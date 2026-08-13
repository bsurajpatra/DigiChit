import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { fetchMemberStatement, downloadStatementCSV } from '../../api/statement.api';
import type { IMemberStatementData, IStatementFilterParams } from '../../types/statement';
import { StatementSummaryCard } from '../../components/statements/StatementSummaryCard';
import { LedgerTimelineTable } from '../../components/statements/LedgerTimelineTable';
import {
    Wallet,
    AlertCircle,
    CheckCircle2,
    Download,
    Search,
    Loader2,
    FileSpreadsheet,
    RotateCcw
} from 'lucide-react';

export const MemberStatementPage = () => {
    const { user } = useAuth();
    const targetMemberId = user?.id || (user as any)?._id;
    const [data, setData] = useState<IMemberStatementData | null>(null);
    const [loading, setLoading] = useState(true);
    const [downloading, setDownloading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Filters
    const [search, setSearch] = useState('');
    const [entryType, setEntryType] = useState<string>('ALL');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [page, setPage] = useState(1);

    const loadData = useCallback(async () => {
        if (!targetMemberId) return;
        setLoading(true);
        setError(null);
        try {
            const params: IStatementFilterParams = {
                page,
                limit: 15,
                search: search.trim() || undefined,
                entryType: entryType !== 'ALL' ? entryType : undefined,
                startDate: startDate || undefined,
                endDate: endDate || undefined
            };
            const result = await fetchMemberStatement(targetMemberId, params);
            setData(result);
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || 'Failed to load member statement');
        } finally {
            setLoading(false);
        }
    }, [targetMemberId, page, search, entryType, startDate, endDate]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleExportCSV = async () => {
        if (!targetMemberId) return;
        setDownloading(true);
        try {
            await downloadStatementCSV({
                memberId: targetMemberId,
                entryType: entryType !== 'ALL' ? entryType : undefined,
                startDate: startDate || undefined,
                endDate: endDate || undefined
            });
        } catch (err: any) {
            alert('Failed to download CSV statement');
        } finally {
            setDownloading(false);
        }
    };

    const handleResetFilters = () => {
        setSearch('');
        setEntryType('ALL');
        setStartDate('');
        setEndDate('');
        setPage(1);
    };

    if (loading && !data) {
        return (
            <div className="py-24 flex flex-col items-center justify-center space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <Loader2 className="w-7 h-7 animate-spin" />
                </div>
                <span className="text-sm font-bold text-slate-700">Loading Financial Statement...</span>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="py-24 flex flex-col items-center justify-center space-y-4">
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 font-bold text-xs flex items-center gap-2 max-w-md">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{error || 'Failed to load statement'}</span>
                </div>
                <button
                    onClick={loadData}
                    className="px-4 py-2 bg-slate-900 text-white font-bold rounded-xl text-xs flex items-center gap-2 hover:bg-slate-800 transition cursor-pointer"
                >
                    <RotateCcw className="w-4 h-4" />
                    <span>Retry</span>
                </button>
            </div>
        );
    }

    const { summary, pagination, timeline } = data;

    return (
        <div className="space-y-6 pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
                        <FileSpreadsheet className="w-4 h-4" />
                        <span>Financial Ledger & Audit Engine</span>
                    </div>
                    <h1 className="text-xl font-black text-slate-900 tracking-tight">Member Financial Statement</h1>
                </div>

                <button
                    onClick={handleExportCSV}
                    disabled={downloading}
                    className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs hover:shadow-md flex items-center gap-2 cursor-pointer shrink-0"
                >
                    {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    <span>Export Statement (CSV)</span>
                </button>
            </div>

            {/* KPI Summary Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatementSummaryCard
                    title="Total Paid"
                    value={summary.totalPaid}
                    subtitle={`${summary.paidInstallmentsCount} of ${summary.totalInstallmentsCount} Installments Settled`}
                    icon={CheckCircle2}
                    variant="primary"
                />

                <StatementSummaryCard
                    title="Outstanding Balance"
                    value={summary.totalOutstanding}
                    subtitle={`${summary.pendingInstallmentsCount} Obligations Remaining`}
                    icon={AlertCircle}
                    variant={summary.totalOutstanding > 0 ? 'warning' : 'success'}
                />

                <StatementSummaryCard
                    title="Late Fees Paid"
                    value={summary.totalLateFeesPaid}
                    subtitle="Accrued Penalties Settled"
                    icon={Wallet}
                    variant="neutral"
                />

                <StatementSummaryCard
                    title="Refunds Received"
                    value={summary.totalRefunds}
                    subtitle="Processed Adjustments"
                    icon={FileSpreadsheet}
                    variant="info"
                />
            </div>

            {/* Main Section: Search, Filters & Timeline */}
            <div className="space-y-4">
                {/* Search & Filter Control Bar */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
                    {/* Search Bar */}
                    <div className="relative min-w-[240px] flex-1 max-w-sm">
                        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by entry ref, description..."
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setPage(1);
                            }}
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        />
                    </div>

                    {/* Filter Dropdown & Date Pickers */}
                    <div className="flex flex-wrap items-center gap-2.5">
                        <select
                            value={entryType}
                            onChange={(e) => {
                                setEntryType(e.target.value);
                                setPage(1);
                            }}
                            className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
                        >
                            <option value="ALL">All Entry Types</option>
                            <option value="INSTALLMENT_PAYMENT">Installment Payment</option>
                            <option value="LATE_FEE">Late Fee</option>
                            <option value="REFUND">Refund</option>
                            <option value="REVERSAL">Reversal</option>
                        </select>

                        <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 border border-slate-200 rounded-xl">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">From</span>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => {
                                    setStartDate(e.target.value);
                                    setPage(1);
                                }}
                                className="bg-transparent text-xs font-bold text-slate-800 outline-none"
                            />
                        </div>

                        <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 border border-slate-200 rounded-xl">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">To</span>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => {
                                    setEndDate(e.target.value);
                                    setPage(1);
                                }}
                                className="bg-transparent text-xs font-bold text-slate-800 outline-none"
                            />
                        </div>

                        {(search || entryType !== 'ALL' || startDate || endDate) && (
                            <button
                                onClick={handleResetFilters}
                                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                                title="Reset Filters"
                            >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>Reset</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Ledger Timeline Table */}
                <LedgerTimelineTable timeline={timeline} />

                {/* Pagination Controls */}
                {pagination.totalPages > 1 && (
                    <div className="bg-white px-6 py-4 rounded-2xl border border-slate-200/80 flex items-center justify-between text-xs font-bold text-slate-500">
                        <span>
                            Showing Page {pagination.page} of {pagination.totalPages} ({pagination.total} entries)
                        </span>

                        <div className="flex items-center gap-2">
                            <button
                                disabled={pagination.page <= 1}
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 rounded-xl transition cursor-pointer"
                            >
                                Previous
                            </button>
                            <button
                                disabled={pagination.page >= pagination.totalPages}
                                onClick={() => setPage((p) => p + 1)}
                                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 rounded-xl transition cursor-pointer"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
