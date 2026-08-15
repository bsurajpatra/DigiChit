import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { X, Hammer, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface ScheduleAuctionFormData {
    cycleId: string;
    scheduledStartTime: string;
    scheduledEndTime?: string;
    minimumBidPercentage?: number;
    maximumBidPercentage?: number;
    remarks?: string;
}

interface CycleOption {
    cycleId: string;
    cycleNumber: number;
    status: string;
}

interface ScheduleAuctionModalProps {
    isOpen: boolean;
    cycles: CycleOption[];
    isLoading?: boolean;
    onClose: () => void;
    onSubmit: (data: ScheduleAuctionFormData) => Promise<void>;
}

export const ScheduleAuctionModal = ({
    isOpen,
    cycles,
    isLoading = false,
    onClose,
    onSubmit
}: ScheduleAuctionModalProps) => {
    const [submitError, setSubmitError] = useState<string | null>(null);

    const defaultStartTime = new Date(Date.now() + 86400000).toISOString().slice(0, 16);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors }
    } = useForm<ScheduleAuctionFormData>({
        defaultValues: {
            scheduledStartTime: defaultStartTime,
            minimumBidPercentage: 0,
            maximumBidPercentage: 50
        }
    });

    if (!isOpen) return null;

    const handleFormSubmit = async (data: ScheduleAuctionFormData) => {
        if (!data.cycleId) {
            setSubmitError('Chit cycle selection is required');
            return;
        }
        if (!data.scheduledStartTime) {
            setSubmitError('Start time is required');
            return;
        }
        setSubmitError(null);
        try {
            const parsed: ScheduleAuctionFormData = {
                cycleId: data.cycleId,
                scheduledStartTime: data.scheduledStartTime,
                scheduledEndTime: data.scheduledEndTime || undefined,
                minimumBidPercentage: data.minimumBidPercentage ? Number(data.minimumBidPercentage) : 0,
                maximumBidPercentage: data.maximumBidPercentage ? Number(data.maximumBidPercentage) : 50,
                remarks: data.remarks || undefined
            };
            await onSubmit(parsed);
            reset();
            onClose();
        } catch (err: any) {
            setSubmitError(err.message || 'Failed to schedule auction');
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
                            <div className="w-10 h-10 rounded-2xl bg-slate-900 text-emerald-400 flex items-center justify-center font-black shadow-xs">
                                <Hammer className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-slate-900">Schedule Monthly Auction</h3>
                                <p className="text-xs text-slate-500">Configure auction start time and bidding boundaries</p>
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
                        {/* Select Cycle */}
                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                Select Chit Cycle <span className="text-rose-500">*</span>
                            </label>
                            <select
                                {...register('cycleId', { required: 'Chit cycle selection is required' })}
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                            >
                                <option value="">-- Choose Chit Cycle --</option>
                                {cycles.map((c) => (
                                    <option key={c.cycleId} value={c.cycleId}>
                                        Cycle #{c.cycleNumber} ({c.status})
                                    </option>
                                ))}
                            </select>
                            {errors.cycleId && (
                                <p className="text-xs text-rose-500 mt-1">{errors.cycleId.message}</p>
                            )}
                        </div>

                        {/* Scheduled Start & End Datetime */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                    Start Time <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="datetime-local"
                                    {...register('scheduledStartTime', { required: 'Start time is required' })}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                                />
                                {errors.scheduledStartTime && (
                                    <p className="text-xs text-rose-500 mt-1">{errors.scheduledStartTime.message}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                    Scheduled End Time (Optional)
                                </label>
                                <input
                                    type="datetime-local"
                                    {...register('scheduledEndTime')}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                                />
                            </div>
                        </div>

                        {/* Bid Boundaries */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                    Min Bid Discount %
                                </label>
                                <input
                                    type="number"
                                    step="0.5"
                                    {...register('minimumBidPercentage')}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                    Max Bid Discount %
                                </label>
                                <input
                                    type="number"
                                    step="0.5"
                                    {...register('maximumBidPercentage')}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                                />
                            </div>
                        </div>

                        {/* Remarks */}
                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                Remarks / Notes (Optional)
                            </label>
                            <textarea
                                rows={2}
                                {...register('remarks')}
                                placeholder="Add optional auction rules or notes..."
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
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
                                className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition shadow-md shadow-emerald-600/20 active:scale-95 cursor-pointer disabled:opacity-50"
                            >
                                {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                                <span>Schedule Auction</span>
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
