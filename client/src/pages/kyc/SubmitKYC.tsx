import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { CreditCard, UploadCloud, Loader2, Save } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../../api/axios';
import { useAuth } from '../../hooks/useAuth';
import logo from '../../assets/logo.png';
import { compressImage } from '../../utils/cloudinary';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];

// Verhoeff algorithm for front-end validation
const d = [[0, 1, 2, 3, 4, 5, 6, 7, 8, 9], [1, 2, 3, 4, 0, 6, 7, 8, 9, 5], [2, 3, 4, 0, 1, 7, 8, 9, 5, 6], [3, 4, 0, 1, 2, 8, 9, 5, 6, 7], [4, 0, 1, 2, 3, 9, 5, 6, 7, 8], [5, 9, 8, 7, 6, 0, 4, 3, 2, 1], [6, 5, 9, 8, 7, 1, 0, 4, 3, 2], [7, 6, 5, 9, 8, 2, 1, 0, 4, 3], [8, 7, 6, 5, 9, 3, 2, 1, 0, 4], [9, 8, 7, 6, 5, 4, 3, 2, 1, 0]];
const p = [[0, 1, 2, 3, 4, 5, 6, 7, 8, 9], [1, 5, 7, 6, 2, 8, 3, 0, 9, 4], [5, 8, 0, 3, 7, 9, 6, 1, 4, 2], [8, 9, 1, 6, 0, 4, 3, 5, 2, 7], [9, 4, 5, 3, 1, 2, 6, 8, 7, 0], [4, 2, 8, 6, 5, 7, 3, 9, 0, 1], [2, 7, 9, 3, 8, 0, 6, 4, 1, 5], [7, 0, 4, 6, 9, 1, 3, 2, 5, 8]];

const validateAadhaarVerhoeff = (aadhaar: string) => {
    let c = 0;
    const invertedArray = aadhaar.split('').map(Number).reverse();
    for (let i = 0; i < invertedArray.length; i++) {
        c = d[c]![p[i % 8]![invertedArray[i]!]!]!;
    }
    return c === 0;
};

const kycSchema = z.object({
    aadhaar: z.string()
        .length(12, 'Aadhaar must be exactly 12 digits')
        .regex(/^\d+$/, 'Aadhaar can only contain digits')
        .refine((val) => validateAadhaarVerhoeff(val), 'Invalid Aadhaar number (Check-sum mismatch)'),
    document: z.custom<FileList>()
        .refine((files) => files?.length === 1, 'Document is required.')
        .refine((files) => files?.[0]?.size <= MAX_FILE_SIZE, `Max file size is 5MB.`)
        .refine(
            (files) => ACCEPTED_IMAGE_TYPES.includes(files?.[0]?.type),
            'Only .jpg, .jpeg, and .png formats are supported.'
        ),
    selfie: z.custom<FileList>()
        .refine((files) => files?.length === 1, 'Selfie is required.')
        .refine((files) => files?.[0]?.size <= MAX_FILE_SIZE, `Max file size is 5MB.`)
        .refine(
            (files) => ACCEPTED_IMAGE_TYPES.includes(files?.[0]?.type),
            'Only .jpg, .jpeg, and .png formats are supported.'
        ),
    undertakingAccepted: z.boolean().refine((val) => val === true, {
        message: 'You must accept the terms.',
    }),
});

type KYCFormData = z.infer<typeof kycSchema>;

