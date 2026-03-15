import React from 'react';
import { Mail } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import logo from '../../assets/logo.png';

export const VerifyEmailInfo = () => {
    const navigate = useNavigate();

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
                    <h2 className="text-4xl font-bold leading-tight mb-6">Almost <span className="text-blue-400">There</span>.</h2>
                    <p className="text-base text-slate-400">Just one more step to secure your account and start your financial journey.</p>
                </div>
                <div className="relative z-10 text-[10px] text-slate-500 uppercase tracking-widest font-bold">© 2026 DigiChit Technologies</div>
            </div>

            <div className="flex items-center justify-center p-6 md:p-10 lg:p-12 bg-slate-50/50">
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="max-w-lg w-full text-center lg:text-left">
                    <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto lg:mx-0 mb-6">
                        <Mail className="w-10 h-10" />
                    </div>
                    <h3 className="text-4xl font-bold text-slate-900 mb-4">Check your email</h3>
                    <p className="text-base text-slate-600 mb-8 leading-relaxed">
                        We've sent a verification link to your email address. 
                        Please click the link to verify your account. It expires in 15 minutes.
                    </p>
                    <div className="space-y-6">
                        <button 
                            onClick={() => navigate('/login')}
                            className="w-full py-4.5 bg-white text-slate-900 border border-slate-200 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-slate-50 transition-all text-lg"
                        >
                            Back to Login
                        </button>
                        <div className="text-center text-slate-600">
                            Didn't receive the email? <Link to="/resend-verification" className="text-blue-600 font-bold hover:underline">Resend it</Link>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};
