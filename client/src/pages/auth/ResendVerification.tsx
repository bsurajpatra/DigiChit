import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { Mail, CheckCircle2, Loader2, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../../api/axios';
import logo from '../../assets/logo.png';

const resendSchema = z.object({
    email: z.string().email('Invalid email address'),
});

type ResendFormData = z.infer<typeof resendSchema>;

const LeftSidebar = ({ title, subtitle }: { title: React.ReactNode, subtitle: React.ReactNode }) => (
    <div className="hidden lg:flex flex-col justify-between p-12 bg-slate-900 text-white relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full">
            <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-blue-600/20 blur-[120px] rounded-full" />
        </div>
        <Link to="/" className="flex items-center gap-2 relative z-10">
            <img src={logo} alt="DigiChit Logo" className="w-10 h-10 object-contain" />
            <span className="text-xl font-bold tracking-tight">DigiChit</span>
        </Link>
        <div className="relative z-10 max-w-sm">
            <h2 className="text-4xl font-bold leading-tight mb-6">{title}</h2>
            <p className="text-base text-slate-400">{subtitle}</p>
        </div>
        <div className="relative z-10 text-[10px] text-slate-500 uppercase tracking-widest font-bold">© 2026 DigiChit Technologies</div>
    </div>
);

export const ResendVerification = () => {
    const [apiError, setApiError] = useState('');
    const [success, setSuccess] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting }
    } = useForm<ResendFormData>({
        resolver: zodResolver(resendSchema)
    });

    const onSubmit = async (data: ResendFormData) => {
        try {
            setApiError('');
            setSuccess(false);
            await api.post('/auth/resend-verification', data);
            setSuccess(true);
        } catch (error: any) {
            setApiError(error.response?.data?.message || 'Failed to resend verification email.');
        }
    };

    if (success) {
        return (
            <div className="h-screen overflow-hidden grid lg:grid-cols-2 bg-white font-sans">
                <LeftSidebar title={<>Help is <span className="text-blue-400">On The Way</span>.</>} subtitle="Check your email inbox for the new verification link." />
                <div className="flex items-center justify-center p-6 md:p-10 lg:p-12 bg-slate-50/50">
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="max-w-lg w-full text-center lg:text-left">
                        <div className="w-20 h-20 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto lg:mx-0 mb-6">
                            <CheckCircle2 className="w-10 h-10" />
                        </div>
                        <h3 className="text-4xl font-bold text-slate-900 mb-4">Email Sent!</h3>
                        <p className="text-base text-slate-600 mb-8 leading-relaxed">
                            If an account exists with that email, we've sent a new verification link.
                        </p>
                        <Link to="/login" className="block w-full py-4.5 bg-blue-600 text-white rounded-2xl font-bold text-center hover:bg-blue-700 transition-all text-lg shadow-lg shadow-blue-100">
                            Back to Login
                        </Link>
                    </motion.div>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen overflow-hidden grid lg:grid-cols-2 bg-white font-sans">
            <LeftSidebar title={<>Need a <span className="text-blue-400">New Link</span>?</>} subtitle="If your verification link expired, request a new one here." />
            <div className="flex items-center justify-center p-6 md:p-10 lg:p-12 bg-slate-50/50">
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="max-w-lg w-full">
                    <div className="mb-10 text-center lg:text-left">
                        <h3 className="text-4xl font-bold text-slate-900 mb-2">Resend Verification</h3>
                        <p className="text-base text-slate-600">Enter your email to get a new link.</p>
                    </div>

                    {apiError && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-4 mb-6 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm font-medium"
                        >
                            {apiError}
                        </motion.div>
                    )}

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 ml-1 uppercase tracking-wider">Email Address</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Mail className="w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                </div>
                                <input
                                    type="email"
                                    placeholder="john@example.com"
                                    className={`w-full pl-12 pr-4 py-4 bg-white border ${errors.email ? 'border-red-500 focus:ring-red-100' : 'border-slate-200 focus:ring-blue-100 focus:border-blue-500'} rounded-2xl focus:ring-4 outline-none transition-all text-base`}
                                    {...register('email')}
                                />
                            </div>
                            {errors.email && <p className="text-sm text-red-600 ml-1">{errors.email.message}</p>}
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full py-4.5 bg-blue-600 text-white rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 text-lg disabled:opacity-70"
                        >
                            {isSubmitting ? (
                                <Loader2 className="w-6 h-6 animate-spin" />
                            ) : (
                                <>
                                    Send Email
                                    <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-10 text-center text-slate-600">
                        <Link to="/login" className="text-sm font-bold text-slate-500 hover:text-blue-600">
                            Back to Login
                        </Link>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};
