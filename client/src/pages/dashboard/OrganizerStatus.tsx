import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import api from '../../api/axios';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader } from '../../components/ui/Loader';
import { CheckCircle2, AlertTriangle, ArrowRight, Loader2, Briefcase, XCircle } from 'lucide-react';
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
                <div className="h-full flex flex-col items-center justify-center p-8 bg-white/40 backdrop-blur-md rounded-[3rem] border border-white/40 shadow-xl text-center overflow-hidden">
                    <div className="w-20 h-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mb-6 shadow-inner">
                        <AlertTriangle className="w-10 h-10" />
                    </div>
                    <h2 className="text-3xl font-medium text-slate-900 mb-3 uppercase tracking-tight">Not Eligible</h2>
                    <p className="text-slate-500 font-medium max-w-sm mb-8 leading-relaxed">
                        You must have an fully Active account and an Approved KYC to apply for Organizer status.
                    </p>
                    <Link to="/profile" className="inline-flex items-center gap-2 px-8 py-3.5 bg-slate-900 text-white font-bold rounded-2xl shadow-xl shadow-slate-200 hover:bg-emerald-600 transition-all active:scale-95 uppercase tracking-widest text-xs">
                        Check Profile Status <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            );
        }

        return (
            <div className="h-full flex flex-col gap-6">
                <div className="shrink-0 flex items-center justify-between bg-white/40 backdrop-blur-md p-6 rounded-[2.5rem] border border-white/40 shadow-xl shadow-slate-100 mb-2">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-emerald-600 rounded-[1.5rem] flex items-center justify-center text-white font-black text-xl shadow-lg shadow-emerald-100 flex-none overflow-hidden">
                            <Briefcase className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-medium text-slate-900 tracking-tight uppercase leading-none">Become an Organizer</h1>
                            <p className="text-xs font-medium text-slate-400 mt-2 uppercase tracking-widest text-[#10b981]">FOUND YOUR OWN FINANCIAL COMMUNITY</p>
                        </div>
                    </div>
                    <div className="hidden sm:flex items-center gap-3 px-5 py-2.5 bg-transparent">
                        <div className="w-8 h-8 bg-emerald-100 text-black rounded-lg flex items-center justify-center font-black text-sm">
                            <Briefcase className="w-4 h-4" />
                        </div>
                        <span className="font-black text-black uppercase tracking-widest text-[10px]">Application Form</span>
                    </div>
                </div>

                <div className="flex-1 min-h-0 bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-y-auto">
                    {status === 'REJECTED' && (
                        <div className="m-8 p-6 bg-red-50/50 border-2 border-red-100 rounded-[2.5rem] flex items-start gap-4">
                            <XCircle className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
                            <div>
                                <h3 className="text-red-900 font-black uppercase text-xs tracking-widest">Previous Application Rejected</h3>
                                <p className="text-red-600 mt-1 text-sm font-medium leading-relaxed">{rejectionReason}</p>
                                <p className="text-red-400 mt-3 text-[10px] font-black uppercase tracking-widest">You may reapply below by addressing these points.</p>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit(onSubmit)} className="p-10 space-y-10">
                        {submitError && (
                            <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-sm font-bold flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 shrink-0" /> {submitError}
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">City of Operation</label>
                                <input {...register('city')} className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-emerald-100 outline-none transition text-slate-900 font-bold placeholder:text-slate-300 shadow-inner" placeholder="E.g., Mumbai" />
                                {errors.city && <p className="text-red-500 text-xs mt-2 ml-1 font-bold">{errors.city.message}</p>}
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Primary Occupation</label>
                                <input {...register('occupation')} className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-emerald-100 outline-none transition text-slate-900 font-bold placeholder:text-slate-300 shadow-inner" placeholder="E.g., Business Owner" />
                                {errors.occupation && <p className="text-red-500 text-xs mt-2 ml-1 font-bold">{errors.occupation.message}</p>}
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Income Range</label>
                                <select {...register('incomeRange')} className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-emerald-100 outline-none transition text-slate-900 font-bold appearance-none shadow-inner">
                                    <option value="">Select an option</option>
                                    <option value="< 5 Lakhs">Less than 5 Lakhs</option>
                                    <option value="5-10 Lakhs">5 - 10 Lakhs</option>
                                    <option value="10-25 Lakhs">10 - 25 Lakhs</option>
                                    <option value="25+ Lakhs">25+ Lakhs</option>
                                </select>
                                {errors.incomeRange && <p className="text-red-500 text-xs mt-2 ml-1 font-bold">{errors.incomeRange.message}</p>}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-4">
                            <div className="space-y-2">
                                <div className="flex items-center gap-3 mb-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Expected Total Chit Value</label>
                                    <span className="text-[9px] font-black bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full uppercase tracking-tighter">Scale Indicator</span>
                                </div>
                                <select {...register('expectedChitValueRange')} className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-emerald-100 outline-none transition text-slate-900 font-bold appearance-none shadow-inner">
                                    <option value="">Select Value Range</option>
                                    <option value="UP_TO_1_LAKH">Up to ₹1 Lakh</option>
                                    <option value="ONE_TO_FIVE_LAKH">₹1–5 Lakhs</option>
                                    <option value="FIVE_TO_TEN_LAKH">₹5–10 Lakhs</option>
                                    <option value="TEN_TO_TWENTY_FIVE_LAKH">₹10–25 Lakhs</option>
                                    <option value="ABOVE_TWENTY_FIVE_LAKH">Above ₹25 Lakhs</option>
                                </select>
                                {errors.expectedChitValueRange && <p className="text-red-500 text-xs mt-2 ml-1 font-bold">{errors.expectedChitValueRange.message}</p>}
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Expected Group Size</label>
                                <select {...register('expectedGroupSizeRange')} className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-emerald-100 outline-none transition text-slate-900 font-bold appearance-none shadow-inner">
                                    <option value="">Any Size (Select Range)</option>
                                    <option value="SMALL_5_TO_10">Small (5–10 Members)</option>
                                    <option value="MEDIUM_10_TO_20">Medium (10–20 Members)</option>
                                    <option value="LARGE_20_TO_50">Large (20–50 Members)</option>
                                    <option value="VERY_LARGE_50_PLUS">Very Large (50+ Members)</option>
                                </select>
                                {errors.expectedGroupSizeRange && <p className="text-red-500 text-xs mt-2 ml-1 font-bold">{errors.expectedGroupSizeRange.message}</p>}
                            </div>
                        </div>

                        <div className="space-y-2 pt-4">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Organizer Pitch & Vision</label>
                            <textarea {...register('organizerApplicationReason')} rows={5} className="w-full resize-none px-6 py-5 bg-slate-50 border-2 border-transparent rounded-[2.5rem] focus:bg-white focus:border-emerald-100 outline-none transition text-slate-900 font-bold placeholder:text-slate-300 shadow-inner" placeholder="Explain your experience with Chit funds and your intention to host transparent financial groups..." />
                            {errors.organizerApplicationReason && <p className="text-red-500 text-xs mt-2 ml-1 font-bold">{errors.organizerApplicationReason.message}</p>}
                        </div>

                        <div className="pt-10 border-t border-slate-100 flex justify-end">
                            <button type="submit" disabled={isSubmitting} className="h-16 px-12 bg-slate-900 text-white rounded-[1.5rem] font-black hover:bg-emerald-600 transition-all active:scale-95 shadow-2xl shadow-slate-200 flex items-center gap-3 uppercase tracking-widest text-xs">
                                {isSubmitting ? <><Loader2 className="w-5 h-5 animate-spin" /> Submitting Application...</> : <><Briefcase className="w-4 h-4" /> Finalize Application</>}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        );
    }

    if (status === 'PENDING') {
        return (
            <div className="h-full flex flex-col items-center justify-center p-12 bg-white/40 backdrop-blur-md rounded-[4rem] border border-white/40 shadow-2xl shadow-slate-200 text-center relative overflow-hidden animate-in zoom-in duration-700">
                <div className="absolute top-0 right-0 w-[40%] h-[40%] bg-amber-500/10 blur-[100px] rounded-full translate-x-1/2 -translate-y-1/2" />
                <div className="w-32 h-32 bg-amber-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 shadow-inner">
                    <Loader2 className="w-16 h-16 text-amber-500 animate-[spin_4s_linear_infinite]" />
                </div>
                <h2 className="text-4xl font-medium text-slate-900 mb-4 tracking-tight uppercase">Application Under Review</h2>
                <p className="text-slate-400 font-medium text-xl leading-relaxed max-w-sm mx-auto">
                    Global compliance is verifying your organizer credentials. We will notify you once you're ready to host.
                </p>
                <div className="mt-12 flex justify-center gap-3">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse delay-75" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse delay-150" />
                </div>
            </div>
        );
    }

    if (status === 'APPROVED') {
        return (
            <div className="h-full flex flex-col items-center justify-center p-16 bg-white/40 backdrop-blur-md rounded-[5rem] border border-white/40 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] text-center relative overflow-hidden animate-in zoom-in duration-1000">
                <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-emerald-500/10 blur-[120px] rounded-full translate-x-1/2 -translate-y-1/2" />
                <div className="w-32 h-32 bg-emerald-600 rounded-[3rem] flex items-center justify-center mx-auto mb-12 shadow-2xl shadow-emerald-200 transform -rotate-6">
                    <CheckCircle2 className="w-16 h-16 text-white" />
                </div>
                <h2 className="text-5xl font-medium text-slate-900 mb-6 tracking-tight uppercase">Status Verified!</h2>
                <p className="text-slate-400 font-medium text-2xl leading-relaxed max-w-md mx-auto mb-14">
                    Your financial circle is ready. Transition to your dashboard to build your first group.
                </p>
                <Link to="/dashboard" className="inline-flex items-center justify-center px-16 py-6 bg-slate-900 text-white font-black rounded-3xl shadow-2xl shadow-slate-300 hover:bg-emerald-600 transition-all hover:scale-105 active:scale-95 text-lg uppercase tracking-widest">
                    Build Groups <ArrowRight className="w-7 h-7 ml-4" />
                </Link>
            </div>
        );
    }

    return null;
};
