import { useEffect, useState } from 'react';
import { Loader } from '../../components/ui/Loader';
import { ErrorMessage } from '../../components/ui/ErrorMessage';
import { 
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
        <div className="h-full flex flex-col gap-6 animate-in fade-in duration-700">
            <div className="flex items-center justify-between bg-white/40 backdrop-blur-md p-6 rounded-[2.5rem] border border-white/40 shadow-xl shadow-slate-100">
                <div>
                    <h1 className="text-3xl font-medium text-slate-900 tracking-tight uppercase">KYC Approvals</h1>
                    <p className="text-xs font-medium text-slate-400 mt-1 uppercase tracking-widest">Verify identities to keep the ecosystem safe.</p>
                </div>
                <div className="flex items-center gap-3 px-5 py-2.5 bg-transparent">
                    <div className="w-8 h-8 bg-blue-100 text-black rounded-lg flex items-center justify-center font-black text-sm">
                        {pendingKycs.length}
                    </div>
                    <span className="font-black text-black uppercase tracking-widest text-[10px]">Pending Requests</span>
                </div>
            </div>

            <ErrorMessage message={error} />

            {/* KYC List */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                <AnimatePresence mode="popLayout">
                    {pendingKycs.length === 0 ? (
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white border border-slate-100 rounded-[2.5rem] flex flex-col items-center justify-center text-center p-12 min-h-[400px]"
                        >
                            <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-6">
                                <ShieldCheck className="w-10 h-10" />
                            </div>
                            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Queue is Clear</h3>
                            <p className="text-sm text-slate-400 font-bold max-w-xs mt-2">All identities have been verified. There are no pending KYC requests at the moment.</p>
                        </motion.div>
                    ) : (
                        pendingKycs.map(kyc => (
                            <motion.div
                                key={kyc._id}
                                layout
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="bg-white p-4 rounded-[2rem] border border-slate-100 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-50/50 transition-all group flex items-center justify-between"
                            >
                                <div className="flex items-center gap-5">
                                    <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center font-black text-slate-400 overflow-hidden shadow-inner group-hover:scale-105 transition-transform">
                                        {kyc.userId.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <span className="font-extrabold text-slate-900">{kyc.userId.name}</span>
                                            <span className="px-2 py-0.5 rounded-full bg-orange-50 text-orange-600 text-[9px] font-black uppercase tracking-wider border border-orange-100">
                                                Pending Review
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-400 font-bold">{kyc.userId.email}</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setSelectedKyc(kyc)}
                                    className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-600 transition-colors flex items-center gap-2 shadow-lg shadow-slate-100"
                                >
                                    Review <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
            </div>

            {/* KYC Detail Modal */}
            <AnimatePresence>
                {selectedKyc && (
                    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedKyc(null)}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
                        />
                        
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-4xl bg-white rounded-[3rem] shadow-2xl overflow-hidden flex flex-col flex-none max-h-[90vh]"
                        >
                            {/* Modal Header */}
                            <div className="p-8 border-b border-slate-50 flex items-center justify-between shrink-0">
                                <div className="flex items-center gap-5">
                                    <div className="w-16 h-16 rounded-[1.5rem] bg-blue-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-100">
                                        {selectedKyc.userId.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">{selectedKyc.userId.name}</h3>
                                        <p className="text-xs font-bold text-slate-400">Identity Verification Request ({selectedKyc.userId.age} years)</p>
                                    </div>
                                </div>
                                <button onClick={() => { setSelectedKyc(null); setShowFullAadhaar(false); }} className="p-3 bg-slate-50 rounded-2xl text-slate-400 hover:text-slate-900 transition-colors">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                                {/* Aadhaar Display */}
                                <div className="bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100 flex items-center justify-between">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Aadhaar Identity</p>
                                        <p className="text-2xl font-black text-slate-900 font-mono tracking-wider">
                                            {formatAadhaar(selectedKyc.aadhaarFull || '')}
                                        </p>
                                    </div>
                                    <button 
                                        onClick={() => setShowFullAadhaar(!showFullAadhaar)}
                                        className="w-12 h-12 flex items-center justify-center bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-emerald-600 transition-colors"
                                    >
                                        {showFullAadhaar ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>

                                {/* Evidence Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Identification Document</p>
                                        <button 
                                            onClick={() => setSelectedImage({ url: getProxyUrl(selectedKyc.userId._id, 'document'), title: 'Primary ID' })}
                                            className="w-full relative group rounded-[2.5rem] overflow-hidden border-4 border-slate-50 aspect-video bg-slate-100 shadow-inner"
                                        >
                                            <img src={getProxyUrl(selectedKyc.userId._id, 'document')} className="w-full h-full object-cover" alt="" />
                                            <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <Maximize2 className="text-white w-8 h-8" />
                                            </div>
                                        </button>
                                    </div>
                                    <div className="space-y-4">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Likeness Check</p>
                                        <button 
                                            onClick={() => setSelectedImage({ url: getProxyUrl(selectedKyc.userId._id, 'selfie'), title: 'Selfie Validation' })}
                                            className="w-full relative group rounded-[2.5rem] overflow-hidden border-4 border-slate-50 aspect-video bg-slate-100 shadow-inner"
                                        >
                                            <img src={getProxyUrl(selectedKyc.userId._id, 'selfie')} className="w-full h-full object-cover" alt="" />
                                            <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <Maximize2 className="text-white w-8 h-8" />
                                            </div>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Action Footer */}
                            <div className="p-8 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
                                <button 
                                    onClick={() => setRejectingId(selectedKyc._id)}
                                    className="h-14 px-8 border-2 border-red-100 text-red-600 bg-white hover:bg-red-50 font-black rounded-2xl text-xs uppercase tracking-widest flex items-center gap-2 transition"
                                >
                                    <X className="w-4 h-4" /> Decline
                                </button>
                                <button 
                                    onClick={() => handleReview(selectedKyc._id, 'APPROVED')}
                                    className="h-14 px-10 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl text-xs uppercase tracking-widest flex items-center gap-2 transition shadow-xl shadow-blue-100"
                                >
                                    <Check className="w-4 h-4" /> Approve Identity
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
                            className="absolute inset-0 bg-slate-950/95 backdrop-blur-2xl"
                        />
                        <button onClick={() => setSelectedImage(null)} className="absolute top-8 right-8 text-white/50 hover:text-white transition-colors z-10">
                            <X className="w-10 h-10" />
                        </button>
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="relative z-10 w-full max-w-5xl aspect-video"
                        >
                            <img src={selectedImage.url} className="w-full h-full object-contain rounded-3xl" alt="" />
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Rejection Feedback Modal */}
            <AnimatePresence>
                {rejectingId && (
                    <div className="fixed inset-0 z-[2001] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-white rounded-[3rem] w-full max-w-md overflow-hidden shadow-2xl p-10"
                        >
                            <div className="mb-8">
                                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Reject Verification</h3>
                                <p className="text-xs font-bold text-slate-400 mt-1">Provide feedback for the user</p>
                            </div>
                            <textarea 
                                className="w-full p-6 bg-slate-50 border-4 border-transparent rounded-[2rem] text-sm font-bold text-slate-800 outline-none focus:bg-white focus:border-red-100 transition-all placeholder:text-slate-300 min-h-[160px]"
                                placeholder="State the reason (e.g., Blur image)..."
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                            />
                            <div className="grid grid-cols-2 gap-3 mt-8">
                                <button onClick={() => setRejectingId(null)} className="h-14 rounded-2xl font-black text-slate-400 hover:bg-slate-50">Cancel</button>
                                <button 
                                    onClick={() => handleReview(rejectingId, 'REJECTED', rejectReason)}
                                    className="bg-red-600 hover:bg-red-700 text-white h-14 rounded-2xl font-black shadow-xl shadow-red-100 disabled:opacity-50"
                                    disabled={!rejectReason.trim()}
                                >
                                    Confirm
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
