import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { 
    Inbox, 
    ArrowRight, FolderKanban, ShieldCheck
} from 'lucide-react';
import { Loader } from '../../components/ui/Loader';
// import { motion } from 'framer-motion';
// import { format } from 'date-fns';

interface Group {
    _id: string;
    name: string;
    totalMembers: number;
    currentMemberCount: number;
    monthlyContribution: number;
    startDate: string;
    status: string;
}

export const MyOrganizedChits = () => {
    const navigate = useNavigate();
    const [groups, setGroups] = useState<Group[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchGroups = async () => {
            try {
                const res = await api.get('/chit-groups/my-groups');
                setGroups(res.data.data.groups);
            } catch (err) {
                console.error('Failed to fetch groups');
            } finally {
                setLoading(false);
            }
        };
        fetchGroups();
    }, []);

    if (loading) return <div className="h-full flex items-center justify-center p-20"><Loader size="lg" /></div>;

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Compact Header */}
            <div className="flex items-center justify-between bg-white/50 backdrop-blur-md px-6 py-4 rounded-3xl border border-white/40 shadow-lg shadow-slate-100/50">
                <div>
                    <h1 className="text-xl font-bold text-slate-900 tracking-tight uppercase leading-tight">Your Organized Circles</h1>
                    <p className="text-[9px] font-bold text-slate-400 mt-0.5 uppercase tracking-widest leading-none">Manage the circles you lead and monitor formation progress</p>
                </div>
                <button 
                    onClick={() => navigate('/organizer/create-chit')}
                    className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-2xl shadow-lg shadow-slate-200 hover:bg-emerald-600 transition-all font-black uppercase tracking-widest text-[9px]"
                >
                    <FolderKanban className="w-3.5 h-3.5" />
                    New Circle
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {groups.length === 0 ? (
                    <div className="col-span-full py-20 text-center bg-white/60 backdrop-blur-sm border border-dashed border-slate-200 rounded-3xl space-y-4 shadow-xl shadow-slate-100/50">
                        <Inbox className="w-12 h-12 text-slate-200 mx-auto" />
                        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">No Circles Organized Yet</h3>
                        <button 
                            onClick={() => navigate('/organizer/create-chit')}
                            className="text-emerald-500 text-[10px] font-black uppercase tracking-widest hover:underline"
                        >
                            Launch your first circle now
                        </button>
                    </div>
                ) : (
                    groups.map((group) => (
                        <div key={group._id} className="bg-white/60 backdrop-blur-sm p-6 rounded-3xl border border-white/60 shadow-xl shadow-slate-100/50 hover:shadow-2xl transition-all group">
                            <div className="flex justify-between items-start mb-6">
                                <div className="bg-emerald-50 p-2.5 rounded-2xl text-emerald-600">
                                    <ShieldCheck className="w-5 h-5" />
                                </div>
                                <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                                    group.status === 'FORMING' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-100 text-emerald-700'
                                }`}>
                                    {group.status}
                                </div>
                            </div>

                            <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase mb-4">{group.name}</h3>

                            <div className="space-y-4 mb-8">
                                <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest">
                                    <span className="text-slate-400">Members</span>
                                    <span className="text-slate-900">{group.currentMemberCount} / {group.totalMembers}</span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-emerald-500 rounded-full" 
                                        style={{ width: `${(group.currentMemberCount / group.totalMembers) * 100}%` }}
                                    />
                                </div>
                                <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest">
                                    <span className="text-slate-400">Monthly Yield</span>
                                    <span className="text-emerald-600">₹{(group.monthlyContribution * group.totalMembers).toLocaleString()}</span>
                                </div>
                            </div>

                            <button 
                                onClick={() => navigate(`/chit-details/${group._id}`)}
                                className="w-full py-3 bg-slate-50 text-slate-500 rounded-2xl font-black text-[9px] uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all flex items-center justify-center gap-2"
                            >
                                Manage Circle
                                <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
