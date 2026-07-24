import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { CheckCircle2, XCircle, MailWarning, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { Loader } from '../../components/ui/Loader';
import api from '../../api/axios';
import logo from '../../assets/logo.png';
import { useAuth } from '../../hooks/useAuth';

export const VerifyEmail = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { login } = useAuth();
    const token = searchParams.get('token');

    const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'invalid'>('loading');
    const [message, setMessage] = useState('');
    const hasRun = useRef(false);

    useEffect(() => {
        if (!token) {
            setStatus('invalid');
            return;
        }

        if (hasRun.current) return;
        hasRun.current = true;

        const verifyToken = async () => {
            try {
                const response = await api.get(`/auth/verify-email?token=${token}`);
                if (response.data.success) {
                    setStatus('success');
                    const { token: jwtToken, data: { user } } = response.data;
                    if (jwtToken && user) {
                        login(jwtToken, user);
                        setTimeout(() => {
                            if (user.role === 'ADMIN') {
                                navigate('/admin/dashboard');
                            } else if (user.kycStatus !== 'APPROVED') {
                                navigate('/kyc/status');
                            } else {
                                navigate('/dashboard');
                            }
                        }, 1500);
                    }
                }
            } catch (err: any) {
                setStatus('error');
                setMessage(err.response?.data?.message || 'Verification failed. The link may have expired.');
            }
        };

        verifyToken();
    }, [token, login, navigate]);

    const renderContent = () => {
        switch (status) {
            case 'loading':
                return (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="max-w-lg w-full text-center lg:text-left">
                        <div className="mb-6 flex justify-center lg:justify-start">
                            <Loader size="lg" />
                        </div>
                        <h3 className="text-4xl font-bold text-slate-900 mb-4">Verifying Email</h3>
                        <p className="text-base text-slate-600 mb-8 leading-relaxed">
                            Please wait a moment while we verify your secure link...
                        </p>
                    </motion.div>
                );
            case 'success':
                return (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="max-w-lg w-full text-center lg:text-left">
                        <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto lg:mx-0 mb-6">
                            <CheckCircle2 className="w-10 h-10" />
                        </div>
                        <h3 className="text-4xl font-bold text-slate-900 mb-4">Email Verified!</h3>
                        <p className="text-base text-slate-600 mb-8 leading-relaxed">
                            Your account is fully verified. Redirecting you to your dashboard...
                        </p>
                        <button 
                            onClick={() => navigate('/dashboard')}
                            className="w-full py-4 bg-slate-900 hover:bg-emerald-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition cursor-pointer text-base"
                        >
                            <span>Proceed to Dashboard</span>
                            <ArrowRight className="w-5 h-5 text-emerald-400" />
                        </button>
                    </motion.div>
                );
            case 'error':
                return (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="max-w-lg w-full text-center lg:text-left">
                        <div className="w-20 h-20 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto lg:mx-0 mb-6">
                            <XCircle className="w-10 h-10" />
                        </div>
                        <h3 className="text-4xl font-bold text-slate-900 mb-4">Verification Failed</h3>
                        <p className="text-base text-slate-600 mb-8 leading-relaxed">{message}</p>
                        <div className="space-y-4">
                            <button 
                                onClick={() => navigate('/resend-verification')}
                                className="w-full py-4.5 bg-white text-slate-900 border border-slate-200 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-slate-50 transition-all text-lg"
                            >
                                Resend Verification Link
                            </button>
                            <p className="text-center">
                                <button onClick={() => navigate('/login')} className="text-sm font-bold text-slate-500 hover:text-emerald-700">
                                    Back to Login
                                </button>
                            </p>
                        </div>
                    </motion.div>
                );
            case 'invalid':
                return (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="max-w-lg w-full text-center lg:text-left">
                        <div className="w-20 h-20 bg-yellow-50 text-yellow-600 rounded-full flex items-center justify-center mx-auto lg:mx-0 mb-6">
                            <MailWarning className="w-10 h-10" />
                        </div>
                        <h3 className="text-4xl font-bold text-slate-900 mb-4">Invalid Link</h3>
                        <p className="text-base text-slate-600 mb-8 leading-relaxed">No token was provided in the URL.</p>
                        <button 
                            onClick={() => navigate('/login')}
                            className="w-full py-4.5 bg-emerald-600 text-white rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-emerald-700 transition-all text-lg shadow-lg shadow-emerald-200"
                        >
                            Back to Login
                        </button>
                    </motion.div>
                );
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
                    <h2 className="text-4xl font-bold leading-tight mb-6">Securing Your <span className="text-emerald-600">Account</span>.</h2>
                    <p className="text-base text-slate-400">We verify every user to maintain a safe and transparent environment for everyone.</p>
                </div>
                <div className="relative z-10 text-[10px] text-slate-500 uppercase tracking-widest font-bold">© 2026 DigiChit Technologies</div>
            </div>

            <div className="flex items-center justify-center p-6 md:p-10 lg:p-12 bg-slate-50/50">
                {renderContent()}
            </div>
        </div>
    );
};
