import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { CheckCircle2, Loader2, ArrowUpRight, Sparkles, AlertCircle, Percent, Calculator, Coins } from 'lucide-react';
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

    const presetPercentages = [
        minBidPercentage,
        Math.min(5, maxBidPercentage),
        Math.min(10, maxBidPercentage),
        Math.min(15, maxBidPercentage),
        maxBidPercentage
    ].filter((v, i, self) => self.indexOf(v) === i && v >= minBidPercentage && v <= maxBidPercentage);

    return (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 md:p-8 space-y-6 w-full">
            {/* Form Header */}
            <div className="flex items-center justify-between pb-5 border-b border-slate-100">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center font-black">
                        <Coins className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-slate-900">
                            {isEditMode ? 'Edit Submitted Bid' : 'Submit Auction Bid'}
                        </h3>
                        <p className="text-xs text-slate-500">
                            {isEditMode ? 'Modify your active discount bid percentage' : 'Enter your competitive discount percentage to bid'}
                        </p>
                    </div>
                </div>
                {isEditMode && (
                    <span className="px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl text-xs font-bold">
                        Editing Active Bid
                    </span>
                )}
            </div>

            {!isAuctionOpen && (
                <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-2xl flex items-center gap-2.5">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>Bidding is currently closed for this auction cycle.</span>
                </div>
            )}

            <AnimatePresence>
                {isSuccess && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center gap-3 text-xs font-bold"
                    >
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                        <div>
                            <p className="text-sm font-bold text-emerald-900">Bid Successfully {isEditMode ? 'Updated' : 'Submitted'}!</p>
                            <p className="text-xs font-medium text-emerald-700 mt-0.5">
                                Discount of {computedPercentage}% ({formatCurrency(computedDiscountAmount, currency)}) recorded.
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {formError && (
                <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-2xl flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{formError}</span>
                </div>
            )}

            <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
                {/* Live Bid Calculator Box */}
                <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-sm space-y-4">
                    <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase tracking-wider">
                        <div className="flex items-center gap-2">
                            <Calculator className="w-4 h-4 text-emerald-400" />
                            <span>Live Bid Valuation Calculator</span>
                        </div>
                        <span className="flex items-center gap-1 text-amber-400 font-medium text-[11px] normal-case">
                            <Sparkles className="w-3.5 h-3.5" />
                            Real-time calculation
                        </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/50">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Chit Pool</span>
                            <span className="text-sm font-black text-white mt-1 block">
                                {formatCurrency(totalChitPool, currency)}
                            </span>
                        </div>

                        <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/50">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Discount Amount</span>
                            <span className="text-sm font-black text-amber-400 mt-1 block">
                                {formatCurrency(computedDiscountAmount, currency)}
                            </span>
                        </div>

                        <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/50">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Est. Take-Home</span>
                            <span className="text-sm font-black text-emerald-400 mt-1 block">
                                {formatCurrency(computedTakeHomeAmount, currency)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Percentage Input */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-900 flex items-center gap-1">
                            <span>Bid Discount (%)</span>
                            <span className="text-rose-500">*</span>
                        </label>
                        <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                            Allowed Range: {minBidPercentage}% — {maxBidPercentage}%
                        </span>
                    </div>

                    <div className="relative">
                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                            <Percent className="w-4 h-4" />
                        </div>
                        <input
                            type="number"
                            step="0.1"
                            disabled={!isAuctionOpen || isLoading}
                            {...register('bidPercentage', {
                                required: 'Bid percentage is required',
                                min: { value: minBidPercentage, message: `Minimum percentage is ${minBidPercentage}%` },
                                max: { value: maxBidPercentage, message: `Maximum percentage is ${maxBidPercentage}%` }
                            })}
                            className="w-full pl-10 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 outline-none transition disabled:opacity-50"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">%</span>
                    </div>

                    {/* Presets */}
                    {isAuctionOpen && presetPercentages.length > 0 && (
                        <div className="flex items-center gap-2 pt-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Presets:</span>
                            {presetPercentages.map((pct) => (
                                <button
                                    key={pct}
                                    type="button"
                                    onClick={() => setValue('bidPercentage', pct)}
                                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold rounded-lg transition cursor-pointer border border-slate-200"
                                >
                                    {pct}%
                                </button>
                            ))}
                        </div>
                    )}

                    {errors.bidPercentage && (
                        <p className="text-xs font-bold text-rose-500 mt-1">{errors.bidPercentage.message}</p>
                    )}
                </div>

                {/* Remarks */}
                <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-900">
                        Remarks / Notes (Optional)
                    </label>
                    <input
                        type="text"
                        disabled={!isAuctionOpen || isLoading}
                        placeholder="Add optional bidding note or remarks..."
                        {...register('remarks')}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 outline-none transition disabled:opacity-50 placeholder:font-normal placeholder:text-slate-400"
                    />
                </div>

                {/* Submit Controls */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                    {isEditMode && onCancelEdit && (
                        <button
                            type="button"
                            onClick={onCancelEdit}
                            disabled={isLoading}
                            className="px-5 py-3 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer border border-slate-200"
                        >
                            Cancel Edit
                        </button>
                    )}

                    <button
                        type="submit"
                        disabled={!isAuctionOpen || isLoading || isSuccess}
                        className="px-6 py-3 bg-slate-900 hover:bg-emerald-600 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition shadow-sm cursor-pointer flex items-center justify-center gap-2 disabled:opacity-40"
                    >
                        {isLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                        ) : (
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
