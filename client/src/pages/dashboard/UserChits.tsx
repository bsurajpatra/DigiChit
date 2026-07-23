import { 
    Wallet, Star, ArrowRight,
    TrendingUp, ShieldCheck
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Loader } from '../../components/ui/Loader';
import { useAuth } from '../../hooks/useAuth';
import { KYCChitGuard } from '../../components/ui/KYCChitGuard';

export const UserChits = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => setLoading(false), 500);
        return () => clearTimeout(timer);
    }, []);

    if (user?.kycStatus !== 'APPROVED') {
        return <KYCChitGuard title="My Chits Portfolio Restricted" />;
    }

    if (loading) return <div className="h-full flex items-center justify-center p-20"><Loader size="lg" /></div>;

    return (
        <div className="h-full flex flex-col gap-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
                        <Wallet className="w-4 h-4" />
                        <span>Joined Portfolios</span>
                    </div>
                    <h1 className="text-xl font-black text-slate-900 tracking-tight">My Joined Circles</h1>
                </div>
                <div className="flex items-center gap-2 px-3.5 py-1.5 bg-slate-100 text-slate-800 rounded-full text-xs font-bold border-none shrink-0">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>Active Portfolios</span>
                </div>
            </div>

            {/* Main Container */}
            <div className="flex-1 flex flex-col items-center justify-center p-12 bg-white rounded-2xl border-none shadow-none relative overflow-hidden">
                <motion.div 
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="relative z-10 flex flex-col items-center text-center max-w-sm"
                >
                    <div className="w-16 h-16 bg-slate-900 text-emerald-400 rounded-xl flex items-center justify-center mb-6 shrink-0">
                        <Wallet className="w-8 h-8" />
                    </div>
                    
                    <h2 className="text-xl font-black text-slate-900 tracking-tight mb-2">No Active Circles Joined</h2>
                    <p className="text-xs font-medium text-slate-400 leading-relaxed mb-6">
                        You haven't joined any financial circles yet. Discover forming chits to start growing your collaborative wealth.
                    </p>

                    <div className="grid grid-cols-2 gap-4 w-full mb-8">
                        <div className="p-4 bg-slate-50 rounded-xl border-none">
                            <TrendingUp className="w-5 h-5 text-emerald-600 mb-1 mx-auto" />
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Growth</p>
                            <p className="text-xs font-bold text-slate-900">0% APY</p>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-xl border-none">
                            <ShieldCheck className="w-5 h-5 text-slate-900 mb-1 mx-auto" />
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Compliance</p>
                            <p className="text-xs font-bold text-slate-900">Verified</p>
                        </div>
                    </div>

                    <Link 
                        to="/join-chit"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 hover:bg-emerald-600 text-white rounded-xl font-bold text-xs transition cursor-pointer"
                    >
                        <span>Discover Chits</span>
                        <ArrowRight className="w-4 h-4 text-emerald-400" />
                    </Link>
                </motion.div>
            </div>
        </div>
    );
};
