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

    const handleApprove = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to approve ${name} as an organizer?`)) return;
        setProcessingId(id);
        setError('');
        try {
            await api.post(`/organizer/approve/${id}`);
            // Remove from list
            setApplications(apps => apps.filter(a => a._id !== id));
            if (expandedId === id) setExpandedId(null);
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
        <div className="h-full flex flex-col gap-6 animate-in fade-in duration-700">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Organizer Applications</h1>
                    <p className="text-sm text-slate-500 mt-1">Review pending requests to start Chit groups</p>
                </div>
            </div>

            {error && (
                <div className="p-4 bg-red-50 text-red-600 border border-red-100 rounded-xl flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" /> {error}
                </div>
            )}

            {/* Application List */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                <AnimatePresence mode="popLayout">
                    {applications.length === 0 ? (
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white border border-slate-100 rounded-[2.5rem] flex flex-col items-center justify-center text-center p-12 min-h-[400px]"
                        >
                            <div className="w-20 h-20 bg-slate-50 text-slate-200 rounded-full flex items-center justify-center mb-6">
                                <Search className="w-10 h-10" />
                            </div>
                            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Queue is Clear</h3>
                            <p className="text-sm text-slate-400 font-bold max-w-xs mt-2">No pending organizer applications found. Everything is up to date.</p>
                        </motion.div>
                    ) : (
                        applications.map(app => (
                            <motion.div
                                key={app._id}
                                layout
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="bg-white p-4 rounded-[2rem] border border-slate-100 hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-50/50 transition-all group flex items-center justify-between"
                            >
                                <div className="flex items-center gap-5">
                                    <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center font-black text-slate-400 overflow-hidden shadow-inner group-hover:scale-105 transition-transform">
                                        {app.profilePictureUrl ? (
                                            <img src={app.profilePictureUrl} className="w-full h-full object-cover" alt={app.name} />
                                        ) : (
                                            app.name.charAt(0).toUpperCase()
                                        )}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <span className="font-extrabold text-slate-900">{app.name}</span>
                                            {app.kycStatus === 'APPROVED' && (
                                                <span className="px-2 py-0.5 rounded-full bg-green-50 text-green-700 text-[9px] font-black uppercase tracking-wider border border-green-100 flex items-center gap-1">
                                                    <CheckCircle className="w-2.5 h-2.5" /> Verified
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-slate-400 font-bold">{app.email}</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setExpandedId(app._id)}
                                    className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-600 transition-colors flex items-center gap-2 shadow-lg shadow-slate-100"
                                >
                                    Review <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
            </div>

            {/* Detail Modal */}
            <AnimatePresence>
                {expandedId && (
                    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setExpandedId(null)}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
                        />
                        
                        {(() => {
                            const app = applications.find(a => a._id === expandedId);
                            if (!app) return null;
                            return (
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                    className="relative w-full max-w-2xl bg-white rounded-[3rem] shadow-2xl overflow-hidden flex flex-col flex-none max-h-[90vh]"
                                >
                                    {/* Modal Header */}
                                    <div className="p-8 border-b border-slate-50 flex items-center justify-between shrink-0">
                                        <div className="flex items-center gap-5">
                                            <div className="w-16 h-16 rounded-[1.5rem] bg-emerald-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-emerald-100 overflow-hidden">
                                                {app.profilePictureUrl ? (
                                                    <img src={app.profilePictureUrl} className="w-full h-full object-cover" alt="" />
                                                ) : (
                                                    app.name.charAt(0).toUpperCase()
                                                )}
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">{app.name}</h3>
                                                <p className="text-xs font-bold text-slate-400">Application submitted on {new Date(app.createdAt).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <button onClick={() => setExpandedId(null)} className="p-3 bg-slate-50 rounded-2xl text-slate-400 hover:text-slate-900 transition-colors">
                                            <XCircle className="w-6 h-6" />
                                        </button>
                                    </div>

                                    {/* Modal Body */}
                                    <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                                        {/* Data Grid */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="p-5 bg-slate-50 rounded-[2rem] border border-slate-100 space-y-1">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Target Market</p>
                                                <div className="flex items-center gap-2">
                                                    <MapPin className="w-4 h-4 text-emerald-600" />
                                                    <p className="text-sm font-black text-slate-800">{app.city}</p>
                                                </div>
                                            </div>
                                            <div className="p-5 bg-slate-50 rounded-[2rem] border border-slate-100 space-y-1">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Occupation</p>
                                                <div className="flex items-center gap-2">
                                                    <Briefcase className="w-4 h-4 text-emerald-600" />
                                                    <p className="text-sm font-black text-slate-800">{app.occupation}</p>
                                                </div>
                                            </div>
                                            <div className="p-5 bg-slate-50 rounded-[2rem] border border-slate-100 space-y-1">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Expected Scale</p>
                                                <div className="flex items-center gap-2">
                                                    <IndianRupee className="w-4 h-4 text-emerald-600" />
                                                    <p className="text-sm font-black text-slate-800">{CHIT_VALUE_LABELS[app.expectedChitValueRange]}</p>
                                                </div>
                                            </div>
                                            <div className="p-5 bg-slate-50 rounded-[2rem] border border-slate-100 space-y-1">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Anticipated Group</p>
                                                <div className="flex items-center gap-2">
                                                    <Users className="w-4 h-4 text-emerald-600" />
                                                    <p className="text-sm font-black text-slate-800">{app.expectedGroupSizeRange ? GROUP_SIZE_LABELS[app.expectedGroupSizeRange] : 'Any Size'}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Pitch Box */}
                                        <div className="bg-emerald-50/50 p-8 rounded-[2.5rem] border border-emerald-100 relative group">
                                            <div className="absolute -top-3 left-8 px-4 py-1.5 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg">
                                                Organizer Vision
                                            </div>
                                            <p className="text-slate-700 text-sm leading-relaxed italic font-medium pt-2">
                                                "{app.organizerApplicationReason}"
                                            </p>
                                        </div>
                                    </div>

                                    {/* Action Footer */}
                                    <div className="p-8 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
                                        <button 
                                            onClick={() => setRejectingApp(app)}
                                            disabled={processingId === app._id}
                                            className="h-14 px-8 border-2 border-red-100 text-red-600 bg-white hover:bg-red-50 font-black rounded-2xl text-xs uppercase tracking-widest flex items-center gap-2 transition"
                                        >
                                            <XCircle className="w-4 h-4" /> Reject Applicant
                                        </button>
                                        <button 
                                            onClick={() => handleApprove(app._id, app.name)}
                                            disabled={processingId === app._id}
                                            className="h-14 px-10 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl text-xs uppercase tracking-widest flex items-center gap-2 transition shadow-xl shadow-emerald-100"
                                        >
                                            {processingId === app._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />} Approve Organizer
                                        </button>
                                    </div>
                                </motion.div>
                            );
                        })()}
                    </div>
                )}
            </AnimatePresence>

            {/* Rejection Modal */}
            <AnimatePresence>
                {rejectingApp && (
                    <div className="fixed inset-0 z-[2000] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-white rounded-[3rem] w-full max-w-md overflow-hidden shadow-2xl p-10"
                        >
                            <div className="mb-8">
                                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Decline Application</h3>
                                <p className="text-xs font-bold text-slate-400 mt-1">Provide feedback for {rejectingApp.name}</p>
                            </div>
                            <textarea 
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                className="w-full resize-none bg-slate-50 border-4 border-transparent rounded-[2rem] p-6 text-sm font-bold text-slate-800 focus:bg-white focus:border-red-100 transition-all outline-none"
                                rows={4}
                                placeholder="E.g., Missing business details..."
                            />
                            <div className="grid grid-cols-2 gap-3 mt-8">
                                <button onClick={() => setRejectingApp(null)} className="h-14 rounded-2xl font-black text-slate-400 hover:bg-slate-50">Cancel</button>
                                <button onClick={submitRejection} disabled={processingId === rejectingApp._id} className="h-14 bg-red-600 text-white font-black rounded-2xl hover:bg-red-700 transition flex items-center justify-center gap-2 shadow-xl shadow-red-100">
                                    {processingId === rejectingApp._id ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 5px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 20px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
            `}</style>
        </div>
    );
};
