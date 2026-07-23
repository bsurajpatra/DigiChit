import type { ChitCycle } from '../../types/chitCycle';
import { Calendar, PlayCircle, CheckCircle2, Trophy } from 'lucide-react';

interface CycleStatisticsProps {
    cycles: ChitCycle[];
    totalDurationMonths?: number;
}

export const CycleStatistics = ({ cycles, totalDurationMonths }: CycleStatisticsProps) => {
    const activeCycle = cycles.find(c => c.status === 'ACTIVE');
    const completedCount = cycles.filter(c => c.status === 'COMPLETED').length;
    const upcomingCount = cycles.filter(c => c.status === 'UPCOMING').length;
    const winnersCount = cycles.filter(c => c.winnerMembershipId).length;

    const totalExpected = totalDurationMonths || cycles.length;
    const progressPercentage = totalExpected > 0 ? Math.round((completedCount / totalExpected) * 100) : 0;

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Active Cycle KPI */}
            <div className="bg-white p-5 rounded-2xl border-none shadow-none relative overflow-hidden">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Current Cycle</p>
                        <h4 className="text-2xl font-black text-slate-900 mt-1">
                            {activeCycle ? `Cycle #${activeCycle.cycleNumber}` : 'None Active'}
                        </h4>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-slate-900 text-emerald-400 flex items-center justify-center font-bold shrink-0">
                        <PlayCircle className="w-5 h-5" />
                    </div>
                </div>
                <div className="mt-3 text-[11px] font-medium text-slate-500">
                    {activeCycle ? `Started: ${new Date(activeCycle.actualStartDate || activeCycle.scheduledStartDate).toLocaleDateString()}` : `${upcomingCount} upcoming cycle(s)`}
                </div>
            </div>

            {/* Cycle Progress KPI */}
            <div className="bg-white p-5 rounded-2xl border-none shadow-none relative overflow-hidden">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cycle Progress</p>
                        <h4 className="text-2xl font-black text-slate-900 mt-1">
                            {completedCount} <span className="text-sm font-medium text-slate-400">/ {totalExpected}</span>
                        </h4>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-slate-900 text-sky-400 flex items-center justify-center font-bold shrink-0">
                        <CheckCircle2 className="w-5 h-5" />
                    </div>
                </div>
                <div className="mt-3 flex items-center gap-2">
                    <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-slate-900 h-full rounded-full transition-all duration-500" style={{ width: `${progressPercentage}%` }}></div>
                    </div>
                    <span className="text-[11px] font-bold text-slate-900">{progressPercentage}%</span>
                </div>
            </div>

            {/* Winners Declared KPI */}
            <div className="bg-white p-5 rounded-2xl border-none shadow-none relative overflow-hidden">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Prizes Awarded</p>
                        <h4 className="text-2xl font-black text-slate-900 mt-1">
                            {winnersCount} <span className="text-sm font-medium text-slate-400">Winners</span>
                        </h4>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center font-bold shrink-0">
                        <Trophy className="w-5 h-5" />
                    </div>
                </div>
                <div className="mt-3 text-[11px] font-medium text-slate-500">
                    {totalExpected - winnersCount} remaining pot allocations
                </div>
            </div>

            {/* Total Duration KPI */}
            <div className="bg-white p-5 rounded-2xl border-none shadow-none relative overflow-hidden">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Duration</p>
                        <h4 className="text-2xl font-black text-slate-900 mt-1">
                            {totalExpected} <span className="text-sm font-medium text-slate-400">Months</span>
                        </h4>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-slate-900 text-rose-400 flex items-center justify-center font-bold shrink-0">
                        <Calendar className="w-5 h-5" />
                    </div>
                </div>
                <div className="mt-3 text-[11px] font-medium text-slate-500">
                    1 financial cycle per month
                </div>
            </div>
        </div>
    );
};
