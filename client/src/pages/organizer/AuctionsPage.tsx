import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useAuctions } from '../../hooks/useAuctions';
import { useChitCycles } from '../../hooks/useChitCycles';
import api from '../../api/axios';
import { AuctionHeader } from '../../components/auctions/AuctionHeader';
import { AuctionCard } from '../../components/auctions/AuctionCard';
import { AuctionTable } from '../../components/auctions/AuctionTable';
import { CountdownTimer } from '../../components/auctions/CountdownTimer';
import { ScheduleAuctionModal } from '../../components/auctions/ScheduleAuctionModal';
import { RecordWinnerModal } from '../../components/cycles/RecordWinnerModal';
import type { RecordWinnerFormData } from '../../components/cycles/RecordWinnerModal';
import { ConfirmationDialog } from '../../components/cycles/ConfirmationDialog';
import { EmptyState } from '../../components/cycles/EmptyState';
import { LoadingSkeleton } from '../../components/cycles/LoadingSkeleton';
import { ArrowLeft, Hammer } from 'lucide-react';
import type { AuctionStatus } from '../../types/auction';

export const AuctionsPage = () => {
    const { groupId } = useParams<{ groupId: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [group, setGroup] = useState<any>(null);
    const [groupMembers, setGroupMembers] = useState<any[]>([]);
    const [groupLoading, setGroupLoading] = useState(true);

    const [activeTab, setActiveTab] = useState<'ALL' | AuctionStatus>('ALL');
    const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);

    const [winnerModal, setWinnerModal] = useState<{ isOpen: boolean; auctionId: string | null; auctionNumber: number }>({
        isOpen: false,
        auctionId: null,
        auctionNumber: 0
    });

    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        type: 'start' | 'close' | 'cancel' | null;
        auctionId: string | null;
        auctionNumber?: number;
    }>({ isOpen: false, type: null, auctionId: null });

    const {
        auctions,
        liveAuction,
        loading: auctionsLoading,
        actionLoading,
        error,
        refetch,
        createAuction,
        updateStatus,
        declareWinner
    } = useAuctions(groupId);

    const { cycles } = useChitCycles(groupId);

    // Fetch Group details
    useEffect(() => {
        if (!groupId) return;
        const fetchGroup = async () => {
            try {
                const res = await api.get(`/chit-groups/details/${groupId}`);
                setGroup(res.data.data.group);
                setGroupMembers(res.data.data.members || []);
            } catch (err) {
                console.error('Failed to load group details', err);
            } finally {
                setGroupLoading(false);
            }
        };
        fetchGroup();
    }, [groupId]);

    const isOrganizer = user?.id === group?.organizerId?._id || user?.id === group?.organizerId;
    const isAdmin = user?.role === 'ADMIN';

    const filteredAuctions = auctions.filter(a => {
        if (activeTab === 'ALL') return true;
        return a.status === activeTab;
    });

    const cycleOptions = cycles.map(c => ({
        cycleId: c._id,
        cycleNumber: c.cycleNumber,
        status: c.status
    }));

    const memberOptions = groupMembers.map((m: any) => ({
        membershipId: m._id,
        userName: m.userId?.name || 'Member',
        userEmail: m.userId?.email || ''
    }));

    // Handlers
    const handleStartConfirm = async () => {
        if (!confirmModal.auctionId) return;
        try {
            await updateStatus(confirmModal.auctionId, 'OPEN');
            setConfirmModal({ isOpen: false, type: null, auctionId: null });
        } catch (err) {
            console.error(err);
        }
    };

    const handleCloseConfirm = async () => {
        if (!confirmModal.auctionId) return;
        try {
            await updateStatus(confirmModal.auctionId, 'CLOSED');
            setConfirmModal({ isOpen: false, type: null, auctionId: null });
        } catch (err) {
            console.error(err);
        }
    };

    const handleCancelConfirm = async () => {
        if (!confirmModal.auctionId) return;
        try {
            await updateStatus(confirmModal.auctionId, 'CANCELLED');
            setConfirmModal({ isOpen: false, type: null, auctionId: null });
        } catch (err) {
            console.error(err);
        }
    };

    const handleScheduleSubmit = async (data: any) => {
        await createAuction({
            cycleId: data.cycleId,
            scheduledStartTime: data.scheduledStartTime,
            scheduledEndTime: data.scheduledEndTime || undefined,
            minimumBidPercentage: data.minimumBidPercentage,
            maximumBidPercentage: data.maximumBidPercentage,
            remarks: data.remarks || undefined
        });
    };

    const handleWinnerSubmit = async (data: RecordWinnerFormData) => {
        if (!winnerModal.auctionId) return;
        await declareWinner(winnerModal.auctionId, {
            winningMembershipId: data.winnerMembershipId,
            remarks: data.remarks
        });
        setWinnerModal({ isOpen: false, auctionId: null, auctionNumber: 0 });
    };

    if (groupLoading || auctionsLoading) {
        return <LoadingSkeleton />;
    }

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-12">
            {/* Back Nav */}
            <button
                onClick={() => navigate(groupId ? `/chit-details/${groupId}` : '/my-chits')}
                className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition cursor-pointer"
            >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Chit Group</span>
            </button>

            {/* Error Notification */}
            {error && (
                <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-2xl">
                    {error}
                </div>
            )}

            {/* Live Auction Highlight Banner if OPEN */}
            {liveAuction && (
                <div className="bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-800 text-white p-6 rounded-3xl shadow-xl shadow-emerald-600/20 relative overflow-hidden">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-start gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center font-black text-2xl border border-white/30 shrink-0">
                                <Hammer className="w-7 h-7 text-emerald-200" />
                            </div>
                            <div>
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-[10px] font-black tracking-widest uppercase mb-1">
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
                                    </span>
                                    LIVE BIDDING OPEN
                                </div>
                                <h3 className="text-xl font-black text-white">Auction #{liveAuction.auctionNumber} is Currently Active!</h3>
                                <p className="text-xs text-emerald-100 mt-1">
                                    Members are placing live bids. Auction limits: {liveAuction.minimumBidPercentage}% to {liveAuction.maximumBidPercentage}%.
                                </p>
                            </div>
                        </div>

                        {liveAuction.scheduledEndTime && (
                            <div className="shrink-0 w-full md:w-auto">
                                <CountdownTimer targetDate={liveAuction.scheduledEndTime} label="Bidding Closes In" />
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Header Toolbar */}
            <AuctionHeader
                groupName={group?.name}
                isOrganizer={isOrganizer}
                isAdmin={isAdmin}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                onScheduleAuction={() => setIsScheduleModalOpen(true)}
                onRefresh={refetch}
                isLoading={auctionsLoading}
            />

            {/* Auction Cards / List Content */}
            {filteredAuctions.length === 0 ? (
                <EmptyState
                    title="No Auctions Scheduled"
                    description={
                        activeTab === 'ALL'
                            ? 'No member auctions have been scheduled for this chit group yet.'
                            : `No auctions found matching status "${activeTab}".`
                    }
                    actionLabel={isOrganizer || isAdmin ? 'Schedule First Auction' : undefined}
                    onAction={() => setIsScheduleModalOpen(true)}
                />
            ) : (
                <AuctionTable
                    auctions={filteredAuctions}
                    isOrganizer={isOrganizer}
                    isAdmin={isAdmin}
                    actionLoading={actionLoading}
                    currency={group?.financialConfig?.currency}
                    onStart={(id) => {
                        const a = auctions.find((auc) => auc._id === id);
                        setConfirmModal({ isOpen: true, type: 'start', auctionId: id, auctionNumber: a?.auctionNumber });
                    }}
                    onCloseAuction={(id) => {
                        const a = auctions.find((auc) => auc._id === id);
                        setConfirmModal({ isOpen: true, type: 'close', auctionId: id, auctionNumber: a?.auctionNumber });
                    }}
                    onDeclareWinner={(id) => {
                        const a = auctions.find((auc) => auc._id === id);
                        setWinnerModal({ isOpen: true, auctionId: id, auctionNumber: a?.auctionNumber || 0 });
                    }}
                    onCancel={(id) => {
                        const a = auctions.find((auc) => auc._id === id);
                        setConfirmModal({ isOpen: true, type: 'cancel', auctionId: id, auctionNumber: a?.auctionNumber });
                    }}
                    onViewDetails={(id) => navigate(`/auctions/${id}`)}
                    onViewBids={(id) => navigate(`/auctions/${id}/bids`)}
                />
            )}

            {/* Schedule Auction Modal */}
            <ScheduleAuctionModal
                isOpen={isScheduleModalOpen}
                cycles={cycleOptions}
                isLoading={actionLoading === 'create'}
                onClose={() => setIsScheduleModalOpen(false)}
                onSubmit={handleScheduleSubmit}
            />

            {/* Declare Winner Modal */}
            <RecordWinnerModal
                isOpen={winnerModal.isOpen}
                cycleNumber={winnerModal.auctionNumber}
                members={memberOptions}
                isLoading={actionLoading?.startsWith('winner')}
                onClose={() => setWinnerModal({ isOpen: false, auctionId: null, auctionNumber: 0 })}
                onSubmit={handleWinnerSubmit}
            />

            {/* Confirmation Dialogs */}
            <ConfirmationDialog
                isOpen={confirmModal.isOpen && confirmModal.type === 'start'}
                title={`Start Auction #${confirmModal.auctionNumber}?`}
                description="Starting this auction will open bidding for all active group members."
                confirmLabel="Start Auction Now"
                confirmVariant="emerald"
                isLoading={!!actionLoading}
                onConfirm={handleStartConfirm}
                onCancel={() => setConfirmModal({ isOpen: false, type: null, auctionId: null })}
            />

            <ConfirmationDialog
                isOpen={confirmModal.isOpen && confirmModal.type === 'close'}
                title={`Close Auction #${confirmModal.auctionNumber}?`}
                description="Closing this auction will prevent any further bid submissions. The winner can then be declared."
                confirmLabel="Close Bidding"
                confirmVariant="indigo"
                isLoading={!!actionLoading}
                onConfirm={handleCloseConfirm}
                onCancel={() => setConfirmModal({ isOpen: false, type: null, auctionId: null })}
            />

            <ConfirmationDialog
                isOpen={confirmModal.isOpen && confirmModal.type === 'cancel'}
                title={`Cancel Auction #${confirmModal.auctionNumber}?`}
                description="Are you sure you want to cancel this auction?"
                confirmLabel="Cancel Auction"
                confirmVariant="rose"
                isLoading={!!actionLoading}
                onConfirm={handleCancelConfirm}
                onCancel={() => setConfirmModal({ isOpen: false, type: null, auctionId: null })}
            />
        </div>
    );
};
