import { X, CreditCard, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatCurrency } from '../../utils/currency';

interface PayNowPlaceholderModalProps {
    isOpen: boolean;
    installmentNumber?: number;
    amount?: number;
    lateFee?: number;
    currency?: string;
    onClose: () => void;
}

export const PayNowPlaceholderModal = ({
    isOpen,
    installmentNumber = 1,
    amount = 0,
    lateFee = 0,
    currency,
    onClose
}: PayNowPlaceholderModalProps) => {
    if (!isOpen) return null;

    const netAmount = amount + lateFee;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
                />

                {/* Modal Container */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 z-10 overflow-hidden"
                >
                    <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center font-black">
                                <CreditCard className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-slate-900">Installment #{installmentNumber} Payment</h3>
                                <p className="text-xs text-slate-500">Online Payment Gateway Integration</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition cursor-pointer"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Breakdown */}
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2 text-xs mb-6">
                        <div className="flex justify-between text-slate-600">
                            <span>Base Monthly Dues:</span>
                            <span className="font-bold text-slate-900">{formatCurrency(amount, currency)}</span>
                        </div>
                        {lateFee > 0 && (
                            <div className="flex justify-between text-rose-600">
                                <span>Late Fee Accrued:</span>
                                <span className="font-bold">{formatCurrency(lateFee, currency)}</span>
                            </div>
                        )}
                        <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-black text-slate-900">
                            <span>Total Payable Amount:</span>
                            <span className="text-emerald-600">{formatCurrency(netAmount, currency)}</span>
                        </div>
                    </div>

                    <div className="p-4 bg-sky-50 border border-sky-200 rounded-2xl text-xs text-sky-800 space-y-2 mb-6">
                        <div className="flex items-center gap-2 font-bold">
                            <Info className="w-4 h-4 text-sky-600 shrink-0" />
                            <span>Payment Gateway Module Notice</span>
                        </div>
                        <p className="text-[11px] leading-relaxed text-sky-700">
                            Online payment processing (UPI, NetBanking, Debit/Credit cards, Auto-Debit) will be enabled when the upcoming <strong>Transaction & Ledger Module</strong> is deployed.
                        </p>
                    </div>

                    <div className="flex items-center justify-end">
                        <button
                            onClick={onClose}
                            className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition shadow-md cursor-pointer"
                        >
                            Understood & Close
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

