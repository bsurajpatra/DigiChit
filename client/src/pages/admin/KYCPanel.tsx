import { useEffect, useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Loader } from '../../components/ui/Loader';
import { ErrorMessage } from '../../components/ui/ErrorMessage';
import { Check, X, FileText, Image as ImageIcon, Maximize2 } from 'lucide-react';
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
            setRejectReason('');
        } catch (err: any) {
            setError(err.response?.data?.message || `Failed to ${status.toLowerCase()} KYC`);
        }
    };

    const getProxyUrl = (userId: string, field: 'document' | 'selfie') => {
        const token = localStorage.getItem('token') || '';
        return `${import.meta.env.VITE_API_URL || ''}/kyc/admin/view/${userId}/${field}?token=${token}`;
    };

    if (isLoading) return <div className="py-20"><Loader size="lg" /></div>;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900 mb-2">KYC Approvals</h1>
                <p className="text-slate-500">Review and verify user identity documents.</p>
            </div>

            <ErrorMessage message={error} />

            {pendingKycs.length === 0 ? (
                <Card className="text-center py-16">
                    <p className="text-slate-500 font-medium">No pending KYC requests found. All caught up!</p>
                </Card>
            ) : (
                <div className="space-y-6">
                    {pendingKycs.map((kyc) => (
                        <Card key={kyc._id} className="overflow-hidden">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 pb-6 border-b border-slate-100 gap-4">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900">{kyc.userId.name}</h3>
                                    <p className="text-sm text-slate-500">{kyc.userId.email}</p>
                                    <div className="flex items-center gap-2 mt-2">
                                        <p className="text-xs font-semibold text-slate-700 bg-slate-100 inline-block px-2 py-1 rounded">
                                            Aadhaar: XXXX XXXX {kyc.aadhaarLast4}
                                        </p>
                                        <p className="text-xs font-semibold text-blue-700 bg-blue-50 inline-block px-2 py-1 rounded">
                                            Age: {kyc.userId.age}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-sm text-slate-400">
                                    Submitted: {new Date(kyc.createdAt).toLocaleDateString()}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                <div>
                                    <p className="text-sm font-semibold flex items-center gap-2 mb-3 text-slate-700">
                                        <FileText className="w-4 h-4" /> Document
                                    </p>
                                    {(kyc.documentUrl || '').toLowerCase().includes('.pdf') ? (
                                        <a 
                                            href={`${getProxyUrl(kyc.userId._id, 'document')}`} 
                                            target="_blank" 
                                            rel="noreferrer" 
                                            className="block border rounded-lg overflow-hidden bg-slate-50 hover:border-blue-400 transition-colors"
                                        >
                                            <div className="aspect-video flex items-center justify-center text-blue-600 font-medium hover:bg-blue-50 transition-colors">
                                                <div className="text-center">
                                                    <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                                    <span>View PDF Document</span>
                                                </div>
                                            </div>
                                        </a>
                                    ) : (
                                        <button 
                                            onClick={() => setSelectedImage({ url: getProxyUrl(kyc.userId._id, 'document'), title: `${kyc.userId.name} - Document` })}
                                            className="w-full text-left block border rounded-lg overflow-hidden bg-slate-50 hover:border-blue-400 transition-colors relative group"
                                        >
                                            <img src={getProxyUrl(kyc.userId._id, 'document')} alt="Document" className="w-full h-48 object-cover" />
                                            <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/40 transition-all flex items-center justify-center">
                                                <Maximize2 className="text-white opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100" />
                                            </div>
                                        </button>
                                    )}
                                </div>
                                <div>
                                    <p className="text-sm font-semibold flex items-center gap-2 mb-3 text-slate-700">
                                        <ImageIcon className="w-4 h-4" /> Selfie
                                    </p>
                                    <button 
                                        onClick={() => setSelectedImage({ url: getProxyUrl(kyc.userId._id, 'selfie'), title: `${kyc.userId.name} - Selfie` })}
                                        className="w-full text-left block border rounded-lg overflow-hidden bg-slate-50 hover:border-blue-400 transition-colors relative group"
                                    >
                                        <img src={getProxyUrl(kyc.userId._id, 'selfie')} alt="Selfie" className="w-full h-48 object-cover" />
                                        <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/40 transition-all flex items-center justify-center">
                                            <Maximize2 className="text-white opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100" />
                                        </div>
                                    </button>
                                </div>
                            </div>

                            {rejectingId === kyc._id ? (
                                <div className="bg-red-50 p-4 rounded-lg border border-red-100">
                                    <label className="block text-sm font-bold text-red-700 mb-2">Rejection Reason</label>
                                    <textarea 
                                        className="w-full p-3 border border-red-200 rounded-md mb-3 focus:ring-2 focus:ring-red-200 outline-none"
                                        placeholder="Explain why the KYC was rejected..."
                                        rows={3}
                                        value={rejectReason}
                                        onChange={(e) => setRejectReason(e.target.value)}
                                    />
                                    <div className="flex gap-3 justify-end">
                                        <Button variant="ghost" onClick={() => setRejectingId(null)}>Cancel</Button>
                                        <Button variant="danger" disabled={!rejectReason.trim()} onClick={() => handleReview(kyc._id, 'REJECTED', rejectReason)}>
                                            Confirm Rejection
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex gap-4 justify-end">
                                    <Button variant="danger" onClick={() => setRejectingId(kyc._id)}>
                                        <X className="w-4 h-4 mr-2" /> Reject
                                    </Button>
                                    <Button onClick={() => handleReview(kyc._id, 'APPROVED')} className="bg-green-600 hover:bg-green-700 text-white border-transparent">
                                        <Check className="w-4 h-4 mr-2" /> Approve Needs
                                    </Button>
                                </div>
                            )}
                        </Card>
                    ))}
                </div>
            )}
            {/* Image Preview Modal */}
            <AnimatePresence>
                {selectedImage && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedImage(null)}
                            className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-5xl max-h-[90vh] bg-white rounded-2xl overflow-hidden shadow-2xl z-110"
                        >
                            <div className="flex items-center justify-between p-4 border-b border-slate-100">
                                <h3 className="font-bold text-slate-900">{selectedImage.title}</h3>
                                <button 
                                    onClick={() => setSelectedImage(null)}
                                    className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                                >
                                    <X className="w-5 h-5 text-slate-500" />
                                </button>
                            </div>
                            <div className="p-2 bg-slate-50 overflow-auto flex items-center justify-center min-h-[300px]">
                                <img 
                                    src={selectedImage.url} 
                                    alt="Preview" 
                                    className="max-w-full h-auto rounded-lg shadow-sm"
                                />
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};
