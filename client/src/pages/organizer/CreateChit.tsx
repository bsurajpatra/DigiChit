import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import api from '../../api/axios';
import { 
    Wallet, Users, Calendar, Coins, 
    ArrowRight, Loader2, AlertCircle, Info, Hammer, ChevronDown, Percent, FileText,
    Sliders, ChevronUp, IndianRupee, Globe
} from 'lucide-react';
import { Loader } from '../../components/ui/Loader';
import { useAuth } from '../../hooks/useAuth';
import { KYCChitGuard } from '../../components/ui/KYCChitGuard';

const chitSchema = z.object({
    name: z.string().min(3, 'Chit name must be at least 3 characters'),
    totalMembers: z.number({ message: 'Total members is required' })
        .min(2, 'Minimum 2 members required')
        .max(50, 'Maximum 50 members allowed'),
    monthlyContribution: z.number({ message: 'Monthly contribution is required' })
        .min(100, 'Minimum monthly contribution is ₹100'),
    startDate: z.string()
        .min(1, 'Start date is required')
        .refine((val) => {
            if (!val) return false;
            const selectedDate = new Date(val);
            if (isNaN(selectedDate.getTime())) return false;
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            return selectedDate >= today;
        }, {
            message: 'Start date cannot be in the past',
        }),
    auctionType: z.enum(['AUCTION', 'LOTTERY']),
    description: z.string().optional(),
    financialConfig: z.object({
        commission: z.object({
            value: z.number({ message: 'Commission is required' }).min(0, 'Min 0').max(10, 'Max 10%'),
            type: z.enum(['PERCENTAGE', 'FIXED'])
        }),
        lateFee: z.object({
            value: z.number({ message: 'Late fee is required' }).min(0, 'Cannot be negative'),
            type: z.enum(['FIXED', 'PERCENTAGE'])
        }),
        gracePeriodDays: z.number({ message: 'Grace period required' }).min(0, 'Min 0 days'),
        auctionStrategy: z.enum(['LOWEST_BID', 'HIGHEST_BID', 'CUSTOM']),
        allowPartialInstallment: z.boolean(),
        allowPrepayment: z.boolean(),
        allowPenaltyWaiver: z.boolean(),
        currency: z.string().min(1, 'Currency required')
    })
});

type ChitFormData = z.infer<typeof chitSchema>;

