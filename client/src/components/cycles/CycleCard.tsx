import type { ChitCycle } from '../../types/chitCycle';
import { CycleStatusBadge } from './CycleStatusBadge';
import { Trophy, PlayCircle, CheckCircle, XCircle, ArrowRight, Award, Info, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

interface CycleCardProps {
    cycle: ChitCycle;
    isOrganizer?: boolean;
    isAdmin?: boolean;
    actionLoading?: string | null;
    onStart?: (cycleId: string) => void;
    onComplete?: (cycleId: string) => void;
    onCancel?: (cycleId: string) => void;
    onRecordWinner?: (cycleId: string) => void;
    onViewDetails?: (cycleId: string) => void;
}

export const CycleCard = ({
    cycle,
    isOrganizer = false,
    isAdmin = false,
    actionLoading,
    onStart,
    onComplete,
    onCancel,
    onRecordWinner,
    onViewDetails
}: CycleCardProps) => {
    const isWinner = !!cycle.winnerMembershipId;
    const winnerName = typeof cycle.winnerMembershipId === 'object' && cycle.winnerMembershipId?.userId?.name
        ? cycle.winnerMembershipId.userId.name
        : null;

    const isStarting = actionLoading === `start-${cycle._id}`;
    const isCompleting = actionLoading === `complete-${cycle._id}`;
    const isCancelling = actionLoading === `cancel-${cycle._id}`;

    return (
        <div className="bg-white rounded-2xl border-none p-6 flex flex-col justify-between relative shadow-none hover:shadow-xs transition-all space-y-4">
            {/* Cycle Header & Badge */}
            <div>
                <div className="flex items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-900 text-emerald-400 flex items-center justify-center font-bold text-sm shrink-0">
                            #{cycle.cycleNumber}
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-slate-900 leading-snug">Cycle {cycle.cycleNumber}</h3>
                            <p className="text-[11px] font-medium text-slate-400">Monthly Financial Cycle</p>
                        </div>
                    </div>
                    <CycleStatusBadge status={cycle.status} size="sm" />
                </div>

                {/* Timeline info */}
                <div className="space-y-2.5 bg-slate-50 p-3.5 rounded-xl border-none mb-4 text-xs">
                    <div className="flex items-center justify-between text-slate-600">
                        <span className="font-medium text-slate-400">Scheduled Start:</span>
                        <span className="font-bold">{format(new Date(cycle.scheduledStartDate), 'MMM dd, yyyy')}</span>
                    </div>

                    {cycle.actualStartDate && (
                        <div className="flex items-center justify-between text-slate-600">
                            <span className="font-medium text-slate-400">Actual Start:</span>
                            <span className="font-bold text-emerald-700">{format(new Date(cycle.actualStartDate), 'MMM dd, yyyy')}</span>
                        </div>
                    )}

                    {cycle.actualEndDate && (
                        <div className="flex items-center justify-between text-slate-600">
                            <span className="font-medium text-slate-400">Completed On:</span>
                            <span className="font-bold text-slate-900">{format(new Date(cycle.actualEndDate), 'MMM dd, yyyy')}</span>
                        </div>
                    )}

                    {cycle.auctionDate && (
                        <div className="flex items-center justify-between text-slate-600 pt-2 border-t border-slate-200/60">
                            <span className="font-medium text-slate-400">Auction Date:</span>
                            <span className="font-bold text-slate-800">{format(new Date(cycle.auctionDate), 'MMM dd, yyyy')}</span>
                        </div>
                    )}
                </div>

                {/* Winner Card if Winner Recorded */}
                {isWinner ? (
                    <div className="bg-slate-50 border-none p-3.5 rounded-xl mb-4">
                        <div className="flex items-center gap-2 mb-1">
                            <Trophy className="w-4 h-4 text-amber-500 shrink-0" />
                            <span className="text-xs font-black text-slate-900 uppercase tracking-wider">Auction Winner</span>
                        </div>
                        <p className="text-sm font-bold text-slate-900">{winnerName || 'Member Winner'}</p>
                        {cycle.winningBidAmount && (
                            <div className="mt-1 flex items-center gap-3 text-xs text-slate-600 font-semibold">
                                <span>Winning Bid: <strong className="text-slate-900 font-black">₹{cycle.winningBidAmount.toLocaleString('en-IN')}</strong></span>
                                {cycle.winningBidPercentage && <span>({cycle.winningBidPercentage}%)</span>}
                            </div>
                        )}
                    </div>
                ) : cycle.status === 'ACTIVE' ? (
                    <div className="bg-slate-50 border-none p-3 rounded-xl mb-4 text-xs text-slate-600 flex items-center gap-2">
                        <Info className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Cycle is active. Awaiting auction & winner recording.</span>
                    </div>
                ) : null}

                {cycle.remarks && (
                    <p className="text-xs text-slate-500 italic mb-4 line-clamp-2">"{cycle.remarks}"</p>
                )}
            </div>

            {/* Action Bar */}
            <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                {onViewDetails && (
                    <button
                        onClick={() => onViewDetails(cycle._id)}
                        className="px-3 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 inline-flex items-center gap-1 transition cursor-pointer"
                    >
                        <span>View Details</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                )}

                {(isOrganizer || isAdmin) && (
                    <div className="flex items-center gap-2 ml-auto">
                        {cycle.status === 'UPCOMING' && onStart && (
                            <button
                                disabled={!!actionLoading}
                                onClick={() => onStart(cycle._id)}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition cursor-pointer disabled:opacity-50"
                            >
                                {isStarting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <PlayCircle className="w-3.5 h-3.5" />}
                                <span>Start Cycle</span>
                            </button>
                        )}

                        {cycle.status === 'ACTIVE' && (
                            <>
                                {onRecordWinner && (
                                    <button
                                        onClick={() => onRecordWinner(cycle._id)}
                                        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition cursor-pointer"
                                    >
                                        <Award className="w-3.5 h-3.5 text-emerald-400" />
                                        <span>Record Winner</span>
                                    </button>
                                )}

                                {onComplete && (
                                    <button
                                        disabled={!!actionLoading}
                                        onClick={() => onComplete(cycle._id)}
                                        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition cursor-pointer disabled:opacity-50"
                                    >
                                        {isCompleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                                        <span>Complete</span>
                                    </button>
                                )}
                            </>
                        )}

                        {(cycle.status === 'UPCOMING' || cycle.status === 'ACTIVE') && onCancel && (
                            <button
                                disabled={!!actionLoading}
                                onClick={() => onCancel(cycle._id)}
                                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer disabled:opacity-50"
                                title="Cancel Cycle"
                            >
                                {isCancelling ? <Loader2 className="w-4 h-4 animate-spin text-rose-600" /> : <XCircle className="w-4 h-4" />}
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
