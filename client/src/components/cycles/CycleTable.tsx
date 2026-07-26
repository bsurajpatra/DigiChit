import { useState } from 'react';
import type { ChitCycle, ChitCycleStatus } from '../../types/chitCycle';
import { CycleStatusBadge } from './CycleStatusBadge';
import { Search, Download, Calendar, Trophy, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { formatCurrency } from '../../utils/currency';

interface CycleTableProps {
    cycles: ChitCycle[];
    isOrganizer?: boolean;
    actionLoading?: string | null;
    currency?: string;
    onStart?: (cycleId: string) => void;
    onComplete?: (cycleId: string) => void;
    onRecordWinner?: (cycleId: string) => void;
    onCancel?: (cycleId: string) => void;
    onViewDetails?: (cycleId: string) => void;
}

export const CycleTable = ({
    cycles,
    isOrganizer = false,
    actionLoading,
    currency,
    onStart,
    onComplete,
    onRecordWinner,
    onCancel,
    onViewDetails
}: CycleTableProps) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'ALL' | ChitCycleStatus>('ALL');

    const filteredCycles = cycles.filter((c) => {
        const matchesSearch = searchTerm === '' ||
            `cycle ${c.cycleNumber}`.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const formatDateSafe = (dateVal: any, pattern: string = 'MMM dd, yyyy') => {
        if (!dateVal) return 'N/A';
        const d = new Date(dateVal);
        return isNaN(d.getTime()) ? 'N/A' : format(d, pattern);
    };

    const handleExportCSV = () => {
        const headers = ['Cycle #', 'Status', 'Scheduled Start', 'Actual Start', 'Actual End', 'Winner Name', 'Winning Bid Amount'];
        const rows = filteredCycles.map((c) => {
            const winMem: any = c.winnerMembershipId;
            const winnerName = typeof winMem === 'object' && winMem !== null
                ? (winMem.userId?.name || winMem.name || 'Recorded')
                : 'N/A';

            return [
                c.cycleNumber,
                c.status,
                `"${formatDateSafe(c.scheduledStartDate)}"`,
                c.actualStartDate ? `"${formatDateSafe(c.actualStartDate)}"` : 'N/A',
                c.actualEndDate ? `"${formatDateSafe(c.actualEndDate)}"` : 'N/A',
                `"${winnerName}"`,
                c.winningBidAmount ? c.winningBidAmount : 'N/A'
            ];
        });

        const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `cycles_list_report.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="bg-white rounded-2xl border-none shadow-none overflow-hidden space-y-4">
            {/* Header Toolbar */}
            <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-emerald-600" />
                        <span>Financial Cycles List Log ({cycles.length})</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Tabular roadmap listing all financial chit cycles and dividend payouts
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Search cycle #..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 pr-4 py-2 bg-slate-50 border-none rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 w-full md:w-64 transition"
                        />
                    </div>

                    <button
                        onClick={handleExportCSV}
                        disabled={cycles.length === 0}
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-slate-900 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition cursor-pointer disabled:opacity-40"
                    >
                        <Download className="w-3.5 h-3.5" />
                        <span>Export CSV</span>
                    </button>
                </div>
            </div>

            {/* Status Filter Tabs */}
            <div className="px-6 py-3 bg-slate-50/50 border-b border-slate-100 flex items-center gap-2 overflow-x-auto">
                <div className="p-1 bg-slate-100/80 rounded-xl border border-slate-200/60 inline-flex items-center gap-1">
                    {(['ALL', 'ACTIVE', 'UPCOMING', 'COMPLETED'] as const).map((st) => (
                        <button
                            key={st}
                            onClick={() => setStatusFilter(st)}
                            className={`
                                px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap
                                ${statusFilter === st
                                    ? 'bg-slate-900 text-white shadow-xs'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                                }
                            `}
                        >
                            {st}
                        </button>
                    ))}
                </div>
            </div>

            {/* List Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase tracking-wider text-slate-400">
                            <th className="py-3.5 px-6">Cycle</th>
                            <th className="py-3.5 px-6">Status</th>
                            <th className="py-3.5 px-6">Scheduled Start</th>
                            <th className="py-3.5 px-6">Winner Member</th>
                            <th className="py-3.5 px-6">Winning Bid</th>
                            <th className="py-3.5 px-6">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredCycles.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="py-12 text-center text-slate-400 font-medium">
                                    No cycles found matching criteria.
                                </td>
                            </tr>
                        ) : (
                            filteredCycles.map((c) => {
                                const winMem: any = c.winnerMembershipId;
                                const winnerName = typeof winMem === 'object' && winMem !== null
                                    ? (winMem.userId?.name || winMem.name || 'Recorded')
                                    : null;

                                const isActive = c.status === 'ACTIVE';

                                return (
                                    <tr key={c._id} className={`hover:bg-slate-50/80 transition ${isActive ? 'bg-emerald-50/30' : ''}`}>
                                        {/* Cycle # */}
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-xl bg-slate-900 text-emerald-400 flex items-center justify-center font-black shrink-0 text-xs">
                                                    #{c.cycleNumber}
                                                </div>
                                                <div>
                                                    <span className="font-bold text-slate-900 block leading-tight">Cycle #{c.cycleNumber}</span>
                                                    <span className="text-[10px] text-slate-400 block font-medium">Chit Cycle Period</span>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Status */}
                                        <td className="py-4 px-6">
                                            <CycleStatusBadge status={c.status} size="sm" />
                                        </td>

                                        {/* Scheduled Start */}
                                        <td className="py-4 px-6 text-slate-600 font-medium">
                                            {formatDateSafe(c.scheduledStartDate)}
                                        </td>

                                        {/* Winner Member */}
                                        <td className="py-4 px-6">
                                            {winnerName ? (
                                                <div className="flex items-center gap-1.5 text-slate-900 font-bold">
                                                    <Trophy className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                                    <span>{winnerName}</span>
                                                </div>
                                            ) : (
                                                <span className="text-slate-400 font-medium">No winner recorded</span>
                                            )}
                                        </td>

                                        {/* Winning Bid */}
                                        <td className="py-4 px-6 font-bold text-slate-900">
                                            {c.winningBidAmount ? formatCurrency(c.winningBidAmount, currency) : 'N/A'}
                                        </td>

                                        {/* Actions */}
                                        <td className="py-4 px-6">
                                            <div className="flex items-center justify-start gap-2">
                                                {onViewDetails && (
                                                    <button
                                                        onClick={() => onViewDetails(c._id)}
                                                        className="px-3 py-1.5 bg-slate-900 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1"
                                                    >
                                                        <Eye className="w-3.5 h-3.5 text-emerald-400" />
                                                        <span>Details</span>
                                                    </button>
                                                )}

                                                {isOrganizer && c.status === 'UPCOMING' && onStart && (
                                                    <button
                                                        disabled={!!actionLoading}
                                                        onClick={() => onStart(c._id)}
                                                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition cursor-pointer disabled:opacity-50"
                                                    >
                                                        Start
                                                    </button>
                                                )}

                                                {isOrganizer && c.status === 'ACTIVE' && (
                                                    <>
                                                        {onRecordWinner && (
                                                            <button
                                                                disabled={!!actionLoading}
                                                                onClick={() => onRecordWinner(c._id)}
                                                                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition cursor-pointer disabled:opacity-50"
                                                            >
                                                                Winner
                                                            </button>
                                                        )}
                                                        {onComplete && (
                                                            <button
                                                                disabled={!!actionLoading}
                                                                onClick={() => onComplete(c._id)}
                                                                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition cursor-pointer disabled:opacity-50"
                                                            >
                                                                Complete
                                                            </button>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
