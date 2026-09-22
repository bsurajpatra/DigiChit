import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { 
    CheckCircle2, Loader2, ArrowUpRight, Sparkles, AlertCircle, 
    Percent, Calculator, Wallet, Gift, Plus, Minus, Zap, ChevronUp, ChevronDown 
} from 'lucide-react';
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
    currentBestBidPercentage?: number;
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
    currentBestBidPercentage,
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

    const initialPercentage = existingBid ? existingBid.bidPercentage : (minBidPercentage || 0);

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        reset,
        formState: { errors }
    } = useForm<BidFormData>({
        defaultValues: {
            bidPercentage: initialPercentage,
            remarks: existingBid?.remarks || ''
        }
    });

    const currentPercentage = watch('bidPercentage');
    const computedPercentage = Number(currentPercentage) || 0;
    const computedDiscountAmount = (totalChitPool * computedPercentage) / 100;
    const computedTakeHomeAmount = Math.max(0, totalChitPool - computedDiscountAmount);
    const computedDividendPerMember = totalMembers > 0 ? computedDiscountAmount / totalMembers : 0;

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

    const handleStepAdjustment = (delta: number) => {
        const next = Math.min(maxBidPercentage, Math.max(minBidPercentage, Number((computedPercentage + delta).toFixed(1))));
        setValue('bidPercentage', next, { shouldValidate: true });
    };

    const presetPercentages = [
        minBidPercentage,
        Math.min(5, maxBidPercentage),
        Math.min(10, maxBidPercentage),
        Math.min(15, maxBidPercentage),
        maxBidPercentage
    ].filter((v, i, self) => self.indexOf(v) === i && v >= minBidPercentage && v <= maxBidPercentage);

    return (
        <div className="bg-white rounded-2xl border-none shadow-none p-6 space-y-6 w-full">
            {/* Form Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 text-emerald-400 flex items-center justify-center font-black shrink-0 shadow-xs">
                        <Wallet className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-base font-black text-slate-900 tracking-tight">
                            {isEditMode ? 'Modify Submitted Bid' : 'Place Your Bid'}
                        </h3>
                        <p className="text-xs text-slate-400 font-medium">
                            {isEditMode ? 'Adjust your active discount percentage offer' : 'Enter discount percentage to claim this month\'s pot'}
                        </p>
                    </div>
                </div>
                {isEditMode && (
                    <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 rounded-md text-[10px] font-black uppercase tracking-wider">
                        Editing Active Bid
                    </span>
                )}
            </div>

            {!isAuctionOpen && (
                <div className="p-4 bg-rose-50 text-rose-700 text-xs font-bold rounded-xl border border-rose-200/60 flex items-center gap-2.5">
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
                        className="p-4 bg-emerald-50 border border-emerald-200/80 text-emerald-800 rounded-xl flex items-center gap-3 text-xs font-bold"
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
                <div className="p-4 bg-rose-50 border border-rose-200/80 text-rose-700 text-xs font-bold rounded-xl flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{formError}</span>
                </div>
            )}

            <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
                
                {/* ─── LIVE DUAL-CALCULATION CARDS ─── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Card 1: You Receive / Take Home */}
                    <div className="bg-slate-900 text-white p-4 rounded-2xl border-none shadow-none relative overflow-hidden flex flex-col justify-between">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                                <Wallet className="w-3.5 h-3.5" />
                                <span>You Receive (Take-Home)</span>
                            </span>
                            <span className="text-[10px] font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md">
                                {computedPercentage}% Discount
                            </span>
                        </div>
                        <div className="text-xl md:text-2xl font-black text-white tracking-tight">
                            {formatCurrency(computedTakeHomeAmount, currency)}
                        </div>
                        <p className="text-[11px] text-slate-400 font-medium mt-1">
                            Pot of {formatCurrency(totalChitPool, currency)} minus {formatCurrency(computedDiscountAmount, currency)} discount
                        </p>
                    </div>

                    {/* Card 2: Dividend Per Member */}
                    <div className="bg-slate-900 text-white p-4 rounded-2xl border-none shadow-none relative overflow-hidden flex flex-col justify-between">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-black uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
                                <Gift className="w-3.5 h-3.5" />
                                <span>Dividend Per Member</span>
                            </span>
                            <span className="text-[10px] font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md">
                                {totalMembers} Members
                            </span>
                        </div>
                        <div className="text-xl md:text-2xl font-black text-sky-400 tracking-tight">
                            {formatCurrency(computedDividendPerMember, currency)}
                        </div>
                        <p className="text-[11px] text-slate-400 font-medium mt-1">
                            Off next month's contribution for each member
                        </p>
                    </div>
                </div>

                {/* ─── PERCENTAGE INPUT & SLIDER CONTROLS ─── */}
                <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border-none">
                    <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-900 flex items-center gap-1">
                            <span>Discount Percentage</span>
                            <span className="text-rose-500">*</span>
                        </label>
                        <span className="text-[11px] font-bold text-slate-600 bg-white px-2.5 py-0.5 rounded-md border border-slate-200/60 shadow-2xs">
                            Allowed Range: {minBidPercentage}% — {maxBidPercentage}%
                        </span>
                    </div>

                    {/* Numeric Input & Quick Step Arrows */}
                    <div className="flex items-center gap-2">
                        <div className="relative flex-1">
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
                                className="w-full pl-10 pr-12 py-2.5 bg-white border border-slate-200/80 rounded-xl text-sm font-black text-slate-900 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 outline-none transition disabled:opacity-50"
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">%</span>
                        </div>

                        {/* Step Buttons */}
                        <div className="flex items-center gap-1 shrink-0">
                            <button
                                type="button"
                                onClick={() => handleStepAdjustment(-0.5)}
                                disabled={!isAuctionOpen || isLoading || computedPercentage <= minBidPercentage}
                                className="px-3 py-2.5 bg-white hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition border border-slate-200/80 cursor-pointer disabled:opacity-40 flex items-center gap-1 shadow-2xs active:scale-95"
                                title="Decrease bid by 0.5%"
                            >
                                <Minus className="w-3.5 h-3.5" />
                                <span>0.5%</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => handleStepAdjustment(0.5)}
                                disabled={!isAuctionOpen || isLoading || computedPercentage >= maxBidPercentage}
                                className="px-3 py-2.5 bg-white hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition border border-slate-200/80 cursor-pointer disabled:opacity-40 flex items-center gap-1 shadow-2xs active:scale-95"
                                title="Increase bid by 0.5%"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                <span>0.5%</span>
                            </button>
                        </div>
                    </div>

                    {/* Range Slider for Smooth Adjustments */}
                    <div className="pt-1">
                        <input
                            type="range"
                            min={minBidPercentage}
                            max={maxBidPercentage}
                            step="0.1"
                            disabled={!isAuctionOpen || isLoading}
                            value={isNaN(computedPercentage) ? minBidPercentage : computedPercentage}
                            onChange={(e) => setValue('bidPercentage', parseFloat(e.target.value), { shouldValidate: true })}
                            className="w-full accent-emerald-500 cursor-pointer"
                        />
                        <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 mt-0.5">
                            <span>Min: {minBidPercentage}%</span>
                            <span className="text-emerald-600 font-black">{computedPercentage}%</span>
                            <span>Max: {maxBidPercentage}%</span>
                        </div>
                    </div>

                    {/* ─── QUICK BID SHORTCUT BUTTONS ─── */}
                    {isAuctionOpen && (
                        <div className="pt-2 border-t border-slate-200/60 flex flex-wrap items-center gap-1.5">
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 mr-1 flex items-center gap-1">
                                <Zap className="w-3 h-3 text-amber-500" />
                                <span>Quick Bid:</span>
                            </span>

                            {/* Match Current Best Bid */}
                            {currentBestBidPercentage !== undefined && currentBestBidPercentage >= minBidPercentage && (
                                <>
                                    <button
                                        type="button"
                                        onClick={() => setValue('bidPercentage', currentBestBidPercentage, { shouldValidate: true })}
                                        className="px-2.5 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 text-[11px] font-black rounded-lg transition cursor-pointer border border-emerald-300 shadow-2xs active:scale-95"
                                    >
                                        Match Best ({currentBestBidPercentage}%)
                                    </button>

                                    {currentBestBidPercentage + 0.5 <= maxBidPercentage && (
                                        <button
                                            type="button"
                                            onClick={() => setValue('bidPercentage', Number((currentBestBidPercentage + 0.5).toFixed(1)), { shouldValidate: true })}
                                            className="px-2.5 py-1 bg-slate-900 hover:bg-emerald-600 text-white text-[11px] font-black rounded-lg transition cursor-pointer shadow-2xs active:scale-95"
                                        >
                                            Beat Best ({(currentBestBidPercentage + 0.5).toFixed(1)}%)
                                        </button>
                                    )}
                                </>
                            )}

                            {/* Presets */}
                            {presetPercentages.map((pct) => (
                                <button
                                    key={pct}
                                    type="button"
                                    onClick={() => setValue('bidPercentage', pct, { shouldValidate: true })}
                                    className="px-2.5 py-1 bg-white hover:bg-slate-200 text-slate-700 text-[11px] font-bold rounded-lg transition cursor-pointer border border-slate-200 shadow-2xs active:scale-95"
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
                <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-900">
                        Remarks / Notes (Optional)
                    </label>
                    <input
                        type="text"
                        disabled={!isAuctionOpen || isLoading}
                        placeholder="Add optional bidding note or remarks..."
                        {...register('remarks')}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 outline-none transition disabled:opacity-50 placeholder:text-slate-400"
                    />
                </div>

                {/* Submit Controls */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                    {isEditMode && onCancelEdit && (
                        <button
                            type="button"
                            onClick={onCancelEdit}
                            disabled={isLoading}
                            className="px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer border border-slate-200"
                        >
                            Cancel Edit
                        </button>
                    )}

                    <button
                        type="submit"
                        disabled={!isAuctionOpen || isLoading || isSuccess}
                        className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black uppercase tracking-wider rounded-xl transition shadow-lg shadow-emerald-500/20 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-40 active:scale-95"
                    >
                        {isLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                        ) : (
                            <>
                                <span>{isEditMode ? 'Update Submitted Bid' : 'Submit Auction Bid'}</span>
                                <ArrowUpRight className="w-4 h-4 text-slate-950" />
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};
