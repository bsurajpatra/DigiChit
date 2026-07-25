import type { ChitCycle } from '../../types/chitCycle';
import { CycleStatusBadge } from './CycleStatusBadge';
import { Calendar, CheckCircle2, Trophy, Clock, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { formatCurrency } from '../../utils/currency';

interface CycleTimelineProps {
    cycles: ChitCycle[];
    currency?: string;
    onSelectCycle?: (cycleId: string) => void;
}

export const CycleTimeline = ({ cycles, currency, onSelectCycle }: CycleTimelineProps) => {
    if (cycles.length === 0) return null;

    const sortedCycles = [...cycles].sort((a, b) => a.cycleNumber - b.cycleNumber);

    const formatDateSafe = (dateVal: any) => {
        if (!dateVal) return 'N/A';
        const d = new Date(dateVal);
        return isNaN(d.getTime()) ? 'N/A' : format(d, 'MMM dd, yyyy');
    };

    return (
        <div className="bg-white p-6 rounded-2xl border-none shadow-none space-y-6">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-emerald-600" />
                    <span>Cycle List Roadmap & Timeline</span>
                </h3>
                <span className="text-xs text-slate-400 font-bold">{sortedCycles.length} Total Cycles</span>
            </div>

            {/* List Row Timeline Layout */}
            <div className="space-y-3">
                {sortedCycles.map((cycle) => {
                    const winMem: any = cycle.winnerMembershipId;
                    const winnerName = typeof winMem === 'object' && winMem !== null
                        ? (winMem.userId?.name || winMem.name || 'Recorded')
                        : null;

                    const isActive = cycle.status === 'ACTIVE';
                    const isCompleted = cycle.status === 'COMPLETED';

                    return (
                        <div
                            key={cycle._id}
                            onClick={() => onSelectCycle && onSelectCycle(cycle._id)}
                            className={`
                                p-4 rounded-2xl border transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4
                                ${isActive
                                    ? 'bg-emerald-50/40 border-emerald-300/80 shadow-xs'
                                    : isCompleted
                                        ? 'bg-slate-50 border-slate-200/80'
                                        : 'bg-white hover:bg-slate-50 border-slate-200/60'
                                }
                            `}
                        >
                            {/* Left Info */}
                            <div className="flex items-center gap-3.5">
                                <div className={`
                                    w-10 h-10 rounded-2xl flex items-center justify-center font-black text-xs shrink-0
                                    ${isActive
                                        ? 'bg-emerald-600 text-white shadow-xs'
                                        : isCompleted
                                            ? 'bg-slate-900 text-emerald-400'
                                            : 'bg-slate-100 text-slate-700'
                                    }
                                `}>
                                    #{cycle.cycleNumber}
                                </div>

                                <div className="space-y-0.5">
                                    <div className="flex items-center gap-2">
                                        <h4 className="text-sm font-bold text-slate-900">Cycle #{cycle.cycleNumber}</h4>
                                        <CycleStatusBadge status={cycle.status} size="sm" />
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                                        <span>Start: {formatDateSafe(cycle.scheduledStartDate)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Middle Winner Info */}
                            <div className="flex items-center gap-4 text-xs">
                                {winnerName ? (
                                    <div className="p-2 px-3 bg-amber-50 rounded-xl border border-amber-100 flex items-center gap-2">
                                        <Trophy className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                        <div>
                                            <span className="text-[10px] text-amber-700 font-bold block uppercase leading-none">Winner</span>
                                            <span className="font-bold text-slate-900 text-xs">{winnerName}</span>
                                        </div>
                                        {cycle.winningBidAmount && (
                                            <span className="font-black text-emerald-700 ml-2">
                                                {formatCurrency(cycle.winningBidAmount, currency)}
                                            </span>
                                        )}
                                    </div>
                                ) : (
                                    <span className="text-slate-400 text-xs font-medium">No winner recorded</span>
                                )}
                            </div>

                            {/* Right Arrow Action */}
                            <div className="flex items-center gap-1 text-xs font-bold text-slate-600 group-hover:text-emerald-600 transition shrink-0">
                                <span>View Details</span>
                                <ChevronRight className="w-4 h-4 text-slate-400" />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
