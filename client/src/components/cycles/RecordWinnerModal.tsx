import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { X, Trophy, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface RecordWinnerFormData {
    winnerMembershipId: string;
    winningBidAmount?: number;
    winningBidPercentage?: number;
    prizeAmount?: number;
    dividendAmount?: number;
    remarks?: string;
}

interface MemberOption {
    membershipId: string;
    userName: string;
    userEmail: string;
}

interface RecordWinnerModalProps {
    isOpen: boolean;
    cycleNumber: number;
    members: MemberOption[];
    isLoading?: boolean;
    onClose: () => void;
    onSubmit: (data: RecordWinnerFormData) => Promise<void>;
}

export const RecordWinnerModal = ({
    isOpen,
    cycleNumber,
    members,
    isLoading = false,
    onClose,
    onSubmit
}: RecordWinnerModalProps) => {
    const [submitError, setSubmitError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors }
    } = useForm<RecordWinnerFormData>();

    if (!isOpen) return null;

    const handleFormSubmit = async (data: RecordWinnerFormData) => {
        if (!data.winnerMembershipId) {
            setSubmitError('Winner member selection is required');
            return;
        }
        setSubmitError(null);
        try {
            const parsedData: RecordWinnerFormData = {
                winnerMembershipId: data.winnerMembershipId,
                winningBidAmount: data.winningBidAmount ? Number(data.winningBidAmount) : undefined,
                winningBidPercentage: data.winningBidPercentage ? Number(data.winningBidPercentage) : undefined,
                prizeAmount: data.prizeAmount ? Number(data.prizeAmount) : undefined,
                dividendAmount: data.dividendAmount ? Number(data.dividendAmount) : undefined,
                remarks: data.remarks || undefined
            };
            await onSubmit(parsedData);
            reset();
            onClose();
        } catch (err: any) {
            setSubmitError(err.message || 'Failed to record winner');
        }
    };

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
                    className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 z-10 overflow-hidden"
                >
                    <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center">
                                <Trophy className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-slate-900">Record Winner — Cycle #{cycleNumber}</h3>
                                <p className="text-xs text-slate-500">Record auction or lottery winner for this cycle</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition cursor-pointer"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {submitError && (
                        <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-2xl">
                            {submitError}
                        </div>
                    )}

                    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
                        {/* Select Winner Member */}
                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                Select Winning Member <span className="text-rose-500">*</span>
                            </label>
                            <select
                                {...register('winnerMembershipId', { required: 'Winner member is required' })}
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition"
                            >
                                <option value="">-- Choose Member --</option>
                                {members.map((m) => (
                                    <option key={m.membershipId} value={m.membershipId}>
                                        {m.userName} ({m.userEmail})
                                    </option>
                                ))}
                            </select>
                            {errors.winnerMembershipId && (
                                <p className="text-xs text-rose-500 mt-1">{errors.winnerMembershipId.message}</p>
                            )}
                        </div>

                        {/* Financial Amounts */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                    Winning Bid Amount (₹)
                                </label>
                                <input
                                    type="number"
                                    placeholder="e.g. 5000"
                                    {...register('winningBidAmount')}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                    Winning Bid Discount %
                                </label>
                                <input
                                    type="number"
                                    step="0.1"
                                    placeholder="e.g. 5.0"
                                    {...register('winningBidPercentage')}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                    Net Prize Amount (₹)
                                </label>
                                <input
                                    type="number"
                                    placeholder="e.g. 95000"
                                    {...register('prizeAmount')}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                    Dividend Per Member (₹)
                                </label>
                                <input
                                    type="number"
                                    placeholder="e.g. 500"
                                    {...register('dividendAmount')}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition"
                                />
                            </div>
                        </div>

                        {/* Remarks */}
                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                Auction / Lottery Remarks
                            </label>
                            <textarea
                                rows={2}
                                {...register('remarks')}
                                placeholder="Add optional auction notes or winner details..."
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition"
                            />
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={isLoading}
                                className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="inline-flex items-center gap-2 px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition shadow-md shadow-amber-500/20 active:scale-95 cursor-pointer disabled:opacity-50"
                            >
                                {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                                <span>Record Winner</span>
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
