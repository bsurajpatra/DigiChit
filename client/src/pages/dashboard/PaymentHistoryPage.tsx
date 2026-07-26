import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTransactions, useRefundPayment } from '../../hooks/useTransactions';
import { TransactionTable } from '../../components/payments/TransactionTable';
import { ReceiptCard } from '../../components/payments/ReceiptCard';
import { PaymentTimeline } from '../../components/payments/PaymentTimeline';
import type { TransactionRecord } from '../../api/transaction.api';
import { CreditCard, DollarSign, CheckCircle2, Clock, RefreshCw, X, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const PaymentHistoryPage = () => {
    const { user } = useAuth();
    const [page, setPage] = useState(1);
    const [selectedTxn, setSelectedTxn] = useState<TransactionRecord | null>(null);

    // Refund Modal State
    const [refundModalTxn, setRefundModalTxn] = useState<TransactionRecord | null>(null);
    const [refundReason, setRefundReason] = useState('');
    const [refundAmount, setRefundAmount] = useState<number | undefined>(undefined);
    const [refundError, setRefundError] = useState<string | null>(null);

    const { data: txnData, isLoading, error } = useTransactions({
        page,
        limit: 15,
        memberId: user?.role === 'ADMIN' ? undefined : user?.id
    });

    const refundMutation = useRefundPayment();

    const transactions = txnData?.data || [];
    const total = txnData?.total || 0;
    const totalPages = txnData?.totalPages || 1;

    // Calculate Summary Stats
    const successTxns = transactions.filter((t) => t.status === 'SUCCESS');
    const totalVolume = successTxns.reduce((acc, t) => acc + t.amount, 0);
    const pendingCount = transactions.filter((t) => t.status === 'PENDING').length;
    const refundCount = transactions.filter((t) => t.status === 'REFUNDED' || t.status === 'PARTIALLY_REFUNDED').length;

    const handleExecuteRefund = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!refundModalTxn) return;

        setRefundError(null);
        try {
            await refundMutation.mutateAsync({
                transactionId: refundModalTxn._id,
                amount: refundAmount || refundModalTxn.amount,
                reason: refundReason.trim() || 'Refund initiated from dashboard'
            });
            setRefundModalTxn(null);
            setRefundReason('');
            setRefundAmount(undefined);
        } catch (err: any) {
            setRefundError(err.response?.data?.message || err.message || 'Failed to process refund');
        }
    };

    return (
        <div className="space-y-6 pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
                        <CreditCard className="w-4 h-4" />
                        <span>Payment & Audit Engine</span>
                    </div>
                    <h1 className="text-xl font-black text-slate-900 tracking-tight">Payments History</h1>
                </div>
            </div>

            {error && (
                <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-2xl">
                    Failed to load transactions history. Please try refreshing.
                </div>
            )}

            {/* Top Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black">
                        <DollarSign className="w-6 h-6" />
                    </div>
                    <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Processed Volume</span>
                        <span className="text-xl font-black text-slate-900">₹{totalVolume.toLocaleString('en-IN')}</span>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black">
                        <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Successful Payments</span>
                        <span className="text-xl font-black text-slate-900">{successTxns.length}</span>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-black">
                        <Clock className="w-6 h-6" />
                    </div>
                    <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pending Gateway Orders</span>
                        <span className="text-xl font-black text-slate-900">{pendingCount}</span>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center font-black">
                        <RefreshCw className="w-6 h-6" />
                    </div>
                    <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Refunded Items</span>
                        <span className="text-xl font-black text-slate-900">{refundCount}</span>
                    </div>
                </div>
            </div>

            {/* Main Transactions Register Table */}
            <TransactionTable
                transactions={transactions}
                total={total}
                page={page}
                totalPages={totalPages}
                isLoading={isLoading}
                onPageChange={(p) => setPage(p)}
                onSelectTransaction={(txn) => setSelectedTxn(txn)}
                onRefundTrigger={(txn) => setRefundModalTxn(txn)}
                isOrganizer={user?.role === 'ORGANIZER' || user?.role === 'ADMIN'}
            />

            {/* Transaction Details & Receipt View Modal */}
            <AnimatePresence>
                {selectedTxn && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedTxn(null)}
                            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
                        />

                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 md:p-8 z-10 overflow-y-auto max-h-[90vh] space-y-6"
                        >
                            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                                <div>
                                    <h3 className="text-lg font-black text-slate-900">Transaction & Receipt Breakdown</h3>
                                    <p className="text-xs text-slate-500 font-mono">ID: {selectedTxn.transactionNumber}</p>
                                </div>
                                <button
                                    onClick={() => setSelectedTxn(null)}
                                    className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition cursor-pointer"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Payment Timeline Component */}
                            <PaymentTimeline transaction={selectedTxn} />

                            {/* Digital Receipt View Component */}
                            <ReceiptCard transaction={selectedTxn} onClose={() => setSelectedTxn(null)} />
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Refund Execution Modal */}
            <AnimatePresence>
                {refundModalTxn && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setRefundModalTxn(null)}
                            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
                        />

                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 z-10 overflow-hidden space-y-4"
                        >
                            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                                <div>
                                    <h3 className="text-base font-bold text-slate-900">Initiate Refund Tracking</h3>
                                    <p className="text-xs text-slate-500 font-mono">Ref: {refundModalTxn.transactionNumber}</p>
                                </div>
                                <button
                                    onClick={() => setRefundModalTxn(null)}
                                    className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {refundError && (
                                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-xl">
                                    {refundError}
                                </div>
                            )}

                            <form onSubmit={handleExecuteRefund} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                                        Refund Amount (Max ₹{refundModalTxn.amount})
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        placeholder={`Original amount: ₹${refundModalTxn.amount}`}
                                        value={refundAmount ?? refundModalTxn.amount}
                                        onChange={(e) => setRefundAmount(parseFloat(e.target.value))}
                                        required
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                                        Refund Reason
                                    </label>
                                    <textarea
                                        rows={3}
                                        placeholder="Reason for refunding this payment..."
                                        value={refundReason}
                                        onChange={(e) => setRefundReason(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 resize-none"
                                    />
                                </div>

                                <div className="flex items-center justify-end gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setRefundModalTxn(null)}
                                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={refundMutation.isPending}
                                        className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition cursor-pointer disabled:opacity-50"
                                    >
                                        {refundMutation.isPending ? 'Processing...' : 'Confirm Refund'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};
