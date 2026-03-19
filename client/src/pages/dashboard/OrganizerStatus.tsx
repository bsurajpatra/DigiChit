import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import api from '../../api/axios';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader } from '../../components/ui/Loader';
import { CheckCircle2, AlertTriangle, ArrowRight, Loader2 } from 'lucide-react';
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
                <div className="max-w-2xl mx-auto mt-10 p-8 bg-white rounded-3xl shadow-sm border border-slate-100 text-center">
                    <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertTriangle className="w-8 h-8" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Not Eligible</h2>
                    <p className="text-slate-600 mb-6 font-medium">
                        You must have an fully Active account and an Approved KYC to apply for Organizer status.
                    </p>
                    <Link to="/profile" className="inline-flex items-center gap-2 text-emerald-600 font-bold hover:text-emerald-700">
                        Check Profile Status <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            );
        }

        return (
            <div className="max-w-3xl mx-auto py-8">
                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="px-8 py-6 bg-slate-50 border-b border-slate-100 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Become an Organizer</h1>
                            <p className="text-slate-500 mt-1">Start hosting and managing your own Chit groups.</p>
                        </div>
                    </div>

                    {status === 'REJECTED' && (
                        <div className="m-8 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-xl">
                            <h3 className="text-red-800 font-bold">Previous Application Rejected</h3>
                            <p className="text-red-600 mt-1 text-sm">{rejectionReason}</p>
                            <p className="text-red-600 mt-2 text-xs font-semibold uppercase tracking-wider">You may reapply below.</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-6">
                        {submitError && (
                            <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm font-medium flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 shrink-0" /> {submitError}
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">City of Operation</label>
                                <input {...register('city')} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition text-slate-900 font-medium" placeholder="E.g., Mumbai" />
                                {errors.city && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.city.message}</p>}
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Primary Occupation</label>
                                <input {...register('occupation')} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition text-slate-900 font-medium" placeholder="E.g., Business Owner" />
                                {errors.occupation && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.occupation.message}</p>}
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Income Range</label>
                                <select {...register('incomeRange')} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition text-slate-900 font-medium appearance-none">
                                    <option value="">Select an option</option>
                                    <option value="< 5 Lakhs">Less than 5 Lakhs</option>
                                    <option value="5-10 Lakhs">5 - 10 Lakhs</option>
                                    <option value="10-25 Lakhs">10 - 25 Lakhs</option>
                                    <option value="25+ Lakhs">25+ Lakhs</option>
                                </select>
                                {errors.incomeRange && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.incomeRange.message}</p>}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-2 border-b border-slate-50">
                            <div className="space-y-1 md:col-span-2">
                                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-3 py-1.5 rounded-lg inline-block">Risk Indicator</p>
                                <p className="text-[11px] text-slate-400 font-medium">This helps us understand the scale of chit groups you plan to organize. <strong>Exact financial structures</strong> will be configured during group creation.</p>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Expected Total Chit Value</label>
                                <select {...register('expectedChitValueRange')} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition text-slate-900 font-medium appearance-none">
                                    <option value="">Select Value Range</option>
                                    <option value="UP_TO_1_LAKH">Up to ₹1 Lakh</option>
                                    <option value="ONE_TO_FIVE_LAKH">₹1–5 Lakhs</option>
                                    <option value="FIVE_TO_TEN_LAKH">₹5–10 Lakhs</option>
                                    <option value="TEN_TO_TWENTY_FIVE_LAKH">₹10–25 Lakhs</option>
                                    <option value="ABOVE_TWENTY_FIVE_LAKH">Above ₹25 Lakhs</option>
                                </select>
                                {errors.expectedChitValueRange && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.expectedChitValueRange.message}</p>}
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Expected Group Size</label>
                                <select {...register('expectedGroupSizeRange')} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition text-slate-900 font-medium appearance-none">
                                    <option value="">Any Size (Select Range)</option>
                                    <option value="SMALL_5_TO_10">Small (5–10 Members)</option>
                                    <option value="MEDIUM_10_TO_20">Medium (10–20 Members)</option>
                                    <option value="LARGE_20_TO_50">Large (20–50 Members)</option>
                                    <option value="VERY_LARGE_50_PLUS">Very Large (50+ Members)</option>
                                </select>
                                {errors.expectedGroupSizeRange && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.expectedGroupSizeRange.message}</p>}
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Why do you want to be an organizer?</label>
                            <textarea {...register('organizerApplicationReason')} rows={4} className="w-full resize-none px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition text-slate-900 font-medium" placeholder="Explain your experience with Chit funds and your intention..." />
                            {errors.organizerApplicationReason && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.organizerApplicationReason.message}</p>}
                        </div>

                        <div className="pt-4 border-t border-slate-100 flex justify-end">
                            <button type="submit" disabled={isSubmitting} className="px-8 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition active:scale-95 shadow-md shadow-emerald-200 flex items-center gap-2">
                                {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</> : 'Submit Application'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        );
    }

    if (status === 'PENDING') {
        return (
            <div className="max-w-2xl mx-auto mt-10 p-10 bg-white rounded-3xl shadow-sm border border-amber-100 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-amber-400" />
                <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
                </div>
                <h2 className="text-3xl font-extrabold text-slate-900 mb-3 tracking-tight">Application Under Review</h2>
                <p className="text-slate-500 font-medium text-lg leading-relaxed">
                    Our compliance team is currently reviewing your organizer application. We will notify you once a decision has been made.
                </p>
            </div>
        );
    }

    if (status === 'APPROVED') {
        return (
            <div className="max-w-2xl mx-auto mt-10 p-10 bg-white rounded-3xl shadow-sm border border-green-100 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-green-500" />
                <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="w-10 h-10 text-green-500" />
                </div>
                <h2 className="text-3xl font-extrabold text-slate-900 mb-3 tracking-tight">Application Approved!</h2>
                <p className="text-slate-500 font-medium text-lg leading-relaxed">
                    Congratulations! You are officially an approved Organizer for DigiChit. You can now start creating and managing your own Chit groups.
                </p>
                <div className="mt-8">
                    <Link to="/dashboard" className="px-8 py-3 bg-green-600 text-white font-bold rounded-xl shadow-lg shadow-green-200 hover:bg-green-700 transition">Go to Dashboard</Link>
                </div>
            </div>
        );
    }

    return null;
};
