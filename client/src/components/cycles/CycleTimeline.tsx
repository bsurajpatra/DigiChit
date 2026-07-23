import type { ChitCycle } from '../../types/chitCycle';
import { CycleStatusBadge } from './CycleStatusBadge';
import { Calendar, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';

interface CycleTimelineProps {
    cycles: ChitCycle[];
    onSelectCycle?: (cycleId: string) => void;
}

export const CycleTimeline = ({ cycles, onSelectCycle }: CycleTimelineProps) => {
    if (cycles.length === 0) return null;

    const sortedCycles = [...cycles].sort((a, b) => a.cycleNumber - b.cycleNumber);

    return (
        <div className="bg-white p-6 rounded-2xl border-none shadow-none space-y-6">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-600" />
                <span>Cycle Roadmap & Timeline</span>
            </h3>

            <div className="relative pl-6 space-y-6 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {sortedCycles.map((cycle) => {
                    const isWinner = !!cycle.winnerMembershipId;
                    const winnerName = typeof cycle.winnerMembershipId === 'object' && cycle.winnerMembershipId?.userId?.name
                        ? cycle.winnerMembershipId.userId.name
                        : null;

                    return (
                        <div
                            key={cycle._id}
                            className="relative group cursor-pointer"
                            onClick={() => onSelectCycle && onSelectCycle(cycle._id)}
                        >
                            {/* Timeline Node Dot */}
                            <div className={`
                                absolute -left-[31px] top-0.5 w-5 h-5 rounded-full border-2 bg-white flex items-center justify-center transition-transform group-hover:scale-110
                                ${cycle.status === 'ACTIVE'
                                    ? 'border-emerald-500 bg-emerald-500'
                                    : cycle.status === 'COMPLETED'
                                        ? 'border-slate-900 bg-slate-900'
                                        : cycle.status === 'CANCELLED'
                                            ? 'border-rose-500 bg-rose-500'
                                            : 'border-slate-300'
                                }
                            `}>
                                {cycle.status === 'ACTIVE' && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                                {cycle.status === 'COMPLETED' && <CheckCircle2 className="w-3 h-3 text-white" />}
                            </div>

                            {/* Cycle Content */}
                            <div className="bg-slate-50 hover:bg-slate-100/80 p-4 rounded-xl border-none transition-all">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-black text-slate-900">Cycle #{cycle.cycleNumber}</span>
                                        <CycleStatusBadge status={cycle.status} size="sm" />
                                    </div>
                                    <span className="text-xs text-slate-400 font-medium">
                                        Scheduled: {format(new Date(cycle.scheduledStartDate), 'MMM dd, yyyy')}
                                    </span>
                                </div>

                                {isWinner && (
                                    <div className="mt-2.5 pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-xs">
                                        <span className="text-slate-500 font-medium">Winner: <strong className="text-slate-900 font-bold">{winnerName || 'Recorded'}</strong></span>
                                        {cycle.winningBidAmount && (
                                            <span className="font-bold text-slate-900">₹{cycle.winningBidAmount.toLocaleString('en-IN')}</span>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
