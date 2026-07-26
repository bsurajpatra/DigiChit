import { useState } from 'react';
import type { Bid } from '../../types/bid';
import { BidStatusBadge } from './BidStatusBadge';
import { Search, Download, Hammer, Trophy } from 'lucide-react';
import { format } from 'date-fns';
import { formatCurrency } from '../../utils/currency';

interface BidTableProps {
    bids: Bid[];
    auctionNumber?: number;
    currency?: string;
    isLoading?: boolean;
}

export const BidTable = ({ bids, auctionNumber = 1, currency, isLoading: _isLoading = false }: BidTableProps) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'ALL' | string>('ALL');

    const filteredBids = bids.filter((bid) => {
        const userName = typeof bid.userId === 'object' && bid.userId?.name ? bid.userId.name : '';
        const userEmail = typeof bid.userId === 'object' && bid.userId?.email ? bid.userId.email : '';

        const matchesSearch = userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            userEmail.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === 'ALL' || bid.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    // Sort by bidPercentage descending (highest discount bid ranked first)
    const sortedBids = [...filteredBids].sort((a, b) => b.bidPercentage - a.bidPercentage);

    const handleExportCSV = () => {
        const headers = ['Rank', 'Member Name', 'Member Email', 'Bid Percentage (%)', 'Bid Amount (INR)', 'Status', 'Submitted At'];
        const rows = sortedBids.map((b, idx) => {
            const name = typeof b.userId === 'object' ? b.userId.name : 'Member';
            const email = typeof b.userId === 'object' ? b.userId.email : '';
            return [
                idx + 1,
                `"${name}"`,
                `"${email}"`,
                b.bidPercentage,
                b.bidAmount,
                b.status,
                `"${format(new Date(b.submittedAt || b.createdAt), 'yyyy-MM-dd HH:mm:ss')}"`
            ];
        });

        const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `auction_${auctionNumber}_bids_report.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="bg-white rounded-2xl border-none shadow-none overflow-hidden">
            {/* Table Header Controls */}
            <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                        <Hammer className="w-5 h-5 text-slate-900" />
                        <span>Submitted Bids Log ({bids.length})</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Member bids ranked by highest percentage discount offer
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {/* Search Input */}
                    <div className="relative">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Search member name or email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 pr-4 py-2 bg-slate-50 border-none rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 w-full md:w-64 transition"
                        />
                    </div>

                    {/* Export CSV Button */}
                    <button
                        onClick={handleExportCSV}
                        disabled={bids.length === 0}
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-slate-900 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition cursor-pointer disabled:opacity-40"
                    >
                        <Download className="w-3.5 h-3.5" />
                        <span>Export CSV</span>
                    </button>
                </div>
            </div>

            {/* Filter Pills */}
            <div className="px-6 py-3 bg-slate-50/50 border-b border-slate-100 flex items-center gap-2 overflow-x-auto">
                <div className="p-1 bg-slate-100/80 rounded-xl border border-slate-200/60 inline-flex items-center gap-1">
                    {(['ALL', 'SUBMITTED', 'VALID', 'WINNING', 'WITHDRAWN', 'REJECTED'] as const).map((st) => (
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

            {/* Table Content */}
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase tracking-wider text-slate-400">
                            <th className="py-3.5 px-6">Rank</th>
                            <th className="py-3.5 px-6">Member</th>
                            <th className="py-3.5 px-6">Bid Percentage</th>
                            <th className="py-3.5 px-6">Discount Amount</th>
                            <th className="py-3.5 px-6">Submitted At</th>
                            <th className="py-3.5 px-6">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {sortedBids.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="py-8 text-center text-slate-400 font-medium">
                                    No member bids found matching your criteria.
                                </td>
                            </tr>
                        ) : (
                            sortedBids.map((bid, index) => {
                                const uName = typeof bid.userId === 'object' && bid.userId?.name ? bid.userId.name : 'Member';
                                const uEmail = typeof bid.userId === 'object' && bid.userId?.email ? bid.userId.email : '';
                                const isWinner = bid.isWinningBid || bid.status === 'WINNING';

                                return (
                                    <tr key={bid._id} className={`hover:bg-slate-50/80 transition ${isWinner ? 'bg-amber-50/40 font-bold' : ''}`}>
                                        <td className="py-4 px-6 font-black text-slate-400">
                                            {isWinner ? (
                                                <Trophy className="w-4 h-4 text-amber-500" />
                                            ) : (
                                                `#${index + 1}`
                                            )}
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-7 h-7 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs shrink-0">
                                                    {uName.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <span className="font-bold text-slate-900 block leading-tight">{uName}</span>
                                                    {uEmail && <span className="text-[10px] text-slate-400 block">{uEmail}</span>}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 font-black text-slate-900 text-sm">
                                            {bid.bidPercentage}%
                                        </td>
                                        <td className="py-4 px-6 font-black text-emerald-600">
                                            {formatCurrency(bid.bidAmount || 0, currency)}
                                        </td>
                                        <td className="py-4 px-6 text-slate-500 font-medium">
                                            {format(new Date(bid.submittedAt || bid.createdAt), 'PPpp')}
                                        </td>
                                        <td className="py-4 px-6">
                                            <BidStatusBadge status={bid.status} isWinning={isWinner} size="sm" />
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
