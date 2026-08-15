import { AlertTriangle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface BidConfirmationModalProps {
    isOpen: boolean;
    type: 'submit' | 'update' | 'withdraw' | null;
    bidPercentage?: number;
    bidAmount?: number;
    isLoading?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

export const BidConfirmationModal = ({
    isOpen,
    type,
    bidPercentage = 0,
    bidAmount = 0,
    isLoading = false,
    onConfirm,
    onCancel
}: BidConfirmationModalProps) => {
    if (!isOpen || !type) return null;

    const titleMap = {
        submit: 'Confirm Bid Submission',
        update: 'Confirm Bid Modification',
        withdraw: 'Confirm Bid Withdrawal'
    };

    const descMap = {
        submit: `Are you sure you want to submit a bid discount of ${bidPercentage}% (₹${bidAmount.toLocaleString('en-IN')})?`,
        update: `Are you sure you want to update your bid to ${bidPercentage}% (₹${bidAmount.toLocaleString('en-IN')})?`,
        withdraw: 'Are you sure you want to withdraw your active bid for this auction? You may submit another bid while the auction remains OPEN.'
    };

    const btnVariant = type === 'withdraw' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-amber-500 hover:bg-amber-600';

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onCancel}
                    className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
                />

                {/* Modal */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 z-10 overflow-hidden"
                >
                    <div className="flex items-center gap-3 mb-4">
                        <div className={`w-10 h-10 rounded-2xl bg-slate-900 flex items-center justify-center font-black shadow-xs ${type === 'withdraw' ? 'text-rose-400' : 'text-amber-400'}`}>
                            <AlertTriangle className="w-5 h-5" />
                        </div>
                        <h3 className="text-base font-bold text-slate-900">{titleMap[type]}</h3>
                    </div>

                    <p className="text-xs text-slate-600 mb-6 leading-relaxed">
                        {descMap[type]}
                    </p>

                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                        <button
                            onClick={onCancel}
                            disabled={isLoading}
                            className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={isLoading}
                            className={`inline-flex items-center gap-2 px-6 py-2.5 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition shadow-md active:scale-95 cursor-pointer disabled:opacity-50 ${btnVariant}`}
                        >
                            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                            <span>Confirm</span>
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
