import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Loader } from '../../components/ui/Loader';
import { AlertTriangle, CheckCircle, XCircle, Search, Users, MapPin, Briefcase, IndianRupee, Loader2, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Application {
    _id: string;
    name: string;
    email: string;
    profilePictureUrl?: string;
    kycStatus: string;
    accountStatus: string;
    createdAt: string;
    organizerApplicationReason: string;
    expectedChitValueRange: string;
    expectedGroupSizeRange?: string;
    city: string;
    occupation: string;
    incomeRange: string;
}

const CHIT_VALUE_LABELS: Record<string, string> = {
    UP_TO_1_LAKH: 'Up to ₹1 Lakh',
    ONE_TO_FIVE_LAKH: '₹1–5 Lakhs',
    FIVE_TO_TEN_LAKH: '₹5–10 Lakhs',
    TEN_TO_TWENTY_FIVE_LAKH: '₹10–25 Lakhs',
    ABOVE_TWENTY_FIVE_LAKH: 'Above ₹25 Lakhs'
};

const GROUP_SIZE_LABELS: Record<string, string> = {
    SMALL_5_TO_10: '5–10 Members',
    MEDIUM_10_TO_20: '10–20 Members',
    LARGE_20_TO_50: '20–50 Members',
    VERY_LARGE_50_PLUS: '50+ Members'
};

export const OrganizerApplications = () => {
    const [applications, setApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    const [expandedId, setExpandedId] = useState<string | null>(null);
    
    // Modal state for rejection
    const [rejectingApp, setRejectingApp] = useState<Application | null>(null);
    const [confirmingApp, setConfirmingApp] = useState<Application | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [processingId, setProcessingId] = useState<string | null>(null);

    const fetchApps = async () => {
        setLoading(true);
        try {
            const res = await api.get('/organizer/applications');
            setApplications(res.data.data.applications);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to fetch applications');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchApps();
    }, []);

    const handleApprove = async () => {
        if (!confirmingApp) return;
        const id = confirmingApp._id;
        setProcessingId(id);
        setError('');
        try {
            await api.post(`/organizer/approve/${id}`);
            // Remove from list
            setApplications(apps => apps.filter(a => a._id !== id));
            if (expandedId === id) setExpandedId(null);
            setConfirmingApp(null);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to approve application');
        } finally {
            setProcessingId(null);
        }
    };

    const submitRejection = async () => {
        if (!rejectingApp) return;
        if (rejectionReason.length < 5) return setError('Please provide a valid reason.');

        setProcessingId(rejectingApp._id);
        setError('');
        try {
            await api.post(`/organizer/reject/${rejectingApp._id}`, { reason: rejectionReason });
            setApplications(apps => apps.filter(a => a._id !== rejectingApp._id));
            if (expandedId === rejectingApp._id) setExpandedId(null);
            setRejectingApp(null);
            setRejectionReason('');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to reject application');
        } finally {
            setProcessingId(null);
        }
    };

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center">
                <Loader size="lg" />
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col gap-4 animate-in fade-in duration-500">
            {/* Reduced Header */}
            <div className="flex items-center justify-between bg-white/50 backdrop-blur-md px-6 py-4 rounded-3xl border border-white/40 shadow-lg shadow-slate-100/50">
                <div>
                    <h1 className="text-xl font-bold text-slate-900 tracking-tight uppercase leading-tight">Organizer Applications</h1>
                    <p className="text-[9px] font-bold text-slate-400 mt-0.5 uppercase tracking-widest leading-none">Reviewing infrastructure capability.</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-slate-50/50 rounded-2xl border border-slate-100">
                    <div className="w-6 h-6 bg-emerald-100 text-emerald-800 rounded-lg flex items-center justify-center font-black text-xs">
                        {applications.length}
                    </div>
                    <span className="font-black text-slate-600 uppercase tracking-widest text-[9px]">Reviewing</span>
                </div>
            </div>

            {error && (
                <div className="p-3 bg-red-50 text-red-600 border border-red-100 rounded-xl flex items-center gap-2 text-[10px] uppercase font-black tracking-widest">
                    <AlertTriangle className="w-3.5 h-3.5" /> {error}
                </div>
            )}

            {/* Compact Application List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                <AnimatePresence mode="popLayout">
                    {applications.length === 0 ? (
                        <motion.div 
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white/60 backdrop-blur-sm border border-slate-100 rounded-3xl flex flex-col items-center justify-center text-center p-12 min-h-[300px]"
                        >
                            <div className="w-16 h-16 bg-slate-50 text-slate-200 rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-slate-100/50">
                                <Search className="w-8 h-8" />
                            </div>
                            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Queue is Clear</h3>
                            <p className="text-[10px] text-slate-400 font-bold max-w-[200px] mt-2 uppercase tracking-widest leading-relaxed">No pending organizer applications found. All requests have been processed.</p>
                        </motion.div>
                    ) : (
                        applications.map(app => (
                            <motion.div
                                key={app._id}
                                layout
                                initial={{ opacity: 0, x: -15 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 15 }}
                                className="bg-white p-3.5 rounded-2xl border border-slate-100 hover:border-emerald-500/20 hover:shadow-lg hover:shadow-emerald-500/5 transition-all group flex items-center justify-between"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-11 h-11 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center font-black text-slate-400 overflow-hidden shadow-inner group-hover:scale-105 transition-transform">
                                        {app.profilePictureUrl ? (
                                            <img src={app.profilePictureUrl} className="w-full h-full object-cover" alt={app.name} />
                                        ) : (
                                            app.name.charAt(0).toUpperCase()
                                        )}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <span className="text-xs font-bold text-slate-900">{app.name}</span>
                                            {app.kycStatus === 'APPROVED' && (
                                                <span className="px-1.5 py-0.5 rounded-md bg-green-50 text-green-700 text-[8px] font-black uppercase tracking-wider border border-green-100 flex items-center gap-1">
                                                    <CheckCircle className="w-2.5 h-2.5" /> Verified
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{app.email}</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setExpandedId(app._id)}
                                    className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-colors flex items-center gap-2 shadow-md shadow-slate-100"
                                >
                                    Review App <ArrowRight className="w-3 h-3" />
                                </button>
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
            </div>

            {/* Compact Detail Modal */}
            <AnimatePresence>
                {expandedId && (
                    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setExpandedId(null)}
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                        />
                        
                        {(() => {
                            const app = applications.find(a => a._id === expandedId);
                            if (!app) return null;
                            return (
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.95, y: 15 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: 15 }}
                                    className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                                >
                                    {/* Modal Header */}
                                    <div className="p-6 border-b border-slate-50 flex items-center justify-between shrink-0">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-emerald-100 overflow-hidden">
                                                {app.profilePictureUrl ? (
                                                    <img src={app.profilePictureUrl} className="w-full h-full object-cover" alt="" />
                                                ) : (
                                                    app.name.charAt(0).toUpperCase()
                                                )}
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-slate-900 uppercase tracking-tight">{app.name}</h3>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Applied: {new Date(app.createdAt).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <button onClick={() => setExpandedId(null)} className="p-2.5 bg-slate-50 rounded-xl text-slate-400 hover:text-slate-900 transition-colors">
                                            <XCircle className="w-5 h-5" />
                                        </button>
                                    </div>

                                    {/* Modal Body */}
                                    <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                                        {/* Compact Data Grid */}
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 space-y-1">
                                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Market</p>
                                                <div className="flex items-center gap-1.5">
                                                    <MapPin className="w-3 h-3 text-emerald-600" />
                                                    <p className="text-xs font-bold text-slate-800 uppercase tracking-tight">{app.city}</p>
                                                </div>
                                            </div>
                                            <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 space-y-1">
                                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Profession</p>
                                                <div className="flex items-center gap-1.5">
                                                    <Briefcase className="w-3 h-3 text-emerald-600" />
                                                    <p className="text-xs font-bold text-slate-800 uppercase tracking-tight">{app.occupation}</p>
                                                </div>
                                            </div>
                                            <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 space-y-1">
                                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Chit Scale</p>
                                                <div className="flex items-center gap-1.5">
                                                    <IndianRupee className="w-3 h-3 text-emerald-600" />
                                                    <p className="text-xs font-bold text-slate-800 uppercase tracking-tight">{CHIT_VALUE_LABELS[app.expectedChitValueRange]}</p>
                                                </div>
                                            </div>
                                            <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 space-y-1">
                                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Group Vol.</p>
                                                <div className="flex items-center gap-1.5">
                                                    <Users className="w-3 h-3 text-emerald-600" />
                                                    <p className="text-xs font-bold text-slate-800 uppercase tracking-tight">{app.expectedGroupSizeRange ? GROUP_SIZE_LABELS[app.expectedGroupSizeRange] : 'Any Size'}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Compact Pitch Box */}
                                        <div className="bg-emerald-50/30 p-6 rounded-3xl border border-emerald-100/50 relative">
                                            <div className="absolute -top-2.5 left-6 px-3 py-1 bg-emerald-600 text-white text-[8px] font-black uppercase tracking-widest rounded-lg shadow-md">
                                                Applicant Strategy
                                            </div>
                                            <p className="text-slate-600 text-xs leading-relaxed italic font-medium pt-1">
                                                "{app.organizerApplicationReason}"
                                            </p>
                                        </div>
                                    </div>

                                    {/* Action Footer */}
                                    <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex items-center justify-end gap-2.5 shrink-0">
                                        <button 
                                            onClick={() => setRejectingApp(app)}
                                            disabled={processingId === app._id}
                                            className="h-11 px-6 border border-red-100 text-red-600 bg-white hover:bg-red-50 font-black rounded-xl text-[9px] uppercase tracking-widest flex items-center gap-2 transition"
                                        >
                                            <XCircle className="w-3.5 h-3.5" /> Reject
                                        </button>
                                        <button 
                                            onClick={() => setConfirmingApp(app)}
                                            disabled={processingId === app._id}
                                            className="h-11 px-8 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-[9px] uppercase tracking-widest flex items-center gap-2 transition shadow-lg shadow-emerald-500/10"
                                        >
                                            <CheckCircle className="w-3.5 h-3.5" /> Approve
                                        </button>
                                    </div>
                                </motion.div>
                            );
                        })()}
                    </div>
                )}
            </AnimatePresence>

            {/* Compact Confirmation Modal */}
            <AnimatePresence>
                {confirmingApp && (
                    <div className="fixed inset-0 z-[2005] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 15 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 15 }}
                            className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl p-8 text-center"
                        >
                            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner transform rotate-2">
                                <CheckCircle className="w-10 h-10" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 uppercase tracking-tight mb-2 leading-none">Confirm Approval</h3>
                            <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest mb-8 leading-relaxed px-2">
                                Grant <span className="text-emerald-600">Full Privileges</span> to {confirmingApp.name}? They will be able to host and manage groups immediately.
                            </p>
                            <div className="grid grid-cols-2 gap-2.5">
                                <button 
                                    onClick={() => setConfirmingApp(null)} 
                                    className="h-11 rounded-xl font-black text-slate-400 hover:bg-slate-50 transition uppercase tracking-[0.2em] text-[8px]"
                                >
                                    Go Back
                                </button>
                                <button 
                                    onClick={handleApprove}
                                    disabled={processingId === confirmingApp._id}
                                    className="h-11 bg-emerald-600 text-white font-black rounded-xl hover:bg-emerald-700 transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10 uppercase tracking-[0.2em] text-[8px]"
                                >
                                    {processingId === confirmingApp._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Briefcase className="w-3 h-3" /> Finalize</>}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
            
            <AnimatePresence>
                {rejectingApp && (
                    <div className="fixed inset-0 z-[2000] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 15 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 15 }}
                            className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl p-8"
                        >
                            <div className="mb-6">
                                <h3 className="text-xl font-bold text-slate-900 uppercase tracking-tight">Decline App</h3>
                                <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-widest">Feedback for {rejectingApp.name}</p>
                            </div>
                            <textarea 
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                className="w-full resize-none bg-slate-50 border border-slate-100 rounded-2xl p-5 text-xs font-bold text-slate-800 focus:bg-white focus:border-red-500/20 transition-all outline-none min-h-[120px]"
                                rows={4}
                                placeholder="State the audit finding..."
                            />
                            <div className="grid grid-cols-2 gap-2.5 mt-6">
                                <button onClick={() => setRejectingApp(null)} className="h-11 rounded-xl font-black text-[9px] uppercase tracking-widest text-slate-400 hover:bg-slate-50">Cancel</button>
                                <button onClick={submitRejection} disabled={processingId === rejectingApp._id} className="h-11 bg-red-600 text-white font-black rounded-xl hover:bg-red-700 transition flex items-center justify-center gap-2 shadow-lg shadow-red-500/10 text-[9px] uppercase tracking-widest">
                                    {processingId === rejectingApp._id ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.05); border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,0.1); }
            `}</style>
        </div>
    );
};
