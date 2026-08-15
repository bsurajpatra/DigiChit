import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../api/axios';
import { 
    Wallet, Star, ArrowRight,
    Coins, Calendar, Users, ShieldCheck, RefreshCw
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Loader } from '../../components/ui/Loader';
import { useAuth } from '../../hooks/useAuth';
import { KYCChitGuard } from '../../components/ui/KYCChitGuard';
import { format } from 'date-fns';
import { formatCurrency } from '../../utils/currency';

export const UserChits = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [memberships, setMemberships] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMemberships = async () => {
            try {
                const res = await api.get('/chit-groups/my-memberships');
                const data = res.data.data.memberships || [];
                // Filter only approved / active joined memberships
                const active = data.filter((m: any) => 
                    m.chitGroupId && ['APPROVED', 'ACTIVE_MEMBER'].includes(m.status)
                );
                setMemberships(active);
            } catch (err) {
                console.error('Failed to fetch user memberships:', err);
            } finally {
                setLoading(false);
            }
        };

        if (user?.kycStatus === 'APPROVED') {
            fetchMemberships();
        } else {
            setLoading(false);
        }
    }, [user?.kycStatus]);

    if (user?.kycStatus !== 'APPROVED') {
        return <KYCChitGuard title="My Chits Portfolio Restricted" />;
    }

    if (loading) return <div className="h-full flex items-center justify-center p-20"><Loader size="lg" /></div>;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
                        <Wallet className="w-4 h-4" />
                        <span>Joined Portfolios</span>
                    </div>
                    <h1 className="text-xl font-black text-slate-900 tracking-tight">My Joined Circles</h1>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center gap-2 px-3.5 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-bold">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span>{memberships.length} Active {memberships.length === 1 ? 'Circle' : 'Circles'}</span>
                    </div>
                    <button
                        onClick={() => {
                            setLoading(true);
                            api.get('/chit-groups/my-memberships')
                                .then(res => {
                                    const data = res.data.data.memberships || [];
                                    setMemberships(data.filter((m: any) => m.chitGroupId && ['APPROVED', 'ACTIVE_MEMBER'].includes(m.status)));
                                })
                                .finally(() => setLoading(false));
                        }}
                        disabled={loading}
                        className="p-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition-all active:scale-95 cursor-pointer disabled:opacity-50 shadow-xs flex items-center justify-center"
                        title="Refresh Circles"
                    >
                        <RefreshCw className={`w-4 h-4 text-emerald-400 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Grid or Empty State */}
            {memberships.length === 0 ? (
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

                        <Link 
                            to="/join-chit"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 hover:bg-emerald-600 text-white rounded-xl font-bold text-xs transition cursor-pointer"
                        >
                            <span>Discover Chits</span>
                            <ArrowRight className="w-4 h-4 text-emerald-400" />
                        </Link>
                    </motion.div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {memberships.map((m) => {
                        const group = m.chitGroupId;
                        if (!group) return null;
                        const potValue = (group.monthlyContribution || 0) * (group.totalMembers || 0);
                        const curr = group.financialConfig?.currency;

                        return (
                            <motion.div 
                                key={m._id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white p-6 rounded-2xl border-none shadow-none space-y-4"
                            >
                                <div className="flex justify-between items-start">
                                    <div className="w-10 h-10 rounded-xl bg-slate-900 text-emerald-400 flex items-center justify-center font-bold shrink-0">
                                        <ShieldCheck className="w-5 h-5" />
                                    </div>
                                    <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border-none">
                                        {m.status === 'ACTIVE_MEMBER' ? 'ACTIVE MEMBER' : 'ENROLLED'}
                                    </span>
                                </div>

                                <div>
                                    <h3 className="text-lg font-black text-slate-900 tracking-tight">{group.name}</h3>
                                    <p className="text-xs font-medium text-slate-400 mt-0.5">Status: {group.status}</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4 pt-1">
                                    <div className="space-y-0.5">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase">Monthly</span>
                                        <div className="flex items-center gap-1 font-bold text-slate-900 text-sm">
                                            <Coins className="w-3.5 h-3.5 text-emerald-600" />
                                            <span>{formatCurrency(group.monthlyContribution || 0, curr)}</span>
                                        </div>
                                    </div>
                                    <div className="space-y-0.5">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase">Pot Value</span>
                                        <div className="flex items-center gap-1 font-bold text-emerald-600 text-sm">
                                            <span>{formatCurrency(potValue, curr)}</span>
                                        </div>
                                    </div>
                                    <div className="space-y-0.5">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase">Starts</span>
                                        <div className="flex items-center gap-1 font-bold text-slate-900 text-xs">
                                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                            <span>{group.startDate ? format(new Date(group.startDate), 'MMM dd, yyyy') : 'TBD'}</span>
                                        </div>
                                    </div>
                                    <div className="space-y-0.5">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase">Capacity</span>
                                        <div className="flex items-center gap-1 font-bold text-slate-900 text-xs">
                                            <Users className="w-3.5 h-3.5 text-slate-400" />
                                            <span>{group.currentMemberCount || 0} / {group.totalMembers || 0}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Financial Config Pill Badges */}
                                <div className="flex flex-wrap gap-1.5 pt-1 text-[10px] font-bold">
                                    <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md">
                                        Fee: {group.financialConfig?.commission?.value ?? group.commissionPercent ?? 2}%
                                    </span>
                                    <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md">
                                        Strategy: {group.financialConfig?.auctionStrategy || 'LOWEST_BID'}
                                    </span>
                                    <span className="px-2 py-0.5 bg-slate-900 text-white rounded-md">
                                        {group.financialConfig?.currency || 'INR'}
                                    </span>
                                </div>

                                <button 
                                    onClick={() => navigate(`/chit-details/${group._id}`)}
                                    className="w-full py-2.5 bg-slate-900 hover:bg-emerald-600 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer mt-2"
                                >
                                    <span>View Circle Details</span>
                                    <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
                                </button>
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
