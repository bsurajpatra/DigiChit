import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { X, Loader2, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const createCycleSchema = z.object({
    scheduledStartDate: z.string().min(1, 'Scheduled start date is required'),
    scheduledEndDate: z.string().optional(),
    auctionDate: z.string().optional(),
    remarks: z.string().optional()
});

type CreateCycleFormData = z.infer<typeof createCycleSchema>;

interface CreateCycleModalProps {
    isOpen: boolean;
    nextCycleNumber: number;
    isLoading?: boolean;
    onClose: () => void;
    onSubmit: (data: CreateCycleFormData) => Promise<void>;
}

export const CreateCycleModal = ({
    isOpen,
    nextCycleNumber,
    isLoading = false,
    onClose,
    onSubmit
}: CreateCycleModalProps) => {
    const [submitError, setSubmitError] = useState<string | null>(null);

    const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors }
    } = useForm<CreateCycleFormData>({
        resolver: zodResolver(createCycleSchema),
        defaultValues: {
            scheduledStartDate: tomorrowStr,
            scheduledEndDate: '',
            auctionDate: '',
            remarks: ''
        }
    });

    if (!isOpen) return null;

    const handleFormSubmit = async (data: CreateCycleFormData) => {
        setSubmitError(null);
        try {
            await onSubmit(data);
            reset();
            onClose();
        } catch (err: any) {
            setSubmitError(err.message || 'Failed to create cycle');
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
                            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center font-black">
                                #{nextCycleNumber}
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-slate-900">Create Cycle #{nextCycleNumber}</h3>
                                <p className="text-xs text-slate-500">Initialize the next sequential monthly chit cycle</p>
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
                        {/* Scheduled Start Date */}
                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                Scheduled Start Date <span className="text-rose-500">*</span>
                            </label>
                            <div className="relative">
                                <input
                                    type="date"
                                    {...register('scheduledStartDate')}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                                />
                            </div>
                            {errors.scheduledStartDate && (
                                <p className="text-xs text-rose-500 mt-1">{errors.scheduledStartDate.message}</p>
                            )}
                        </div>

                        {/* Optional Scheduled End Date & Auction Date */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                    Scheduled End Date (Optional)
                                </label>
                                <input
                                    type="date"
                                    {...register('scheduledEndDate')}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                    Auction Date (Optional)
                                </label>
                                <input
                                    type="date"
                                    {...register('auctionDate')}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                                />
                            </div>
                        </div>

                        {/* Remarks */}
                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                Remarks / Operational Notes (Optional)
                            </label>
                            <textarea
                                rows={3}
                                {...register('remarks')}
                                placeholder="Add optional remarks or notes for this cycle..."
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                            />
                        </div>

                        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/60 flex items-start gap-2 text-[11px] text-slate-500">
                            <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                            <span>This will initialize Cycle #{nextCycleNumber} in UPCOMING status. It can be started when previous cycles are complete.</span>
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
                                <span>Initialize Cycle #{nextCycleNumber}</span>
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
