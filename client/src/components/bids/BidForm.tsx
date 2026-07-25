import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { CheckCircle2, Loader2, ArrowUpRight, Sparkles, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatCurrency } from '../../utils/currency';

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
    currency?: string;
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
    currency,
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
        <div className="space-y-4">
            {!isAuctionOpen && (
                <div className="p-3 bg-rose-50 text-rose-700 text-xs font-bold rounded-xl flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>Bidding is currently closed for this cycle.</span>
                </div>
            )}

            <AnimatePresence>
                {isSuccess && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="p-3.5 bg-emerald-50 text-emerald-800 rounded-xl flex items-center gap-2.5 text-xs font-bold"
                    >
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <div>
                            <p>Bid Successfully {isEditMode ? 'Updated' : 'Submitted'}!</p>
                            <p className="text-[10px] font-medium text-emerald-700 mt-0.5">
                                Discount of {computedPercentage}% ({formatCurrency(computedDiscountAmount, currency)}) recorded.
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {formError && (
                <div className="p-3 bg-rose-50 text-rose-700 text-xs font-bold rounded-xl">
                    {formError}
                </div>
            )}

            <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
                {/* Live Discount Calculator */}
                <div className="bg-slate-50 p-4 rounded-xl space-y-3">
                    <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase tracking-wider">
                        <span>Live Bid Calculator</span>
                        <Sparkles className="w-4 h-4 text-amber-500" />
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-center">
                        <div className="bg-white p-3 rounded-xl">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Discount Amount</span>
                            <span className="text-sm font-black text-amber-600 mt-0.5 block">
                                {formatCurrency(computedDiscountAmount, currency)}
                            </span>
                        </div>
                        <div className="bg-white p-3 rounded-xl">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Est. Take-Home</span>
                            <span className="text-sm font-black text-emerald-600 mt-0.5 block">
                                {formatCurrency(computedTakeHomeAmount, currency)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Percentage Input */}
                <div>
                    <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-bold text-slate-900">
                            Bid Discount (%) <span className="text-rose-500">*</span>
                        </label>
                        <span className="text-[10px] font-bold text-slate-400">
                            Range: {minBidPercentage}% — {maxBidPercentage}%
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
                            className="w-full pl-4 pr-8 py-2.5 bg-slate-50 border-none rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-slate-900 outline-none transition disabled:opacity-50"
                        />
                        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">%</span>
                    </div>

                    {errors.bidPercentage && (
                        <p className="text-xs font-bold text-rose-500 mt-1">{errors.bidPercentage.message}</p>
                    )}
                </div>

                {/* Remarks */}
                <div>
                    <label className="block text-xs font-bold text-slate-900 mb-1">
                        Remarks / Notes (Optional)
                    </label>
                    <input
                        type="text"
                        disabled={!isAuctionOpen || isLoading}
                        placeholder="Add optional bidding note..."
                        {...register('remarks')}
                        className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-slate-900 outline-none transition disabled:opacity-50 placeholder:font-normal placeholder:text-slate-400"
                    />
                </div>

                {/* Submit Controls */}
                <div className="flex items-center gap-2 pt-2">
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
                        className="w-full py-3 bg-slate-900 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-40"
                    >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin text-emerald-400" /> : (
                            <>
                                <span>{isEditMode ? 'Update Submitted Bid' : 'Submit Bid'}</span>
                                <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};
