import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useChitSidebar } from '../../context/ChitSidebarContext';
import * as auctionApi from '../../api/auction.api';
import api from '../../api/axios';
import type { Auction } from '../../types/auction';
import { AuctionStatusBadge } from '../../components/auctions/AuctionStatusBadge';
import { CountdownTimer } from '../../components/auctions/CountdownTimer';
import { WinnerBanner } from '../../components/auctions/WinnerBanner';
import { AuctionTimeline } from '../../components/auctions/AuctionTimeline';
import { ConfirmationDialog } from '../../components/cycles/ConfirmationDialog';
import { RecordWinnerModal, type RecordWinnerFormData } from '../../components/cycles/RecordWinnerModal';
import { LoadingSkeleton } from '../../components/cycles/LoadingSkeleton';
import {
    ArrowLeft, Hammer, PlayCircle, CheckCircle, XCircle, Trophy, Sparkles
} from 'lucide-react';

export const AuctionDetailsPage = () => {
    const { auctionId } = useParams<{ auctionId: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { setGroup, setActiveTab, setIsOrganizer: setSidebarIsOrganizer } = useChitSidebar();

    const [auction, setAuction] = useState<Auction | null>(null);
    const [groupMembers, setGroupMembers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [isWinnerModalOpen, setIsWinnerModalOpen] = useState(false);
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        type: 'start' | 'close' | 'cancel' | null;
    }>({ isOpen: false, type: null });

    const loadAuction = async () => {
        if (!auctionId) return;
        setLoading(true);
        setError(null);
        try {
            const data = await auctionApi.fetchAuctionDetails(auctionId);
            setAuction(data);

            const grpId = typeof data.groupId === 'object' ? data.groupId._id : data.groupId;
            if (grpId) {
                const groupRes = await api.get(`/chit-groups/details/${grpId}`);
                setGroupMembers(groupRes.data.data.members || []);
                if (groupRes.data.data.group) {
                    setGroup(groupRes.data.data.group);
                    setActiveTab('AUCTIONS');
                    setSidebarIsOrganizer(user?.id === groupRes.data.data.group.organizerId._id);
                }
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to fetch auction details');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAuction();
    }, [auctionId]);

    const groupObj = typeof auction?.groupId === 'object' ? auction.groupId : null;
    const isOrganizer = user?.id === auction?.organizerId;
    const isAdmin = user?.role === 'ADMIN';

    const memberOptions = groupMembers.map((m: any) => ({
        membershipId: m._id,
        userName: m.userId?.name || 'Member',
        userEmail: m.userId?.email || ''
    }));

    const handleStart = async () => {
        if (!auctionId) return;
        setActionLoading(true);
        try {
            await auctionApi.updateAuctionStatus(auctionId, 'OPEN');
            await loadAuction();
            setConfirmModal({ isOpen: false, type: null });
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to start auction');
        } finally {
            setActionLoading(false);
        }
    };

    const handleClose = async () => {
        if (!auctionId) return;
        setActionLoading(true);
        try {
            await auctionApi.updateAuctionStatus(auctionId, 'CLOSED');
            await loadAuction();
            setConfirmModal({ isOpen: false, type: null });
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to close auction');
        } finally {
            setActionLoading(false);
        }
    };

    const handleCancel = async () => {
        if (!auctionId) return;
        setActionLoading(true);
        try {
            await auctionApi.updateAuctionStatus(auctionId, 'CANCELLED');
            await loadAuction();
            setConfirmModal({ isOpen: false, type: null });
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to cancel auction');
        } finally {
            setActionLoading(false);
        }
    };

    const handleWinnerSubmit = async (data: RecordWinnerFormData) => {
        if (!auctionId) return;
        setActionLoading(true);
        try {
            await auctionApi.declareAuctionWinner(auctionId, {
                winningMembershipId: data.winnerMembershipId,
                remarks: data.remarks
            });
            await loadAuction();
            setIsWinnerModalOpen(false);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to declare winner');
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) {
        return <LoadingSkeleton />;
    }

    if (!auction) {
        return (
            <div className="p-8 text-center bg-white rounded-3xl border border-slate-200">
                <h3 className="text-lg font-bold text-slate-900">Auction Not Found</h3>
                <button
                    onClick={() => navigate(-1)}
                    className="mt-4 px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl"
                >
                    Go Back
                </button>
            </div>
        );
    }

    const handleBackNav = () => {
        const grpId = typeof auction?.groupId === 'object' ? auction.groupId._id : auction?.groupId;
        if (grpId) {
            setActiveTab('AUCTIONS');
            navigate(`/chit-details/${grpId}?tab=AUCTIONS`);
        } else {
            navigate(-1);
        }
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-12">
            {/* Back Nav */}
            <button
                onClick={handleBackNav}
                className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition cursor-pointer"
            >
                <ArrowLeft className="w-4 h-4 text-emerald-600" />
                <span>Back to Auctions & Bids</span>
            </button>

            {error && (
                <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-2xl">
                    {error}
                </div>
            )}

            {/* Header Title Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">
                        <Hammer className="w-4 h-4" />
                        <span>Auction Control Room</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
                            Auction #{auction.auctionNumber} Control Room
                        </h1>
                        <AuctionStatusBadge status={auction.status} size="md" />
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                        {groupObj?.name ? `Group: ${groupObj.name}` : 'Monthly Member Auction Control Room'}
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {/* Live Bids Room Button */}
                    <button
                        onClick={() => navigate(`/auctions/${auction._id}/bids`)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
                    >
                        <Hammer className="w-4 h-4 text-emerald-400" />
                        <span>Bids Room</span>
                    </button>

                    {(isOrganizer || isAdmin) && (
                        <>
                            {auction.status === 'SCHEDULED' && (
                                <button
                                    onClick={() => setConfirmModal({ isOpen: true, type: 'start' })}
                                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
                                >
                                    <PlayCircle className="w-4 h-4" />
                                    <span>Start Auction</span>
                                </button>
                            )}

                            {auction.status === 'OPEN' && (
                                <>
                                    <button
                                        onClick={() => setConfirmModal({ isOpen: true, type: 'close' })}
                                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
                                    >
                                        <CheckCircle className="w-4 h-4" />
                                        <span>Close Bidding</span>
                                    </button>
                                    <button
                                        onClick={() => setIsWinnerModalOpen(true)}
                                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
                                    >
                                        <Trophy className="w-4 h-4 text-amber-300" />
                                        <span>Declare Winner</span>
                                    </button>
                                </>
                            )}

                            {auction.status === 'CLOSED' && (
                                <button
                                    onClick={() => setIsWinnerModalOpen(true)}
                                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
                                >
                                    <Trophy className="w-4 h-4 text-amber-300" />
                                    <span>Declare Winner</span>
                                </button>
                            )}

                            {auction.status !== 'WINNER_DECLARED' && auction.status !== 'CANCELLED' && (
                                <button
                                    onClick={() => setConfirmModal({ isOpen: true, type: 'cancel' })}
                                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                                    title="Cancel Auction"
                                >
                                    <XCircle className="w-5 h-5" />
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Live Countdown if SCHEDULED or OPEN */}
            {auction.status === 'SCHEDULED' && (
                <CountdownTimer targetDate={auction.scheduledStartTime} label="Auction Starts In" />
            )}

            {auction.status === 'OPEN' && auction.scheduledEndTime && (
                <CountdownTimer targetDate={auction.scheduledEndTime} label="Bidding Closes In" />
            )}

            {/* Grid Content */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                    {/* Winner Banner if Declared */}
                    {auction.winningMembershipId && (
                        <WinnerBanner
                            winner={auction.winningMembershipId}
                            winningBidPercentage={auction.minimumBidPercentage}
                            remarks={auction.remarks}
                        />
                    )}

                    {/* Timeline */}
                    <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
                        <AuctionTimeline auction={auction} />
                    </div>
                </div>

                {/* Right Column: Configuration & Bounds */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Bidding Rules & Limits</h3>

                        <div className="space-y-3 text-xs">
                            <div className="flex justify-between p-3 bg-slate-50 rounded-xl">
                                <span className="text-slate-500 font-medium">Minimum Bid Discount:</span>
                                <span className="font-bold text-slate-900">{auction.minimumBidPercentage}%</span>
                            </div>
                            <div className="flex justify-between p-3 bg-slate-50 rounded-xl">
                                <span className="text-slate-500 font-medium">Maximum Bid Discount:</span>
                                <span className="font-bold text-slate-900">{auction.maximumBidPercentage}%</span>
                            </div>
                        </div>
                    </div>

                    {auction.remarks && (
                        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-2">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Auction Remarks</h3>
                            <p className="text-xs text-slate-600 italic">"{auction.remarks}"</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Confirmation Dialogs */}
            <ConfirmationDialog
                isOpen={confirmModal.isOpen && confirmModal.type === 'start'}
                title={`Start Auction #${auction.auctionNumber}?`}
                description="Starting this auction will open live bidding for members."
                confirmLabel="Start Auction"
                confirmVariant="emerald"
                isLoading={actionLoading}
                onConfirm={handleStart}
                onCancel={() => setConfirmModal({ isOpen: false, type: null })}
            />

            <ConfirmationDialog
                isOpen={confirmModal.isOpen && confirmModal.type === 'close'}
                title={`Close Auction #${auction.auctionNumber}?`}
                description="Close bidding for this auction?"
                confirmLabel="Close Bidding"
                confirmVariant="indigo"
                isLoading={actionLoading}
                onConfirm={handleClose}
                onCancel={() => setConfirmModal({ isOpen: false, type: null })}
            />

            <ConfirmationDialog
                isOpen={confirmModal.isOpen && confirmModal.type === 'cancel'}
                title={`Cancel Auction #${auction.auctionNumber}?`}
                description="Are you sure you want to cancel this auction?"
                confirmLabel="Cancel Auction"
                confirmVariant="rose"
                isLoading={actionLoading}
                onConfirm={handleCancel}
                onCancel={() => setConfirmModal({ isOpen: false, type: null })}
            />

            {/* Record Winner Modal */}
            <RecordWinnerModal
                isOpen={isWinnerModalOpen}
                cycleNumber={auction.auctionNumber}
                members={memberOptions}
                isLoading={actionLoading}
                onClose={() => setIsWinnerModalOpen(false)}
                onSubmit={handleWinnerSubmit}
            />
        </div>
    );
};
