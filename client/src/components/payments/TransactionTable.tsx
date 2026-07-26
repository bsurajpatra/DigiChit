import { useState } from 'react';
import type { TransactionRecord, TransactionStatus, PaymentGatewayProvider } from '../../api/transaction.api';
import { TransactionStatusBadge } from './TransactionStatusBadge';
import { Search, Download, Eye, RefreshCw, FileText, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { formatCurrency } from '../../utils/currency';

interface TransactionTableProps {
    transactions: TransactionRecord[];
    total: number;
    page: number;
    totalPages: number;
    isLoading?: boolean;
    onPageChange?: (page: number) => void;
    onSelectTransaction?: (txn: TransactionRecord) => void;
    onRefundTrigger?: (txn: TransactionRecord) => void;
    isOrganizer?: boolean;
}

export const TransactionTable = ({
    transactions,
    total,
    page,
    totalPages,
    isLoading = false,
    onPageChange,
    onSelectTransaction,
    onRefundTrigger,
    isOrganizer = false
}: TransactionTableProps) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'ALL' | TransactionStatus>('ALL');

    const filteredTransactions = transactions.filter((t) => {
        const matchesSearch = searchTerm === '' ||
            t.transactionNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (t.receiptNumber && t.receiptNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (t.memberId?.name && t.memberId.name.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const formatDateSafe = (dateVal?: string | null) => {
        if (!dateVal) return 'N/A';
        try {
            const d = new Date(dateVal);
            return isNaN(d.getTime()) ? 'N/A' : format(d, 'MMM dd, yyyy h:mm a');
        } catch {
            return 'N/A';
        }
    };

    const handleExportCSV = () => {
        const headers = ['Txn Number', 'Member', 'Group', 'Cycle', 'Amount', 'Currency', 'Payment Method', 'Gateway', 'Status', 'Receipt Number', 'Date'];
        const rows = filteredTransactions.map((t) => [
            t.transactionNumber,
            `"${t.memberId?.name || 'Member'}"`,
            `"${t.groupId?.name || 'Group'}"`,
            t.cycleId?.cycleNumber || 1,
            t.amount,
            t.currency,
            t.paymentMethod,
            t.paymentGateway,
            t.status,
            t.receiptNumber || 'N/A',
            `"${formatDateSafe(t.completedAt || t.createdAt)}"`
        ]);

        const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `transactions_report.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden space-y-4">
            {/* Header Control Bar */}
            <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/40">
                <div>
                    <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                        <FileText className="w-5 h-5 text-emerald-600" />
                        <span>Payment Transactions Register ({total})</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Immutable event log for all chit installment payment activities
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Search transaction # or member..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 w-full md:w-64 transition"
                        />
                    </div>

                    <button
                        onClick={handleExportCSV}
                        disabled={transactions.length === 0}
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-slate-900 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition cursor-pointer disabled:opacity-40"
                    >
                        <Download className="w-3.5 h-3.5" />
                        <span>Export CSV</span>
                    </button>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="px-6 py-2 border-b border-slate-100 flex items-center gap-2 overflow-x-auto">
                {(['ALL', 'SUCCESS', 'PENDING', 'FAILED', 'REFUNDED'] as const).map((st) => (
                    <button
                        key={st}
                        onClick={() => setStatusFilter(st)}
                        className={`
                            px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap
                            ${statusFilter === st
                                ? 'bg-slate-900 text-white shadow-xs'
                                : 'text-slate-500 bg-slate-100 hover:bg-slate-200/70'
                            }
                        `}
                    >
                        {st}
                    </button>
                ))}
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase tracking-wider text-slate-400">
                            <th className="py-3.5 px-6">Transaction #</th>
                            <th className="py-3.5 px-6">Member & Group</th>
                            <th className="py-3.5 px-6">Amount</th>
                            <th className="py-3.5 px-6">Method / Gateway</th>
                            <th className="py-3.5 px-6">Status</th>
                            <th className="py-3.5 px-6">Initiated Date</th>
                            <th className="py-3.5 px-6">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {isLoading ? (
                            <tr>
                                <td colSpan={7} className="py-12 text-center text-slate-400">
                                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-600 mb-2" />
                                    <span>Loading transactions...</span>
                                </td>
                            </tr>
                        ) : filteredTransactions.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                                    No payment transactions found matching criteria.
                                </td>
                            </tr>
                        ) : (
                            filteredTransactions.map((t) => (
                                <tr key={t._id} className="hover:bg-slate-50/80 transition">
                                    {/* Transaction # */}
                                    <td className="py-4 px-6 font-mono font-bold text-slate-900">
                                        <span>{t.transactionNumber}</span>
                                        {t.receiptNumber && (
                                            <span className="block text-[10px] text-emerald-600 font-medium font-mono">
                                                {t.receiptNumber}
                                            </span>
                                        )}
                                    </td>

                                    {/* Member & Group */}
                                    <td className="py-4 px-6">
                                        <span className="font-bold text-slate-900 block">{t.memberId?.name || 'Chit Member'}</span>
                                        <span className="text-[10px] text-slate-400 font-medium block">{t.groupId?.name || 'Chit Group'}</span>
                                    </td>

                                    {/* Amount */}
                                    <td className="py-4 px-6 font-black text-slate-900 text-sm">
                                        {formatCurrency(t.amount, t.currency)}
                                    </td>

                                    {/* Method / Gateway */}
                                    <td className="py-4 px-6">
                                        <span className="font-bold text-slate-800 block text-xs">{t.paymentMethod}</span>
                                        <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider block">{t.paymentGateway}</span>
                                    </td>

                                    {/* Status */}
                                    <td className="py-4 px-6">
                                        <TransactionStatusBadge status={t.status} size="sm" />
                                    </td>

                                    {/* Initiated Date */}
                                    <td className="py-4 px-6 text-slate-600 font-medium">
                                        {formatDateSafe(t.completedAt || t.initiatedAt)}
                                    </td>

                                    {/* Actions */}
                                    <td className="py-4 px-6">
                                        <div className="flex items-center justify-start gap-2">
                                            {onSelectTransaction && (
                                                <button
                                                    onClick={() => onSelectTransaction(t)}
                                                    className="px-3 py-1.5 bg-slate-900 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1"
                                                >
                                                    <Eye className="w-3.5 h-3.5 text-emerald-400" />
                                                    <span>View</span>
                                                </button>
                                            )}

                                            {isOrganizer && t.status === 'SUCCESS' && onRefundTrigger && (
                                                <button
                                                    onClick={() => onRefundTrigger(t)}
                                                    className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition cursor-pointer"
                                                >
                                                    Refund
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-600">
                    <span>Page {page} of {totalPages}</span>
                    <div className="flex items-center gap-2">
                        <button
                            disabled={page <= 1}
                            onClick={() => onPageChange && onPageChange(page - 1)}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer disabled:opacity-40"
                        >
                            Previous
                        </button>
                        <button
                            disabled={page >= totalPages}
                            onClick={() => onPageChange && onPageChange(page + 1)}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer disabled:opacity-40"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
