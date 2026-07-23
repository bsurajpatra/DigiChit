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
                <div className="h-full flex flex-col items-center justify-center p-8 bg-white rounded-2xl border-none shadow-none text-center">
                    <div className="w-16 h-16 bg-slate-900 text-rose-400 rounded-xl flex items-center justify-center mb-4 shrink-0 font-bold">
                        <AlertTriangle className="w-8 h-8" />
                    </div>
                    <h2 className="text-xl font-black text-slate-900 mb-2">Not Eligible to Apply</h2>
                    <p className="text-xs font-medium text-slate-400 max-w-[320px] mb-6 leading-relaxed">
                        You must have an <span className="text-slate-900 font-bold">Active Account</span> and an <span className="text-slate-900 font-bold">Approved KYC</span> to apply for Organizer status.
                    </p>
                    <Link to="/profile" className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs transition cursor-pointer">
                        <span>Check Credentials</span>
                        <ArrowRight className="w-4 h-4 text-emerald-400" />
                    </Link>
                </div>
            );
        }

        return (
            <div className="h-full flex flex-col gap-4">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
                            <Briefcase className="w-4 h-4" />
                            <span>Organizer Application</span>
                        </div>
                        <h1 className="text-xl font-black text-slate-900 tracking-tight">Become an Organizer</h1>
                    </div>
                    <div className="flex items-center gap-2 px-3.5 py-1.5 bg-slate-100 text-slate-800 rounded-full text-xs font-bold border-none shrink-0">
                        <Briefcase className="w-3.5 h-3.5 text-slate-900" />
                        <span>Application</span>
                    </div>
                </div>

                <div className="flex-1 min-h-0 bg-white rounded-2xl border-none shadow-none overflow-y-auto custom-scrollbar flex flex-col">
                    {status === 'REJECTED' && (
                        <div className="mx-6 mt-6 p-4 bg-rose-50 text-rose-900 rounded-xl flex items-start gap-3 border-none">
                            <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                            <div>
                                <h3 className="font-bold uppercase text-xs">Feedback on previous application</h3>
                                <p className="text-xs mt-0.5 leading-relaxed">{rejectionReason}</p>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit(onSubmit)} className="p-6 md:p-8 space-y-6 flex-1">
                        {submitError && (
                            <div className="p-3.5 bg-rose-50 text-rose-800 rounded-xl text-xs font-bold flex items-center gap-2 border-none">
                                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                                <span>{submitError}</span>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-900">HQ City</label>
                                <div className="relative">
                                    <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input {...register('city')} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-none rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-slate-900 transition-all placeholder:text-slate-400 placeholder:font-normal" placeholder="E.g., Mumbai" />
                                </div>
                                {errors.city && <p className="text-rose-600 text-xs font-bold mt-1">{errors.city.message}</p>}
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-900">Profession</label>
                                <div className="relative">
                                    <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input {...register('occupation')} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-none rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-slate-900 transition-all placeholder:text-slate-400 placeholder:font-normal" placeholder="E.g., Business Owner" />
                                </div>
                                {errors.occupation && <p className="text-rose-600 text-xs font-bold mt-1">{errors.occupation.message}</p>}
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-900">Income Level</label>
                                <div className="relative">
                                    <IndianRupee className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <select {...register('incomeRange')} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-none rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-slate-900 transition-all appearance-none cursor-pointer">
                                        <option value="">Range</option>
                                        <option value="< 5 Lakhs">Less than 5 Lakhs</option>
                                        <option value="5-10 Lakhs">5 - 10 Lakhs</option>
                                        <option value="10-25 Lakhs">10 - 25 Lakhs</option>
                                        <option value="25+ Lakhs">25+ Lakhs</option>
                                    </select>
                                </div>
                                {errors.incomeRange && <p className="text-rose-600 text-xs font-bold mt-1">{errors.incomeRange.message}</p>}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-900">Anticipated Value Ratio</label>
                                <select {...register('expectedChitValueRange')} className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-slate-900 transition-all appearance-none cursor-pointer">
                                    <option value="">Select Value Scale</option>
                                    <option value="UP_TO_1_LAKH">Up to ₹1 Lakh</option>
                                    <option value="ONE_TO_FIVE_LAKH">₹1–5 Lakhs</option>
                                    <option value="FIVE_TO_TEN_LAKH">₹5–10 Lakhs</option>
                                    <option value="TEN_TO_TWENTY_FIVE_LAKH">₹10–25 Lakhs</option>
                                    <option value="ABOVE_TWENTY_FIVE_LAKH">Above ₹25 Lakhs</option>
                                </select>
                                {errors.expectedChitValueRange && <p className="text-rose-600 text-xs font-bold mt-1">{errors.expectedChitValueRange.message}</p>}
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-900">Target Group Volume</label>
                                <div className="relative">
                                    <Users className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <select {...register('expectedGroupSizeRange')} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-none rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-slate-900 transition-all appearance-none cursor-pointer">
                                        <option value="">Any Size</option>
                                        <option value="SMALL_5_TO_10">Small (5–10 Members)</option>
                                        <option value="MEDIUM_10_TO_20">Medium (10–20 Members)</option>
                                        <option value="LARGE_20_TO_50">Large (20–50 Members)</option>
                                        <option value="VERY_LARGE_50_PLUS">Very Large (50+ Members)</option>
                                    </select>
                                </div>
                                {errors.expectedGroupSizeRange && <p className="text-rose-600 text-xs font-bold mt-1">{errors.expectedGroupSizeRange.message}</p>}
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-900">Strategy & Implementation Pitch</label>
                            <textarea {...register('organizerApplicationReason')} rows={3} className="w-full resize-none px-4 py-3 bg-slate-50 border-none rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-slate-900 transition-all placeholder:text-slate-400 placeholder:font-normal" placeholder="Identify your experience and strategy for host transparency..." />
                            {errors.organizerApplicationReason && <p className="text-rose-600 text-xs font-bold mt-1">{errors.organizerApplicationReason.message}</p>}
                        </div>

                        <div className="pt-4 border-t border-slate-100 flex justify-end shrink-0">
                            <button type="submit" disabled={isSubmitting} className="h-11 px-8 bg-slate-900 hover:bg-emerald-600 text-white rounded-xl font-bold text-xs transition cursor-pointer flex items-center gap-2">
                                {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin text-emerald-400" /> <span>Verifying...</span></> : <><Briefcase className="w-4 h-4 text-emerald-400" /> <span>Submit Application</span></>}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        );
    }

    if (status === 'PENDING') {
        return (
            <div className="h-full flex flex-col items-center justify-center p-8 bg-white rounded-2xl border-none shadow-none text-center">
                <div className="w-16 h-16 bg-slate-900 text-amber-400 rounded-xl flex items-center justify-center mx-auto mb-6 shrink-0 font-bold">
                    <Loader2 className="w-8 h-8 animate-spin" />
                </div>
                <h2 className="text-xl font-black text-slate-900 mb-2">Review Status: Pending</h2>
                <p className="text-xs font-medium text-slate-400 max-w-[300px] mx-auto leading-relaxed">
                    Audit is verifying your infrastructure capacity. We will unlock your organizer dashboard shortly.
                </p>
            </div>
        );
    }

    if (status === 'APPROVED') {
        return (
            <div className="h-full flex flex-col items-center justify-center p-8 bg-white rounded-2xl border-none shadow-none text-center">
                <div className="w-16 h-16 bg-slate-900 text-emerald-400 rounded-xl flex items-center justify-center mx-auto mb-6 shrink-0 font-bold">
                    <CheckCircle2 className="w-8 h-8" />
                </div>
                <h2 className="text-xl font-black text-slate-900 mb-2">Credentials Verified</h2>
                <p className="text-xs font-medium text-slate-400 max-w-[300px] mx-auto leading-relaxed mb-6">
                    Infrastructure audit complete. Your organizer instruments are now active.
                </p>
                <Link to="/dashboard" className="inline-flex items-center justify-center px-8 py-3 bg-slate-900 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs transition cursor-pointer gap-2">
                    <span>Enter Dashboard</span>
                    <ArrowRight className="w-4 h-4 text-emerald-400" />
                </Link>
            </div>
        );
    }

    return null;
};
