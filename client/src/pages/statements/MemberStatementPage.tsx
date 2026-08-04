import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { fetchMemberStatement, downloadStatementCSV } from '../../api/statement.api';
import { IMemberStatementData, IStatementFilterParams } from '../../types/statement';
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
        if (!user?._id) return;
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
            const result = await fetchMemberStatement(user._id, params);
            setData(result);
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || 'Failed to load member statement');
        } finally {
            setLoading(false);
        }
    }, [user?._id, page, search, entryType, startDate, endDate]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleExportCSV = async () => {
        if (!user?._id) return;
        setDownloading(true);
        try {
            await downloadStatementCSV({
                memberId: user._id,
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
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
                <div className="flex items-center gap-3 bg-white p-6 rounded-3xl shadow-sm border border-slate-200 text-slate-700 font-bold">
                    <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
                    <span>Loading Financial Statement...</span>
                </div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="min-h-screen bg-slate-50 p-6 flex flex-col items-center justify-center space-y-4">
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 font-bold text-sm flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                    <span>{error || 'Failed to load statement'}</span>
                </div>
                <button
                    onClick={loadData}
                    className="px-4 py-2 bg-slate-900 text-white font-bold rounded-xl text-xs flex items-center gap-2"
                >
                    <RotateCcw className="w-4 h-4" />
                    <span>Retry</span>
                </button>
            </div>
        );
    }

    const { summary, pagination, timeline } = data;

    return (
        <div className="min-h-screen bg-slate-50/60 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
                <div>
                    <h1 className="text-xl font-black text-slate-900">My Financial Statement</h1>
                    <p className="text-xs font-medium text-slate-400 mt-0.5">
                        Official ledger audit trail and contribution history for {data.member.name}
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={handleExportCSV}
                        disabled={downloading}
                        className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition flex items-center gap-2 cursor-pointer shadow-xs"
                    >
                        {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                        <span>Download Statement (CSV)</span>
                    </button>
                </div>
            </div>

            {/* KPI Summary Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatementSummaryCard
                    title="Total Paid"
                    value={summary.totalPaid}
                    subtitle={`${summary.paidInstallmentsCount} of ${summary.totalInstallmentsCount} Installments Paid`}
                    icon={CheckCircle2}
                    variant="primary"
                />

                <StatementSummaryCard
                    title="Outstanding Amount"
                    value={summary.totalOutstanding}
                    subtitle={`${summary.pendingInstallmentsCount} Pending Obligations`}
                    icon={AlertCircle}
                    variant={summary.totalOutstanding > 0 ? 'warning' : 'success'}
                />

                <StatementSummaryCard
                    title="Late Fees Paid"
                    value={summary.totalLateFeesPaid}
                    subtitle="Accrued Late Penalties"
                    icon={Wallet}
                    variant="neutral"
                />

                <StatementSummaryCard
                    title="Refunds Received"
                    value={summary.totalRefunds}
                    subtitle="Processed Adjustments"
                    icon={FileSpreadsheet}
                    variant="neutral"
                />
            </div>

            {/* Main Content Card: Timeline & Filters */}
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-6">
                {/* Search & Filter Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-4">
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
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:bg-white focus:border-slate-900 transition"
                        />
                    </div>

                    {/* Filters: Type & Date Range */}
                    <div className="flex flex-wrap items-center gap-3">
                        <select
                            value={entryType}
                            onChange={(e) => {
                                setEntryType(e.target.value);
                                setPage(1);
                            }}
                            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:bg-white cursor-pointer"
                        >
                            <option value="ALL">All Entry Types</option>
                            <option value="INSTALLMENT_PAYMENT">Installment Payment</option>
                            <option value="LATE_FEE">Late Fee</option>
                            <option value="REFUND">Refund</option>
                            <option value="REVERSAL">Reversal</option>
                        </select>

                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => {
                                setStartDate(e.target.value);
                                setPage(1);
                            }}
                            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:bg-white"
                        />

                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => {
                                setEndDate(e.target.value);
                                setPage(1);
                            }}
                            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:bg-white"
                        />

                        {(search || entryType !== 'ALL' || startDate || endDate) && (
                            <button
                                onClick={handleResetFilters}
                                className="p-2 text-slate-400 hover:text-slate-700 bg-slate-100 rounded-xl transition cursor-pointer"
                                title="Reset Filters"
                            >
                                <RotateCcw className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Ledger Timeline Table */}
                <LedgerTimelineTable timeline={timeline} />

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-xs font-bold text-slate-500">
                        <span>
                            Showing Page {pagination.page} of {pagination.totalPages} ({pagination.total} entries)
                        </span>

                        <div className="flex items-center gap-2">
                            <button
                                disabled={pagination.page <= 1}
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 rounded-lg transition cursor-pointer"
                            >
                                Previous
                            </button>
                            <button
                                disabled={pagination.page >= pagination.totalPages}
                                onClick={() => setPage((p) => p + 1)}
                                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 rounded-lg transition cursor-pointer"
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
