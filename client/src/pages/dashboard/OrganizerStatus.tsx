import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import api from '../../api/axios';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader } from '../../components/ui/Loader';
import { CheckCircle2, AlertTriangle, ArrowRight, Loader2, Briefcase, XCircle, Users, MapPin, IndianRupee } from 'lucide-react';
import { Link } from 'react-router-dom';

const applySchema = z.object({
    organizerApplicationReason: z.string().min(20, 'Please provide more detail (at least 20 chars).'),
    expectedChitValueRange: z.string().min(1, 'Please select expected total chit value.'),
    expectedGroupSizeRange: z.string().optional(),
    city: z.string().min(2, 'City is required.'),
    occupation: z.string().min(2, 'Occupation is required.'),
    incomeRange: z.string().min(1, 'Please select your income range.')
});

type ApplyFormValues = z.infer<typeof applySchema>;

export const OrganizerStatus = () => {
    const { user, updateUser } = useAuth();
    const [status, setStatus] = useState(user?.organizerStatus || 'NOT_APPLIED');
    const [rejectionReason, setRejectionReason] = useState<string | null>(null);
    const [loadingProfile, setLoadingProfile] = useState(true);

    const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<ApplyFormValues>({
        resolver: zodResolver(applySchema)
    });

    const [submitError, setSubmitError] = useState<string | null>(null);

    useEffect(() => {
        api.get('/user/profile')
            .then(res => {
                const profile = res.data.data.user;
                setStatus(profile.organizerStatus);
                setRejectionReason(profile.organizerRejectedReason || null);
                updateUser({ organizerStatus: profile.organizerStatus });
            })
            .catch(console.error)
            .finally(() => setLoadingProfile(false));
    }, [updateUser]);

    const onSubmit = async (data: ApplyFormValues) => {
        setSubmitError(null);
        try {
            const res = await api.post('/organizer/apply', data);
            setStatus(res.data.data.organizerStatus);
            updateUser({ organizerStatus: res.data.data.organizerStatus });
            reset();
        } catch (err: any) {
            setSubmitError(err.response?.data?.message || 'Failed to submit application.');
        }
    };

    if (loadingProfile) {
        return (
            <div className="h-full flex items-center justify-center">
                <Loader size="lg" />
            </div>
        );
    }

    // Must be ACTIVE and KYC APPROVED to even see the form
    const isEligible = user?.accountStatus === 'ACTIVE' && user?.kycStatus === 'APPROVED';

    if (status === 'NOT_APPLIED' || status === 'REJECTED') {
        if (!isEligible) {
            return (
                <div className="h-full flex flex-col items-center justify-center p-8 bg-white/40 backdrop-blur-md rounded-3xl border border-white/40 shadow-xl shadow-slate-100/50 text-center relative overflow-hidden animate-in zoom-in duration-500">
                    <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mb-6 shadow-inner transform rotate-12 transition-transform hover:rotate-0 duration-500">
                        <AlertTriangle className="w-8 h-8" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 mb-2 uppercase tracking-tight leading-none">Not Eligible</h2>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest max-w-[280px] mb-8 leading-relaxed">
                        You must have a fully <span className="text-slate-900">Active Account</span> and an <span className="text-slate-900">Approved KYC</span> to apply for Organizer status.
                    </p>
                    <Link to="/profile" className="inline-flex items-center gap-2 px-8 py-3.5 bg-slate-900 text-white font-black rounded-xl shadow-lg shadow-slate-200 hover:bg-emerald-600 transition-all active:scale-95 uppercase tracking-widest text-[9px]">
                        Check Credentials <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                </div>
            );
        }

        return (
            <div className="h-full flex flex-col gap-4 animate-in fade-in duration-500">
                {/* Compact Header */}
                <div className="flex items-center justify-between bg-white/50 backdrop-blur-md px-6 py-4 rounded-3xl border border-white/40 shadow-lg shadow-slate-100/50">
                    <div>
                        <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight uppercase leading-tight">Become an Organizer</h1>
                        <p className="text-[9px] font-black text-slate-400 mt-0.5 uppercase tracking-widest leading-none">Scale financial circles efficiently.</p>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-100 rounded-2xl">
                        <div className="w-6 h-6 bg-emerald-100 text-emerald-700 rounded-lg flex items-center justify-center">
                            <Briefcase className="w-3.5 h-3.5" />
                        </div>
                        <span className="font-black text-slate-600 uppercase tracking-widest text-[9px]">Application</span>
                    </div>
                </div>

                <div className="flex-1 min-h-0 bg-white/60 backdrop-blur-sm rounded-3xl border border-white/60 shadow-xl shadow-slate-100/50 overflow-y-auto custom-scrollbar flex flex-col">
                    {status === 'REJECTED' && (
                        <div className="mx-6 mt-6 p-4 bg-red-50/30 border border-red-100 rounded-2xl flex items-start gap-3">
                            <XCircle className="w-4 h-4 text-red-500 shrink-0" />
                            <div>
                                <h3 className="text-red-900 font-black uppercase text-[9px] tracking-widest">Feedback on previous app</h3>
                                <p className="text-red-600 mt-1 text-[11px] font-bold leading-relaxed">{rejectionReason}</p>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-8 flex-1">
                        {submitError && (
                            <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
                                <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> {submitError}
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">HQ City</label>
                                <div className="relative">
                                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                                    <input {...register('city')} className="w-full pl-10 pr-4 py-3 bg-white/80 border border-slate-100 rounded-xl focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 outline-none transition text-xs font-bold placeholder:text-slate-300" placeholder="E.g., Mumbai" />
                                </div>
                                {errors.city && <p className="text-red-500 text-[9px] mt-1 ml-1 font-black uppercase tracking-widest">{errors.city.message}</p>}
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Profession</label>
                                <div className="relative">
                                    <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                                    <input {...register('occupation')} className="w-full pl-10 pr-4 py-3 bg-white/80 border border-slate-100 rounded-xl focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 outline-none transition text-xs font-bold placeholder:text-slate-300" placeholder="E.g., Business Owner" />
                                </div>
                                {errors.occupation && <p className="text-red-500 text-[9px] mt-1 ml-1 font-black uppercase tracking-widest">{errors.occupation.message}</p>}
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Income Level</label>
                                <div className="relative">
                                    <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                                    <select {...register('incomeRange')} className="w-full pl-10 pr-4 py-3 bg-white/80 border border-slate-100 rounded-xl focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 outline-none transition text-xs font-bold appearance-none">
                                        <option value="">Range</option>
                                        <option value="< 5 Lakhs">Less than 5 Lakhs</option>
                                        <option value="5-10 Lakhs">5 - 10 Lakhs</option>
                                        <option value="10-25 Lakhs">10 - 25 Lakhs</option>
                                        <option value="25+ Lakhs">25+ Lakhs</option>
                                    </select>
                                </div>
                                {errors.incomeRange && <p className="text-red-500 text-[9px] mt-1 ml-1 font-black uppercase tracking-widest">{errors.incomeRange.message}</p>}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Anticipated Value Ratio</label>
                                <select {...register('expectedChitValueRange')} className="w-full px-4 py-3 bg-white/80 border border-slate-100 rounded-xl focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 outline-none transition text-xs font-bold appearance-none">
                                    <option value="">Select Value Scale</option>
                                    <option value="UP_TO_1_LAKH">Up to ₹1 Lakh</option>
                                    <option value="ONE_TO_FIVE_LAKH">₹1–5 Lakhs</option>
                                    <option value="FIVE_TO_TEN_LAKH">₹5–10 Lakhs</option>
                                    <option value="TEN_TO_TWENTY_FIVE_LAKH">₹10–25 Lakhs</option>
                                    <option value="ABOVE_TWENTY_FIVE_LAKH">Above ₹25 Lakhs</option>
                                </select>
                                {errors.expectedChitValueRange && <p className="text-red-500 text-[9px] mt-1 ml-1 font-black uppercase tracking-widest">{errors.expectedChitValueRange.message}</p>}
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Target Group Volume</label>
                                <div className="relative">
                                    <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                                    <select {...register('expectedGroupSizeRange')} className="w-full pl-10 pr-4 py-3 bg-white/80 border border-slate-100 rounded-xl focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 outline-none transition text-xs font-bold appearance-none">
                                        <option value="">Any Size</option>
                                        <option value="SMALL_5_TO_10">Small (5–10 Members)</option>
                                        <option value="MEDIUM_10_TO_20">Medium (10–20 Members)</option>
                                        <option value="LARGE_20_TO_50">Large (20–50 Members)</option>
                                        <option value="VERY_LARGE_50_PLUS">Very Large (50+ Members)</option>
                                    </select>
                                </div>
                                {errors.expectedGroupSizeRange && <p className="text-red-500 text-[9px] mt-1 ml-1 font-black uppercase tracking-widest">{errors.expectedGroupSizeRange.message}</p>}
                            </div>
                        </div>

                        <div className="space-y-1.5 pt-2">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Strategy & Implementation Pitch</label>
                            <textarea {...register('organizerApplicationReason')} rows={3} className="w-full resize-none px-6 py-4 bg-white/80 border border-slate-100 rounded-3xl focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 outline-none transition text-xs font-bold placeholder:text-slate-300" placeholder="Identify your experience and strategy for host transparency..." />
                            {errors.organizerApplicationReason && <p className="text-red-500 text-[9px] mt-1 ml-1 font-black uppercase tracking-widest">{errors.organizerApplicationReason.message}</p>}
                        </div>

                        <div className="pt-8 border-t border-slate-50 flex justify-end shrink-0">
                            <button type="submit" disabled={isSubmitting} className="h-12 px-10 bg-slate-900 text-white rounded-xl font-black hover:bg-emerald-600 transition-all active:scale-95 shadow-xl shadow-slate-200 flex items-center gap-2 uppercase tracking-widest text-[9px]">
                                {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Verifying Credentials...</> : <><Briefcase className="w-4 h-4" /> Dispatch Application</>}
                            </button>
                        </div>
                    </form>
                </div>
                
                <style>{`
                    .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                    .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.05); border-radius: 10px; }
                    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,0.1); }
                `}</style>
            </div>
        );
    }

    if (status === 'PENDING') {
        return (
            <div className="h-full flex flex-col items-center justify-center p-8 bg-white/40 backdrop-blur-md rounded-3xl border border-white/40 shadow-2xl shadow-slate-100/50 text-center relative overflow-hidden animate-in zoom-in duration-500">
                <div className="absolute top-0 right-0 w-[40%] h-[40%] bg-amber-500/5 blur-[80px] rounded-full translate-x-1/2 -translate-y-1/2" />
                <div className="w-20 h-20 bg-amber-50/50 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-inner relative z-10">
                    <Loader2 className="w-10 h-10 text-amber-500 animate-[spin_4s_linear_infinite]" />
                </div>
                <h2 className="text-xl font-bold text-slate-900 mb-2 tracking-tight uppercase leading-none relative z-10">Review Status: Pending</h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest max-w-[300px] mx-auto leading-relaxed relative z-10">
                    Audit is verifying your infrastructure capacity. We will unlock your dashboard shortly.
                </p>
                <div className="mt-8 flex justify-center gap-2 relative z-10">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse delay-75" />
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse delay-150" />
                </div>
            </div>
        );
    }

    if (status === 'APPROVED') {
        return (
            <div className="h-full flex flex-col items-center justify-center p-8 bg-white/40 backdrop-blur-md rounded-3xl border border-white/40 shadow-2xl shadow-slate-100/50 text-center relative overflow-hidden animate-in zoom-in duration-700">
                <div className="absolute top-0 right-0 w-[40%] h-[40%] bg-emerald-500/5 blur-[80px] rounded-full translate-x-1/2 -translate-y-1/2" />
                <div className="w-20 h-20 bg-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-xl shadow-emerald-500/20 transform -rotate-3 relative z-10">
                    <CheckCircle2 className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-xl font-bold text-slate-900 mb-2 tracking-tight uppercase leading-none relative z-10">Credentials Verified</h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest max-w-[300px] mx-auto leading-relaxed mb-10 relative z-10">
                    Infrastructure audit complete. Your organizer instruments are now active.
                </p>
                <Link to="/dashboard" className="inline-flex items-center justify-center px-10 py-4 bg-slate-900 text-white font-black rounded-xl shadow-xl shadow-slate-100 hover:bg-emerald-600 transition-all hover:scale-105 active:scale-95 text-[10px] uppercase tracking-widest relative z-10">
                    Enter Pulse Dashboard <ArrowRight className="w-4 h-4 ml-3" />
                </Link>
            </div>
        );
    }

    return null;
};
