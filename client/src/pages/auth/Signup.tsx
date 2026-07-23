import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, User, ArrowRight, Eye, EyeOff, Loader2, Plus, Minus } from 'lucide-react';
import logo from '../../assets/logo.png';
import api from '../../api/axios';

const signupSchema = z.object({
    fullName: z.string().min(2, 'Full name is required'),
    email: z.string().email('Invalid email address'),
    age: z.string()
        .regex(/^\d+$/, 'Age must be a number')
        .refine((val) => parseInt(val, 10) >= 21, 'You must be at least 21 years old'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"]
});

type SignupFormData = z.infer<typeof signupSchema>;

const LeftSidebar = ({ title, subtitle }: { title: React.ReactNode, subtitle: React.ReactNode }) => (
    <div className="hidden lg:flex flex-col justify-between p-12 bg-slate-900 text-white relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full">
            <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-emerald-600 blur-[120px] rounded-full" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-teal-500/10 blur-[100px] rounded-full" />
        </div>

        <Link to="/" className="flex items-center gap-2 relative z-10 group">
            <img src={logo} alt="DigiChit Logo" className="w-10 h-10 object-contain group-hover:scale-110 transition-transform" />
            <span className="text-xl font-bold tracking-tight">DigiChit</span>
        </Link>

        <div className="relative z-10 max-w-sm">
            <h2 className="text-4xl font-bold leading-tight mb-6">{title}</h2>
            <p className="text-base text-slate-400 leading-relaxed">{subtitle}</p>
        </div>

        <div className="relative z-10 flex gap-10 font-medium text-slate-500">
            <div>
                <p className="text-2xl font-bold text-white mb-1">99.9%</p>
                <p className="text-xs uppercase tracking-wider">Uptime</p>
            </div>
            <div>
                <p className="text-2xl font-bold text-white mb-1">Bank-Grade</p>
                <p className="text-xs uppercase tracking-wider">Security</p>
            </div>
        </div>
    </div>
);

export const Signup = () => {
    const navigate = useNavigate();
    const [apiError, setApiError] = useState('');
    const [errorCode, setErrorCode] = useState('');
    const [success, setSuccess] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const {
        register,
        handleSubmit,
        getValues,
        setValue,
        watch,
        formState: { errors, isSubmitting }
    } = useForm<SignupFormData>({
        resolver: zodResolver(signupSchema),
        defaultValues: {
            age: '21'
        }
    });

    const watchAge = watch('age', '21');

    const handleIncrementAge = () => {
        const current = parseInt(getValues('age') || '21', 10);
        const nextAge = isNaN(current) ? 21 : Math.max(21, current + 1);
        setValue('age', String(nextAge), { shouldValidate: true });
    };

    const handleDecrementAge = () => {
        const current = parseInt(getValues('age') || '21', 10);
        const nextAge = isNaN(current) ? 21 : Math.max(21, current - 1);
        setValue('age', String(nextAge), { shouldValidate: true });
    };

    const onSubmit = async (data: SignupFormData) => {
        try {
            setApiError('');
            setErrorCode('');
            await api.post('/auth/register', {
                name: data.fullName,
                email: data.email,
                password: data.password,
                age: parseInt(data.age, 10)
            });
            setSuccess(true);
        } catch (error: any) {
            const errCode = error.response?.data?.errorCode;
            setErrorCode(errCode || '');
            setApiError(error.response?.data?.message || 'Registration failed. Please try again.');
        }
    };

    const [countdown, setCountdown] = useState(5);

    useEffect(() => {
        if (success && countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        } else if (success && countdown === 0) {
            navigate('/login');
        }
    }, [success, countdown, navigate]);

    if (success) {
        return (
            <div className="h-screen overflow-hidden grid lg:grid-cols-2 bg-white font-sans">
                <LeftSidebar 
                    title={<>Welcome to <span className="text-emerald-600">DigiChit</span>.</>} 
                    subtitle="We are preparing your secure digital vault environment." 
                />
                <div className="flex items-center justify-center p-6 md:p-10 lg:p-12 bg-slate-50/50">
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="max-w-lg w-full text-center lg:text-left"
                    >
                        <div className="w-20 h-20 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto lg:mx-0 mb-8">
                            <Mail className="w-10 h-10" />
                        </div>
                        <h2 className="text-4xl font-bold text-slate-900 mb-4">Check Your Email</h2>
                        <p className="text-base text-slate-600 mb-8 leading-relaxed">
                            We've sent a verification link to <span className="font-bold text-slate-900">{getValues().email}</span>.
                            Please verify your account to continue.
                        </p>
                        <button
                            onClick={() => navigate('/login')}
                            className="w-full py-4.5 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 text-lg flex items-center justify-center gap-2"
                        >
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Redirecting to Login in {countdown}...
                        </button>
                    </motion.div>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen overflow-hidden grid lg:grid-cols-2 bg-white font-sans">
            <LeftSidebar 
                title={<>Join the <span className="text-emerald-600">Next Gen</span> of Financial Savings.</>} 
                subtitle="Secure, transparent, and completely digital. Experience the traditional chit fund redefined for the modern age." 
            />

            <div className="flex items-center justify-center p-6 md:p-10 lg:p-12 bg-slate-50/50 overflow-y-auto w-full">
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6 }}
                    className="max-w-lg w-full"
                >
                    <div className="mb-8">
                        <h3 className="text-4xl font-bold text-slate-900 mb-2">Create an Account</h3>
                        <p className="text-slate-600">Start your journey with DigiChit today.</p>
                    </div>

                    {apiError && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-4 mb-6 bg-rose-50 border border-rose-100 text-rose-700 rounded-xl text-xs font-bold space-y-2"
                        >
                            <p>{apiError}</p>
                            {errorCode === 'AUTH_EMAIL_EXISTS' && (
                                <Link to="/login" className="inline-block text-emerald-600 hover:underline font-extrabold">
                                    → Account already exists? Log in here
                                </Link>
                            )}
                        </motion.div>
                    )}

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 ml-1 uppercase tracking-wider">Full Name</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <User className="w-5 h-5 text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
                                </div>
                                <input
                                    type="text"
                                    placeholder="John Doe"
                                    className={`w-full pl-12 pr-4 py-4 bg-white border ${errors.fullName ? 'border-red-500 focus:ring-red-100' : 'border-slate-200 focus:ring-emerald-500 focus:border-emerald-500'} rounded-2xl focus:ring-4 outline-none transition-all placeholder:text-slate-300 text-base`}
                                    {...register('fullName')}
                                />
                            </div>
                            {errors.fullName && <p className="text-sm text-red-600 ml-1">{errors.fullName.message}</p>}
                        </div>

                        <div className="grid grid-cols-2 gap-5">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700 ml-1 uppercase tracking-wider">Age</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                                        <User className="w-5 h-5 text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
                                    </div>
                                    <input
                                        type="number"
                                        min="21"
                                        placeholder="21"
                                        className={`w-full pl-12 pr-20 py-4 bg-white border ${errors.age ? 'border-red-500 focus:ring-red-100' : 'border-slate-200 focus:ring-emerald-500 focus:border-emerald-500'} rounded-2xl focus:ring-4 outline-none transition-all placeholder:text-slate-300 text-base [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
                                        {...register('age')}
                                    />
                                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center gap-1 z-10">
                                        <button
                                            type="button"
                                            onClick={handleDecrementAge}
                                            disabled={!watchAge || isNaN(parseInt(watchAge, 10)) || parseInt(watchAge, 10) <= 21}
                                            aria-label="Decrement age"
                                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 disabled:opacity-40 disabled:hover:bg-slate-100 disabled:cursor-not-allowed transition-all active:scale-95"
                                        >
                                            <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleIncrementAge}
                                            aria-label="Increment age"
                                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all active:scale-95"
                                        >
                                            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                                        </button>
                                    </div>
                                </div>
                                {errors.age && <p className="text-sm text-red-600 ml-1">{errors.age.message}</p>}
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700 ml-1 uppercase tracking-wider">Email Address</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Mail className="w-5 h-5 text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
                                    </div>
                                    <input
                                        type="email"
                                        placeholder="john@example.com"
                                        className={`w-full pl-12 pr-4 py-4 bg-white border ${errors.email ? 'border-red-500 focus:ring-red-100' : 'border-slate-200 focus:ring-emerald-500 focus:border-emerald-500'} rounded-2xl focus:ring-4 outline-none transition-all placeholder:text-slate-300 text-base`}
                                        {...register('email')}
                                    />
                                </div>
                                {errors.email && <p className="text-sm text-red-600 ml-1">{errors.email.message}</p>}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-5">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700 ml-1 uppercase tracking-wider">Password</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Lock className="w-5 h-5 text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
                                    </div>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        className={`w-full pl-12 pr-10 py-4 bg-white border ${errors.password ? 'border-red-500 focus:ring-red-100' : 'border-slate-200 focus:ring-emerald-500 focus:border-emerald-500'} rounded-2xl focus:ring-4 outline-none transition-all placeholder:text-slate-300 text-base`}
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

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700 ml-1 uppercase tracking-wider">Confirm</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Lock className="w-5 h-5 text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
                                    </div>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        className={`w-full pl-12 pr-4 py-4 bg-white border ${errors.confirmPassword ? 'border-red-500 focus:ring-red-100' : 'border-slate-200 focus:ring-emerald-500 focus:border-emerald-500'} rounded-2xl focus:ring-4 outline-none transition-all placeholder:text-slate-300 text-base`}
                                        {...register('confirmPassword')}
                                    />
                                </div>
                                {errors.confirmPassword && <p className="text-sm text-red-600 ml-1">{errors.confirmPassword.message}</p>}
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-emerald-700 hover:shadow-xl hover:shadow-emerald-300 transition-all active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100 text-lg"
                        >
                            {isSubmitting ? (
                                <Loader2 className="w-6 h-6 animate-spin" />
                            ) : (
                                <>
                                    Create Account
                                    <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 text-center text-slate-600">
                        Already have an account? <Link to="/login" className="text-emerald-600 font-bold hover:underline">Login</Link>
                    </div>

                    <div className="mt-10 pt-8 border-t border-slate-200 text-center">
                        <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">
                            Secured by DigiChit Bank-Grade Encryption
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};