export const SubmitKYC = () => {
    const navigate = useNavigate();
    const { updateUser } = useAuth();
    const [apiError, setApiError] = useState('');
    const [uploadProgress, setUploadProgress] = useState(0);

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors, isSubmitting }
    } = useForm<KYCFormData>({
        resolver: zodResolver(kycSchema)
    });

    const watchDocument = watch('document');
    const watchSelfie = watch('selfie');

    const renderPreview = (files: FileList | null | undefined) => {
        if (!files || files.length === 0) return null;
        const file = files[0];

        return (
            <div className="mt-4 rounded-xl overflow-hidden border-2 border-slate-200">
                <img src={URL.createObjectURL(file)} alt="Preview" className="w-full h-32 object-cover bg-white" />
            </div>
        );
    };

    const onSubmit = async (data: KYCFormData) => {
        try {
            setApiError('');
            setUploadProgress(0);

            // 1. "Fast Fast" - Compress client-side first
            const [compressedDoc, compressedSelfie] = await Promise.all([
                compressImage(data.document[0], 1600, 0.7), // Slightly higher res for legal docs
                compressImage(data.selfie[0], 1000, 0.7)
            ]);

            const formData = new FormData();
            formData.append('aadhaar', data.aadhaar);
            formData.append('document', compressedDoc, 'document.jpg');
            formData.append('selfie', compressedSelfie, 'selfie.jpg');
            formData.append('undertakingAccepted', 'true');

            await api.post('/kyc/submit', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round(
                        (progressEvent.loaded * 100) / (progressEvent.total || progressEvent.loaded)
                    );
                    setUploadProgress(percentCompleted);
                },
            });

            updateUser({ kycStatus: 'PENDING' });
            navigate('/kyc/status');
        } catch (error: any) {
            setApiError(error.response?.data?.message || 'Failed to submit KYC. Please try again.');
            setUploadProgress(0);
        }
    };

    return (
        <div className="h-screen overflow-hidden grid lg:grid-cols-2 bg-white font-sans">
            <div className="hidden lg:flex flex-col justify-between p-12 bg-slate-900 text-white relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full">
                    <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-emerald-600 blur-[120px] rounded-full" />
                </div>
                <div className="relative z-10">
                    <Link to="/" className="flex items-center gap-2 mb-16">
                        <img src={logo} alt="DigiChit Logo" className="w-10 h-10 object-contain" />
                        <span className="text-xl font-bold tracking-tight">DigiChit</span>
                    </Link>
                    <div className="max-w-sm">
                        <h2 className="text-4xl font-bold leading-tight mb-6">Complete Your <span className="text-emerald-600">Profile</span>.</h2>
                        <p className="text-base text-slate-400 leading-relaxed mb-10">
                            We use advanced encryption and bank-grade storage to protect your most sensitive data. We NEVER store plaintext Aadhaar numbers on our servers.
                        </p>

                        <div className="space-y-6">
                            <div className="flex gap-4 items-start">
                                <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white shrink-0 font-bold">1</div>
                                <div>
                                    <h4 className="font-bold mb-1">Government ID</h4>
                                    <p className="text-sm text-slate-400">12-digit permanent identity</p>
                                </div>
                            </div>
                            <div className="flex gap-4 items-start">
                                <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white shrink-0 font-bold">2</div>
                                <div>
                                    <h4 className="font-bold mb-1">Document Scanner</h4>
                                    <p className="text-sm text-slate-400">Secure automated review</p>
                                </div>
                            </div>
                            <div className="flex gap-4 items-start">
                                <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white shrink-0 font-bold">3</div>
                                <div>
                                    <h4 className="font-bold mb-1">Liveness Check</h4>
                                    <p className="text-sm text-slate-400">Match identity with reality</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="relative z-10 text-[10px] text-slate-500 uppercase tracking-widest font-bold">© 2026 DigiChit Technologies</div>
            </div>

            <div className="flex-1 flex flex-col min-h-0 bg-slate-50/50">
                <div className="shrink-0 flex items-center justify-between bg-white/40 backdrop-blur-md p-6 rounded-[2.5rem] border border-white/40 shadow-xl shadow-slate-100 m-6 mb-0">
                    <div>
                        <h2 className="text-3xl font-medium text-slate-900 tracking-tight uppercase leading-none">Identity Verification</h2>
                        <p className="text-xs font-medium text-slate-400 mt-2 uppercase tracking-widest">Document & Identity Check</p>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-6 scroll-smooth">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto py-8">

                        {apiError && (
                            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-4 mb-6 bg-red-50 text-red-600 border border-red-100 rounded-xl text-sm font-medium">
                                {apiError}
                            </motion.div>
                        )}

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                            <div>
                                <label className="text-sm font-bold text-slate-700 ml-1 uppercase tracking-wider mb-2 block">Aadhaar Number <span className="text-[10px] text-slate-400 normal-case ml-2 font-medium">(12 Digits)</span></label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <CreditCard className="w-5 h-5 text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="0000 0000 0000"
                                        maxLength={12}
                                        onInput={(e) => {
                                            const target = e.target as HTMLInputElement;
                                            target.value = target.value.replace(/[^0-9]/g, '');
                                        }}
                                        className={`w-full pl-12 pr-4 py-4 bg-white border ${errors.aadhaar ? 'border-red-500 focus:ring-red-100' : 'border-slate-200 focus:ring-emerald-500 focus:border-emerald-500'} rounded-2xl focus:ring-4 outline-none transition-all text-base tracking-widest font-mono`}
                                        {...register('aadhaar')}
                                    />
                                </div>
                                {errors.aadhaar && <p className="text-sm text-red-600 ml-1 mt-2">{errors.aadhaar.message}</p>}
                            </div>

                            <div className="grid sm:grid-cols-2 gap-6">
                                <div>
                                    <label className="text-sm font-bold text-slate-700 ml-1 uppercase tracking-wider mb-2 block">Aadhaar Card</label>
                                    <div className={`relative flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-2xl transition-all cursor-pointer bg-white ${watchDocument && watchDocument.length > 0 ? 'border-emerald-300 shadow-lg shadow-emerald-200' : 'border-slate-200 hover:border-emerald-400 hover:bg-slate-50'}`}>
                                        <input type="file" accept=".jpg,.jpeg,.png" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" {...register('document')} />
                                        {watchDocument && watchDocument.length > 0 ? (
                                            <div className="absolute inset-2 z-0 pointer-events-none">{renderPreview(watchDocument)}</div>
                                        ) : (
                                            <div className="text-center px-4">
                                                <UploadCloud className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                                                <p className="text-xs font-bold text-slate-600">Upload Front Document</p>
                                                <p className="text-[10px] text-slate-400 mt-1 font-medium">JPG, JPEG or PNG only</p>
                                            </div>
                                        )}
                                    </div>
                                    {errors.document && <p className="text-sm text-red-600 ml-1 mt-2">{errors.document.message as string}</p>}
                                </div>

                                <div>
                                    <label className="text-sm font-bold text-slate-700 ml-1 uppercase tracking-wider mb-2 block">Clear Selfie</label>
                                    <div className={`relative flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-2xl transition-all cursor-pointer bg-white ${watchSelfie && watchSelfie.length > 0 ? 'border-emerald-300 shadow-lg shadow-emerald-200' : 'border-slate-200 hover:border-emerald-400 hover:bg-slate-50'}`}>
                                        <input type="file" accept=".jpg,.jpeg,.png" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" {...register('selfie')} />
                                        {watchSelfie && watchSelfie.length > 0 ? (
                                            <div className="absolute inset-2 z-0 pointer-events-none">{renderPreview(watchSelfie)}</div>
                                        ) : (
                                            <div className="text-center px-4">
                                                <UploadCloud className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                                                <p className="text-xs font-bold text-slate-600">Upload Face Photo</p>
                                                <p className="text-[10px] text-slate-400 mt-1 font-medium">JPG, JPEG or PNG only</p>
                                            </div>
                                        )}
                                    </div>
                                    {errors.selfie && <p className="text-sm text-red-600 ml-1 mt-2">{errors.selfie.message as string}</p>}
                                </div>
                            </div>

                            <div>
                                <label className="flex items-start gap-4 p-5 bg-white border border-slate-200 rounded-2xl cursor-pointer hover:border-emerald-400 transition-colors">
                                    <div className="flex items-center h-6">
                                        <input type="checkbox" className="w-5 h-5 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500 cursor-pointer" {...register('undertakingAccepted')} />
                                    </div>
                                    <div className="text-sm text-slate-600 leading-relaxed font-medium">
                                        I hereby declare that the details furnished above are true and correct to the best of my knowledge and belief. I completely agree to the DigiChit Terms & Conditions.
                                    </div>
                                </label>
                                {errors.undertakingAccepted && <p className="text-sm text-red-600 ml-1 mt-2">{errors.undertakingAccepted.message}</p>}
                            </div>

                            {isSubmitting && uploadProgress > 0 && (
                                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden shadow-inner">
                                    <div className="bg-emerald-600 h-full rounded-full transition-all duration-300 ease-out" style={{ width: `${uploadProgress}%` }} />
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full py-4.5 bg-emerald-600 text-white rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 text-lg disabled:opacity-70 active:scale-[0.99]"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Uploading {uploadProgress}%...
                                    </>
                                ) : (
                                    <>
                                        Submit Application
                                        <Save className="w-5 h-5" />
                                    </>
                                )}
                            </button>
                        </form>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};
