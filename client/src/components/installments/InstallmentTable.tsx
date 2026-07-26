import { useState } from 'react';
import type { Installment, InstallmentPaymentStatus } from '../../types/installment';
import { PaymentStatusBadge } from './PaymentStatusBadge';
import { Search, Download, ShieldCheck, Coins, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { formatCurrency } from '../../utils/currency';

interface InstallmentTableProps {
    installments: Installment[];
    isOrganizer?: boolean;
    isAdmin?: boolean;
    actionLoading?: string | null;
    currency?: string;
    onWaiveLateFee?: (installmentId: string) => void;
}

const formatDateSafe = (dateVal: any, formatPattern: string = 'PP') => {
    if (!dateVal) return 'N/A';
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return 'N/A';
    return format(d, formatPattern);
};

export const InstallmentTable = ({
    installments,
    isOrganizer = false,
    isAdmin = false,
    actionLoading,
    currency,
    onWaiveLateFee
}: InstallmentTableProps) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'ALL' | InstallmentPaymentStatus>('ALL');

    const filteredInstallments = installments.filter((item) => {
        const uName = typeof item.userId === 'object' && item.userId?.name ? item.userId.name : '';
        const uEmail = typeof item.userId === 'object' && item.userId?.email ? item.userId.email : '';

        const matchesSearch = uName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            uEmail.toLowerCase().includes(searchTerm.toLowerCase());

        const currentStatus = item.paymentStatus || item.status || 'PENDING';
        const matchesStatus = statusFilter === 'ALL' || currentStatus === statusFilter;

        return matchesSearch && matchesStatus;
    });

    const handleExportCSV = () => {
        const headers = ['Member Name', 'Member Email', 'Installment #', 'Base Amount', 'Due Date', 'Late Fee', 'Status', 'Paid Date'];
        const rows = filteredInstallments.map((inst) => {
            const uName = typeof inst.userId === 'object' ? inst.userId.name : 'Member';
            const uEmail = typeof inst.userId === 'object' ? inst.userId.email : '';
            return [
                `"${uName}"`,
                `"${uEmail}"`,
                inst.installmentNumber,
                inst.amount,
                `"${formatDateSafe(inst.dueDate, 'yyyy-MM-dd')}"`,
                inst.lateFee || 0,
                inst.status,
                inst.paidDate ? `"${formatDateSafe(inst.paidDate, 'yyyy-MM-dd')}"` : 'N/A'
            ];
        });

        const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `installments_collection_report.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="bg-white rounded-2xl border-none shadow-none overflow-hidden">
            {/* Header Controls */}
            <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                        <Coins className="w-5 h-5 text-emerald-600" />
                        <span>Cycle Installments Log ({installments.length})</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Track individual member payment obligations and late fees
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
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

                    <button
                        onClick={handleExportCSV}
                        disabled={installments.length === 0}
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-slate-900 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition cursor-pointer disabled:opacity-40"
                    >
                        <Download className="w-3.5 h-3.5" />
                        <span>Export CSV</span>
                    </button>
                </div>
            </div>

            {/* Filter Pills */}
            <div className="px-6 py-3 bg-slate-50/50 border-b border-slate-100 flex items-center gap-2 overflow-x-auto">
                {(['ALL', 'PENDING', 'PAID', 'OVERDUE'] as const).map((st) => (
                    <button
                        key={st}
                        onClick={() => setStatusFilter(st)}
                        className={`
                            px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap
                            ${statusFilter === st
                                ? 'bg-slate-900 text-white'
                                : 'text-slate-500 hover:bg-slate-200/60'
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
                            <th className="py-3.5 px-6">Member</th>
                            <th className="py-3.5 px-6">Base Dues</th>
                            <th className="py-3.5 px-6">Due Date</th>
                            <th className="py-3.5 px-6">Late Fee</th>
                            <th className="py-3.5 px-6">Status</th>
                            <th className="py-3.5 px-6">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredInstallments.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="py-8 text-center text-slate-400 font-medium">
                                    No installments found matching your criteria.
                                </td>
                            </tr>
                        ) : (
                            filteredInstallments.map((inst) => {
                                const uName = typeof inst.userId === 'object' && inst.userId?.name ? inst.userId.name : 'Member';
                                const uEmail = typeof inst.userId === 'object' && inst.userId?.email ? inst.userId.email : '';
                                const isWaiving = actionLoading === `waive-${inst._id}`;

                                return (
                                    <tr key={inst._id} className="hover:bg-slate-50/80 transition">
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
                                        <td className="py-4 px-6 font-black text-slate-900">
                                            {formatCurrency(inst.amount, currency)}
                                        </td>
                                        <td className="py-4 px-6 text-slate-500 font-medium">
                                            {formatDateSafe(inst.dueDate)}
                                        </td>
                                        <td className="py-4 px-6 font-bold">
                                            {inst.lateFee > 0 ? (
                                                <span className="text-rose-600">+ {formatCurrency(inst.lateFee, currency)}</span>
                                            ) : (
                                                <span className="text-slate-400">{formatCurrency(0, currency)}</span>
                                            )}
                                        </td>
                                        <td className="py-4 px-6">
                                            <PaymentStatusBadge status={inst.paymentStatus || inst.status || 'PENDING'} size="sm" />
                                        </td>
                                        <td className="py-4 px-6">
                                            {(isOrganizer || isAdmin) && inst.lateFee > 0 && !inst.isLateFeeWaived && onWaiveLateFee && (
                                                <button
                                                    disabled={!!actionLoading}
                                                    onClick={() => onWaiveLateFee(inst._id)}
                                                    className="inline-flex items-center gap-1 px-3 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-xl text-[11px] font-bold transition cursor-pointer disabled:opacity-50"
                                                >
                                                    {isWaiving ? <Loader2 className="w-3 h-3 animate-spin" /> : <ShieldCheck className="w-3 h-3" />}
                                                    <span>Waive Fee</span>
                                                </button>
                                            )}
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
