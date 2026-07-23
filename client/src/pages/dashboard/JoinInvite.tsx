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
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
            <div className="w-full max-w-xl bg-white p-8 md:p-10 rounded-2xl border-none shadow-none space-y-6">
                <div className="text-center space-y-3">
                    <div className="w-16 h-16 bg-slate-900 text-emerald-400 rounded-xl flex items-center justify-center mx-auto shrink-0 font-bold">
                        <Wallet className="w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">{group.name}</h1>
                        <p className="text-xs font-bold text-slate-700 bg-slate-100 inline-block px-3 py-1 rounded-full border-none mt-2">
                            Invited by {group.organizerId.name}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="p-4 bg-slate-50 rounded-xl border-none space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Monthly</span>
                        <div className="flex items-center gap-1 font-bold text-slate-900 text-sm">
                            <Coins className="w-4 h-4 text-emerald-600" />
                            <span>₹{group.monthlyContribution.toLocaleString('en-IN')}</span>
                        </div>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl border-none space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Pot Value</span>
                        <div className="flex items-center gap-1 font-bold text-emerald-600 text-sm">
                            <span>₹{(group.monthlyContribution * group.totalMembers).toLocaleString('en-IN')}</span>
                        </div>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl border-none space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Duration</span>
                        <div className="flex items-center gap-1 font-bold text-slate-900 text-sm">
                            <Calendar className="w-4 h-4 text-slate-400" />
                            <span>{group.totalMembers} Mo</span>
                        </div>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl border-none space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Total Seats</span>
                        <div className="flex items-center gap-1 font-bold text-slate-900 text-sm">
                            <Users className="w-4 h-4 text-slate-400" />
                            <span>{group.totalMembers}</span>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl flex items-start gap-3 border-none">
                    <div className="w-8 h-8 bg-slate-900 text-emerald-400 rounded-lg flex items-center justify-center shrink-0">
                        <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                        <h4 className="text-xs font-bold text-slate-900 uppercase">Secure Financial Circle</h4>
                        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                            Joining this group requires approval and verified KYC. Your request will be sent to the organizer.
                        </p>
                    </div>
                </div>

                <div className="pt-2">
                    {success ? (
                        <div className="space-y-3">
                            <button disabled className="w-full py-3.5 bg-emerald-600 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 border-none">
                                <CheckCircle2 className="w-4 h-4" />
                                <span>Request Successfully Sent</span>
                            </button>
                            <button onClick={() => navigate('/dashboard')} className="w-full py-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors">
                                Go to Dashboard
                            </button>
                        </div>
                    ) : (
                        <button 
                            onClick={handleJoin}
                            disabled={requesting}
                            className="w-full py-3.5 bg-slate-900 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-2"
                        >
                            {requesting ? <Loader2 className="w-4 h-4 animate-spin text-emerald-400" /> : (
                                <>
                                    <span>Confirm Join Request</span>
                                    <ArrowRight className="w-4 h-4 text-emerald-400" />
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
