import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import api from '../../api/axios';
import { 
    Wallet, Users, Calendar, Coins, 
    ArrowRight, Loader2, AlertCircle, Info, Hammer, ChevronDown, Percent, FileText
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
    commissionPercent: z.number({ message: 'Commission percentage is required' })
        .min(0, 'Commission cannot be negative')
        .max(5, 'Commission maximum is 5%'),
    auctionType: z.enum(['AUCTION', 'LOTTERY']),
    description: z.string().optional(),
});

type ChitFormData = z.infer<typeof chitSchema>;

export const CreateChit = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

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
            commissionPercent: 2,
            auctionType: 'AUCTION',
            startDate: tomorrowStr,
            description: ''
        }
    });

    const rawTotalMembers = watch('totalMembers');
    const rawMonthlyContribution = watch('monthlyContribution');
    const commissionPercent = watch('commissionPercent') ?? 2;

    const totalMembers = Math.max(0, rawTotalMembers || 0);
    const monthlyContribution = Math.max(0, rawMonthlyContribution || 0);
    const totalPotValue = totalMembers * monthlyContribution;

    const onSubmit = async (data: ChitFormData) => {
        setLoading(true);
        setError('');
        try {
            const res = await api.post('/chit-groups', data);
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
                                    <label className="text-xs font-bold text-slate-900 mb-1 block">Organizer Fee (%)</label>
                                    <div className="relative">
                                        <Percent className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none z-10" />
                                        <input 
                                            type="number"
                                            min="0"
                                            max="5"
                                            step="0.5"
                                            {...register('commissionPercent', { valueAsNumber: true })}
                                            className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 border-none ${errors.commissionPercent ? 'ring-2 ring-rose-500' : ''} rounded-xl text-xs font-bold focus:ring-2 focus:ring-slate-900 outline-none transition-all`} 
                                        />
                                    </div>
                                    {errors.commissionPercent ? (
                                        <p className="text-rose-600 text-xs font-bold mt-1">{errors.commissionPercent.message}</p>
                                    ) : (
                                        <p className="text-[10px] text-slate-400 font-medium mt-1">Max 5% allowable fee</p>
                                    )}
                                </div>
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
                                <span className="text-slate-900">{commissionPercent}%</span>
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


