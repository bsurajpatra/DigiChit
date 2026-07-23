import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Hammer, CheckCircle2, Loader2, ArrowUpRight, Sparkles, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface BidFormData {
    bidPercentage: number;
    remarks?: string;
}

interface BidFormProps {
    auctionId: string;
    auctionStatus: string;
    minBidPercentage?: number;
    maxBidPercentage?: number;
    monthlyContribution?: number;
    totalMembers?: number;
    existingBid?: {
        _id: string;
        bidPercentage: number;
        bidAmount: number;
        remarks?: string | null;
    } | null;
    isLoading?: boolean;
    onSubmitBid: (data: { bidPercentage: number; bidAmount: number; remarks?: string }) => Promise<void>;
    onCancelEdit?: () => void;
}

export const BidForm = ({
    auctionId: _auctionId,
    auctionStatus,
    minBidPercentage = 0,
    maxBidPercentage = 50,
    monthlyContribution = 10000,
    totalMembers = 10,
    existingBid,
    isLoading = false,
    onSubmitBid,
    onCancelEdit
}: BidFormProps) => {
    const [isSuccess, setIsSuccess] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    const totalChitPool = monthlyContribution * totalMembers;
    const isAuctionOpen = auctionStatus === 'OPEN';
    const isEditMode = !!existingBid;

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        reset,
        formState: { errors }
    } = useForm<BidFormData>({
        defaultValues: {
            bidPercentage: existingBid ? existingBid.bidPercentage : minBidPercentage,
            remarks: existingBid?.remarks || ''
        }
    });

    const currentPercentage = watch('bidPercentage');
    const computedPercentage = Number(currentPercentage) || 0;
    const computedDiscountAmount = (totalChitPool * computedPercentage) / 100;
    const computedTakeHomeAmount = totalChitPool - computedDiscountAmount;

    useEffect(() => {
        if (existingBid) {
            setValue('bidPercentage', existingBid.bidPercentage);
            setValue('remarks', existingBid.remarks || '');
        }
    }, [existingBid, setValue]);

    const handleFormSubmit = async (data: BidFormData) => {
        setFormError(null);

        if (!isAuctionOpen) {
            setFormError('Bidding is only allowed when the auction status is OPEN.');
            return;
        }

        const pct = Number(data.bidPercentage);
        if (isNaN(pct) || pct < minBidPercentage || pct > maxBidPercentage) {
            setFormError(`Bid percentage must be between ${minBidPercentage}% and ${maxBidPercentage}%.`);
            return;
        }

        try {
            await onSubmitBid({
                bidPercentage: pct,
                bidAmount: (totalChitPool * pct) / 100,
                remarks: data.remarks || undefined
            });

            setIsSuccess(true);
            setTimeout(() => {
                setIsSuccess(false);
                if (!isEditMode) reset();
            }, 3000);
        } catch (err: any) {
            setFormError(err.message || 'Failed to submit bid');
        }
    };

    return (
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs relative overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-black shadow-md shadow-amber-500/30">
                        <Hammer className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-slate-900">
                            {isEditMode ? 'Modify Your Submitted Bid' : 'Submit Auction Bid'}
                        </h3>
                        <p className="text-xs text-slate-500">
                            Pool Value: ₹{totalChitPool.toLocaleString('en-IN')} ({totalMembers} Members @ ₹{monthlyContribution.toLocaleString('en-IN')})
                        </p>
                    </div>
                </div>

                {!isAuctionOpen && (
                    <span className="px-3 py-1 bg-rose-50 text-rose-700 text-xs font-bold rounded-full border border-rose-200 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Bidding Closed
                    </span>
                )}
            </div>

            <AnimatePresence>
                {isSuccess && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center gap-3"
                    >
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                        <div>
                            <p className="text-xs font-black">Bid Successfully {isEditMode ? 'Updated' : 'Submitted'}!</p>
                            <p className="text-[11px] font-medium text-emerald-700">
                                Your bid discount percentage of {computedPercentage}% (₹{computedDiscountAmount.toLocaleString('en-IN')}) has been recorded.
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {formError && (
                <div className="mb-6 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-2xl">
                    {formError}
                </div>
            )}

            <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
                {/* Live Discount Calculator Card */}
                <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-md">
                    <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase tracking-wider mb-3">
                        <span>Live Bid Calculator</span>
                        <Sparkles className="w-4 h-4 text-amber-400" />
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-center">
                        <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/60">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Discount Amount</span>
                            <span className="text-lg font-black text-amber-400 mt-1 block">
                                ₹{computedDiscountAmount.toLocaleString('en-IN')}
                            </span>
                        </div>
                        <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/60">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Est. Take-Home Prize</span>
                            <span className="text-lg font-black text-emerald-400 mt-1 block">
                                ₹{computedTakeHomeAmount.toLocaleString('en-IN')}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Percentage Input */}
                <div>
                    <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                            Bid Discount Percentage (%) <span className="text-rose-500">*</span>
                        </label>
                        <span className="text-xs font-bold text-slate-500">
                            Allowed Range: {minBidPercentage}% — {maxBidPercentage}%
                        </span>
                    </div>

                    <div className="relative">
                        <input
                            type="number"
                            step="0.1"
                            disabled={!isAuctionOpen || isLoading}
                            {...register('bidPercentage', {
                                required: 'Bid percentage is required',
                                min: { value: minBidPercentage, message: `Minimum percentage is ${minBidPercentage}%` },
                                max: { value: maxBidPercentage, message: `Maximum percentage is ${maxBidPercentage}%` }
                            })}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition disabled:opacity-50"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-black text-sm">%</span>
                    </div>

                    {errors.bidPercentage && (
                        <p className="text-xs text-rose-500 mt-1">{errors.bidPercentage.message}</p>
                    )}
                </div>

                {/* Remarks */}
                <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Remarks / Notes (Optional)
                    </label>
                    <input
                        type="text"
                        disabled={!isAuctionOpen || isLoading}
                        placeholder="Add optional bidding note..."
                        {...register('remarks')}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition disabled:opacity-50"
                    />
                </div>

                {/* Submit Controls */}
                <div className="flex items-center justify-end gap-3 pt-2">
                    {isEditMode && onCancelEdit && (
                        <button
                            type="button"
                            onClick={onCancelEdit}
                            disabled={isLoading}
                            className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                        >
                            Cancel Edit
                        </button>
                    )}

                    <button
                        type="submit"
                        disabled={!isAuctionOpen || isLoading || isSuccess}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition shadow-md shadow-amber-500/20 active:scale-95 cursor-pointer disabled:opacity-40"
                    >
                        {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                        <span>{isEditMode ? 'Update Submitted Bid' : 'Submit Bid'}</span>
                        <ArrowUpRight className="w-4 h-4" />
                    </button>
                </div>
            </form>
        </div>
    );
};
