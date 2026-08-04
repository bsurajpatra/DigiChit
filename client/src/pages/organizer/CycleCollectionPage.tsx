import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Download,
    Search,
    Unlock,
    Lock,
    Trophy,
    Coins,
    CheckCircle2,
    Clock,
    AlertCircle,
    Loader2,
    LayoutDashboard
} from 'lucide-react';
import { format } from 'date-fns';
import {
    fetchCollectionSummary,
    fetchPendingMembers,
    openCollections,
    closeCollections,
    type CollectionSummaryData
} from '../../api/collection.api';
import { PaymentCollectionBadge } from '../../components/cycles/PaymentCollectionBadge';
import { PaymentStatusBadge } from '../../components/installments/PaymentStatusBadge';
import { formatCurrency } from '../../utils/currency';
import { useAuth } from '../../context/AuthContext';

export const CycleCollectionPage = () => {
    const { cycleId } = useParams<{ cycleId: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [summary, setSummary] = useState<CollectionSummaryData | null>(null);
    const [members, setMembers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('ALL');
    const [actionLoading, setActionLoading] = useState(false);
    const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; action: 'open' | 'close' }>({
        isOpen: false,
        action: 'open'
    });

    const loadData = useCallback(async () => {
        if (!cycleId) return;
        setLoading(true);
        setError(null);
        try {
            const [sumData, memData] = await Promise.all([
                fetchCollectionSummary(cycleId),
                fetchPendingMembers(cycleId, { status: statusFilter, search: searchTerm })
            ]);
            setSummary(sumData);
            setMembers(memData);
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || 'Failed to load collection data');
        } finally {
            setLoading(false);
        }
    }, [cycleId, statusFilter, searchTerm]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleOpenCollections = async () => {
        if (!cycleId) return;
        setActionLoading(true);
        try {
            await openCollections(cycleId);
            setConfirmModal({ isOpen: false, action: 'open' });
            await loadData();
        } catch (err: any) {
            alert(err.response?.data?.message || err.message || 'Failed to open collections');
        } finally {
            setActionLoading(false);
        }
    };

    const handleCloseCollections = async () => {
        if (!cycleId) return;
        setActionLoading(true);
        try {
            await closeCollections(cycleId);
            setConfirmModal({ isOpen: false, action: 'close' });
            await loadData();
        } catch (err: any) {
            alert(err.response?.data?.message || err.message || 'Failed to close collections');
        } finally {
            setActionLoading(false);
        }
    };

    const handleExportCSV = () => {
        if (!summary || !members.length) return;

        const headers = ['Member Name', 'Email', 'Amount', 'Late Fee', 'Due Date', 'Status', 'Paid Date', 'Transaction ID'];
        const rows = members.map((m) => [
            m.userId?.name || 'Member',
            m.userId?.email || '',
            m.amount || 0,
            m.lateFee || 0,
            m.dueDate ? format(new Date(m.dueDate), 'yyyy-MM-dd') : '',
            m.paymentStatus || m.status || 'PENDING',
            m.paidDate ? format(new Date(m.paidDate), 'yyyy-MM-dd HH:mm') : '',
            m.transactionId?.transactionNumber || ''
        ]);

        const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `Collection_Summary_Cycle_${summary.cycleNumber}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading && !summary) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
                <div className="flex items-center gap-3 bg-white p-6 rounded-3xl shadow-sm border border-slate-200 text-slate-700 font-bold">
                    <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
                    <span>Loading Collection Dashboard...</span>
                </div>
            </div>
        );
    }

    if (error || !summary) {
        return (
            <div className="min-h-screen bg-slate-50 p-6 flex flex-col items-center justify-center space-y-4">
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 font-bold text-sm flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                    <span>{error || 'Failed to load cycle collection data'}</span>
                </div>
                <button
                    onClick={() => navigate(-1)}
                    className="px-4 py-2 bg-slate-900 text-white font-bold rounded-xl text-xs flex items-center gap-2"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to Details</span>
                </button>
            </div>
        );
    }

    const currency = summary.currency;
    const remainingAmount = Math.max(0, summary.totalAmountExpected - summary.totalAmountCollected);
    const isOrganizerOrAdmin = user?.role === 'ORGANIZER' || user?.role === 'ADMIN';
    const status = summary.paymentCollection.status;

    return (
        <div className="min-h-screen bg-slate-50/60 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
            {/* Header Navigation */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-10 h-10 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition cursor-pointer"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <div className="flex items-center gap-2.5">
                            <h1 className="text-xl font-black text-slate-900">
                                Cycle #{summary.cycleNumber} Collection Dashboard
                            </h1>
                            <PaymentCollectionBadge status={status} size="sm" />
                        </div>
                        <p className="text-xs font-medium text-slate-400 mt-0.5">
                            {summary.groupName} • Monthly Installment Collections
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={handleExportCSV}
                        className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition flex items-center gap-2 cursor-pointer"
                    >
                        <Download className="w-4 h-4" />
                        <span>Export CSV Report</span>
                    </button>

                    {isOrganizerOrAdmin && (
                        status === 'NOT_STARTED' ? (
                            <button
                                onClick={() => setConfirmModal({ isOpen: true, action: 'open' })}
                                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition flex items-center gap-2 shadow-xs cursor-pointer"
                            >
                                <Unlock className="w-4 h-4" />
                                <span>Open Collections</span>
                            </button>
                        ) : status === 'OPEN' ? (
                            <button
                                onClick={() => setConfirmModal({ isOpen: true, action: 'close' })}
                                className="px-5 py-2.5 bg-slate-900 hover:bg-rose-600 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition flex items-center gap-2 shadow-xs cursor-pointer"
                            >
                                <Lock className="w-4 h-4" />
                                <span>Close Collections</span>
                            </button>
                        ) : (
                            <span className="px-4 py-2 bg-slate-100 text-slate-500 text-xs font-bold rounded-xl border border-slate-200 flex items-center gap-1.5">
                                <Lock className="w-4 h-4" />
                                <span>Collections Closed</span>
                            </span>
                        )
                    )}
                </div>
            </div>

            {/* Winner & Financial KPI Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Winner Card */}
                <div className="bg-gradient-to-br from-amber-500 to-amber-600 text-white p-5 rounded-3xl shadow-sm flex flex-col justify-between space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-widest text-amber-100">Declared Winner</span>
                        <Trophy className="w-5 h-5 text-amber-200" />
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-white leading-tight">
                            {summary.winner?.userName || 'No Winner Recorded'}
                        </h3>
                        <p className="text-xs text-amber-100 mt-0.5">
                            {summary.winner?.userEmail || 'Cycle Winner'}
                        </p>
                    </div>
                    <div className="pt-2 border-t border-amber-400/40 flex items-center justify-between text-xs font-bold text-amber-100">
                        <span>Prize Amount</span>
                        <span className="text-sm font-black text-white">
                            {formatCurrency(summary.winner?.prizeAmount || 0, currency)}
                        </span>
                    </div>
                </div>

                {/* Expected Amount Card */}
                <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
                    <div className="flex items-center justify-between text-slate-400">
                        <span className="text-[10px] font-black uppercase tracking-widest">Total Expected</span>
                        <Coins className="w-5 h-5 text-slate-400" />
                    </div>
                    <div>
                        <span className="text-2xl font-black text-slate-900 block mt-2">
                            {formatCurrency(summary.totalAmountExpected, currency)}
                        </span>
                        <p className="text-[11px] font-medium text-slate-400 mt-0.5">
                            {summary.totalMembers} Member Obligations
                        </p>
                    </div>
                </div>

                {/* Collected Amount Card */}
                <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
                    <div className="flex items-center justify-between text-emerald-600">
                        <span className="text-[10px] font-black uppercase tracking-widest">Collected Amount</span>
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                        <span className="text-2xl font-black text-emerald-600 block mt-2">
                            {formatCurrency(summary.totalAmountCollected, currency)}
                        </span>
                        <p className="text-[11px] font-medium text-slate-400 mt-0.5">
                            {summary.paidMembers} of {summary.totalMembers} Paid
                        </p>
                    </div>
                </div>

                {/* Remaining Amount Card */}
                <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
                    <div className="flex items-center justify-between text-rose-500">
                        <span className="text-[10px] font-black uppercase tracking-widest">Remaining Balance</span>
                        <Clock className="w-5 h-5 text-rose-500" />
                    </div>
                    <div>
                        <span className="text-2xl font-black text-slate-900 block mt-2">
                            {formatCurrency(remainingAmount, currency)}
                        </span>
                        <p className="text-[11px] font-medium text-slate-400 mt-0.5">
                            {summary.pendingMembers + summary.lateMembers} Pending / Late
                        </p>
                    </div>
                </div>
            </div>

            {/* Collection Progress Bar Card */}
            <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <LayoutDashboard className="w-5 h-5 text-emerald-400" />
                        <span className="text-sm font-bold">Overall Collection Progress</span>
                    </div>
                    <span className="text-xl font-black text-emerald-400">{summary.collectionPercentage}%</span>
                </div>

                <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700">
                    <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-700"
                        style={{ width: `${Math.min(100, summary.collectionPercentage)}%` }}
                    />
                </div>

                <div className="grid grid-cols-3 gap-3 text-center text-xs font-bold pt-2 border-t border-slate-800">
                    <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/50">
                        <span className="text-[10px] text-emerald-400 block uppercase">Paid Members</span>
                        <span className="text-base text-white">{summary.paidMembers}</span>
                    </div>
                    <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/50">
                        <span className="text-[10px] text-amber-400 block uppercase">Pending Members</span>
                        <span className="text-base text-white">{summary.pendingMembers}</span>
                    </div>
                    <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/50">
                        <span className="text-[10px] text-rose-400 block uppercase">Late / Overdue</span>
                        <span className="text-base text-white">{summary.lateMembers}</span>
                    </div>
                </div>
            </div>

            {/* Member Collections Table Card */}
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden space-y-4 p-6">
                {/* Search & Filter Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                    {/* Search Input */}
                    <div className="relative min-w-[260px] flex-1 max-w-md">
                        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search member by name or email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:bg-white focus:border-slate-900 transition"
                        />
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs font-bold">
                        {['ALL', 'PENDING', 'PAID', 'OVERDUE'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setStatusFilter(tab)}
                                className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${statusFilter === tab
                                        ? 'bg-slate-900 text-white shadow-xs'
                                        : 'text-slate-600 hover:text-slate-900'
                                    }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                <th className="py-3 px-4">Member</th>
                                <th className="py-3 px-4">Amount</th>
                                <th className="py-3 px-4">Due Date</th>
                                <th className="py-3 px-4">Late Fee</th>
                                <th className="py-3 px-4">Payment Status</th>
                                <th className="py-3 px-4">Paid Date</th>
                                <th className="py-3 px-4">Transaction Ref</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs">
                            {members.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-8 text-center text-slate-400 font-medium">
                                        No installment records found matching criteria.
                                    </td>
                                </tr>
                            ) : (
                                members.map((inst) => {
                                    const uName = inst.userId?.name || 'Member';
                                    const uEmail = inst.userId?.email || '';
                                    const instStatus = inst.paymentStatus || inst.status || 'PENDING';

                                    return (
                                        <tr key={inst._id} className="hover:bg-slate-50/80 transition">
                                            <td className="py-4 px-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-xl bg-slate-900 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0">
                                                        {uName.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <span className="font-bold text-slate-900 block">{uName}</span>
                                                        {uEmail && <span className="text-[10px] text-slate-400 block">{uEmail}</span>}
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="py-4 px-4 font-black text-slate-900">
                                                {formatCurrency(inst.amount, currency)}
                                            </td>

                                            <td className="py-4 px-4 text-slate-500 font-medium">
                                                {inst.dueDate ? format(new Date(inst.dueDate), 'MMM dd, yyyy') : 'N/A'}
                                            </td>

                                            <td className="py-4 px-4 font-bold">
                                                {inst.lateFee > 0 ? (
                                                    <span className="text-rose-600">+ {formatCurrency(inst.lateFee, currency)}</span>
                                                ) : (
                                                    <span className="text-slate-400">{formatCurrency(0, currency)}</span>
                                                )}
                                            </td>

                                            <td className="py-4 px-4">
                                                <PaymentStatusBadge status={instStatus} size="sm" />
                                            </td>

                                            <td className="py-4 px-4 text-slate-600 font-medium">
                                                {inst.paidDate ? format(new Date(inst.paidDate), 'MMM dd, yyyy HH:mm') : '-'}
                                            </td>

                                            <td className="py-4 px-4 font-mono text-[11px] text-slate-500">
                                                {inst.transactionId?.transactionNumber || '-'}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Action Confirmation Modal */}
            {confirmModal.isOpen && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white ${confirmModal.action === 'open' ? 'bg-emerald-600' : 'bg-rose-600'}`}>
                                {confirmModal.action === 'open' ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-slate-900">
                                    {confirmModal.action === 'open' ? 'Open Payment Collections?' : 'Close Payment Collections?'}
                                </h3>
                                <p className="text-xs text-slate-500">
                                    Cycle #{summary.cycleNumber} • {summary.groupName}
                                </p>
                            </div>
                        </div>

                        <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                            {confirmModal.action === 'open'
                                ? 'Opening collections allows active group members to submit their installment payments via the payment gateway.'
                                : 'Closing collections prevents members from making further payments for this cycle.'}
                        </p>

                        <div className="flex items-center justify-end gap-3 pt-2">
                            <button
                                disabled={actionLoading}
                                onClick={() => setConfirmModal({ isOpen: false, action: 'open' })}
                                className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                            >
                                Cancel
                            </button>

                            <button
                                disabled={actionLoading}
                                onClick={confirmModal.action === 'open' ? handleOpenCollections : handleCloseCollections}
                                className={`px-5 py-2.5 text-xs font-bold text-white rounded-xl transition cursor-pointer flex items-center gap-2 ${confirmModal.action === 'open' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'}`}
                            >
                                {actionLoading && <Loader2 className="w-4 h-4 animate-spin text-white" />}
                                <span>{confirmModal.action === 'open' ? 'Confirm Open' : 'Confirm Close'}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
