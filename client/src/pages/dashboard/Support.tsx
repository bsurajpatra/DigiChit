import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { 
    MessageSquare, Send, Loader2, Inbox,
    Plus, X, User
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
    subject: string;
    status: 'PENDING' | 'RESOLVED';
    source: 'EXTERNAL' | 'INTERNAL';
    messages: Message[];
    createdAt: string;
    updatedAt: string;
}

export const Support = () => {
    const [queries, setQueries] = useState<Query[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [response, setResponse] = useState('');
    const [sending, setSending] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [newSubject, setNewSubject] = useState('');
    const [newMessage, setNewMessage] = useState('');
    const [error, setError] = useState('');

    const fetchQueries = async () => {
        try {
            const res = await api.get('/contact/user/my-queries');
            setQueries(res.data.data.queries);
        } catch (err) {
            console.error('Failed to fetch support tickets');
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
            const res = await api.post(`/contact/user/respond/${selectedId}`, { message: response });
            setQueries(prev => prev.map(q => q._id === selectedId ? res.data.data.query : q));
            setResponse('');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to send message');
        } finally {
            setSending(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newSubject.trim() || !newMessage.trim()) return;
        setSending(true);
        setError('');
        try {
            const res = await api.post('/contact/user/submit', { subject: newSubject, message: newMessage });
            const newQuery = res.data.data.query;
            setQueries(prev => [newQuery, ...prev]);
            setSelectedId(newQuery._id);
            setShowNew(false);
            setNewSubject('');
            setNewMessage('');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to create ticket');
        } finally {
            setSending(false);
        }
    };

    const selectedQuery = queries.find(q => q._id === selectedId);

    if (loading) return <div className="h-full flex items-center justify-center"><Loader size="lg" /></div>;

    return (
        <div className="h-full flex flex-col gap-4 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center justify-between bg-white/50 backdrop-blur-md px-6 py-4 rounded-3xl border border-white/40 shadow-lg shadow-slate-100/50">
                <div>
                    <h1 className="text-xl font-bold text-slate-900 tracking-tight uppercase">Support & Help</h1>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">Connect with our engineering team.</p>
                </div>
                <button 
                    onClick={() => setShowNew(true)}
                    className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-2xl shadow-lg shadow-slate-200 hover:bg-emerald-600 transition-all font-black uppercase tracking-widest text-[9px]"
                >
                    <Plus className="w-3.5 h-3.5" /> Open Ticket
                </button>
            </div>

            <div className="flex-1 min-h-0 flex flex-col md:flex-row gap-4">
                {/* Sidebar */}
                <div className="w-full md:w-80 flex flex-col bg-white/60 backdrop-blur-sm border border-white/60 rounded-3xl overflow-hidden shadow-xl shadow-slate-100/50">
                    <div className="p-4 border-b border-slate-50 flex items-center justify-between">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Support Threads</span>
                        <Inbox className="w-3.5 h-3.5 text-slate-300" />
                    </div>

                    <div className="flex-1 overflow-y-auto p-2 space-y-1.5 custom-scrollbar">
                        <AnimatePresence mode="popLayout">
                            {queries.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-slate-300 opacity-60 py-8">
                                    <MessageSquare className="w-10 h-10 mb-2" />
                                    <p className="text-[10px] font-bold uppercase tracking-widest">No active support</p>
                                </div>
                            ) : (
                                queries.map(q => (
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
                                            <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${
                                                q.status === 'PENDING' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
                                            }`}>
                                                {q.status}
                                            </span>
                                            <span className="text-[8px] font-bold text-slate-400">
                                                {format(new Date(q.updatedAt), 'MMM dd')}
                                            </span>
                                        </div>
                                        <h3 className="text-xs font-bold text-slate-900 truncate mb-0.5 group-hover:text-emerald-600 transition-colors uppercase tracking-tight">
                                            {q.subject}
                                        </h3>
                                        <div className="flex justify-between items-center">
                                            <p className="text-[10px] font-black text-slate-400 truncate max-w-[125px] uppercase tracking-widest">Help Thread</p>
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

                {/* Chat Area */}
                <div className="flex-1 flex flex-col bg-white/60 backdrop-blur-sm border border-white/60 rounded-3xl overflow-hidden shadow-xl shadow-slate-100/50 relative">
                    {selectedQuery ? (
                        <>
                            <div className="px-6 py-5 border-b border-white/60 bg-white/20">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-11 h-11 bg-white border border-slate-100 rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm shrink-0">
                                            <User className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h2 className="text-base font-bold text-slate-900 tracking-tight uppercase leading-none mb-1">{selectedQuery.subject}</h2>
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Support Reference: {selectedQuery._id.slice(-6).toUpperCase()}</p>
                                        </div>
                                    </div>
                                    <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                                        selectedQuery.status === 'PENDING' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
                                    }`}>
                                        {selectedQuery.status}
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar scroll-smooth bg-slate-50/5">
                                <AnimatePresence initial={false}>
                                    {selectedQuery.messages.map((msg, idx) => {
                                        const isUserSender = msg.senderRole === 'USER';
                                        return (
                                            <motion.div 
                                                key={idx}
                                                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                                className={`flex flex-col ${isUserSender ? 'items-end ml-auto' : 'items-start'} max-w-[90%]`}
                                            >
                                                <div className={`p-4 rounded-2xl ${
                                                    isUserSender 
                                                        ? 'bg-slate-900 text-white rounded-tr-none shadow-lg shadow-slate-500/10' 
                                                        : 'bg-white border border-emerald-100 text-slate-800 rounded-tl-none shadow-sm'
                                                }`}>
                                                    <p className="text-xs leading-relaxed font-bold">{msg.message}</p>
                                                </div>
                                                <div className={`flex items-center gap-2 mt-1.5 px-1 ${isUserSender ? 'flex-row-reverse' : ''}`}>
                                                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-300">
                                                        {format(new Date(msg.sentAt), 'HH:mm')}
                                                    </span>
                                                    {!isUserSender && (
                                                        <div className="px-1.5 py-0.5 bg-emerald-50 text-emerald-600 rounded-md flex items-center gap-1">
                                                            <span className="text-[7px] font-black uppercase tracking-widest">Engineering Team</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </AnimatePresence>
                            </div>

                            <div className="p-5 border-t border-white/60 bg-white/30">
                                {error && (
                                    <div className="mb-3 p-3 bg-red-50 text-red-600 text-[9px] font-black uppercase tracking-widest rounded-xl border border-red-100">
                                        {error}
                                    </div>
                                )}
                                <div className="relative">
                                    <textarea 
                                        placeholder={selectedQuery.status === 'RESOLVED' ? "Support ticket closed." : "Type your message to support..."}
                                        disabled={selectedQuery.status === 'RESOLVED'}
                                        className="w-full pl-5 pr-28 py-4 bg-white/90 border border-slate-100 rounded-2xl text-xs font-bold focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 outline-none transition-all resize-none shadow-sm disabled:bg-slate-50/50"
                                        rows={2}
                                        value={response}
                                        onChange={e => setResponse(e.target.value)}
                                    />
                                    <div className="absolute right-2 bottom-2">
                                        <button 
                                            disabled={sending || !response.trim() || selectedQuery.status === 'RESOLVED'}
                                            onClick={handleRespond}
                                            className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-emerald-600 hover:shadow-lg transition-all active:scale-95 disabled:opacity-40"
                                        >
                                            <span className="text-[9px] font-black uppercase tracking-widest">Update</span>
                                            {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50/10">
                            <div className="w-20 h-20 bg-white/60 backdrop-blur-sm border border-white/20 rounded-[2rem] flex items-center justify-center mb-6 shadow-xl shadow-slate-100/50">
                                <MessageSquare className="w-8 h-8 text-slate-200" />
                            </div>
                            <h2 className="text-xl font-bold text-slate-900 tracking-tight uppercase mb-2">Help Center</h2>
                            <p className="text-[10px] font-bold text-slate-400 max-w-[200px] mx-auto uppercase tracking-widest leading-relaxed">
                                Select a thread to continue support or open a new performance ticket.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* New Ticket Modal */}
            <AnimatePresence>
                {showNew && (
                    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowNew(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 15 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 15 }} className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden p-8">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight leading-none">Open Ticket</h3>
                                <button onClick={() => setShowNew(false)} className="p-2 hover:bg-slate-50 rounded-xl text-slate-400"><X className="w-5 h-5" /></button>
                            </div>
                            
                            <form onSubmit={handleCreate} className="space-y-6">
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Support Subject</label>
                                    <input type="text" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 outline-none text-xs font-bold transition-all" placeholder="E.g., Transaction timeout" value={newSubject} onChange={e => setNewSubject(e.target.value)} required />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Details</label>
                                    <textarea className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 outline-none text-xs font-bold transition-all resize-none" rows={4} placeholder="Summarize your operational issue..." value={newMessage} onChange={e => setNewMessage(e.target.value)} required />
                                </div>
                                <button type="submit" disabled={sending} className="w-full h-14 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-emerald-600 transition-all flex items-center justify-center gap-3 shadow-xl">
                                    {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                    Dispatch Support
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.05); border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,0.08); }
            `}</style>
        </div>
    );
};
