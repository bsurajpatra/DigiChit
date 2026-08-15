import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { 
    Mail, MessageSquare, 
    Send, Loader2, Search, User, Inbox,
    AlertTriangle, Archive, RefreshCw, Smartphone, Globe
} from 'lucide-react';
import { Loader } from '../../components/ui/Loader';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';

interface Message {
    senderId?: string;
    senderRole: 'USER' | 'ADMIN';
    message: string;
    sentAt: string;
    isRead: boolean;
}

interface Query {
    _id: string;
    userId?: string;
    name: string;
    email: string;
    subject: string;
    status: 'PENDING' | 'RESOLVED';
    source: 'EXTERNAL' | 'INTERNAL';
    messages: Message[];
    createdAt: string;
    updatedAt: string;
}

const ContactQueries = () => {
    const [queries, setQueries] = useState<Query[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [response, setResponse] = useState('');
    const [sending, setSending] = useState(false);
    const [statusLoading, setStatusLoading] = useState(false);
    const [error, setError] = useState('');
    const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'RESOLVED'>('ALL');
    const [search, setSearch] = useState('');

    const fetchQueries = async () => {
        try {
            const res = await api.get('/contact/queries');
            setQueries(res.data.data.queries);
        } catch (err) {
            console.error('Failed to fetch queries');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchQueries();
    }, []);

    const handleRespond = async () => {
        if (!selectedId || !response.trim()) return;
        setSending(true);
        setError('');
        try {
            const res = await api.post(`/contact/respond/${selectedId}`, { message: response });
            const updatedQuery = res.data.data.query;
            setQueries(prev => prev.map(q => q._id === selectedId ? updatedQuery : q));
            setResponse('');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to send response');
        } finally {
            setSending(false);
        }
    };

    const handleUpdateStatus = async (newStatus: 'PENDING' | 'RESOLVED') => {
        if (!selectedId) return;
        setStatusLoading(true);
        try {
            const res = await api.patch(`/contact/status/${selectedId}`, { status: newStatus });
            const updatedQuery = res.data.data.query;
            setQueries(prev => prev.map(q => q._id === selectedId ? updatedQuery : q));
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to update status');
        } finally {
            setStatusLoading(false);
        }
    };

    const selectedQuery = queries.find(q => q._id === selectedId);

    const filteredQueries = queries.filter(q => {
        const matchesSearch = q.name.toLowerCase().includes(search.toLowerCase()) || 
                             q.email.toLowerCase().includes(search.toLowerCase()) ||
                             q.subject.toLowerCase().includes(search.toLowerCase());
        const matchesFilter = filter === 'ALL' || q.status === filter;
        return matchesSearch && matchesFilter;
    });

    if (loading) return <div className="h-[80vh] flex items-center justify-center"><Loader size="lg" /></div>;

    return (
        <div className="h-full flex flex-col gap-4 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center justify-between bg-white/50 backdrop-blur-md px-6 py-4 rounded-3xl border border-white/40 shadow-lg shadow-slate-100/50">
                <div>
                    <h1 className="text-xl font-bold text-slate-900 tracking-tight uppercase">Inquiry Inbox</h1>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Managing {queries.length} active threads.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchQueries}
                        disabled={loading}
                        className="p-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition-all active:scale-95 cursor-pointer disabled:opacity-50 shadow-xs flex items-center justify-center"
                        title="Refresh Queries"
                    >
                        <RefreshCw className={`w-4 h-4 text-emerald-400 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    <div className="flex items-center gap-2 px-4 py-2 bg-slate-50/50 rounded-2xl border border-slate-100">
                        <div className="w-6 h-6 bg-emerald-100 text-emerald-700 rounded-lg flex items-center justify-center font-black text-xs">
                            {queries.filter(q => q.status === 'PENDING').length}
                        </div>
                        <span className="font-black text-slate-600 uppercase tracking-widest text-[9px]">Open</span>
                    </div>
                </div>
            </div>

            {/* Split Content Area */}
            <div className="flex-1 min-h-0 flex flex-col md:flex-row gap-4">
                
                {/* Sidebar */}
                <div className="w-full md:w-80 flex flex-col bg-white/60 backdrop-blur-sm border border-white/60 rounded-3xl overflow-hidden shadow-xl shadow-slate-100/50">
                    <div className="p-4 border-b border-slate-50">
                        <div className="relative mb-3">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                            <input 
                                type="text" 
                                placeholder="Search..."
                                className="w-full pl-9 pr-4 py-2 bg-white/80 border border-slate-100 rounded-xl text-xs font-bold focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>

                        <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-100">
                            {(['ALL', 'PENDING', 'RESOLVED'] as const).map(f => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    className={`flex-1 py-1 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ${
                                        filter === f ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                                    }`}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-2 space-y-1.5 custom-scrollbar">
                        <AnimatePresence mode="popLayout">
                            {filteredQueries.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-slate-300 opacity-60 py-8">
                                    <Inbox className="w-10 h-10 mb-2" />
                                    <p className="text-[10px] font-bold uppercase tracking-widest">No inquiries found</p>
                                </div>
                            ) : (
                                filteredQueries.map(q => (
                                    <motion.button
                                        key={q._id}
                                        layout
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        onClick={() => setSelectedId(q._id)}
                                        className={`w-full text-left p-3.5 rounded-2xl transition-all group relative border ${
                                            selectedId === q._id 
                                                ? 'bg-white border-emerald-500/20 shadow-md shadow-emerald-500/5' 
                                                : 'bg-white/40 border-slate-50 hover:border-emerald-500/10'
                                        }`}
                                    >
                                        <div className="flex justify-between items-start mb-1.5">
                                            <div className="flex gap-1">
                                                <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${
                                                    q.status === 'PENDING' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
                                                }`}>
                                                    {q.status}
                                                </span>
                                                <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md flex items-center gap-1 ${
                                                    q.source === 'INTERNAL' ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-500'
                                                }`}>
                                                    {q.source === 'INTERNAL' ? <Smartphone className="w-2 h-2" /> : <Globe className="w-2 h-2" />}
                                                    {q.source}
                                                </span>
                                            </div>
                                            <span className="text-[8px] font-bold text-slate-400">
                                                {format(new Date(q.updatedAt), 'MMM dd')}
                                            </span>
                                        </div>
                                        <h3 className="text-xs font-bold text-slate-900 truncate mb-0.5 group-hover:text-emerald-600 transition-colors">
                                            {q.subject}
                                        </h3>
                                        <div className="flex justify-between items-center">
                                            <p className="text-[10px] font-black text-slate-500 truncate max-w-[120px] uppercase tracking-widest">{q.name}</p>
                                            {q.messages.length > 1 && (
                                                <span className="text-[9px] bg-slate-900 text-white w-4 h-4 flex items-center justify-center rounded-full font-black">
                                                    {q.messages.length}
                                                </span>
                                            )}
                                        </div>
                                    </motion.button>
                                ))
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col bg-white/60 backdrop-blur-sm border border-white/60 rounded-3xl overflow-hidden shadow-xl shadow-slate-100/50 relative">
                    {selectedQuery ? (
                        <>
                            <div className="px-6 py-5 border-b border-white/60 bg-white/20">
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-11 h-11 bg-white border border-slate-100 rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm relative group shrink-0">
                                            <User className="w-5 h-5 relative z-10" />
                                            {selectedQuery.source === 'INTERNAL' && (
                                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 text-white rounded-full flex items-center justify-center ring-2 ring-white">
                                                    <Smartphone className="w-2.5 h-2.5" />
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h2 className="text-base font-bold text-slate-900 tracking-tight uppercase leading-tight">{selectedQuery.name}</h2>
                                                <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md ${
                                                    selectedQuery.source === 'INTERNAL' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
                                                }`}>
                                                    {selectedQuery.source === 'INTERNAL' ? 'Registered User' : 'Web Visitor'}
                                                </span>
                                            </div>
                                            <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1 uppercase tracking-widest mt-0.5">
                                                <Mail className="w-3 h-3" /> {selectedQuery.email}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-2">
                                        {selectedQuery.status === 'PENDING' ? (
                                            <button 
                                                onClick={() => handleUpdateStatus('RESOLVED')}
                                                disabled={statusLoading}
                                                className="px-4 py-2 bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-800 transition-all disabled:opacity-50 flex items-center gap-2 shadow-md shadow-slate-200"
                                            >
                                                {statusLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Archive className="w-3 h-3" />}
                                                Resolve
                                            </button>
                                        ) : (
                                            <button 
                                                onClick={() => handleUpdateStatus('PENDING')}
                                                disabled={statusLoading}
                                                className="px-4 py-2 bg-emerald-50 text-emerald-700 text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-emerald-100 transition-all disabled:opacity-50 flex items-center gap-2"
                                            >
                                                {statusLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                                                Reopen
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Chat Thread */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar scroll-smooth bg-slate-50/5">
                                <AnimatePresence initial={false}>
                                    {selectedQuery.messages.map((msg, idx) => {
                                        const isAdminSender = msg.senderRole === 'ADMIN';
                                        return (
                                            <motion.div 
                                                key={idx}
                                                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                                className={`flex flex-col ${isAdminSender ? 'items-end ml-auto' : 'items-start'} max-w-[90%]`}
                                            >
                                                <div className={`p-4 rounded-2xl ${
                                                    isAdminSender 
                                                        ? 'bg-emerald-600 text-white rounded-tr-none shadow-lg shadow-emerald-500/10' 
                                                        : 'bg-white border border-slate-100 text-slate-800 rounded-tl-none shadow-sm'
                                                }`}>
                                                    {idx === 0 && !isAdminSender && (
                                                        <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 mb-2 pb-1">
                                                            Topic: {selectedQuery.subject}
                                                        </div>
                                                    )}
                                                    <p className="text-xs leading-relaxed font-bold">{msg.message}</p>
                                                </div>
                                                <div className={`flex items-center gap-2 mt-1.5 px-1 ${isAdminSender ? 'flex-row-reverse' : ''}`}>
                                                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-300">
                                                        {format(new Date(msg.sentAt), 'HH:mm')}
                                                    </span>
                                                    {isAdminSender && selectedQuery.source === 'EXTERNAL' && (
                                                        <div className="px-1.5 py-0.5 bg-emerald-50 text-emerald-600 rounded-md flex items-center gap-1">
                                                            <Mail className="w-2.5 h-2.5" />
                                                            <span className="text-[7px] font-black uppercase tracking-widest">Sent via Email</span>
                                                        </div>
                                                    )}
                                                    {isAdminSender && selectedQuery.source === 'INTERNAL' && (
                                                        <div className="px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded-md flex items-center gap-1">
                                                            <MessageSquare className="w-2.5 h-2.5" />
                                                            <span className="text-[7px] font-black uppercase tracking-widest">In-App Chat</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </AnimatePresence>
                            </div>

                            {/* Response Terminal */}
                            <div className="p-5 border-t border-white/60 bg-white/30">
                                {error && (
                                    <div className="mb-3 p-3 bg-red-50 text-red-600 text-[9px] font-black uppercase tracking-widest rounded-xl flex items-center gap-2 border border-red-100">
                                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> {error}
                                    </div>
                                )}
                                <div className="relative">
                                    <textarea 
                                        placeholder={selectedQuery.status === 'RESOLVED' ? "Inquiry resolved. Reopen to chat..." : (selectedQuery.source === 'INTERNAL' ? "Type your message..." : "Reply via email...")}
                                        disabled={selectedQuery.status === 'RESOLVED'}
                                        className="w-full pl-5 pr-28 py-4 bg-white/90 border border-slate-100 rounded-2xl text-xs font-bold focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 outline-none transition-all resize-none shadow-sm disabled:bg-slate-50/50"
                                        rows={2}
                                        value={response}
                                        onChange={e => setResponse(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleRespond();
                                            }
                                        }}
                                    />
                                    <div className="absolute right-2 bottom-2">
                                        <button 
                                            disabled={sending || !response.trim() || selectedQuery.status === 'RESOLVED'}
                                            onClick={handleRespond}
                                            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-200/50 transition-all active:scale-95 disabled:opacity-40"
                                        >
                                            <span className="text-[9px] font-black uppercase tracking-widest">Post</span>
                                            {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50/10">
                            <div className="w-20 h-20 bg-slate-900 rounded-[2rem] flex items-center justify-center mb-6 shadow-xl shadow-slate-900/10 group">
                                <MessageSquare className="w-8 h-8 text-emerald-400 group-hover:scale-110 transition-all" />
                            </div>
                            <h2 className="text-xl font-bold text-slate-900 tracking-tight uppercase mb-2">Select Thread</h2>
                            <p className="text-[10px] font-bold text-slate-400 max-w-[200px] mx-auto uppercase tracking-widest leading-relaxed">
                                Review system tickets and provide operational support.
                            </p>
                        </div>
                    )}
                </div>
            </div>
            
            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.05); border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,0.08); }
            `}</style>
        </div>
    );
};

export default ContactQueries;
