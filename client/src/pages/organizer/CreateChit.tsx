import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import api from '../../api/axios';
import { 
    Wallet, Users, Calendar, Coins, 
    ArrowRight, Loader2, AlertCircle, Info, Hammer, ChevronDown
} from 'lucide-react';
import { Loader } from '../../components/ui/Loader';
import { useAuth } from '../../hooks/useAuth';
import { KYCChitGuard } from '../../components/ui/KYCChitGuard';

const chitSchema = z.object({
    name: z.string().min(3, 'Chit name must be at least 3 characters'),
    totalMembers: z.number({ invalid_type_error: 'Total members is required' })
        .min(2, 'Minimum 2 members required')
        .max(50, 'Maximum 50 members allowed'),
    monthlyContribution: z.number({ invalid_type_error: 'Monthly contribution is required' })
        .min(1, 'Monthly contribution must be greater than 0'),
    startDate: z.string().refine((val) => new Date(val) > new Date(), {
        message: 'Start date must be in the future',
    }),
    commissionPercent: z.number().min(0, 'Commission cannot be negative').max(5, 'Commission max 5%'),
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

    const { register, handleSubmit, watch, formState: { errors } } = useForm<ChitFormData>({
        resolver: zodResolver(chitSchema),
        defaultValues: {
            totalMembers: 10,
            monthlyContribution: 1000,
            commissionPercent: 2,
            auctionType: 'AUCTION'
        }
    });

    const rawTotalMembers = watch('totalMembers');
    const rawMonthlyContribution = watch('monthlyContribution');

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
        <div className="w-full space-y-6 animate-in fade-in duration-700">
            {/* Compact Header */}
            <div className="flex items-center justify-between bg-white/50 backdrop-blur-md px-6 py-4 rounded-3xl border border-white/40 shadow-lg shadow-slate-100/50">
                <div>
                    <h1 className="text-xl font-bold text-slate-900 tracking-tight uppercase leading-tight">Create New Chit</h1>
                    <p className="text-[9px] font-bold text-slate-400 mt-0.5 uppercase tracking-widest leading-none">Define parameters for your next financial circle</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-2xl shadow-md">
                    <Wallet className="w-4 h-4 text-emerald-400" />
                    <span className="font-bold text-[9px] uppercase tracking-[0.2em]">Formation Phase</span>
                </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Main Configuration */}
                <div className="md:col-span-2 space-y-6">
                    <div className="bg-white/60 backdrop-blur-sm border border-white/60 p-8 rounded-3xl shadow-xl shadow-slate-100/50 space-y-6">
                        <div className="flex items-center gap-2 mb-2">
                            <Info className="w-3.5 h-3.5 text-emerald-500" />
                            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Circle Configuration</h2>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">Chit Group Name</label>
                                <input 
                                    {...register('name')}
                                    placeholder="Blue Chip Monthly"
                                    className="w-full px-5 py-4 bg-white border border-slate-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-emerald-500/5 outline-none transition-all shadow-sm" 
                                />
                                {errors.name && <p className="text-red-500 text-[9px] font-bold mt-1.5 ml-1 uppercase">{errors.name.message}</p>}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">Total Members (Min 2)</label>
                                    <div className="relative">
                                        <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none z-10" />
                                        <input 
                                            type="number"
                                            min="2"
                                            max="50"
                                            onInput={(e) => {
                                                if (parseFloat(e.currentTarget.value) < 0) e.currentTarget.value = '2';
                                            }}
                                            {...register('totalMembers', { valueAsNumber: true })}
                                            className={`w-full pl-12 pr-5 py-4 bg-white border ${errors.totalMembers ? 'border-red-500' : 'border-slate-100'} rounded-2xl text-sm font-bold focus:ring-4 focus:ring-emerald-500/5 outline-none transition-all`} 
                                        />
                                    </div>
                                    {errors.totalMembers ? (
                                        <p className="text-red-500 text-[9px] font-bold mt-1.5 ml-1 uppercase">{errors.totalMembers.message}</p>
                                    ) : (
                                        <p className="text-[8px] text-slate-400 font-bold mt-1.5 ml-1 uppercase">Equal to duration in months (Min 2)</p>
                                    )}
                                </div>
                                <div>
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">Contribution (₹)</label>
                                    <div className="relative">
                                        <Coins className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none z-10" />
                                        <input 
                                            type="number"
                                            min="0"
                                            onInput={(e) => {
                                                if (parseFloat(e.currentTarget.value) < 0) e.currentTarget.value = '0';
                                            }}
                                            {...register('monthlyContribution', { valueAsNumber: true })}
                                            className={`w-full pl-12 pr-5 py-4 bg-white border ${errors.monthlyContribution ? 'border-red-500' : 'border-slate-100'} rounded-2xl text-sm font-bold focus:ring-4 focus:ring-emerald-500/5 outline-none transition-all`} 
                                        />
                                    </div>
                                    {errors.monthlyContribution && (
                                        <p className="text-red-500 text-[9px] font-bold mt-1.5 ml-1 uppercase">{errors.monthlyContribution.message}</p>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">Start Date</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none z-10" />
                                        <input 
                                            type="date"
                                            {...register('startDate')}
                                            className="w-full pl-12 pr-5 py-4 bg-white border border-slate-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-emerald-500/5 outline-none transition-all" 
                                        />
                                    </div>
                                    {errors.startDate && <p className="text-red-500 text-[9px] font-bold mt-1.5 ml-1 uppercase">{errors.startDate.message}</p>}
                                </div>
                                <div>
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">Auction Type</label>
                                    <div className="relative flex items-center">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10 pointer-events-none text-emerald-600">
                                            <Hammer className="w-4 h-4" />
                                        </div>
                                        <select 
                                            {...register('auctionType')}
                                            className="w-full pl-12 pr-10 py-4 bg-white border border-slate-100 rounded-2xl text-sm font-bold text-slate-800 focus:ring-4 focus:ring-emerald-500/5 outline-none appearance-none transition-all cursor-pointer shadow-sm"
                                        >
                                            <option value="AUCTION">Competitive Auction</option>
                                            <option value="LOTTERY">Simple Lottery</option>
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 z-10 pointer-events-none text-slate-400">
                                            <ChevronDown className="w-4 h-4" />
                                        </div>
                                    </div>
                                    {errors.auctionType && <p className="text-red-500 text-[9px] font-bold mt-1.5 ml-1 uppercase">{errors.auctionType.message}</p>}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Summary & Submit */}
                <div className="space-y-6">
                    <div className="bg-white/60 backdrop-blur-sm border border-white/60 p-8 rounded-3xl shadow-xl shadow-slate-100/50 space-y-6 sticky top-6">
                        <div className="text-center pb-6 border-b border-slate-50">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Financial Summary</h3>
                            <div className="text-3xl font-black text-slate-900 tracking-tighter">
                                ₹{totalPotValue.toLocaleString()}
                            </div>
                            <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mt-1">Total Pot Value</p>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
                                <span className="text-slate-400">Organizer Fee</span>
                                <span className="text-slate-900">2% Fixed</span>
                            </div>
                            <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
                                <span className="text-slate-400">Duration</span>
                                <span className="text-slate-900">{totalMembers} Months</span>
                            </div>
                        </div>

                        {error && (
                            <div className="p-3 bg-red-50 text-red-600 rounded-xl flex items-center gap-2 border border-red-100">
                                <AlertCircle className="w-4 h-4" />
                                <span className="text-[9px] font-black uppercase tracking-widest">{error}</span>
                            </div>
                        )}

                        <button 
                            disabled={loading}
                            className="w-full bg-slate-900 text-white h-14 rounded-2xl font-black uppercase tracking-[0.1em] text-xs hover:bg-emerald-600 transition-all flex items-center justify-center gap-3 shadow-xl group cursor-pointer"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                <>
                                    Launch Formation
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};

