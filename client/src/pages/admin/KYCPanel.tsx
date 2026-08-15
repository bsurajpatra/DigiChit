import { useEffect, useState } from 'react';
import { Loader } from '../../components/ui/Loader';
import { ErrorMessage } from '../../components/ui/ErrorMessage';
import { RefreshCw,
    Check, X, Maximize2, 
    ArrowRight, Eye, EyeOff,
    ShieldCheck
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import api from '../../api/axios';

interface KYCRecord {
    _id: string;
    userId: {
        _id: string;
        name: string;
        email: string;
        age: number;
    };
    aadhaarLast4: string;
    aadhaarFull?: string;
    documentUrl: string;
    selfieUrl: string;
    status: string;
    createdAt: string;
}

export const KYCPanel = () => {
    const [pendingKycs, setPendingKycs] = useState<KYCRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [rejectingId, setRejectingId] = useState<string | null>(null);
    const [rejectReason, setRejectReason] = useState('');
    const [selectedImage, setSelectedImage] = useState<{ url: string; title: string } | null>(null);
    const [selectedKyc, setSelectedKyc] = useState<KYCRecord | null>(null);
    const [showFullAadhaar, setShowFullAadhaar] = useState(false);

    const fetchPending = async () => {
        try {
            setIsLoading(true);
            const res = await api.get('/kyc/pending');
            setPendingKycs(res.data.data.pendings);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to fetch pending KYC requests');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchPending();
    }, []);

    const handleReview = async (kycId: string, status: 'APPROVED' | 'REJECTED', reason?: string) => {
        try {
            await api.post('/kyc/review', { kycId, status, rejectionReason: reason });
            setPendingKycs(prev => prev.filter(k => k._id !== kycId));
            if (rejectingId === kycId) setRejectingId(null);
            setSelectedKyc(null);
            setRejectReason('');
            setShowFullAadhaar(false);
        } catch (err: any) {
            setError(err.response?.data?.message || `Failed to ${status.toLowerCase()} KYC`);
        }
    };

    const getProxyUrl = (userId: string, field: 'document' | 'selfie') => {
        const token = localStorage.getItem('token') || '';
        return `${import.meta.env.VITE_API_URL || ''}/kyc/admin/view/${userId}/${field}?token=${token}`;
    };

    const formatAadhaar = (aadhaar: string) => {
        if (!aadhaar) return 'XXXX XXXX XXXX';
        if (showFullAadhaar) return aadhaar.replace(/(\d{4})/g, '$1 ').trim();
        return `XXXX XXXX ${aadhaar.slice(-4)}`;
    };

    if (isLoading) return <div className="h-[80vh] flex items-center justify-center"><Loader size="lg" /></div>;

    return (
        <div className="h-full flex flex-col gap-4 animate-in fade-in duration-500">
            {/* Reduced Header */}
            <div className="flex items-center justify-between bg-white/50 backdrop-blur-md px-6 py-4 rounded-3xl border border-white/40 shadow-lg shadow-slate-100/50">
                <div>
                    <h1 className="text-xl font-bold text-slate-900 tracking-tight uppercase leading-tight">KYC Approvals</h1>
                    <p className="text-[9px] font-bold text-slate-400 mt-0.5 uppercase tracking-widest leading-none">Identity verification queue.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchPending} disabled={isLoading}
                        className="p-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition-all active:scale-95 cursor-pointer disabled:opacity-50 shadow-xs flex items-center justify-center"
                        title="Refresh KYC Queue"
                    >
                        <RefreshCw className={`w-4 h-4 text-emerald-400 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                    <div className="flex items-center gap-2 px-4 py-2 bg-slate-50/50 rounded-2xl border border-slate-100">
                        <div className="w-6 h-6 bg-blue-100 text-blue-800 rounded-lg flex items-center justify-center font-black text-xs">
                            {pendingKycs.length}
                        </div>
                        <span className="font-black text-slate-600 uppercase tracking-widest text-[9px]">Pending</span>
                    </div>
                </div>
            </div>

            <ErrorMessage message={error} />

            {/* Compact KYC List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                <AnimatePresence mode="popLayout">
                    {pendingKycs.length === 0 ? (
                        <motion.div 
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white/60 backdrop-blur-sm border border-slate-100 rounded-3xl flex flex-col items-center justify-center text-center p-12 min-h-[300px]"
                        >
                            <div className="w-16 h-16 bg-slate-900 text-emerald-400 rounded-2xl flex items-center justify-center mb-6 shadow-md">
                                <ShieldCheck className="w-8 h-8" />
                            </div>
                            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Queue is Clear</h3>
                            <p className="text-[10px] text-slate-400 font-bold max-w-[200px] mt-2 uppercase tracking-widest leading-relaxed">No pending identity verification requests found.</p>
                        </motion.div>
                    ) : (
                        pendingKycs.map(kyc => (
                            <motion.div
                                key={kyc._id}
                                layout
                                initial={{ opacity: 0, x: -15 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 15 }}
                                className="bg-white p-3.5 rounded-2xl border border-slate-100 hover:border-blue-500/20 hover:shadow-lg hover:shadow-blue-500/5 transition-all group flex items-center justify-between"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-11 h-11 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center font-black text-slate-400 overflow-hidden shadow-inner group-hover:scale-105 transition-transform">
                                        {kyc.userId.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <span className="text-xs font-bold text-slate-900">{kyc.userId.name}</span>
                                            <span className="px-1.5 py-0.5 rounded-md bg-orange-50 text-orange-600 text-[8px] font-black uppercase tracking-wider border border-orange-100">
                                                Review
                                            </span>
                                        </div>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{kyc.userId.email}</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setSelectedKyc(kyc)}
                                    className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-colors flex items-center gap-2 shadow-md shadow-slate-100"
                                >
                                    View Request <ArrowRight className="w-3 h-3" />
                                </button>
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
            </div>

            {/* Compact Detail Modal */}
            <AnimatePresence>
                {selectedKyc && (
                    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedKyc(null)}
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                        />
                        
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 15 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 15 }}
                            className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                        >
                            {/* Modal Header */}
                            <div className="p-6 border-b border-slate-50 flex items-center justify-between shrink-0">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-blue-100">
                                        {selectedKyc.userId.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900 uppercase tracking-tight">{selectedKyc.userId.name}</h3>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Verification Request • {selectedKyc.userId.age}y</p>
                                    </div>
                                </div>
                                <button onClick={() => { setSelectedKyc(null); setShowFullAadhaar(false); }} className="p-2.5 bg-slate-50 rounded-xl text-slate-400 hover:text-slate-900 transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                                {/* Aadhaar Display */}
                                <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100 flex items-center justify-between">
                                    <div className="space-y-1">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Aadhaar Number</p>
                                        <p className="text-xl font-bold text-slate-900 font-mono tracking-wider">
                                            {formatAadhaar(selectedKyc.aadhaarFull || '')}
                                        </p>
                                    </div>
                                    <button 
                                        onClick={() => setShowFullAadhaar(!showFullAadhaar)}
                                        className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-emerald-600 transition-colors"
                                    >
                                        {showFullAadhaar ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                                    </button>
                                </div>

                                {/* Evidence Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-3">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">ID Document</p>
                                        <button 
                                            onClick={() => setSelectedImage({ url: getProxyUrl(selectedKyc.userId._id, 'document'), title: 'Primary ID' })}
                                            className="w-full relative group rounded-2xl overflow-hidden border border-slate-100 aspect-video bg-slate-50 shadow-inner"
                                        >
                                            <img src={getProxyUrl(selectedKyc.userId._id, 'document')} className="w-full h-full object-cover" alt="" />
                                            <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <Maximize2 className="text-white w-6 h-6" />
                                            </div>
                                        </button>
                                    </div>
                                    <div className="space-y-3">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Likeness Check (Selfie)</p>
                                        <button 
                                            onClick={() => setSelectedImage({ url: getProxyUrl(selectedKyc.userId._id, 'selfie'), title: 'Selfie Validation' })}
                                            className="w-full relative group rounded-2xl overflow-hidden border border-slate-100 aspect-video bg-slate-50 shadow-inner"
                                        >
                                            <img src={getProxyUrl(selectedKyc.userId._id, 'selfie')} className="w-full h-full object-cover" alt="" />
                                            <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <Maximize2 className="text-white w-6 h-6" />
                                            </div>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Action Footer */}
                            <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex items-center justify-end gap-2.5 shrink-0">
                                <button 
                                    onClick={() => setRejectingId(selectedKyc._id)}
                                    className="h-11 px-6 border border-red-100 text-red-600 bg-white hover:bg-red-50 font-black rounded-xl text-[9px] uppercase tracking-widest flex items-center gap-2 transition"
                                >
                                    <X className="w-3.5 h-3.5" /> Decline
                                </button>
                                <button 
                                    onClick={() => handleReview(selectedKyc._id, 'APPROVED')}
                                    className="h-11 px-8 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl text-[9px] uppercase tracking-widest flex items-center gap-2 transition shadow-lg shadow-blue-500/10"
                                >
                                    <Check className="w-3.5 h-3.5" /> Verify Identity
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Premium Overlays */}
            <AnimatePresence>
                {selectedImage && (
                    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedImage(null)}
                            className="absolute inset-0 bg-slate-950/95 backdrop-blur-md"
                        />
                        <button onClick={() => setSelectedImage(null)} className="absolute top-6 right-6 text-white/40 hover:text-white transition-colors z-10">
                            <X className="w-8 h-8" />
                        </button>
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="relative z-10 w-full max-w-4xl aspect-video"
                        >
                            <img src={selectedImage.url} className="w-full h-full object-contain rounded-2xl shadow-2xl" alt="" />
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Feedback Modal */}
            <AnimatePresence>
                {rejectingId && (
                    <div className="fixed inset-0 z-[2001] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 15 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 15 }}
                            className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl p-8"
                        >
                            <div className="mb-6">
                                <h3 className="text-xl font-bold text-slate-900 uppercase tracking-tight">Decline Verification</h3>
                                <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-widest">Provide missing information feedback.</p>
                            </div>
                            <textarea 
                                className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-red-500/20 transition-all placeholder:text-slate-300 min-h-[120px] resize-none"
                                placeholder="Blurry document, mismatched selfie, etc..."
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                            />
                            <div className="grid grid-cols-2 gap-2.5 mt-6">
                                <button onClick={() => setRejectingId(null)} className="h-11 rounded-xl font-black text-[9px] uppercase tracking-widest text-slate-400 hover:bg-slate-50">Cancel</button>
                                <button 
                                    onClick={() => handleReview(rejectingId, 'REJECTED', rejectReason)}
                                    className="bg-red-600 hover:bg-red-700 text-white h-11 rounded-xl font-black text-[9px] uppercase tracking-widest shadow-lg shadow-red-500/10 disabled:opacity-50"
                                    disabled={!rejectReason.trim()}
                                >
                                    Confirm Rejection
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
