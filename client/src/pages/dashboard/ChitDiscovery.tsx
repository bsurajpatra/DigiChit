import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { 
    Search, Users, Calendar, Coins, 
    Loader2, Inbox, Wallet, CheckCircle2
} from 'lucide-react';
import { Loader } from '../../components/ui/Loader';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { useAuth } from '../../hooks/useAuth';
import { KYCChitGuard } from '../../components/ui/KYCChitGuard';

interface Group {
    _id: string;
    name: string;
    totalMembers: number;
    currentMemberCount: number;
    monthlyContribution: number;
    startDate: string;
    auctionType: string;
    status: string;
    organizerId: {
        name: string;
        email: string;
    };
}

export const ChitDiscovery = () => {
    const { user } = useAuth();
    const [groups, setGroups] = useState<Group[]>([]);
    const [loading, setLoading] = useState(true);
    const [requestingId, setRequestingId] = useState<string | null>(null);
    const [successId, setSuccessId] = useState<string | null>(null);

    const fetchGroups = async () => {
        try {
            const res = await api.get('/chit-groups');
            setGroups(res.data.data.groups);
        } catch (err) {
            console.error('Failed to fetch groups');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user?.kycStatus === 'APPROVED') {
            fetchGroups();
        } else {
            setLoading(false);
        }
    }, [user?.kycStatus]);

    const handleJoinRequest = async (groupId: string) => {
        setRequestingId(groupId);
        try {
            await api.post(`/chit-groups/${groupId}/request-join`);
            setSuccessId(groupId);
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to send request');
        } finally {
            setRequestingId(null);
        }
    };

    if (user?.kycStatus !== 'APPROVED') {
        return <KYCChitGuard title="Chit Group Discovery Restricted" />;
    }

    if (loading) return <div className="h-full flex items-center justify-center p-20"><Loader size="lg" /></div>;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-700">
            {/* Compact Header */}
            <div className="flex items-center justify-between bg-white/50 backdrop-blur-md px-6 py-4 rounded-3xl border border-white/40 shadow-lg shadow-slate-100/50">
                <div>
                    <h1 className="text-xl font-bold text-slate-900 tracking-tight uppercase leading-tight">Discover Chits</h1>
                    <p className="text-[9px] font-bold text-slate-400 mt-0.5 uppercase tracking-widest leading-none">Browse and join active financial circles</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                        <input 
                            placeholder="Search circles..."
                            className="pl-10 pr-4 py-2 bg-white/80 border border-slate-100 rounded-xl text-[9px] font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 transition-all w-48"
                        />
                    </div>
                </div>
            </div>

            {/* Grid display */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {groups.length === 0 ? (
                    <div className="col-span-full py-20 flex flex-col items-center text-center space-y-4 bg-white/40 border border-dashed border-slate-200 rounded-[3rem]">
                        <Inbox className="w-12 h-12 text-slate-200" />
                        <div>
                            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">No Active Circles</h3>
                            <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest mt-1">Check back later for new formations.</p>
                        </div>
                    </div>
                ) : (
                    groups.map((group) => (
                        <motion.div 
                            key={group._id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white/60 backdrop-blur-sm border border-white/60 p-6 rounded-3xl shadow-xl shadow-slate-100/50 group hover:shadow-2xl hover:shadow-emerald-500/5 transition-all relative overflow-hidden"
                        >
                            <div className="mb-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="bg-slate-900 p-2.5 rounded-2xl border border-slate-800 shadow-lg">
                                        <Wallet className="w-5 h-5 text-emerald-400" />
                                    </div>
                                    <div className="bg-white px-3 py-1 border border-slate-50 rounded-full flex items-center gap-2 shadow-sm">
                                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{group.auctionType}</span>
                                    </div>
                                </div>
                                <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase group-hover:text-emerald-600 transition-colors mb-1">{group.name}</h3>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Organizer: {group.organizerId.name}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-8">
                                <div className="space-y-1">
                                    <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest block">Monthly</span>
                                    <div className="flex items-center gap-1.5 font-black text-slate-900 text-sm tracking-tight">
                                        <Coins className="w-3.5 h-3.5 text-emerald-500" />
                                        ₹{group.monthlyContribution.toLocaleString()}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest block">Pot Value</span>
                                    <div className="flex items-center gap-1.5 font-black text-emerald-600 text-sm tracking-tight">
                                        ₹{(group.monthlyContribution * group.totalMembers).toLocaleString()}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest block">Starts</span>
                                    <div className="flex items-center gap-1.5 font-black text-slate-900 text-xs tracking-tight">
                                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                        {format(new Date(group.startDate), 'MMM dd, yyyy')}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest block">Capacity</span>
                                    <div className="flex items-center gap-1.5 font-black text-slate-900 text-xs tracking-tight">
                                        <Users className="w-3.5 h-3.5 text-slate-400" />
                                        {group.currentMemberCount} / {group.totalMembers}
                                    </div>
                                </div>
                            </div>

                            {/* Progress bar */}
                            <div className="mb-6 space-y-2">
                                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(group.currentMemberCount / group.totalMembers) * 100}%` }}
                                        className="h-full bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                                    />
                                </div>
                                <div className="flex justify-between text-[8px] font-black uppercase tracking-widest text-slate-400">
                                    <span>Formation Progress</span>
                                    <span>{Math.round((group.currentMemberCount / group.totalMembers) * 100)}%</span>
                                </div>
                            </div>

                            <div className="pt-2">
                                {successId === group._id ? (
                                    <button disabled className="w-full px-4 py-4 bg-emerald-500 text-white rounded-2xl text-[9px] font-black uppercase tracking-[0.1em] flex items-center justify-center gap-2 shadow-lg shadow-emerald-100">
                                        <CheckCircle2 className="w-4 h-4" />
                                        Sent Request
                                    </button>
                                ) : (
                                    <button 
                                        onClick={() => handleJoinRequest(group._id)}
                                        disabled={requestingId === group._id}
                                        className="w-full px-4 py-4 bg-slate-900 text-white rounded-2xl hover:bg-emerald-600 transition-all shadow-xl shadow-slate-200 text-[10px] font-black uppercase tracking-[0.1em] flex items-center justify-center gap-2 group-hover:scale-[1.02] active:scale-95"
                                    >
                                        {requestingId === group._id ? (
                                            <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                                        ) : (
                                            <>
                                                Request to Join
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    );
};
