import { 
    Wallet, Star, ArrowRight,
    TrendingUp, ShieldCheck
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Loader } from '../../components/ui/Loader';

export const UserChits = () => {
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Mock loading for unified experience
        const timer = setTimeout(() => setLoading(false), 800);
        return () => clearTimeout(timer);
    }, []);

    if (loading) return <div className="h-full flex items-center justify-center p-20"><Loader size="lg" /></div>;

    return (
        <div className="h-full flex flex-col gap-6 animate-in fade-in duration-700">
            {/* Compact Header */}
            <div className="flex items-center justify-between bg-white/50 backdrop-blur-md px-6 py-4 rounded-3xl border border-white/40 shadow-lg shadow-slate-100/50">
                <div>
                    <h1 className="text-xl font-bold text-slate-900 tracking-tight uppercase leading-tight">My Chits</h1>
                    <p className="text-[9px] font-bold text-slate-400 mt-0.5 uppercase tracking-widest leading-none">Track your active contributions and upcoming payouts</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100/50 shadow-sm">
                    <Star className="w-3.5 h-3.5 fill-emerald-500" />
                    <span className="font-black text-[9px] uppercase tracking-[0.2em]">Active Portfolios</span>
                </div>
            </div>

            {/* Placeholder Container */}
            <div className="flex-1 flex flex-col items-center justify-center p-12 bg-white/60 backdrop-blur-sm border border-white/60 rounded-3xl shadow-xl shadow-slate-100/50 relative overflow-hidden">
                {/* Decorative background blurs */}
                <div className="absolute top-0 left-0 w-64 h-64 bg-emerald-500/5 blur-[100px] rounded-full -ml-20 -mt-20" />
                <div className="absolute bottom-0 right-0 w-64 h-64 bg-blue-500/5 blur-[100px] rounded-full -mr-20 -mb-20" />

                <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="relative z-10 flex flex-col items-center text-center max-w-sm"
                >
                    <div className="w-24 h-24 bg-white/80 border border-slate-100 rounded-[2.5rem] flex items-center justify-center mb-8 shadow-xl shadow-slate-200/50 group">
                        <Wallet className="w-10 h-10 text-slate-200 group-hover:text-emerald-500 transition-colors duration-500" />
                    </div>
                    
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase mb-4">No Active Circles</h2>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-relaxed mb-10">
                        You haven't joined any financial circles yet. Discover forming chits to start growing your collaborative wealth.
                    </p>

                    <div className="grid grid-cols-2 gap-4 w-full mb-10">
                        <div className="p-4 bg-slate-50/50 border border-slate-100/50 rounded-2xl">
                            <TrendingUp className="w-5 h-5 text-emerald-500 mb-2 mx-auto" />
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Growth</p>
                            <p className="text-xs font-black text-slate-900">0% APY</p>
                        </div>
                        <div className="p-4 bg-slate-50/50 border border-slate-100/50 rounded-2xl">
                            <ShieldCheck className="w-5 h-5 text-blue-500 mb-2 mx-auto" />
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Compliance</p>
                            <p className="text-xs font-black text-slate-900">Verified</p>
                        </div>
                    </div>

                    <button className="flex items-center gap-3 px-8 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-emerald-600 transition-all shadow-2xl shadow-slate-300 group">
                        Discover Chits
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                </motion.div>
            </div>
        </div>
    );
};
