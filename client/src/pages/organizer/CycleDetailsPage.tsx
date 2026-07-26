import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import * as cycleApi from '../../api/chitCycle.api';
import type { ChitCycle } from '../../types/chitCycle';
import { CycleStatusBadge } from '../../components/cycles/CycleStatusBadge';
import { ConfirmationDialog } from '../../components/cycles/ConfirmationDialog';
import { LoadingSkeleton } from '../../components/cycles/LoadingSkeleton';
import {
    ArrowLeft, Trophy, PlayCircle, CheckCircle,
    XCircle, Info, Calendar
} from 'lucide-react';
import { format } from 'date-fns';

import { useChitSidebar } from '../../context/ChitSidebarContext';

export const CycleDetailsPage = () => {
    const { cycleId } = useParams<{ cycleId: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { setGroup, setActiveTab, setIsOrganizer: setSidebarIsOrganizer } = useChitSidebar();

    const [cycle, setCycle] = useState<ChitCycle | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        type: 'start' | 'complete' | 'cancel' | null;
    }>({ isOpen: false, type: null });

    const loadCycle = async () => {
        if (!cycleId) return;
        setLoading(true);
        setError(null);
        try {
            const data = await cycleApi.fetchCycleDetails(cycleId);
            setCycle(data);
            if (data.groupId && typeof data.groupId === 'object') {
                setGroup(data.groupId as any);
                setActiveTab('CYCLES');
                setSidebarIsOrganizer(user?.id === (data.groupId as any).organizerId);
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to fetch cycle details');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCycle();
    }, [cycleId]);

    const groupObj = typeof cycle?.groupId === 'object' ? cycle.groupId : null;
    const isOrganizer = user?.id === groupObj?.organizerId;
    const isAdmin = user?.role === 'ADMIN';

    const winnerUser = typeof cycle?.winnerMembershipId === 'object' && cycle?.winnerMembershipId?.userId
        ? cycle.winnerMembershipId.userId
        : null;

    const handleStart = async () => {
        if (!cycleId) return;
        setActionLoading(true);
        try {
            await cycleApi.startChitCycle(cycleId);
            await loadCycle();
            setConfirmModal({ isOpen: false, type: null });
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to start cycle');
        } finally {
            setActionLoading(false);
        }
    };

    const handleComplete = async () => {
        if (!cycleId) return;
        setActionLoading(true);
        try {
            await cycleApi.completeChitCycle(cycleId);
            await loadCycle();
            setConfirmModal({ isOpen: false, type: null });
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to complete cycle');
        } finally {
            setActionLoading(false);
        }
    };

    const handleCancel = async () => {
        if (!cycleId) return;
        setActionLoading(true);
        try {
            await cycleApi.cancelChitCycle(cycleId);
            await loadCycle();
            setConfirmModal({ isOpen: false, type: null });
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to cancel cycle');
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) {
        return <LoadingSkeleton />;
    }

    if (!cycle) {
        return (
            <div className="p-8 text-center bg-white rounded-3xl border border-slate-200">
                <h3 className="text-lg font-bold text-slate-900">Cycle Not Found</h3>
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
        const grpId = typeof cycle?.groupId === 'object' ? cycle.groupId._id : cycle?.groupId;
        if (grpId) {
            setActiveTab('CYCLES');
            navigate(`/chit-details/${grpId}?tab=CYCLES`);
        } else {
            navigate(-1);
        }
    };

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-12">
            {/* Back Nav */}
            <button
                onClick={handleBackNav}
                className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition cursor-pointer"
            >
                <ArrowLeft className="w-4 h-4 text-emerald-600" />
                <span>Back to Cycles & Timeline</span>
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
                        <Calendar className="w-4 h-4" />
                        <span>Cycle Details & Operations</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
                            Cycle #{cycle.cycleNumber} Details
                        </h1>
                        <CycleStatusBadge status={cycle.status} size="md" />
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                        {groupObj?.name ? `Group: ${groupObj.name}` : 'Monthly Chit Cycle Operations'}
                    </p>
                </div>

                {(isOrganizer || isAdmin) && (
                        <div className="flex items-center gap-2">
                            {cycle.status === 'UPCOMING' && (
                                <button
                                    onClick={() => setConfirmModal({ isOpen: true, type: 'start' })}
                                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
                                >
                                    <PlayCircle className="w-4 h-4" />
                                    <span>Start Cycle</span>
                                </button>
                            )}

                            {cycle.status === 'ACTIVE' && (
                                <button
                                    onClick={() => setConfirmModal({ isOpen: true, type: 'complete' })}
                                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
                                >
                                    <CheckCircle className="w-4 h-4" />
                                    <span>Complete Cycle</span>
                                </button>
                            )}

                            {cycle.status !== 'COMPLETED' && cycle.status !== 'CANCELLED' && (
                                <button
                                    onClick={() => setConfirmModal({ isOpen: true, type: 'cancel' })}
                                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                                    title="Cancel Cycle"
                                >
                                    <XCircle className="w-5 h-5" />
                                </button>
                            )}
                        </div>
                    )}
                </div>

            {/* Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Left 2 columns: Dates & Timelines */}
                <div className="md:col-span-2 space-y-6">
                    {/* Key Schedule Grid */}
                    <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cycle Schedule & Dates</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <span className="text-xs text-slate-400 font-medium block">Scheduled Start Date</span>
                                <span className="text-sm font-bold text-slate-900 mt-0.5 block">
                                    {format(new Date(cycle.scheduledStartDate), 'PPP')}
                                </span>
                            </div>

                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <span className="text-xs text-slate-400 font-medium block">Actual Start Date</span>
                                <span className="text-sm font-bold text-slate-900 mt-0.5 block">
                                    {cycle.actualStartDate ? format(new Date(cycle.actualStartDate), 'PPP') : 'Not Started Yet'}
                                </span>
                            </div>

                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <span className="text-xs text-slate-400 font-medium block">Scheduled End Date</span>
                                <span className="text-sm font-bold text-slate-900 mt-0.5 block">
                                    {cycle.scheduledEndDate ? format(new Date(cycle.scheduledEndDate), 'PPP') : 'N/A'}
                                </span>
                            </div>

                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <span className="text-xs text-slate-400 font-medium block">Completed On</span>
                                <span className="text-sm font-bold text-slate-900 mt-0.5 block">
                                    {cycle.actualEndDate ? format(new Date(cycle.actualEndDate), 'PPP') : 'In Progress'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Winner Details Card */}
                    {winnerUser ? (
                        <div className="bg-amber-50/90 border border-amber-200/80 p-6 rounded-3xl shadow-xs space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-black shadow-md shadow-amber-500/30">
                                    <Trophy className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-black text-amber-950 uppercase tracking-wider">Auction Winner Declared</h3>
                                    <p className="text-xs text-amber-700">Recorded winner for Cycle #{cycle.cycleNumber}</p>
                                </div>
                            </div>

                            <div className="p-4 bg-white/80 rounded-2xl border border-amber-100 space-y-2">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-slate-500 font-medium">Winner Name:</span>
                                    <span className="font-bold text-slate-900">{winnerUser.name}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-slate-500 font-medium">Winner Email:</span>
                                    <span className="font-bold text-slate-700">{winnerUser.email}</span>
                                </div>
                                {cycle.winningBidAmount && (
                                    <div className="flex justify-between items-center text-xs pt-2 border-t border-amber-100">
                                        <span className="text-slate-500 font-medium">Winning Bid Amount:</span>
                                        <span className="font-black text-amber-900 text-sm">₹{cycle.winningBidAmount.toLocaleString('en-IN')}</span>
                                    </div>
                                )}
                                {cycle.winningBidPercentage && (
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-slate-500 font-medium">Discount Percentage:</span>
                                        <span className="font-bold text-amber-900">{cycle.winningBidPercentage}%</span>
                                    </div>
                                )}
                                {cycle.prizeAmount && (
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-slate-500 font-medium">Net Prize Amount:</span>
                                        <span className="font-bold text-emerald-700">₹{cycle.prizeAmount.toLocaleString('en-IN')}</span>
                                    </div>
                                )}
                                {cycle.dividendAmount && (
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-slate-500 font-medium">Dividend Per Member:</span>
                                        <span className="font-bold text-indigo-700">₹{cycle.dividendAmount.toLocaleString('en-IN')}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex items-center gap-3 text-slate-500 text-xs">
                            <Info className="w-5 h-5 text-slate-400 shrink-0" />
                            <span>Winner has not been recorded for this cycle yet.</span>
                        </div>
                    )}
                </div>

                {/* Right Column: Group Overview */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Group Context</h3>
                        {groupObj ? (
                            <div className="space-y-3 text-xs">
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Group Name:</span>
                                    <span className="font-bold text-slate-900">{groupObj.name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Total Members:</span>
                                    <span className="font-bold text-slate-900">{groupObj.totalMembers}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Monthly Contribution:</span>
                                    <span className="font-bold text-emerald-600">₹{groupObj.monthlyContribution?.toLocaleString('en-IN')}</span>
                                </div>
                            </div>
                        ) : (
                            <p className="text-xs text-slate-400">Loading group information...</p>
                        )}
                    </div>

                    {cycle.remarks && (
                        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-2">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Remarks</h3>
                            <p className="text-xs text-slate-600 italic">"{cycle.remarks}"</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Confirmation Dialogs */}
            <ConfirmationDialog
                isOpen={confirmModal.isOpen && confirmModal.type === 'start'}
                title={`Start Cycle #${cycle.cycleNumber}?`}
                description="Starting this cycle will set its status to ACTIVE."
                confirmLabel="Start Now"
                confirmVariant="emerald"
                isLoading={actionLoading}
                onConfirm={handleStart}
                onCancel={() => setConfirmModal({ isOpen: false, type: null })}
            />

            <ConfirmationDialog
                isOpen={confirmModal.isOpen && confirmModal.type === 'complete'}
                title={`Complete Cycle #${cycle.cycleNumber}?`}
                description="Mark this cycle as COMPLETED?"
                confirmLabel="Complete"
                confirmVariant="indigo"
                isLoading={actionLoading}
                onConfirm={handleComplete}
                onCancel={() => setConfirmModal({ isOpen: false, type: null })}
            />

            <ConfirmationDialog
                isOpen={confirmModal.isOpen && confirmModal.type === 'cancel'}
                title={`Cancel Cycle #${cycle.cycleNumber}?`}
                description="Are you sure you want to cancel this cycle?"
                confirmLabel="Cancel Cycle"
                confirmVariant="rose"
                isLoading={actionLoading}
                onConfirm={handleCancel}
                onCancel={() => setConfirmModal({ isOpen: false, type: null })}
            />
        </div>
    );
};