export const CreateChit = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [isFinConfigOpen, setIsFinConfigOpen] = useState(true);

    if (user?.kycStatus !== 'APPROVED') {
        return <KYCChitGuard title="Chit Circle Creation Restricted" />;
    }

    const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];

    const { register, handleSubmit, watch, formState: { errors } } = useForm<ChitFormData>({
        resolver: zodResolver(chitSchema),
        defaultValues: {
            name: '',
            totalMembers: 10,
            monthlyContribution: 1000,
            auctionType: 'AUCTION',
            startDate: tomorrowStr,
            description: '',
            financialConfig: {
                commission: { value: 2, type: 'PERCENTAGE' },
                lateFee: { value: 0, type: 'FIXED' },
                gracePeriodDays: 3,
                auctionStrategy: 'LOWEST_BID',
                allowPartialInstallment: false,
                allowPrepayment: true,
                allowPenaltyWaiver: true,
                currency: 'INR'
            }
        }
    });

    const rawTotalMembers = watch('totalMembers');
    const rawMonthlyContribution = watch('monthlyContribution');
    const commissionVal = watch('financialConfig.commission.value') ?? 2;
    const commissionType = watch('financialConfig.commission.type') ?? 'PERCENTAGE';

    const totalMembers = Math.max(0, rawTotalMembers || 0);
    const monthlyContribution = Math.max(0, rawMonthlyContribution || 0);
    const totalPotValue = totalMembers * monthlyContribution;

    const onSubmit = async (data: ChitFormData) => {
        setLoading(true);
        setError('');
        try {
            const payload = {
                ...data,
                commissionPercent: data.financialConfig.commission.value
            };
            const res = await api.post('/chit-groups', payload);
            navigate(`/chit-details/${res.data.data.chitGroup._id}`);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to create chit group');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="h-full flex items-center justify-center p-20"><Loader size="lg" /></div>;

    return (
        <div className="w-full space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
                        <Wallet className="w-4 h-4" />
                        <span>Circle Creation</span>
                    </div>
                    <h1 className="text-xl font-black text-slate-900 tracking-tight">Create New Chit</h1>
                </div>
                <div className="flex items-center gap-2 px-3.5 py-1.5 bg-slate-900 text-white rounded-xl font-bold text-xs shrink-0">
                    <Wallet className="w-4 h-4 text-emerald-400" />
                    <span>Formation Phase</span>
                </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Main Configuration */}
                <div className="md:col-span-2 space-y-6">
                    <div className="bg-white p-6 md:p-8 rounded-2xl border-none shadow-none space-y-6">
                        <div className="flex items-center gap-2 mb-2">
                            <Info className="w-4 h-4 text-emerald-600" />
                            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Circle Configuration</h2>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-900 mb-1 block">Chit Group Name</label>
                                <input 
                                    {...register('name')}
                                    placeholder="e.g. Blue Chip Monthly Circle"
                                    className={`w-full px-4 py-2.5 bg-slate-50 border-none ${errors.name ? 'ring-2 ring-rose-500' : ''} rounded-xl text-xs font-bold focus:ring-2 focus:ring-slate-900 outline-none transition-all placeholder:text-slate-400 placeholder:font-normal`} 
                                />
                                {errors.name && <p className="text-rose-600 text-xs font-bold mt-1">{errors.name.message}</p>}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-900 mb-1 block">Total Members (Min 2)</label>
                                    <div className="relative">
                                        <Users className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none z-10" />
                                        <input 
                                            type="number"
                                            min="2"
                                            max="50"
                                            {...register('totalMembers', { valueAsNumber: true })}
                                            className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 border-none ${errors.totalMembers ? 'ring-2 ring-rose-500' : ''} rounded-xl text-xs font-bold focus:ring-2 focus:ring-slate-900 outline-none transition-all`} 
                                        />
                                    </div>
                                    {errors.totalMembers ? (
                                        <p className="text-rose-600 text-xs font-bold mt-1">{errors.totalMembers.message}</p>
                                    ) : (
                                        <p className="text-[10px] text-slate-400 font-medium mt-1">Equal to duration in months (Min 2)</p>
                                    )}
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-900 mb-1 block">Monthly Contribution (₹)</label>
                                    <div className="relative">
                                        <Coins className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none z-10" />
                                        <input 
                                            type="number"
                                            min="100"
                                            step="500"
                                            {...register('monthlyContribution', { valueAsNumber: true })}
                                            className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 border-none ${errors.monthlyContribution ? 'ring-2 ring-rose-500' : ''} rounded-xl text-xs font-bold focus:ring-2 focus:ring-slate-900 outline-none transition-all`} 
                                        />
                                    </div>
                                    {errors.monthlyContribution && (
                                        <p className="text-rose-600 text-xs font-bold mt-1">{errors.monthlyContribution.message}</p>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-900 mb-1 block">Start Date</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none z-10" />
                                        <input 
                                            type="date"
                                            min={new Date().toISOString().split('T')[0]}
                                            {...register('startDate')}
                                            className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 border-none ${errors.startDate ? 'ring-2 ring-rose-500' : ''} rounded-xl text-xs font-bold focus:ring-2 focus:ring-slate-900 outline-none transition-all`} 
                                        />
                                    </div>
                                    {errors.startDate && <p className="text-rose-600 text-xs font-bold mt-1">{errors.startDate.message}</p>}
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-900 mb-1 block">Auction System Type</label>
                                    <div className="relative flex items-center">
                                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 z-10 pointer-events-none text-slate-900">
                                            <Hammer className="w-4 h-4" />
                                        </div>
                                        <select 
                                            {...register('auctionType')}
                                            className={`w-full pl-10 pr-10 py-2.5 bg-slate-50 border-none ${errors.auctionType ? 'ring-2 ring-rose-500' : ''} rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-slate-900 outline-none appearance-none transition-all cursor-pointer`}
                                        >
                                            <option value="AUCTION">Competitive Auction (Lowest Bidder Wins)</option>
                                            <option value="LOTTERY">Simple Lottery (Random Selection)</option>
                                        </select>
                                        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 z-10 pointer-events-none text-slate-400">
                                            <ChevronDown className="w-4 h-4" />
                                        </div>
                                    </div>
                                    {errors.auctionType && <p className="text-rose-600 text-xs font-bold mt-1">{errors.auctionType.message}</p>}
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-900 mb-1 block">Description / Rules (Optional)</label>
                                <div className="relative">
                                    <FileText className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400 pointer-events-none z-10" />
                                    <textarea 
                                        rows={3}
                                        {...register('description')}
                                        placeholder="Describe rules, payment due dates, or special notes for members..."
                                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-none rounded-xl text-xs font-bold focus:ring-2 focus:ring-slate-900 outline-none transition-all resize-none placeholder:text-slate-400 placeholder:font-normal" 
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Dedicated Financial Configuration Card (Collapsible) */}
                    <div className="bg-white p-6 md:p-8 rounded-2xl border-none shadow-none space-y-6">
                        <button
                            type="button"
                            onClick={() => setIsFinConfigOpen(!isFinConfigOpen)}
                            className="w-full flex items-center justify-between text-left cursor-pointer focus:outline-none"
                        >
                            <div className="flex items-center gap-2">
                                <Sliders className="w-4 h-4 text-blue-600" />
                                <div>
                                    <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Financial Configuration</h2>
                                    <p className="text-[10px] text-slate-400 font-medium">Scheme rules, fees, grace period, & strategy</p>
                                </div>
                            </div>
                            {isFinConfigOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                        </button>

                        {isFinConfigOpen && (
                            <div className="space-y-4 pt-2 border-t border-slate-100">
                                {/* Commission Type & Commission Value */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-slate-900 mb-1 block">Commission Type</label>
                                        <select 
                                            {...register('financialConfig.commission.type')}
                                            className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-slate-900 outline-none cursor-pointer"
                                        >
                                            <option value="PERCENTAGE">PERCENTAGE (%)</option>
                                            <option value="FIXED">FIXED (₹)</option>
                                        </select>
                                        <p className="text-[10px] text-slate-400 font-medium mt-1">
                                            {commissionType === 'PERCENTAGE' ? 'Percentage of total pot value per cycle' : 'Fixed fee amount per cycle'}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-900 mb-1 block">
                                            {commissionType === 'PERCENTAGE' ? 'Organizer Commission (%)' : 'Organizer Commission Amount (₹)'}
                                        </label>
                                        <div className="relative">
                                            {commissionType === 'PERCENTAGE' ? (
                                                <Percent className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none z-10" />
                                            ) : (
                                                <IndianRupee className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none z-10" />
                                            )}
                                            <input 
                                                type="number"
                                                min="0"
                                                max={commissionType === 'PERCENTAGE' ? 10 : undefined}
                                                step={commissionType === 'PERCENTAGE' ? 0.5 : 100}
                                                placeholder={commissionType === 'PERCENTAGE' ? 'e.g. 2' : 'e.g. 500'}
                                                {...register('financialConfig.commission.value', { valueAsNumber: true })}
                                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-none rounded-xl text-xs font-bold focus:ring-2 focus:ring-slate-900 outline-none"
                                            />
                                        </div>
                                        {errors.financialConfig?.commission?.value ? (
                                            <p className="text-rose-600 text-xs font-bold mt-1">{errors.financialConfig.commission.value.message}</p>
                                        ) : (
                                            <p className="text-[10px] text-slate-400 font-medium mt-1">
                                                {commissionType === 'PERCENTAGE' ? 'Max 10% allowable fee' : 'Fixed organizer fee'}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Late Fee Value & Type */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-slate-900 mb-1 block">Late Fee Penalty</label>
                                        <input 
                                            type="number"
                                            min="0"
                                            {...register('financialConfig.lateFee.value', { valueAsNumber: true })}
                                            className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl text-xs font-bold focus:ring-2 focus:ring-slate-900 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-900 mb-1 block">Late Fee Type</label>
                                        <select 
                                            {...register('financialConfig.lateFee.type')}
                                            className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-slate-900 outline-none cursor-pointer"
                                        >
                                            <option value="FIXED">FIXED (₹)</option>
                                            <option value="PERCENTAGE">PERCENTAGE (%)</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Grace Period & Strategy */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-slate-900 mb-1 block">Grace Period (Days)</label>
                                        <input 
                                            type="number"
                                            min="0"
                                            {...register('financialConfig.gracePeriodDays', { valueAsNumber: true })}
                                            className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl text-xs font-bold focus:ring-2 focus:ring-slate-900 outline-none"
                                        />
                                        <p className="text-[10px] text-slate-400 font-medium mt-1">Days before late penalty applies</p>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-900 mb-1 block">Auction Strategy</label>
                                        <select 
                                            {...register('financialConfig.auctionStrategy')}
                                            className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-slate-900 outline-none cursor-pointer"
                                        >
                                            <option value="LOWEST_BID">LOWEST BID (Competitive Winner)</option>
                                            <option value="HIGHEST_BID">HIGHEST BID (Custom Reverse)</option>
                                            <option value="CUSTOM">CUSTOM STRATEGY</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Currency Dropdown */}
                                <div>
                                    <label className="text-xs font-bold text-slate-900 mb-1 block">Currency Code</label>
                                    <div className="relative">
                                        <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none z-10" />
                                        <select 
                                            {...register('financialConfig.currency')}
                                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-none rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-slate-900 outline-none cursor-pointer"
                                        >
                                            <option value="INR">INR (₹) - Indian Rupee</option>
                                            <option value="USD">USD ($) - US Dollar</option>
                                            <option value="EUR">EUR (€) - Euro</option>
                                            <option value="GBP">GBP (£) - British Pound</option>
                                            <option value="AED">AED - UAE Dirham</option>
                                            <option value="SGD">SGD (S$) - Singapore Dollar</option>
                                        </select>
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-medium mt-1">Select supported ISO currency for this scheme</p>
                                </div>

                                {/* Financial Policy Switches */}
                                <div className="space-y-3 pt-2">
                                    <label className="text-xs font-bold text-slate-900 block">Financial Policy Rules</label>

                                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                                        <div>
                                            <span className="text-xs font-bold text-slate-900 block">Allow Partial Installments</span>
                                            <span className="text-[10px] text-slate-400 block">Permit members to pay dues in multiple part payments</span>
                                        </div>
                                        <input 
                                            type="checkbox"
                                            {...register('financialConfig.allowPartialInstallment')}
                                            className="w-4 h-4 text-emerald-600 rounded cursor-pointer"
                                        />
                                    </div>

                                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                                        <div>
                                            <span className="text-xs font-bold text-slate-900 block">Allow Prepayment</span>
                                            <span className="text-[10px] text-slate-400 block">Permit paying future monthly dues in advance</span>
                                        </div>
                                        <input 
                                            type="checkbox"
                                            {...register('financialConfig.allowPrepayment')}
                                            className="w-4 h-4 text-emerald-600 rounded cursor-pointer"
                                        />
                                    </div>

                                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                                        <div>
                                            <span className="text-xs font-bold text-slate-900 block">Allow Penalty Waiver</span>
                                            <span className="text-[10px] text-slate-400 block">Enable organizer/admin to waive late fees</span>
                                        </div>
                                        <input 
                                            type="checkbox"
                                            {...register('financialConfig.allowPenaltyWaiver')}
                                            className="w-4 h-4 text-emerald-600 rounded cursor-pointer"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Summary & Submit */}
                <div className="space-y-6">
                    <div className="bg-white p-6 md:p-8 rounded-2xl border-none shadow-none space-y-6 sticky top-6">
                        <div className="text-center pb-6 border-b border-slate-100">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Financial Summary</h3>
                            <div className="text-3xl font-black text-slate-900 tracking-tight">
                                ₹{totalPotValue.toLocaleString('en-IN')}
                            </div>
                            <p className="text-xs font-bold text-emerald-600 mt-1">Total Pot Value</p>
                        </div>

                        <div className="space-y-3">
                            <div className="flex justify-between items-center text-xs font-bold">
                                <span className="text-slate-400">Organizer Fee</span>
                                <span className="text-slate-900">{commissionVal}%</span>
                            </div>
                            <div className="flex justify-between items-center text-xs font-bold">
                                <span className="text-slate-400">Duration</span>
                                <span className="text-slate-900">{totalMembers} Months</span>
                            </div>
                            <div className="flex justify-between items-center text-xs font-bold">
                                <span className="text-slate-400">Monthly Contribution</span>
                                <span className="text-slate-900">₹{monthlyContribution.toLocaleString('en-IN')}</span>
                            </div>
                        </div>

                        {error && (
                            <div className="p-3.5 bg-rose-50 text-rose-800 rounded-xl flex items-center gap-2 border-none">
                                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                                <span className="text-xs font-bold">{error}</span>
                            </div>
                        )}

                        <button 
                            type="submit"
                            disabled={loading}
                            className="w-full bg-slate-900 hover:bg-emerald-600 text-white py-3.5 rounded-xl font-bold text-xs transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin text-emerald-400" /> : (
                                <>
                                    <span>Launch Formation</span>
                                    <ArrowRight className="w-4 h-4 text-emerald-400" />
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};


