import { useState, useEffect, useCallback } from 'react';
import {
    MessageSquare, Send, CheckCircle2,
    ShieldCheck, User, Plus, RefreshCw, X, Loader2, Sparkles,
    Search, Clock, BookOpen, UserCheck, Inbox, ChevronRight, MessageCircle, HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { useAuth } from '../../context/AuthContext';
import * as chitMessageApi from '../../api/chitMessage.api';
import type { ChitHelpThread } from '../../api/chitMessage.api';

interface Group {
    _id: string;
    name: string;
    organizerId: {
        _id: string;
        name: string;
        email: string;
    };
}

interface NeedHelpTabProps {
    group: Group;
    isOrganizer: boolean;
}

export const NeedHelpTab = ({ group, isOrganizer }: NeedHelpTabProps) => {
    const { user } = useAuth();
    const [subTab, setSubTab] = useState<'MESSAGES' | 'LEADER' | 'RULES'>('MESSAGES');

    const [threads, setThreads] = useState<ChitHelpThread[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'OPEN' | 'RESOLVED'>('ALL');
    const [searchQuery, setSearchQuery] = useState('');
    const [isNewModalOpen, setIsNewModalOpen] = useState(false);

    // Form inputs
    const [newSubject, setNewSubject] = useState('');
    const [newMessage, setNewMessage] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Reply input
    const [replyText, setReplyText] = useState('');
    const [replying, setReplying] = useState(false);

    const loadThreads = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await chitMessageApi.fetchGroupThreads(group._id);
            setThreads(data);
            if (data.length > 0 && !activeThreadId) {
                setActiveThreadId(data[0]._id);
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to load support threads');
        } finally {
            setLoading(false);
        }
    }, [group._id, activeThreadId]);

    useEffect(() => {
        loadThreads();
    }, [loadThreads]);

    const activeThread = threads.find((t) => t._id === activeThreadId) || (threads.length > 0 ? threads[0] : null);

    const filteredThreads = threads.filter((t) => {
        const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
        const matchesSearch = searchQuery.trim() === '' ||
            t.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (t.memberId?.name && t.memberId.name.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchesStatus && matchesSearch;
    });

    const openCount = threads.filter((t) => t.status === 'OPEN').length;

    const handleCreateThread = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newSubject.trim() || !newMessage.trim()) return;

        setSubmitting(true);
        try {
            const created = await chitMessageApi.createHelpThread(group._id, newSubject.trim(), newMessage.trim());
            setThreads((prev) => [created, ...prev]);
            setActiveThreadId(created._id);
            setNewSubject('');
            setNewMessage('');
            setIsNewModalOpen(false);
            setSubTab('MESSAGES');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to send message');
        } finally {
            setSubmitting(false);
        }
    };

    const handleSendReply = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeThread || !replyText.trim()) return;

        setReplying(true);
        try {
            const updated = await chitMessageApi.replyToThread(activeThread._id, replyText.trim());
            setThreads((prev) => prev.map((t) => (t._id === updated._id ? updated : t)));
            setReplyText('');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to send reply');
        } finally {
            setReplying(false);
        }
    };

    const handleToggleStatus = async (threadId: string, currentStatus: 'OPEN' | 'RESOLVED') => {
        const nextStatus = currentStatus === 'OPEN' ? 'RESOLVED' : 'OPEN';
        try {
            const updated = await chitMessageApi.updateThreadStatus(threadId, nextStatus);
            setThreads((prev) => prev.map((t) => (t._id === updated._id ? updated : t)));
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to update thread status');
        }
    };

    const formatDateSafe = (dateStr: string) => {
        try {
            const d = new Date(dateStr);
            return isNaN(d.getTime()) ? '' : format(d, 'MMM dd, h:mm a');
        } catch {
            return '';
        }
    };

    return (
        <div className="space-y-4">
            {/* Top Header Controls (Matching Installments & Dues Header Structure) */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
                        <HelpCircle className="w-4 h-4" />
                        <span>Support & Guidelines</span>
                    </div>
                    <h2 className="text-xl font-black text-slate-900 tracking-tight">Need Circle Assistance?</h2>
                </div>

                {/* Sub-Tab Navigation Controls */}
                <div className="flex items-center gap-1.5 overflow-x-auto bg-slate-100 p-1 rounded-xl border border-slate-200/60">
                    <button
                        onClick={() => setSubTab('MESSAGES')}
                        className={`
                            px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer
                            ${subTab === 'MESSAGES'
                                ? 'bg-slate-900 text-white shadow-xs'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                            }
                        `}
                    >
                        <Inbox className="w-3.5 h-3.5" />
                        <span>Conversations</span>
                        {openCount > 0 && (
                            <span className="px-1.5 py-0.5 text-[9px] font-black rounded-full bg-emerald-500 text-white">
                                {openCount}
                            </span>
                        )}
                    </button>

                    <button
                        onClick={() => setSubTab('LEADER')}
                        className={`
                            px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer
                            ${subTab === 'LEADER'
                                ? 'bg-slate-900 text-white shadow-xs'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                            }
                        `}
                    >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Foreman Profile</span>
                    </button>

                    <button
                        onClick={() => setSubTab('RULES')}
                        className={`
                            px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer
                            ${subTab === 'RULES'
                                ? 'bg-slate-900 text-white shadow-xs'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                            }
                        `}
                    >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Circle Guidelines</span>
                    </button>
                </div>
            </div>

            {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-2xl flex items-center justify-between">
                    <span>{error}</span>
                    <button onClick={() => setError(null)} className="text-rose-500 hover:text-rose-700 cursor-pointer">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* ─── 1. DECOUPLED MESSAGING & CHAT VIEW ─── */}
            {subTab === 'MESSAGES' && (
                <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
                    {/* Messaging Control Bar */}
                    <div className="p-4 md:p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/40">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-slate-900 text-emerald-400 flex items-center justify-center font-black shadow-xs">
                                <MessageSquare className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-slate-900">
                                    {isOrganizer ? 'Member Inquiry Conversations' : 'Your Support Threads'}
                                </h3>
                                <p className="text-xs text-slate-500">
                                    {isOrganizer ? 'Respond to circle members in real-time' : 'Ask questions or discuss dues with the organizer'}
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            <button
                                onClick={loadThreads}
                                disabled={loading}
                                className="p-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition-all active:scale-95 cursor-pointer disabled:opacity-50 shadow-xs flex items-center justify-center shrink-0"
                                title="Refresh conversations"
                            >
                                <RefreshCw className={`w-4 h-4 text-emerald-400 ${loading ? 'animate-spin' : ''}`} />
                            </button>

                            {!isOrganizer && (
                                <button
                                    onClick={() => setIsNewModalOpen(true)}
                                    className="px-4 py-2.5 bg-slate-900 hover:bg-emerald-600 text-white text-xs font-bold uppercase tracking-wider rounded-xl flex items-center gap-2 transition shadow-xs cursor-pointer active:scale-95"
                                >
                                    <Plus className="w-4 h-4 text-emerald-400" />
                                    <span>New Inquiry</span>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Main Split Chat Layout */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[550px]">
                        {/* Left Sidebar: Threads List (4 cols) */}
                        <div className="lg:col-span-4 border-r border-slate-100 p-4 space-y-4 bg-slate-50/20">
                            {/* Search & Filter Controls */}
                            <div className="space-y-3">
                                <div className="relative">
                                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                    <input
                                        type="text"
                                        placeholder="Search topic or member..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-9 pr-4 py-2 bg-slate-100 border-none rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                                    />
                                </div>

                                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                                    {(['ALL', 'OPEN', 'RESOLVED'] as const).map((st) => (
                                        <button
                                            key={st}
                                            onClick={() => setStatusFilter(st)}
                                            className={`
                                                px-3 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer whitespace-nowrap
                                                ${statusFilter === st
                                                    ? 'bg-slate-900 text-white'
                                                    : 'text-slate-500 bg-slate-100 hover:bg-slate-200'
                                                }
                                            `}
                                        >
                                            {st}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Thread Cards List */}
                            <div className="space-y-2.5 max-h-[440px] overflow-y-auto pr-1">
                                {loading ? (
                                    <div className="py-12 flex justify-center text-slate-400">
                                        <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
                                    </div>
                                ) : filteredThreads.length === 0 ? (
                                    <div className="py-12 text-center text-slate-400 text-xs font-medium space-y-2">
                                        <Inbox className="w-8 h-8 mx-auto text-slate-300" />
                                        <p>No conversations found</p>
                                    </div>
                                ) : (
                                    filteredThreads.map((t) => {
                                        const isSelected = t._id === activeThreadId;
                                        const isResolved = t.status === 'RESOLVED';
                                        const lastMsg = t.messages[t.messages.length - 1];
                                        const senderName = isOrganizer ? (t.memberId?.name || 'Member') : group.organizerId.name;

                                        return (
                                            <div
                                                key={t._id}
                                                onClick={() => setActiveThreadId(t._id)}
                                                className={`
                                                    p-3.5 rounded-2xl border transition-all cursor-pointer space-y-2
                                                    ${isSelected
                                                        ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                                                        : 'bg-white hover:bg-slate-100/80 border-slate-200/60 text-slate-800'
                                                    }
                                                `}
                                            >
                                                <div className="flex items-center justify-between gap-2">
                                                    <h4 className={`font-bold text-xs truncate ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                                                        {t.subject}
                                                    </h4>
                                                    <span className={`
                                                        px-2 py-0.5 rounded-full text-[9px] font-black shrink-0 uppercase tracking-wider
                                                        ${isResolved
                                                            ? (isSelected ? 'bg-slate-800 text-slate-300' : 'bg-slate-200 text-slate-600')
                                                            : (isSelected ? 'bg-emerald-500 text-white' : 'bg-emerald-100 text-emerald-800')
                                                        }
                                                    `}>
                                                        {t.status}
                                                    </span>
                                                </div>

                                                <p className={`text-[11px] line-clamp-1 ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                                                    {lastMsg?.text || 'No messages yet'}
                                                </p>

                                                <div className="flex items-center justify-between text-[10px] pt-1">
                                                    <span className={isSelected ? 'text-slate-400' : 'text-slate-400'}>
                                                        {isOrganizer ? `From: ${senderName}` : `With Foreman`}
                                                    </span>
                                                    <span className={isSelected ? 'text-slate-400' : 'text-slate-400'}>
                                                        {formatDateSafe(t.updatedAt)}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                        {/* Right Section: Active Chat Conversation Box (8 cols) */}
                        <div className="lg:col-span-8 p-4 md:p-6 flex flex-col justify-between bg-white h-full">
                            {activeThread ? (
                                <>
                                    {/* Chat Box Header */}
                                    <div className="pb-4 border-b border-slate-100 flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-2xl bg-slate-900 text-emerald-400 flex items-center justify-center font-black">
                                                {isOrganizer ? activeThread.memberId?.name?.charAt(0).toUpperCase() : group.organizerId.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <h3 className="text-base font-black text-slate-900 leading-tight">
                                                    {activeThread.subject}
                                                </h3>
                                                <p className="text-xs text-slate-500 mt-0.5">
                                                    Participant: <span className="font-bold text-slate-700">{isOrganizer ? activeThread.memberId?.name : group.organizerId.name}</span> ({isOrganizer ? activeThread.memberId?.email : group.organizerId.email})
                                                </p>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => handleToggleStatus(activeThread._id, activeThread.status)}
                                            className={`
                                                px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs
                                                ${activeThread.status === 'OPEN'
                                                    ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
                                                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                                                }
                                            `}
                                        >
                                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                            <span>{activeThread.status === 'OPEN' ? 'Mark Resolved' : 'Reopen Thread'}</span>
                                        </button>
                                    </div>

                                    {/* Chat Message History Feed */}
                                    <div className="flex-1 overflow-y-auto py-4 space-y-4 my-2 pr-2">
                                        {activeThread.messages.map((m, idx) => {
                                            const isMe = m.senderId === user?.id;
                                            return (
                                                <div
                                                    key={m._id || idx}
                                                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                                                >
                                                    <div className="flex items-center gap-2 mb-1 px-1">
                                                        <span className="text-[10px] font-bold text-slate-600">
                                                            {m.senderName} ({m.senderRole})
                                                        </span>
                                                        <span className="text-[9px] font-medium text-slate-400">
                                                            {formatDateSafe(m.sentAt)}
                                                        </span>
                                                    </div>

                                                    <div className={`
                                                        p-4 rounded-2xl max-w-lg text-xs leading-relaxed font-medium shadow-xs
                                                        ${isMe
                                                            ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-br-xs'
                                                            : 'bg-slate-100 text-slate-800 border border-slate-200/80 rounded-bl-xs'
                                                        }
                                                    `}>
                                                        {m.text}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Interactive Reply Bar */}
                                    <form onSubmit={handleSendReply} className="pt-3 border-t border-slate-100 flex items-center gap-3">
                                        <input
                                            type="text"
                                            placeholder="Type your message or response here..."
                                            value={replyText}
                                            onChange={(e) => setReplyText(e.target.value)}
                                            disabled={replying}
                                            className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition"
                                        />
                                        <button
                                            type="submit"
                                            disabled={replying || !replyText.trim()}
                                            className="px-5 py-3 bg-slate-900 hover:bg-emerald-600 text-white text-xs font-bold rounded-2xl flex items-center gap-2 transition cursor-pointer disabled:opacity-40 shadow-sm active:scale-95"
                                        >
                                            {replying ? <Loader2 className="w-4 h-4 animate-spin text-emerald-400" /> : <Send className="w-4 h-4 text-emerald-400" />}
                                            <span>Send Reply</span>
                                        </button>
                                    </form>
                                </>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-slate-400 text-xs space-y-3">
                                    <div className="w-16 h-16 bg-slate-900 text-emerald-400 rounded-2xl flex items-center justify-center mb-3 shadow-md"><Inbox className="w-8 h-8" /></div>
                                    <p className="font-bold text-slate-600">Select a conversation thread on the left</p>
                                    <p className="text-[11px] text-slate-400">View message history and respond in real-time</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ─── 2. DECOUPLED LEADER PROFILE VIEW ─── */}
            {subTab === 'LEADER' && (
                <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
                    <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                        <div className="w-12 h-12 rounded-2xl bg-slate-900 text-emerald-400 flex items-center justify-center font-black shadow-md">
                            <UserCheck className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-slate-900">Circle Foreman Profile</h3>
                            <p className="text-xs text-slate-500">Official Chit Group Organizer & Administrator</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="p-6 bg-slate-50 rounded-2xl space-y-4 border border-slate-100">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white font-black text-lg flex items-center justify-center">
                                    {group.organizerId.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h4 className="text-base font-bold text-slate-900">{group.organizerId.name}</h4>
                                    <p className="text-xs text-slate-500">{group.organizerId.email}</p>
                                </div>
                            </div>

                            <div className="pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs">
                                <span className="text-slate-500 font-medium">Role:</span>
                                <span className="px-3 py-1 bg-emerald-100 text-emerald-800 font-bold rounded-lg text-[11px]">
                                    Verified Organizer
                                </span>
                            </div>
                        </div>

                        <div className="p-6 bg-slate-50 rounded-2xl space-y-4 border border-slate-100 flex flex-col justify-between">
                            <div className="space-y-2 text-xs">
                                <h4 className="font-bold text-slate-900 text-sm">Direct In-App Communication</h4>
                                <p className="text-slate-500 leading-relaxed">
                                    Send inquiries regarding chit cycles, monthly dues, late fee waivers, or auction bidding directly to {group.organizerId.name}.
                                </p>
                            </div>

                            {!isOrganizer ? (
                                <button
                                    onClick={() => {
                                        setIsNewModalOpen(true);
                                    }}
                                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition cursor-pointer active:scale-95 shadow-sm"
                                >
                                    <MessageSquare className="w-4 h-4" />
                                    <span>Send Message to Organizer</span>
                                </button>
                            ) : (
                                <div className="p-3 bg-slate-200/60 text-slate-700 text-center rounded-xl text-xs font-bold">
                                    You are managing this Chit Circle
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ─── 3. DECOUPLED CIRCLE RULES & GUIDELINES VIEW ─── */}
            {subTab === 'RULES' && (
                <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
                    <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                        <div className="w-12 h-12 rounded-2xl bg-slate-900 text-emerald-400 flex items-center justify-center font-black shadow-md">
                            <BookOpen className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-slate-900">Circle Operating Rules & FAQs</h3>
                            <p className="text-xs text-slate-500">Standard guidelines for monthly contributions, bidding, and payouts</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-2 text-xs">
                            <div className="w-8 h-8 rounded-xl bg-slate-900 text-emerald-400 flex items-center justify-center font-bold mb-2 shadow-2xs">
                                1
                            </div>
                            <h4 className="font-bold text-slate-900 text-sm">Monthly Contributions</h4>
                            <p className="text-slate-500 leading-relaxed">
                                Dues are collected every cycle before the scheduled auction date. Late payments accrue configured penalty fees.
                            </p>
                        </div>

                        <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-2 text-xs">
                            <div className="w-8 h-8 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center font-bold mb-2 shadow-2xs">
                                2
                            </div>
                            <h4 className="font-bold text-slate-900 text-sm">Auction & Bidding</h4>
                            <p className="text-slate-500 leading-relaxed">
                                Non-winning members submit discount percentage bids during active auction windows. The lowest/highest qualifying bid wins.
                            </p>
                        </div>

                        <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-2 text-xs">
                            <div className="w-8 h-8 rounded-xl bg-slate-900 text-sky-400 flex items-center justify-center font-bold mb-2 shadow-2xs">
                                3
                            </div>
                            <h4 className="font-bold text-slate-900 text-sm">Prize & Dividend</h4>
                            <p className="text-slate-500 leading-relaxed">
                                Winning member receives net pot amount after deducting organizer commission. Remaining discount is distributed as dividend.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* New Inquiry Modal */}
            <AnimatePresence>
                {isNewModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsNewModalOpen(false)}
                            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
                        />

                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 z-10 overflow-hidden"
                        >
                            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-9 h-9 rounded-xl bg-slate-900 text-emerald-400 flex items-center justify-center font-bold shadow-xs">
                                        <Sparkles className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-bold text-slate-900">New In-App Inquiry</h3>
                                        <p className="text-xs text-slate-500">Send a message to {group.organizerId.name}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsNewModalOpen(false)}
                                    className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleCreateThread} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                        Subject / Topic <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Question about Cycle #2 auction date"
                                        value={newSubject}
                                        onChange={(e) => setNewSubject(e.target.value)}
                                        required
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                        Your Message <span className="text-rose-500">*</span>
                                    </label>
                                    <textarea
                                        rows={4}
                                        placeholder="Type your question or query for the organizer here..."
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        required
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 resize-none"
                                    />
                                </div>

                                <div className="flex items-center justify-end gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setIsNewModalOpen(false)}
                                        className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitting || !newSubject.trim() || !newMessage.trim()}
                                        className="px-5 py-2.5 bg-slate-900 hover:bg-emerald-600 text-white text-xs font-bold uppercase tracking-wider rounded-xl flex items-center gap-2 transition cursor-pointer disabled:opacity-50"
                                    >
                                        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 text-emerald-400" />}
                                        <span>Submit Inquiry</span>
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};
