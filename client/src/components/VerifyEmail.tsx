import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, Loader2, ArrowRight } from 'lucide-react';
import logo from '../assets/logo.png';
import api from '../api/axios';

const VerifyEmail = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');

    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('');

    useEffect(() => {
        const verifyToken = async () => {
            if (!token) {
                setStatus('error');
                setMessage('No verification token found. Please check your email link.');
                return;
            }

            try {
                const response = await api.get(`/auth/verify-email?token=${token}`);
                if (response.data.success) {
                    setStatus('success');
                    setMessage('Your email has been successfully verified! You can now login to your account.');
                }
            } catch (err: any) {
                setStatus('error');
                setMessage(err.response?.data?.message || 'Verification failed. The link may have expired or is invalid.');
            }
        };

        verifyToken();
    }, [token]);

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-slate-900">
            <Link to="/" className="flex items-center gap-2 mb-12">
                <img src={logo} alt="DigiChit Logo" className="w-10 h-10 object-contain" />
                <span className="text-xl font-bold tracking-tight">DigiChit</span>
            </Link>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-md w-full bg-white rounded-[2.5rem] p-10 md:p-12 shadow-xl border border-slate-100 text-center"
            >
                {status === 'loading' && (
                    <div className="flex flex-col items-center">
                        <Loader2 className="w-16 h-16 text-blue-600 animate-spin mb-6" />
                        <h2 className="text-2xl font-bold mb-2">Verifying Your Email</h2>
                        <p className="text-slate-500">Please wait while we secure your account...</p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="flex flex-col items-center">
                        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-3xl flex items-center justify-center mb-8">
                            <CheckCircle2 className="w-10 h-10" />
                        </div>
                        <h2 className="text-3xl font-bold mb-4">Email Verified!</h2>
                        <p className="text-slate-600 mb-10 leading-relaxed">
                            {message}
                        </p>
                        <button
                            onClick={() => navigate('/login')}
                            className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
                        >
                            Login to Your Account
                            <ArrowRight className="w-5 h-5" />
                        </button>
                    </div>
                )}

                {status === 'error' && (
                    <div className="flex flex-col items-center">
                        <div className="w-20 h-20 bg-red-100 text-red-600 rounded-3xl flex items-center justify-center mb-8">
                            <XCircle className="w-10 h-10" />
                        </div>
                        <h2 className="text-3xl font-bold mb-4">Verification Failed</h2>
                        <p className="text-slate-600 mb-10 leading-relaxed">
                            {message}
                        </p>
                        <div className="space-y-4 w-full">
                            <button
                                onClick={() => navigate('/signup')}
                                className="w-full py-4 bg-white border border-slate-200 text-slate-700 rounded-2xl font-bold hover:bg-slate-50 transition-all"
                            >
                                Back to Signup
                            </button>
                            <Link to="/" className="block text-sm font-bold text-blue-600 hover:underline">
                                Need help? Contact support
                            </Link>
                        </div>
                    </div>
                )}
            </motion.div>
        </div>
    );
};

export default VerifyEmail;
