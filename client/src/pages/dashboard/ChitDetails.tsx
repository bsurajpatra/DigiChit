import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { 
    Users, Calendar, Coins, 
    ArrowLeft, Loader2, User, ShieldCheck,
    Hammer, MessageSquare, Clock, XCircle,
    Share2, Check, CheckCircle2
} from 'lucide-react';
import { Loader } from '../../components/ui/Loader';
// import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { useAuth } from '../../context/AuthContext';

interface Member {
    _id: string;
    userId: {
        _id: string;
        name: string;
        email: string;
    };
    status: string;
    joinedAt?: string;
    createdAt: string;
}

interface Group {
    _id: string;
    name: string;
    totalMembers: number;
    currentMemberCount: number;
    monthlyContribution: number;
    startDate: string;
    auctionType: string;
    status: string;
    commissionPercent: number;
    organizerId: {
        _id: string;
        name: string;
        email: string;
    };
    description?: string;
}

export const ChitDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [group, setGroup] = useState<Group | null>(null);
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'MEMBERS'>('OVERVIEW');
    const [viewMode, setViewMode] = useState<'LIST' | 'REQUESTS'>('LIST');
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [isManualAddModalOpen, setIsManualAddModalOpen] = useState(false);
    const [searchEmail, setSearchEmail] = useState('');
    const [searchResult, setSearchResult] = useState<any>(null);
    const [isSearching, setIsSearching] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [searchError, setSearchError] = useState<string | null>(null);

    const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
    const [copied, setCopied] = useState(false);

    const isOrganizer = user?.id === group?.organizerId._id;

    const fetchDetails = async () => {
        try {
            const res = await api.get(`/chit-groups/details/${id}`);
            setGroup(res.data.data.group);
            setMembers(res.data.data.members);
        } catch (err) {
            console.error('Failed to fetch details');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDetails();
    }, [id]);

    const handleApproval = async (membershipId: string, approve: boolean) => {
        setActionLoading(membershipId);
        try {
            const endpoint = approve ? 'approve' : 'reject';
            await api.post(`/chit-groups/members/${endpoint}/${membershipId}`);
            fetchDetails(); 
        } catch (err: any) {
            alert(err.response?.data?.message || 'Action failed');
        } finally {
            setActionLoading(null);
        }
    };

    const handleSearchUser = async () => {
        if (!searchEmail) return;
        setIsSearching(true);
        setSearchError(null);
        setSearchResult(null);
        try {
            const res = await api.get(`/user/search?email=${searchEmail}`);
            setSearchResult(res.data.data.user);
        } catch (err: any) {
            setSearchError(err.response?.data?.message || 'User not found or not KYC approved');
        } finally {
            setIsSearching(false);
        }
    };

    const handleManualAdd = async () => {
        if (!searchResult) return;
        setIsAdding(true);
        try {
            await api.post(`/chit-groups/${id}/add-member`, { email: searchResult.email });
            setIsManualAddModalOpen(false);
            setSearchEmail('');
            setSearchResult(null);
            fetchDetails();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to add member');
        } finally {
            setIsAdding(false);
        }
    };

    if (loading) return <div className="h-full flex items-center justify-center p-20"><Loader size="lg" /></div>;
    if (!group) return <div>Group not found</div>;

    const pendingMembers = members.filter(m => m.status === 'REQUESTED');
    const approvedMembers = members.filter(m => ['APPROVED', 'ACTIVE_MEMBER'].includes(m.status));

    return (
        <div className="space-y-6 w-full pb-12 animate-in fade-in duration-500 relative">
            {/* Header with Styled Back Button */}
            <div className="flex items-center justify-between bg-white/50 backdrop-blur-md px-6 py-4 rounded-3xl border border-white/40 shadow-lg shadow-slate-100/50">
                <button 
                    onClick={() => navigate(-1)}
                    className="p-2.5 bg-emerald-600 border border-emerald-500 rounded-xl hover:bg-emerald-700 transition-all text-white group shadow-lg shadow-emerald-200"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                </button>
                <div className="text-center">
                    <h1 className="text-base font-black text-slate-900 tracking-tight uppercase leading-none mb-1">{group.name}</h1>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Circle ID: #{group._id.slice(-6).toUpperCase()}</p>
                </div>
                <div className="flex items-center gap-2">
                    {isOrganizer && (
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={() => {
                                    const link = `${window.location.origin}/join/${group._id}`;
                                    navigator.clipboard.writeText(link);
                                    setCopied(true);
                                    setTimeout(() => setCopied(false), 2000);
                                }}
                                className={`flex items-center gap-2 px-6 py-2.5 rounded-2xl transition-all text-[9px] font-black uppercase tracking-widest shadow-lg ${
                                    copied 
                                    ? 'bg-emerald-600 text-white shadow-emerald-200' 
                                    : 'bg-slate-900 text-white hover:bg-emerald-600 shadow-slate-200'
                                }`}
                            >
                                {copied ? <Check className="w-3 h-3" /> : <Share2 className="w-3 h-3" />}
                                {copied ? 'Link Copied' : 'Share Circle'}
                            </button>
                            <div className="px-6 py-2.5 bg-emerald-600 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest shadow-md">
                                Lead
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Top Navigation Tabs & Help Button Row */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex p-1.5 bg-white/40 backdrop-blur-md rounded-2xl border border-white/40 shadow-sm overflow-x-auto w-full sm:w-auto">
                    <button
                        onClick={() => setActiveTab('OVERVIEW')}
                        className={`flex-1 sm:flex-none px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] transition-all ${
                            activeTab === 'OVERVIEW' 
                            ? 'bg-slate-900 text-white shadow-lg shadow-slate-200' 
                            : 'text-slate-400 hover:text-slate-900'
                        }`}
                    >
                        Overview
                    </button>
                    <button
                        onClick={() => setActiveTab('MEMBERS')}
                        className={`flex-1 sm:flex-none px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] transition-all ml-1 relative ${
                            activeTab === 'MEMBERS' 
                            ? 'bg-slate-900 text-white shadow-lg shadow-slate-200' 
                            : 'text-slate-400 hover:text-slate-900'
                        }`}
                    >
                        Members
                        {pendingMembers.length > 0 && isOrganizer && (
                            <span className="absolute -top-1 -right-1 flex h-4 w-4">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 text-[8px] items-center justify-center text-white font-bold">{pendingMembers.length}</span>
                            </span>
                        )}
                    </button>
                </div>

                <button 
                    onClick={() => setIsHelpModalOpen(true)}
                    className="w-full sm:w-auto px-8 py-2.5 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-emerald-600 transition-all shadow-lg shadow-slate-200"
                >
                    <MessageSquare className="w-4 h-4 text-emerald-400" />
                    Need Help?
                </button>
            </div>

            <div className="w-full space-y-6">
                {activeTab === 'OVERVIEW' && (
                    <div className="space-y-6">
                        <div className="bg-white/60 backdrop-blur-sm border border-white/60 p-10 rounded-3xl shadow-xl shadow-slate-100/50 relative overflow-hidden">
                            {/* Group Leader & Auction Type Header */}
                            <div className="flex flex-col md:flex-row items-center gap-6 mb-10 pb-10 border-b border-slate-100">
                                <div className="w-16 h-16 bg-slate-900 text-emerald-400 rounded-2xl flex items-center justify-center shadow-xl shadow-slate-200">
                                    <Hammer className="w-8 h-8" />
                                </div>
                                <div className="text-center md:text-left flex-1">
                                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Leaded by {group.organizerId.name}</h3>
                                    <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-2">
                                        <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[9px] font-black uppercase tracking-widest border border-emerald-100">
                                            Auction: {group.auctionType}
                                        </span>
                                        <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[9px] font-black uppercase tracking-widest border border-blue-100">
                                            Commission: {group.commissionPercent}%
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 relative z-10">
                                <div className="space-y-2">
                                    <Coins className="w-5 h-5 text-emerald-500 mb-2" />
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Pot Value</span>
                                    <div className="text-xl font-black text-slate-900 tracking-tighter">₹{(group.monthlyContribution * group.totalMembers).toLocaleString()}</div>
                                </div>
                                <div className="space-y-2">
                                    <Clock className="w-5 h-5 text-amber-500 mb-2" />
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Duration</span>
                                    <div className="text-xl font-black text-slate-900 tracking-tighter">{group.totalMembers} Months</div>
                                </div>
                                <div className="space-y-2">
                                    <Users className="w-5 h-5 text-blue-500 mb-2" />
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Total Seats</span>
                                    <div className="text-xl font-black text-slate-900 tracking-tighter">{group.totalMembers} Members</div>
                                </div>
                                <div className="space-y-2">
                                    <Calendar className="w-5 h-5 text-rose-500 mb-2" />
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Start Date</span>
                                    <div className="text-xl font-black text-slate-900 tracking-tighter">{format(new Date(group.startDate), 'MMM dd')}</div>
                                </div>
                            </div>

                            {group.description && (
                                <div className="mt-10 p-6 bg-slate-50/50 border border-slate-100 rounded-3xl">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Note from Organizer</label>
                                    <p className="text-xs font-bold text-slate-600 leading-relaxed uppercase tracking-tight">{group.description}</p>
                                </div>
                            )}
                            
                            <div className={`mt-10 p-4 rounded-2xl flex items-center gap-4 border ${
                                group.status === 'FORMING' ? 'bg-amber-50 border-amber-100 text-amber-700' : 'bg-emerald-50 border-emerald-100 text-emerald-700'
                            }`}>
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-white shadow-sm ${
                                    group.status === 'FORMING' ? 'text-amber-500' : 'text-emerald-500'
                                }`}>
                                    {group.status === 'FORMING' ? <Clock className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
                                </div>
                                <div>
                                    <h4 className="text-[10px] font-black uppercase tracking-widest">Group State: {group.status}</h4>
                                    <p className="text-[9px] font-bold opacity-70 uppercase tracking-widest">
                                        {group.status === 'FORMING' 
                                            ? 'Member invitations and approvals are currently open.' 
                                            : 'Formation locked. Financial cycle is officially active.'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'MEMBERS' && (
                    <div className="space-y-6">
                        {/* Consolidated Member Section */}
                        <div className="bg-white/60 backdrop-blur-sm p-8 rounded-3xl border border-white/60 shadow-xl shadow-slate-100/50">
                            <div className="flex flex-col md:flex-row items-center gap-8 mb-10 pb-8 border-b border-slate-100">
                                <div className="relative">
                                    <svg className="w-24 h-24 transform -rotate-90">
                                        <circle cx="48" cy="48" r="42" stroke="currentColor" strokeWidth="10" fill="transparent" className="text-slate-100" />
                                        <circle cx="48" cy="48" r="42" stroke="currentColor" strokeWidth="10" fill="transparent" className="text-emerald-500" strokeDasharray={264} strokeDashoffset={264 - (264 * (approvedMembers.length / group.totalMembers))} strokeLinecap="round" />
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-lg font-black tracking-tighter text-slate-900">{Math.round((approvedMembers.length / group.totalMembers) * 100)}%</span>
                                    </div>
                                </div>
                                <div className="text-center md:text-left flex-1">
                                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Member Quota Status</h3>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                                        {approvedMembers.length} of {group.totalMembers} spots secured in this circle
                                    </p>
                                </div>
                                {isOrganizer && group.status === 'FORMING' && (
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => setIsManualAddModalOpen(true)}
                                            className="px-6 py-3 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-600 transition-all flex items-center gap-2 shadow-lg shadow-slate-100"
                                        >
                                            <User className="w-4 h-4 text-emerald-400" />
                                            Manual Add
                                        </button>
                                        <button 
                                            onClick={() => setViewMode(viewMode === 'LIST' ? 'REQUESTS' : 'LIST')}
                                            className={`px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 ${
                                                viewMode === 'REQUESTS' 
                                                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' 
                                                : 'bg-slate-900 text-white hover:bg-emerald-600'
                                            }`}
                                        >
                                            {viewMode === 'LIST' ? (
                                                <>Manage Requests ({pendingMembers.length})</>
                                            ) : (
                                                <>Back to Members</>
                                            )}
                                        </button>
                                    </div>
                                )}
                            </div>

                            {viewMode === 'LIST' ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                    {approvedMembers.length === 0 ? (
                                        <div className="col-span-full py-20 text-center text-slate-300 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
                                            <Users className="w-10 h-10 mx-auto mb-4 opacity-10" />
                                            <p className="text-[10px] font-black uppercase tracking-widest">No members joined yet.</p>
                                        </div>
                                    ) : (
                                        approvedMembers.map((m) => (
                                            <div key={m._id} className="p-4 bg-white border border-slate-100 rounded-2xl flex items-center gap-4 group">
                                                <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-300 group-hover:bg-emerald-50 group-hover:text-emerald-500 transition-all">
                                                    <User className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-tight">{m.userId.name}</h4>
                                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Joined: {format(new Date(m.createdAt), 'MMM yyyy')}</p>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            ) : (
                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 animate-in slide-in-from-right duration-300">
                                    {pendingMembers.length === 0 ? (
                                        <div className="col-span-full py-20 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">No pending applications</p>
                                        </div>
                                    ) : (
                                        pendingMembers.map((m) => (
                                            <div key={m._id} className="p-5 bg-white border border-slate-50 rounded-2xl space-y-4 shadow-sm relative overflow-hidden">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-emerald-400">
                                                        <User className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-xs font-black text-slate-900 uppercase tracking-tight">{m.userId.name}</h4>
                                                        <p className="text-[9px] font-black text-slate-400 tracking-widest uppercase">{m.userId.email}</p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button 
                                                        onClick={() => handleApproval(m._id, true)}
                                                        disabled={!!actionLoading}
                                                        className="flex-1 bg-emerald-500 text-white h-10 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-emerald-600 transition-all flex items-center justify-center gap-2"
                                                    >
                                                        {actionLoading === m._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                                                        Approve
                                                    </button>
                                                    <button 
                                                        onClick={() => handleApproval(m._id, false)}
                                                        disabled={!!actionLoading}
                                                        className="flex-1 bg-white text-rose-600 h-10 rounded-xl border border-rose-100 font-bold text-[10px] uppercase tracking-widest hover:bg-rose-50 transition-all flex items-center justify-center gap-2"
                                                    >
                                                        {actionLoading === m._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                                                        Reject
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Help & Assistance Modal */}
            {isHelpModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-0">
                    <div 
                        className="absolute inset-0 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300" 
                        onClick={() => setIsHelpModalOpen(false)}
                    />
                    <div className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-10 text-center space-y-8">
                            <div className="w-20 h-20 bg-slate-900 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto shadow-xl shadow-slate-200">
                                <MessageSquare className="w-10 h-10" />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Need Assistance?</h3>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2 leading-relaxed">
                                    For inquiries regarding this specific chit group or rules, please contact the group leader directly.
                                </p>
                            </div>

                            <div className="p-6 bg-slate-50 border border-slate-100 rounded-3xl space-y-4">
                                <div className="flex items-center justify-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center text-slate-400">
                                        <User className="w-4 h-4" />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Group Leader</p>
                                        <p className="text-xs font-black text-slate-900 uppercase tracking-tight">{group.organizerId.name}</p>
                                    </div>
                                </div>
                                <div className="text-center text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                    {group.organizerId.email}
                                </div>
                            </div>

                            <div className="space-y-3">
                                {!isOrganizer ? (
                                    <button 
                                        className="w-full bg-slate-900 text-white h-14 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-emerald-600 transition-all flex items-center justify-center gap-3 shadow-lg shadow-slate-200"
                                        onClick={() => window.location.href = `mailto:${group.organizerId.email}`}
                                    >
                                        <MessageSquare className="w-4 h-4" />
                                        Contact Lead via Email
                                    </button>
                                ) : (
                                    <div className="py-4 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100 text-[10px] font-black uppercase tracking-widest">
                                        You are the lead of this circle
                                    </div>
                                )}
                                <button 
                                    onClick={() => setIsHelpModalOpen(false)}
                                    className="w-full bg-slate-50 text-slate-400 h-12 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-100 transition-all"
                                >
                                    Close Window
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Manual Add Member Modal */}
            {isManualAddModalOpen && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
                    <div 
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300" 
                        onClick={() => {
                            if (!isAdding) {
                                setIsManualAddModalOpen(false);
                                setSearchResult(null);
                                setSearchError(null);
                                setSearchEmail('');
                            }
                        }}
                    />
                    <div className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-white">
                        <div className="p-10 space-y-8">
                            <div className="text-center space-y-2">
                                <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase">Manual Enrollment</h3>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Enroll KYC verified members directly</p>
                            </div>

                            <div className="space-y-4">
                                <div className="relative">
                                    <input 
                                        type="email"
                                        placeholder="Enter member's exact email..."
                                        value={searchEmail}
                                        onChange={(e) => setSearchEmail(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSearchUser()}
                                        className="w-full bg-slate-50 border border-slate-100 h-14 px-6 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all"
                                    />
                                    <button 
                                        onClick={handleSearchUser}
                                        disabled={isSearching || !searchEmail}
                                        className="absolute right-2 top-2 bottom-2 px-6 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all disabled:opacity-50 shadow-md shadow-slate-200"
                                    >
                                        {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
                                    </button>
                                </div>

                                {searchError && (
                                    <p className="text-center text-[10px] font-black text-rose-500 uppercase tracking-widest bg-rose-50 py-3 rounded-xl border border-rose-100">
                                        {searchError}
                                    </p>
                                )}

                                {searchResult && (
                                    <div className="p-6 bg-emerald-50/50 rounded-3xl border border-emerald-100/50 space-y-4 animate-in slide-in-from-top-4 duration-300">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-emerald-500 shadow-sm">
                                                <User className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">{searchResult.name}</h4>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{searchResult.email}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 text-emerald-600 rounded-lg w-fit">
                                            <ShieldCheck className="w-3 h-3" />
                                            <span className="text-[8px] font-black uppercase tracking-widest">KYC Verified & Ready</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button 
                                    onClick={() => {
                                        setIsManualAddModalOpen(false);
                                        setSearchResult(null);
                                        setSearchError(null);
                                        setSearchEmail('');
                                    }}
                                    disabled={isAdding}
                                    className="flex-1 h-14 rounded-2xl bg-rose-500 text-white font-black uppercase text-[10px] tracking-widest hover:bg-rose-600 transition-all shadow-lg shadow-rose-100"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={handleManualAdd}
                                    disabled={!searchResult || isAdding}
                                    className="flex-[2] h-14 rounded-2xl bg-emerald-600 text-white font-black uppercase text-[10px] tracking-widest hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-100 disabled:opacity-20 flex items-center justify-center gap-3"
                                >
                                    {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-5 h-5 text-white" />}
                                    Enroll Member
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
