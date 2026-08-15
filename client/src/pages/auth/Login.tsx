import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowRight, Eye, EyeOff, Loader2 } from 'lucide-react';
import logo from '../../assets/logo.png';
import api from '../../api/axios';
import { useAuth } from '../../hooks/useAuth';

const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const Login = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [apiError, setApiError] = useState('');
    const [errorCode, setErrorCode] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors, isSubmitting }
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema)
    });

    const onSubmit = async (data: LoginFormData) => {
        try {
            setApiError('');
            setErrorCode('');
            const response = await api.post('/auth/login', { ...data, email: data.email.trim().toLowerCase() });

            const { token, data: { user } } = response.data;
            login(token, user);

            if (user.role === 'ADMIN') {
                navigate('/admin/dashboard');
            } else if (user.kycStatus !== 'APPROVED') {
                navigate('/kyc/status');
            } else {
                navigate('/dashboard');
            }
        } catch (error: any) {
            const errCode = error.response?.data?.errorCode;
            const msg = error.response?.data?.message || 'Login failed. Please check your details.';
            setErrorCode(errCode || '');
            setApiError(msg);
        }
    };

    const [resending, setResending] = useState(false);
    const [resendSent, setResendSent] = useState(false);

    const handleResendVerification = async () => {
        const email = watch('email');
        if (!email) {
            alert('Please enter your email address above.');
            return;
        }
        setResending(true);
        try {
            await api.post('/auth/resend-verification', { email });
            setResendSent(true);
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to resend verification link');
        } finally {
            setResending(false);
        }
    };

    return (
        <div className="h-screen overflow-hidden grid lg:grid-cols-2 bg-white font-sans">
            <div className="hidden lg:flex flex-col justify-between p-12 bg-slate-900 text-white relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full">
                    <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-emerald-600 blur-[120px] rounded-full" />
                </div>
                <Link to="/" className="flex items-center gap-2 relative z-10">
                    <img src={logo} alt="DigiChit Logo" className="w-10 h-10 object-contain" />
                    <span className="text-xl font-bold tracking-tight">DigiChit</span>
                </Link>
                <div className="relative z-10 max-w-sm">
                    <h2 className="text-4xl font-bold leading-tight mb-6">Welcome Back to the <span className="text-emerald-600">Future</span>.</h2>
                    <p className="text-base text-slate-400">Access your digital chit fund dashboard and participate in live auctions securely.</p>
                </div>
                <div className="relative z-10 text-[10px] text-slate-500 uppercase tracking-widest font-bold">© 2026 DigiChit Technologies</div>
            </div>
            <div className="flex items-center justify-center p-6 md:p-10 lg:p-12 bg-slate-50/50">
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="max-w-lg w-full">
                    <div className="mb-10 text-center lg:text-left">
                        <h3 className="text-4xl font-bold text-slate-900 mb-2">Login to DigiChit</h3>
                        <p className="text-base text-slate-600">Enter your credentials to access your account.</p>
                    </div>

                    {apiError && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-4 mb-6 bg-rose-50 border border-rose-100 text-rose-700 rounded-xl text-xs font-bold space-y-2"
                        >
                            <p>{apiError}</p>
                            {errorCode === 'AUTH_EMAIL_NOT_FOUND' && (
                                <Link to="/signup" className="inline-block text-emerald-600 hover:underline font-extrabold">
                                    → No account found? Register now
                                </Link>
                            )}
                            {errorCode === 'AUTH_INCORRECT_PASSWORD' && (
                                <Link to="/forgot-password" className="inline-block text-emerald-600 hover:underline font-extrabold">
                                    → Forgot your password? Reset password
                                </Link>
                            )}
                            {errorCode === 'AUTH_EMAIL_UNVERIFIED' && (
                                <div className="pt-2 border-t border-rose-200 space-y-2">
                                    <button
                                        type="button"
                                        onClick={handleResendVerification}
                                        disabled={resending}
                                        className="w-full py-2 bg-slate-900 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-2"
                                    >
                                        {resending ? <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" /> : <Mail className="w-3.5 h-3.5 text-emerald-400" />}
                                        <span>Resend Verification Email</span>
                                    </button>
                                    {resendSent && <p className="text-[11px] font-bold text-emerald-700 text-center">✓ Verification email sent! Check your inbox.</p>}
                                </div>
                            )}
                        </motion.div>
                    )}

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 ml-1 uppercase tracking-wider">Email Address</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Mail className="w-5 h-5 text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
                                </div>
                                <input
                                    type="email"
                                    placeholder="john@example.com"
                                    className={`w-full pl-12 pr-4 py-4 bg-white border ${errors.email ? 'border-red-500 focus:ring-red-100' : 'border-slate-200 focus:ring-emerald-500 focus:border-emerald-500'} rounded-2xl focus:ring-4 outline-none transition-all text-base`}
                                    {...register('email')}
                                />
                            </div>
                            {errors.email && <p className="text-sm text-red-600 ml-1">{errors.email.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 ml-1 flex justify-between uppercase tracking-wider">
                                <span>Password</span>
                                <Link to="/forgot-password" className="text-emerald-600 font-bold hover:underline normal-case">Forgot?</Link>
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Lock className="w-5 h-5 text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
                                </div>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    className={`w-full pl-12 pr-12 py-4 bg-white border ${errors.password ? 'border-red-500 focus:ring-red-100' : 'border-slate-200 focus:ring-emerald-500 focus:border-emerald-500'} rounded-2xl focus:ring-4 outline-none transition-all text-base`}
                                    {...register('password')}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                            {errors.password && <p className="text-sm text-red-600 ml-1">{errors.password.message}</p>}
                        </div>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full py-4.5 bg-emerald-600 text-white rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 text-lg disabled:opacity-70"
                        >
                            {isSubmitting ? (
                                <Loader2 className="w-6 h-6 animate-spin" />
                            ) : (
                                <>
                                    Sign In
                                    <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </button>
                    </form>
                    <div className="mt-10 text-center text-slate-600">
                        Don't have an account? <Link to="/signup" className="text-emerald-600 font-bold hover:underline">Create Account</Link>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};
