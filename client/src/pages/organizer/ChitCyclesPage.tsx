import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useChitCycles } from '../../hooks/useChitCycles';
import api from '../../api/axios';
import { CycleHeader } from '../../components/cycles/CycleHeader';
import { CycleStatistics } from '../../components/cycles/CycleStatistics';
import { CycleCard } from '../../components/cycles/CycleCard';
import { CycleTimeline } from '../../components/cycles/CycleTimeline';
import { EmptyState } from '../../components/cycles/EmptyState';
import { LoadingSkeleton } from '../../components/cycles/LoadingSkeleton';
import { ConfirmationDialog } from '../../components/cycles/ConfirmationDialog';
import { CreateCycleModal } from '../../components/cycles/CreateCycleModal';
import { RecordWinnerModal } from '../../components/cycles/RecordWinnerModal';
import { ArrowLeft, Calendar, Grid } from 'lucide-react';

export const ChitCyclesPage = () => {
    const { groupId } = useParams<{ groupId: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [group, setGroup] = useState<any>(null);
    const [groupMembers, setGroupMembers] = useState<any[]>([]);
    const [groupLoading, setGroupLoading] = useState(true);

    const [activeTab, setActiveTab] = useState<'ALL' | 'ACTIVE' | 'UPCOMING' | 'COMPLETED'>('ALL');
    const [viewMode, setViewMode] = useState<'CARDS' | 'TIMELINE'>('CARDS');

    // Dialog state
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        type: 'start' | 'complete' | 'cancel' | 'openCollections' | 'closeCollections' | null;
        cycleId: string | null;
        cycleNumber?: number;
    }>({ isOpen: false, type: null, cycleId: null });

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [winnerModal, setWinnerModal] = useState<{ isOpen: boolean; cycleId: string | null; cycleNumber: number }>({
        isOpen: false,
        cycleId: null,
        cycleNumber: 0
    });

    const {
        cycles,
        loading: cyclesLoading,
        actionLoading,
        error,
        refetch,
        createCycle,
        startCycle,
        completeCycle,
        cancelCycle,
        recordWinner,
        openCollections,
        closeCollections
    } = useChitCycles(groupId);

    // Fetch Group details
    useEffect(() => {
        if (!groupId) return;
        const fetchGroupDetails = async () => {
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
        fetchGroupDetails();
    }, [groupId]);

    const isOrganizer = user?.id === group?.organizerId?._id || user?.id === group?.organizerId;
    const isAdmin = user?.role === 'ADMIN';

    const filteredCycles = cycles.filter(c => {
        if (activeTab === 'ALL') return true;
        return c.status === activeTab;
    });

    const nextCycleNumber = cycles.length > 0 ? Math.max(...cycles.map(c => c.cycleNumber)) + 1 : 1;

    const memberOptions = groupMembers.map((m: any) => ({
        membershipId: m._id,
        userName: m.userId?.name || 'Member',
        userEmail: m.userId?.email || ''
    }));

    // Handlers
    const handleStartConfirm = async () => {
        if (!confirmModal.cycleId) return;
        try {
            await startCycle(confirmModal.cycleId);
            setConfirmModal({ isOpen: false, type: null, cycleId: null });
        } catch (err) {
            console.error(err);
        }
    };

    const handleCompleteConfirm = async () => {
        if (!confirmModal.cycleId) return;
        try {
            await completeCycle(confirmModal.cycleId);
            setConfirmModal({ isOpen: false, type: null, cycleId: null });
        } catch (err) {
            console.error(err);
        }
    };

    const handleCancelConfirm = async () => {
        if (!confirmModal.cycleId) return;
        try {
            await cancelCycle(confirmModal.cycleId);
            setConfirmModal({ isOpen: false, type: null, cycleId: null });
        } catch (err) {
            console.error(err);
        }
    };

    const handleOpenCollectionsConfirm = async () => {
        if (!confirmModal.cycleId) return;
        try {
            await openCollections(confirmModal.cycleId);
            setConfirmModal({ isOpen: false, type: null, cycleId: null });
        } catch (err) {
            console.error(err);
        }
    };

    const handleCloseCollectionsConfirm = async () => {
        if (!confirmModal.cycleId) return;
        try {
            await closeCollections(confirmModal.cycleId);
            setConfirmModal({ isOpen: false, type: null, cycleId: null });
        } catch (err) {
            console.error(err);
        }
    };

    const handleCreateSubmit = async (data: any) => {
        if (!groupId) return;
        await createCycle({
            groupId,
            scheduledStartDate: data.scheduledStartDate,
            scheduledEndDate: data.scheduledEndDate || undefined,
            remarks: data.remarks || undefined
        });
    };

    const handleWinnerSubmit = async (data: any) => {
        if (!winnerModal.cycleId) return;
        await recordWinner(winnerModal.cycleId, {
            winnerMembershipId: data.winnerMembershipId,
            winningBidAmount: data.winningBidAmount,
            winningBidPercentage: data.winningBidPercentage,
            prizeAmount: data.prizeAmount,
            dividendAmount: data.dividendAmount,
            remarks: data.remarks
        });
        setWinnerModal({ isOpen: false, cycleId: null, cycleNumber: 0 });
    };

    if (groupLoading || cyclesLoading) {
        return <LoadingSkeleton />;
    }

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-12">
            {/* Back Button */}
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

            {/* KPI Statistics */}
            <CycleStatistics cycles={cycles} totalDurationMonths={group?.durationMonths} />

            {/* Header Toolbar */}
            <CycleHeader
                groupName={group?.name}
                isOrganizer={isOrganizer}
                isAdmin={isAdmin}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                onCreateCycle={() => setIsCreateModalOpen(true)}
                onRefresh={refetch}
                isLoading={cyclesLoading}
            />

            {/* View Toggle */}
            <div className="flex items-center justify-between gap-4">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Showing {filteredCycles.length} of {cycles.length} Cycles
                </span>

                <div className="inline-flex p-1 bg-slate-200/60 rounded-xl">
                    <button
                        onClick={() => setViewMode('CARDS')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                            viewMode === 'CARDS' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                        }`}
                    >
                        <Grid className="w-3.5 h-3.5" />
                        <span>Cards View</span>
                    </button>
                    <button
                        onClick={() => setViewMode('TIMELINE')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                            viewMode === 'TIMELINE' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                        }`}
                    >
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Timeline View</span>
                    </button>
                </div>
            </div>

            {/* Cycles Content */}
            {filteredCycles.length === 0 ? (
                <EmptyState
                    title="No Cycles Available"
                    description={
                        activeTab === 'ALL'
                            ? 'No chit cycles have been created yet. Click below to initialize Cycle #1.'
                            : `No cycles found matching status "${activeTab}".`
                    }
                    actionLabel={isOrganizer || isAdmin ? `Create Cycle #${nextCycleNumber}` : undefined}
                    onAction={() => setIsCreateModalOpen(true)}
                />
            ) : viewMode === 'TIMELINE' ? (
                <CycleTimeline
                    cycles={filteredCycles}
                    onSelectCycle={(id) => navigate(`/cycles/${id}`)}
                />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredCycles.map((cycle) => (
                        <CycleCard
                            key={cycle._id}
                            cycle={cycle}
                            isOrganizer={isOrganizer}
                            isAdmin={isAdmin}
                            actionLoading={actionLoading}
                            onStart={(id) => setConfirmModal({ isOpen: true, type: 'start', cycleId: id, cycleNumber: cycle.cycleNumber })}
                            onComplete={(id) => setConfirmModal({ isOpen: true, type: 'complete', cycleId: id, cycleNumber: cycle.cycleNumber })}
                            onCancel={(id) => setConfirmModal({ isOpen: true, type: 'cancel', cycleId: id, cycleNumber: cycle.cycleNumber })}
                            onRecordWinner={(id) => setWinnerModal({ isOpen: true, cycleId: id, cycleNumber: cycle.cycleNumber })}
                            onViewDetails={(id) => navigate(`/cycles/${id}`)}
                        />
                    ))}
                </div>
            )}

            {/* Create Cycle Modal */}
            <CreateCycleModal
                isOpen={isCreateModalOpen}
                nextCycleNumber={nextCycleNumber}
                isLoading={actionLoading === 'create'}
                onClose={() => setIsCreateModalOpen(false)}
                onSubmit={handleCreateSubmit}
            />

            {/* Record Winner Modal */}
            <RecordWinnerModal
                isOpen={winnerModal.isOpen}
                cycleNumber={winnerModal.cycleNumber}
                members={memberOptions}
                isLoading={actionLoading?.startsWith('winner')}
                onClose={() => setWinnerModal({ isOpen: false, cycleId: null, cycleNumber: 0 })}
                onSubmit={handleWinnerSubmit}
            />

            {/* Confirmation Dialogs */}
            <ConfirmationDialog
                isOpen={confirmModal.isOpen && confirmModal.type === 'start'}
                title={`Start Cycle #${confirmModal.cycleNumber}?`}
                description="Starting this cycle will activate it and allow members to participate in this month's auction and installments. Ensure previous cycles are completed."
                confirmLabel="Start Cycle Now"
                confirmVariant="emerald"
                isLoading={!!actionLoading}
                onConfirm={handleStartConfirm}
                onCancel={() => setConfirmModal({ isOpen: false, type: null, cycleId: null })}
            />

            <ConfirmationDialog
                isOpen={confirmModal.isOpen && confirmModal.type === 'complete'}
                title={`Complete Cycle #${confirmModal.cycleNumber}?`}
                description="Are you sure you want to mark this cycle as COMPLETED? Ensure auction winner details have been recorded."
                confirmLabel="Complete Cycle"
                confirmVariant="indigo"
                isLoading={!!actionLoading}
                onConfirm={handleCompleteConfirm}
                onCancel={() => setConfirmModal({ isOpen: false, type: null, cycleId: null })}
            />

            <ConfirmationDialog
                isOpen={confirmModal.isOpen && confirmModal.type === 'cancel'}
                title={`Cancel Cycle #${confirmModal.cycleNumber}?`}
                description="Are you sure you want to CANCEL this cycle? Cancelled cycles cannot be re-activated."
                confirmLabel="Cancel Cycle"
                confirmVariant="rose"
                isLoading={!!actionLoading}
                onConfirm={handleCancelConfirm}
                onCancel={() => setConfirmModal({ isOpen: false, type: null, cycleId: null })}
            />

            <ConfirmationDialog
                isOpen={confirmModal.isOpen && confirmModal.type === 'openCollections'}
                title={`Open Payment Collections for Cycle #${confirmModal.cycleNumber}?`}
                description="Opening payment collections will allow members to initiate installment payments for this cycle."
                confirmLabel="Open Collections"
                confirmVariant="emerald"
                isLoading={!!actionLoading}
                onConfirm={handleOpenCollectionsConfirm}
                onCancel={() => setConfirmModal({ isOpen: false, type: null, cycleId: null })}
            />

            <ConfirmationDialog
                isOpen={confirmModal.isOpen && confirmModal.type === 'closeCollections'}
                title={`Close Payment Collections for Cycle #${confirmModal.cycleNumber}?`}
                description="Closing payment collections will prevent members from making further installment payments for this cycle."
                confirmLabel="Close Collections"
                confirmVariant="rose"
                isLoading={!!actionLoading}
                onConfirm={handleCloseCollectionsConfirm}
                onCancel={() => setConfirmModal({ isOpen: false, type: null, cycleId: null })}
            />
        </div>
    );
};
