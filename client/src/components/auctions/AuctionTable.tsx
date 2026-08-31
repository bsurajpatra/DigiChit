import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Auction, AuctionStatus } from '../../types/auction';
import { AuctionStatusBadge } from './AuctionStatusBadge';
import { Search, Download, Hammer, Trophy, PlayCircle, XCircle, CheckCircle, ArrowRight, Eye, ShieldCheck } from 'lucide-react';
import { format } from 'date-fns';
import { formatCurrency } from '../../utils/currency';

interface AuctionTableProps {
    auctions: Auction[];
    isOrganizer?: boolean;
    isAdmin?: boolean;
    actionLoading?: string | null;
    currency?: string;
    onStart?: (auctionId: string) => void;
    onCloseAuction?: (auctionId: string) => void;
    onDeclareWinner?: (auctionId: string) => void;
    onCancel?: (auctionId: string) => void;
    onViewDetails?: (auctionId: string) => void;
    onViewBids?: (auctionId: string) => void;
    onOpenBiddingRoom?: (auctionId: string) => void;
}

export const AuctionTable = ({
    auctions,
    isOrganizer = false,
    isAdmin = false,
    actionLoading,
    currency,
    onStart,
    onCloseAuction,
    onDeclareWinner,
    onCancel,
    onViewDetails,
    onViewBids,
    onOpenBiddingRoom
}: AuctionTableProps) => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'ALL' | AuctionStatus>('ALL');

    const filteredAuctions = auctions.filter((item) => {
        const cycleNum = typeof item.cycleId === 'object' ? (item.cycleId as any).cycleNumber : '';
        const matchesSearch = searchTerm === '' ||
            `auction ${item.auctionNumber}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
            `cycle ${cycleNum}`.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const formatDateSafe = (dateVal: any, pattern: string = 'MMM dd, yyyy h:mm a') => {
        if (!dateVal) return 'N/A';
        const d = new Date(dateVal);
        return isNaN(d.getTime()) ? 'N/A' : format(d, pattern);
    };

    const handleExportCSV = () => {
        const headers = ['Auction #', 'Status', 'Min Bid %', 'Max Bid %', 'Scheduled Start', 'Scheduled End', 'Winning Bid %'];
        const rows = filteredAuctions.map((a) => {
            const winPct = (a as any).winningBidPercentage;
            return [
                a.auctionNumber,
                a.status,
                `${a.minimumBidPercentage}%`,
                `${a.maximumBidPercentage}%`,
                `"${formatDateSafe(a.scheduledStartTime, 'yyyy-MM-dd HH:mm')}"`,
                a.scheduledEndTime ? `"${formatDateSafe(a.scheduledEndTime, 'yyyy-MM-dd HH:mm')}"` : 'N/A',
                winPct ? `${winPct}%` : 'N/A'
            ];
        });

        const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `auctions_list_report.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="bg-white rounded-2xl border-none shadow-none overflow-hidden">
            {/* Header Toolbar */}
            <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                        <Hammer className="w-5 h-5 text-emerald-600" />
                        <span>Auctions List Log ({auctions.length})</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Detailed tabular record of scheduled, active, and completed auctions
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Search auction or cycle..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 pr-4 py-2 bg-slate-50 border-none rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 w-full md:w-64 transition"
                        />
                    </div>

                    <button
                        onClick={handleExportCSV}
                        disabled={auctions.length === 0}
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
                    {(['ALL', 'SCHEDULED', 'OPEN', 'CLOSED', 'CANCELLED'] as const).map((st) => (
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
                            <th className="py-3.5 px-6">Auction & Cycle</th>
                            <th className="py-3.5 px-6">Status</th>
                            <th className="py-3.5 px-6">Bid Limits (%)</th>
                            <th className="py-3.5 px-6">Scheduled Start</th>
                            <th className="py-3.5 px-6">Winner / Winning Bid</th>
                            <th className="py-3.5 px-6">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredAuctions.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="py-12 text-center text-slate-400 font-medium">
                                    No auctions found matching criteria.
                                </td>
                            </tr>
                        ) : (
                            filteredAuctions.map((a) => {
                                const cycleObj = typeof a.cycleId === 'object' ? a.cycleId : null;
                                const winMem: any = a.winningMembershipId;
                                const winnerName = typeof winMem === 'object' && winMem !== null
                                    ? (winMem.userId?.name || winMem.name || null)
                                    : null;

                                const isOpen = a.status === 'OPEN';

                                return (
                                    <tr key={a._id} className={`hover:bg-slate-50/80 transition ${isOpen ? 'bg-emerald-50/30' : ''}`}>
                                        {/* Auction & Cycle */}
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-xl bg-slate-900 text-emerald-400 flex items-center justify-center font-black shrink-0 text-xs">
                                                    #{a.auctionNumber}
                                                </div>
                                                <div>
                                                    <span className="font-bold text-slate-900 block leading-tight">Auction #{a.auctionNumber}</span>
                                                    <span className="text-[10px] text-slate-400 block font-medium">
                                                        {cycleObj ? `Cycle #${cycleObj.cycleNumber}` : `Cycle #${a.auctionNumber}`}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Status */}
                                        <td className="py-4 px-6">
                                            <AuctionStatusBadge status={a.status} size="sm" />
                                        </td>

                                        {/* Bid Limits */}
                                        <td className="py-4 px-6 font-bold text-slate-900">
                                            <span>{a.minimumBidPercentage}%</span>
                                            <span className="text-slate-400 mx-1">—</span>
                                            <span>{a.maximumBidPercentage}%</span>
                                        </td>

                                        {/* Scheduled Start */}
                                        <td className="py-4 px-6 text-slate-600 font-medium">
                                            {formatDateSafe(a.scheduledStartTime)}
                                        </td>

                                        {/* Winner */}
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

                                        {/* Actions */}
                                        <td className="py-4 px-6">
                                            <div className="flex items-center justify-start gap-2">
                                                {a.status === 'OPEN' && (
                                                    <button
                                                        onClick={() => {
                                                            if (onOpenBiddingRoom) {
                                                                onOpenBiddingRoom(a._id);
                                                            } else if (onViewBids) {
                                                                onViewBids(a._id);
                                                            } else {
                                                                navigate(`/auctions/${a._id}/bids`);
                                                            }
                                                        }}
                                                        className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                                                    >
                                                        <Hammer className="w-3.5 h-3.5" />
                                                        <span>Bid Now</span>
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => {
                                                        if (onViewDetails) {
                                                            onViewDetails(a._id);
                                                        } else {
                                                            navigate(`/auctions/${a._id}`);
                                                        }
                                                    }}
                                                    className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                                                >
                                                    <Eye className="w-3.5 h-3.5 text-emerald-400" />
                                                    <span>Details</span>
                                                </button>
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
