import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, ArrowRight, ArrowLeft } from 'lucide-react';
import api from '../../api/axios';
import logo from '../../assets/logo.png';

const ForgotPassword = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');

        try {
            const response = await api.post('/auth/forgot-password', { email });
            setMessage(response.data.message || 'If an account with that email exists, we have sent a password reset link.');
            setIsSuccess(true);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="h-screen overflow-hidden grid lg:grid-cols-2 bg-white font-sans">
            <div className="hidden lg:flex flex-col justify-between p-12 bg-slate-900 text-white relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full">
                    <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-blue-600/20 blur-[120px] rounded-full" />
                </div>
                <Link to="/" className="flex items-center gap-2 relative z-10">
                    <img src={logo} alt="DigiChit Logo" className="w-10 h-10 object-contain" />
                    <span className="text-xl font-bold tracking-tight">DigiChit</span>
                </Link>
                <div className="relative z-10 max-w-sm">
                    <h2 className="text-4xl font-bold leading-tight mb-6">Lost Your <span className="text-blue-400">Key</span>?</h2>
                    <p className="text-base text-slate-400">Don't worry, we'll help you securely reset your password right now.</p>
                </div>
                <div className="relative z-10 text-[10px] text-slate-500 uppercase tracking-widest font-bold">© 2026 DigiChit Technologies</div>
            </div>

            <div className="flex items-center justify-center p-6 md:p-10 lg:p-12 bg-slate-50/50">
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="max-w-lg w-full">
                    <div className="mb-10 text-center lg:text-left">
                        <h2 className="text-4xl font-bold text-slate-900 mb-2">Reset Password</h2>
                        <p className="text-base text-slate-600">
                            Enter your email address and we'll send you a link.
                        </p>
                    </div>

                    {error && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-4 mb-6 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100">
                            {error}
                        </motion.div>
                    )}

                    {message && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className={`p-4 mb-6 rounded-xl text-sm font-medium border ${isSuccess ? 'bg-green-50 text-green-600 border-green-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                            {message}
                        </motion.div>
                    )}

                    {!isSuccess ? (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700 ml-1 uppercase tracking-wider">Email Address</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Mail className="w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                    </div>
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all text-base"
                                        placeholder="Enter your registered email"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4.5 bg-blue-600 text-white rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 text-lg disabled:opacity-70"
                            >
                                {loading ? 'Sending link...' : 'Send Reset Link'}
                                {!loading && <ArrowRight className="w-5 h-5" />}
                            </button>
                        </form>
                    ) : (
                        <button
                            onClick={() => navigate('/login')}
                            className="w-full py-4.5 bg-white text-slate-900 border border-slate-200 rounded-2xl font-bold flex items-center justify-center hover:bg-slate-50 transition-all text-lg"
                        >
                            Return to Login
                        </button>
                    )}

                    <div className="mt-10 text-center">
                        <Link to="/login" className="text-sm font-bold text-slate-500 hover:text-blue-600 flex items-center justify-center gap-2">
                            <ArrowLeft className="w-4 h-4" /> Back to Login
                        </Link>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default ForgotPassword;
