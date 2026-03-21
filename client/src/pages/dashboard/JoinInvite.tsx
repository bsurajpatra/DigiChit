import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { 
    Loader2, Users, Calendar, Coins, 
    ShieldCheck, ArrowRight, Wallet, CheckCircle2 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Loader } from '../../components/ui/Loader';

export const JoinInvite = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [group, setGroup] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [requesting, setRequesting] = useState(false);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        const fetchGroup = async () => {
            try {
                const res = await api.get(`/chit-groups/details/${id}`);
                setGroup(res.data.data.group);
            } catch (err) {
                console.error('Failed to fetch group details');
            } finally {
                setLoading(false);
            }
        };
        if (id) fetchGroup();
    }, [id]);

    const handleJoin = async () => {
        if (!user) {
            navigate(`/login?redirect=/join/${id}`);
            return;
        }

        setRequesting(true);
        try {
            await api.post(`/chit-groups/${id}/request-join`);
            setSuccess(true);
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to send request');
        } finally {
            setRequesting(false);
        }
    };

    if (loading) return <div className="h-screen flex items-center justify-center bg-slate-50"><Loader size="lg" /></div>;

    if (!group) return (
        <div className="h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
            <div className="w-20 h-20 bg-rose-50 rounded-3xl flex items-center justify-center text-rose-500 mb-6 font-black text-2xl shadow-xl shadow-rose-100">!</div>
            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Circle Not Found</h1>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">The link might be expired or the circle no longer exists.</p>
            <button onClick={() => navigate('/dashboard')} className="mt-8 px-8 py-3 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest">Back to Dashboard</button>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white via-slate-50 to-emerald-50/20">
            <div className="w-full max-w-2xl bg-white/80 backdrop-blur-xl border border-white p-12 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 space-y-8 animate-in zoom-in-95 duration-500">
                <div className="text-center space-y-4">
                    <div className="w-24 h-24 bg-slate-900 rounded-[2rem] flex items-center justify-center mx-auto shadow-2xl shadow-slate-300 transform -rotate-6">
                        <Wallet className="w-10 h-10 text-emerald-400" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none">{group.name}</h1>
                        <p className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em] mt-4 bg-emerald-50 inline-block px-5 py-2 rounded-full border border-emerald-100/50">
                            Invited by {group.organizerId.name}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-5 bg-white border border-slate-50 rounded-2xl shadow-sm space-y-1">
                        <span className="text-[8px] font-black text-slate-900 uppercase tracking-widest block opacity-60">Monthly Contribution</span>
                        <div className="flex items-center gap-1.5 font-black text-slate-900 text-lg tracking-tighter">
                            <Coins className="w-4 h-4 text-emerald-600" />
                            ₹{group.monthlyContribution.toLocaleString()}
                        </div>
                    </div>
                    <div className="p-5 bg-white border border-slate-50 rounded-2xl shadow-sm space-y-1">
                        <span className="text-[8px] font-black text-slate-900 uppercase tracking-widest block opacity-60">Pot Value</span>
                        <div className="flex items-center gap-1.5 font-black text-emerald-600 text-lg tracking-tighter">
                            ₹{(group.monthlyContribution * group.totalMembers).toLocaleString()}
                        </div>
                    </div>
                    <div className="p-5 bg-white border border-slate-50 rounded-2xl shadow-sm space-y-1">
                        <span className="text-[8px] font-black text-slate-900 uppercase tracking-widest block opacity-60">Cycle Duration</span>
                        <div className="flex items-center gap-1.5 font-black text-slate-900 text-lg tracking-tighter uppercase">
                            <Calendar className="w-4 h-4 text-slate-900" />
                            {group.totalMembers} Months
                        </div>
                    </div>
                    <div className="p-5 bg-white border border-slate-50 rounded-2xl shadow-sm space-y-1">
                        <span className="text-[8px] font-black text-slate-900 uppercase tracking-widest block opacity-60">Total Seats</span>
                        <div className="flex items-center gap-1.5 font-black text-slate-900 text-lg tracking-tighter">
                            <Users className="w-4 h-4 text-slate-900" />
                            {group.totalMembers}
                        </div>
                    </div>
                </div>

                <div className="bg-emerald-50/50 border border-emerald-100 p-6 rounded-3xl flex items-start gap-4">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-emerald-500 shadow-sm shrink-0">
                        <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div>
                        <h4 className="text-[10px] font-black text-emerald-900 uppercase tracking-widest mb-1">Secure Financial Circle</h4>
                        <p className="text-[9px] font-bold text-emerald-900/80 uppercase tracking-widest leading-relaxed">
                            Joining this group requires admin approval and a verified KYC. Your request will be sent to the organizer.
                        </p>
                    </div>
                </div>

                <div className="pt-4">
                    {success ? (
                        <div className="space-y-4">
                            <button disabled className="w-full py-5 bg-emerald-500 text-white rounded-[2rem] font-black uppercase text-[12px] tracking-widest flex items-center justify-center gap-3 shadow-2xl shadow-emerald-200">
                                <CheckCircle2 className="w-5 h-5" />
                                Request Successfully Sent
                            </button>
                            <button onClick={() => navigate('/dashboard')} className="w-full text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors">
                                Go to Dashboard
                            </button>
                        </div>
                    ) : (
                        <button 
                            onClick={handleJoin}
                            disabled={requesting}
                            className="w-full py-5 bg-slate-900 text-white rounded-[2rem] font-black uppercase text-[12px] tracking-widest flex items-center justify-center gap-3 hover:bg-emerald-600 transition-all shadow-2xl shadow-slate-300 group"
                        >
                            {requesting ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                <>
                                    Confirm Join Request
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
