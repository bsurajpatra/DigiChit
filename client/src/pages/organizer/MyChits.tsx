import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { 
    Inbox, 
    ArrowRight, FolderKanban, ShieldCheck
} from 'lucide-react';
import { Loader } from '../../components/ui/Loader';
import { useAuth } from '../../hooks/useAuth';
import { KYCChitGuard } from '../../components/ui/KYCChitGuard';

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
    const { user } = useAuth();
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
        if (user?.kycStatus === 'APPROVED') {
            fetchGroups();
        } else {
            setLoading(false);
        }
    }, [user?.kycStatus]);

    if (user?.kycStatus !== 'APPROVED') {
        return <KYCChitGuard title="Organized Circles Restricted" />;
    }

    if (loading) return <div className="h-full flex items-center justify-center p-20"><Loader size="lg" /></div>;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
                        <FolderKanban className="w-4 h-4" />
                        <span>Organized Circles</span>
                    </div>
                    <h1 className="text-xl font-black text-slate-900 tracking-tight">Your Organized Circles</h1>
                </div>
                <button 
                    onClick={() => navigate('/organizer/create-chit')}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-none shrink-0"
                >
                    <FolderKanban className="w-4 h-4 text-emerald-400" />
                    <span>New Circle</span>
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {groups.length === 0 ? (
                    <div className="col-span-full py-16 text-center bg-white rounded-2xl border-none space-y-3">
                        <Inbox className="w-10 h-10 text-slate-300 mx-auto" />
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">No Circles Organized Yet</h3>
                        <button 
                            onClick={() => navigate('/organizer/create-chit')}
                            className="text-emerald-600 text-xs font-bold hover:underline"
                        >
                            Launch your first circle now
                        </button>
                    </div>
                ) : (
                    groups.map((group) => (
                        <div key={group._id} className="bg-white p-6 rounded-2xl border-none shadow-none space-y-4">
                            <div className="flex justify-between items-start">
                                <div className="w-10 h-10 rounded-xl bg-slate-900 text-emerald-400 flex items-center justify-center font-bold shrink-0">
                                    <ShieldCheck className="w-5 h-5" />
                                </div>
                                <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-800 border-none">
                                    {group.status}
                                </span>
                            </div>

                            <div>
                                <h3 className="text-lg font-black text-slate-900 tracking-tight">{group.name}</h3>
                            </div>

                            <div className="space-y-3 pt-1">
                                <div className="flex justify-between items-center text-xs font-bold">
                                    <span className="text-slate-400">Members</span>
                                    <span className="text-slate-900">{group.currentMemberCount} / {group.totalMembers}</span>
                                </div>
                                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden border-none">
                                    <div 
                                        className="h-full bg-slate-900 rounded-full transition-all duration-500" 
                                        style={{ width: `${(group.currentMemberCount / group.totalMembers) * 100}%` }}
                                    />
                                </div>
                                <div className="flex justify-between items-center text-xs font-bold">
                                    <span className="text-slate-400">Monthly Yield</span>
                                    <span className="text-emerald-600">₹{(group.monthlyContribution * group.totalMembers).toLocaleString('en-IN')}</span>
                                </div>
                            </div>

                            <button 
                                onClick={() => navigate(`/chit-details/${group._id}`)}
                                className="w-full py-2.5 bg-slate-900 hover:bg-emerald-600 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer mt-2"
                            >
                                <span>Manage Circle</span>
                                <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
