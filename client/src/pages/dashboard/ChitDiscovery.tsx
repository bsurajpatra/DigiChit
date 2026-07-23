import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { 
    Search, Users, Calendar, Coins, 
    Loader2, Inbox, Wallet, CheckCircle2, Compass
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
    commissionPercent?: number;
    financialConfig?: any;
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
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
                        <Compass className="w-4 h-4" />
                        <span>Circle Discovery</span>
                    </div>
                    <h1 className="text-xl font-black text-slate-900 tracking-tight">Discover Chits</h1>
                </div>
                <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                        placeholder="Search circles..."
                        className="pl-10 pr-4 py-2 bg-white border-none rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-slate-900 transition-all w-full md:w-56"
                    />
                </div>
            </div>

            {/* Grid display */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {groups.length === 0 ? (
                    <div className="col-span-full py-16 flex flex-col items-center text-center space-y-3 bg-white rounded-2xl border-none">
                        <Inbox className="w-10 h-10 text-slate-300" />
                        <div>
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">No Active Circles Available</h3>
                            <p className="text-xs text-slate-400 mt-0.5">Check back later for new chit formations.</p>
                        </div>
                    </div>
                ) : (
                    groups.map((group) => (
                        <motion.div 
                            key={group._id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white p-6 rounded-2xl border-none shadow-none space-y-4"
                        >
                            <div className="flex justify-between items-start">
                                <div className="w-10 h-10 rounded-xl bg-slate-900 text-emerald-400 flex items-center justify-center font-bold shrink-0">
                                    <Wallet className="w-5 h-5" />
                                </div>
                                <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-800 border-none">
                                    {group.auctionType === 'AUCTION' ? 'Competitive Auction' : 'Lottery Draw'}
                                </span>
                            </div>

                            <div>
                                <h3 className="text-lg font-black text-slate-900 tracking-tight">{group.name}</h3>
                                <p className="text-xs font-medium text-slate-400 mt-0.5">Organizer: {group.organizerId.name}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-1">
                                <div className="space-y-0.5">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">Monthly</span>
                                    <div className="flex items-center gap-1 font-bold text-slate-900 text-sm">
                                        <Coins className="w-3.5 h-3.5 text-emerald-600" />
                                        <span>₹{group.monthlyContribution.toLocaleString('en-IN')}</span>
                                    </div>
                                </div>
                                <div className="space-y-0.5">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">Pot Value</span>
                                    <div className="flex items-center gap-1 font-bold text-emerald-600 text-sm">
                                        <span>₹{(group.monthlyContribution * group.totalMembers).toLocaleString('en-IN')}</span>
                                    </div>
                                </div>
                                <div className="space-y-0.5">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">Starts</span>
                                    <div className="flex items-center gap-1 font-bold text-slate-900 text-xs">
                                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                        <span>{format(new Date(group.startDate), 'MMM dd, yyyy')}</span>
                                    </div>
                                </div>
                                <div className="space-y-0.5">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">Capacity</span>
                                    <div className="flex items-center gap-1 font-bold text-slate-900 text-xs">
                                        <Users className="w-3.5 h-3.5 text-slate-400" />
                                        <span>{group.currentMemberCount} / {group.totalMembers}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Financial Config Pill Badges */}
                            <div className="flex flex-wrap gap-1.5 pt-1 text-[10px] font-bold">
                                <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md">
                                    Fee: {(group as any).financialConfig?.commission?.value ?? group.commissionPercent ?? 2}%
                                </span>
                                <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md">
                                    Strategy: {(group as any).financialConfig?.auctionStrategy || 'LOWEST_BID'}
                                </span>
                                <span className="px-2 py-0.5 bg-slate-900 text-white rounded-md">
                                    {(group as any).financialConfig?.currency || 'INR'}
                                </span>
                            </div>

                            {/* Progress bar */}
                            <div className="space-y-1.5 pt-1">
                                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden border-none">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(group.currentMemberCount / group.totalMembers) * 100}%` }}
                                        className="h-full bg-slate-900 rounded-full"
                                    />
                                </div>
                                <div className="flex justify-between text-[10px] font-bold uppercase text-slate-400">
                                    <span>Progress</span>
                                    <span>{Math.round((group.currentMemberCount / group.totalMembers) * 100)}%</span>
                                </div>
                            </div>

                            <div className="pt-2">
                                {successId === group._id ? (
                                    <button disabled className="w-full py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 border-none">
                                        <CheckCircle2 className="w-4 h-4" />
                                        <span>Sent Request</span>
                                    </button>
                                ) : (
                                    <button 
                                        onClick={() => handleJoinRequest(group._id)}
                                        disabled={requestingId === group._id}
                                        className="w-full py-2.5 bg-slate-900 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-2"
                                    >
                                        {requestingId === group._id ? (
                                            <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                                        ) : (
                                            <span>Request to Join</span>
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
