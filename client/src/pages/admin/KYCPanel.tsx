import { useEffect, useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
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
        <div className="h-[calc(100vh-5rem)] flex flex-col gap-6 overflow-hidden animate-in fade-in duration-700">
            {/* Header: Sticky Top */}
            <div className="flex-none flex items-center justify-between bg-slate-50/80 backdrop-blur-md p-4 rounded-3xl border border-slate-200/50">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">KYC Approvals</h1>
                    <p className="text-slate-500 font-bold text-sm">Verify human identities to keep the ecosystem safe.</p>
                </div>
                <div className="flex items-center gap-3 px-5 py-2.5">
                    <div className="w-8 h-8 bg-blue-100 text-black rounded-lg flex items-center justify-center font-black text-sm">
                        {pendingKycs.length}
                    </div>
                    <span className="font-black text-black uppercase tracking-widest text-[10px]">Pending Requests</span>
                </div>
            </div>

            <ErrorMessage message={error} />

            {/* Unified Command Layout */}
            <div className="flex-1 flex gap-6 overflow-hidden min-h-0">
                {/* Master Queue Panel */}
                <div className="w-full max-w-[380px] flex-none flex flex-col gap-4 overflow-hidden">
                    <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                        <AnimatePresence mode="popLayout">
                            {pendingKycs.length === 0 ? (
                                <motion.div 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="p-10 text-center bg-white/50 border-4 border-dashed border-slate-200 rounded-[3rem]"
                                >
                                    <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Check className="w-8 h-8 font-black" />
                                    </div>
                                    <p className="font-black text-slate-400">Queue is clear.</p>
                                </motion.div>
                            ) : (
                                pendingKycs.map((kyc) => (
                                    <motion.div
                                        key={kyc._id}
                                        layout
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        onClick={() => {
                                            setSelectedKyc(kyc);
                                            setShowFullAadhaar(false);
                                        }}
                                        className={`p-5 cursor-pointer rounded-3xl border-2 transition-all duration-300 ${selectedKyc?._id === kyc._id ? 'bg-blue-600 border-blue-600 text-white shadow-xl shadow-blue-100 transform scale-[1.02]' : 'bg-white border-transparent hover:border-blue-200 shadow-sm'}`}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <h4 className="font-black text-sm truncate max-w-[180px]">{kyc.userId.name}</h4>
                                            <span className={`text-[10px] font-black uppercase ${selectedKyc?._id === kyc._id ? 'text-blue-200' : 'text-slate-400'}`}>
                                                {kyc.aadhaarLast4}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <p className={`text-[10px] font-bold ${selectedKyc?._id === kyc._id ? 'text-blue-100' : 'text-slate-500'}`}>
                                                {new Date(kyc.createdAt).toLocaleDateString()}
                                            </p>
                                            <div className={`p-1.5 bg-transparent ${selectedKyc?._id === kyc._id ? 'text-white' : 'text-blue-600'}`}>
                                                <ArrowRight className="w-4 h-4" />
                                            </div>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Detail Investigation Workspace */}
                <Card className="flex-1 rounded-[2.5rem] bg-white border-none shadow-sm overflow-hidden flex flex-col relative">
                    <AnimatePresence mode="wait">
                        {selectedKyc ? (
                            <motion.div 
                                key={selectedKyc._id}
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -15 }}
                                className="h-full flex flex-col overflow-hidden"
                            >
                                {/* Header */}
                                <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-white flex-none">
                                    <div className="flex items-center gap-5">
                                        <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center text-3xl font-black border-4 border-blue-50">
                                            {selectedKyc.userId.name.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-black text-slate-900 tracking-tight">{selectedKyc.userId.name}</h3>
                                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                                <ShieldCheck className="w-3.5 h-3.5 text-blue-500" /> Active Investigation
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button 
                                            onClick={() => setRejectingId(selectedKyc._id)}
                                            className="text-red-600 hover:text-red-700 font-black px-6 h-12 rounded-2xl transition-all flex items-center gap-2 hover:bg-red-50"
                                        >
                                            <X className="w-5 h-5" /> Reject
                                        </button>
                                        <Button 
                                            onClick={() => handleReview(selectedKyc._id, 'APPROVED')}
                                            className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 rounded-2xl font-black text-sm h-12 shadow-lg shadow-emerald-50 transition-all hover:-translate-y-0.5"
                                        >
                                            <Check className="w-5 h-5 mr-2" /> Approve
                                        </Button>
                                    </div>
                                </div>

                                {/* Content Workspace */}
                                <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
                                    {/* Data Blocks - MOVED UP */}
                                    <div className="grid grid-cols-2 gap-8">
                                        <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">User Metadata Verification</p>
                                            <div className="space-y-6">
                                                <div>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Full Legal Name</p>
                                                    <p className="text-lg font-black text-slate-900">{selectedKyc.userId.name}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Identity Secret (Aadhaar)</p>
                                                    <div className="flex items-center gap-3">
                                                        <p className="text-xl font-black text-slate-900 font-mono tracking-tighter">
                                                            {formatAadhaar(selectedKyc.aadhaarFull || '')}
                                                        </p>
                                                        <button 
                                                            onClick={() => setShowFullAadhaar(!showFullAadhaar)}
                                                            className="p-2 bg-transparent text-slate-400 hover:text-blue-600 transition-all rounded-xl"
                                                        >
                                                            {showFullAadhaar ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">System Identity Feed</p>
                                            <div className="space-y-6">
                                                <div className="flex justify-between items-end">
                                                    <div>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Reported Age</p>
                                                        <p className="text-lg font-black text-slate-900">{selectedKyc.userId.age} Years</p>
                                                    </div>
                                                    <div className="bg-blue-600 text-white px-3 py-1 rounded-lg text-[9px] font-black tracking-widest uppercase shadow-lg shadow-blue-100">
                                                        Unverified
                                                    </div>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Communication Channel</p>
                                                    <p className="text-[13px] font-bold text-slate-600">{selectedKyc.userId.email}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Physical Evidence - SMALLER PREVIEWS */}
                                    <div className="grid grid-cols-2 gap-8">
                                        <div className="space-y-4">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Aadhaar Verification Document</p>
                                            <button 
                                                onClick={() => setSelectedImage({ url: getProxyUrl(selectedKyc.userId._id, 'document'), title: 'Primary Documentation' })}
                                                className="w-full max-w-[320px] relative group rounded-[2.5rem] overflow-hidden border-8 border-slate-50 shadow-inner aspect-[4/3] bg-slate-100"
                                            >
                                                <img src={getProxyUrl(selectedKyc.userId._id, 'document')} className="w-full h-full object-cover" alt="Docs" />
                                                <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                                                    <Maximize2 className="text-white w-10 h-10" />
                                                </div>
                                            </button>
                                        </div>
                                        <div className="space-y-4">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Real-Time Validation Selfie</p>
                                            <button 
                                                onClick={() => setSelectedImage({ url: getProxyUrl(selectedKyc.userId._id, 'selfie'), title: 'Live Likeness' })}
                                                className="w-full max-w-[320px] relative group rounded-[2.5rem] overflow-hidden border-8 border-slate-50 shadow-inner aspect-[4/3] bg-slate-100"
                                            >
                                                <img src={getProxyUrl(selectedKyc.userId._id, 'selfie')} className="w-full h-full object-cover" alt="Selfie" />
                                                <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                                                    <Maximize2 className="text-white w-10 h-10" />
                                                </div>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Content area is now free of rejection form, which is now a modal */}
                                </div>
                            </motion.div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center p-16">
                                <motion.div 
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="w-32 h-32 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mb-10 shadow-inner"
                                >
                                    <ShieldCheck className="w-16 h-16 text-slate-200" />
                                </motion.div>
                                <h3 className="text-3xl font-black text-slate-900 mb-2">Protocol Idle</h3>
                                <p className="text-slate-400 font-bold text-lg max-w-[340px] leading-relaxed">
                                    Select an identity from the queue to start the verification protocol.
                                </p>
                            </div>
                        )}
                    </AnimatePresence>
                </Card>
            </div>

            {/* Overlays */}
            {/* Premium Image Preview Lightbox */}
            <AnimatePresence>
                {selectedImage && (
                    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 md:p-12 overflow-hidden">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedImage(null)}
                            className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl"
                        />
                        
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-5xl h-full flex flex-col items-center justify-center z-10 pointer-events-none"
                        >
                            {/* Controls & Title */}
                            <div className="absolute top-0 inset-x-0 flex items-center justify-between p-6 pointer-events-auto">
                                <div className="space-y-1">
                                    <h3 className="text-xl font-black text-white uppercase tracking-tighter">{selectedImage.title}</h3>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Secure View</span>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setSelectedImage(null)}
                                    className="p-4 text-white hover:text-white/70 transition-all hover:rotate-90 active:scale-90"
                                >
                                    <X className="w-10 h-10" />
                                </button>
                            </div>

                            {/* Image Frame */}
                            <div className="w-full h-full flex items-center justify-center p-12 lg:p-24">
                                <motion.img 
                                    layoutId={`img-${selectedImage.url}`}
                                    src={selectedImage.url} 
                                    className="max-w-full max-h-full object-contain rounded-3xl shadow-[0_0_80px_rgba(0,0,0,0.5)] border-4 border-white/5 pointer-events-auto"
                                    alt="DetailView" 
                                />
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Rejection Feedback Modal */}
            <AnimatePresence>
                {rejectingId && (
                    <div className="fixed inset-0 z-[1001] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="w-full max-w-xl bg-white rounded-[3rem] shadow-2xl overflow-hidden p-10"
                        >
                            <div className="flex flex-col mb-8">
                                <h4 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Reject Application</h4>
                                <p className="text-xs font-bold text-slate-400">Provide feedback to the user regarding the rejection.</p>
                            </div>

                            <textarea 
                                className="w-full p-6 bg-slate-50 border-4 border-transparent rounded-[2rem] text-sm font-bold text-slate-800 outline-none focus:bg-white focus:border-red-100 transition-all placeholder:text-slate-300 min-h-[160px]"
                                placeholder="State the discrepancy or missing information..."
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                            />

                            <div className="grid grid-cols-2 gap-4 mt-8">
                                <Button 
                                    variant="ghost" 
                                    onClick={() => setRejectingId(null)}
                                    className="h-14 rounded-2xl font-black text-slate-400 hover:bg-slate-50"
                                >
                                    Cancel
                                </Button>
                                <Button 
                                    onClick={() => handleReview(rejectingId, 'REJECTED', rejectReason)}
                                    className="bg-red-600 hover:bg-red-700 text-white h-14 rounded-2xl font-black shadow-xl shadow-red-100"
                                    disabled={!rejectReason.trim()}
                                >
                                    Confirm Rejection
                                </Button>
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
