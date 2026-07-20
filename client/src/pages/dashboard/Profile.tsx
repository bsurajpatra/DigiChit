import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { Loader } from '../../components/ui/Loader';
import {
    Mail, Shield, Clock, Calendar, AlertTriangle,
    KeyRound, Eye, EyeOff, Lock, CheckCircle2, XCircle,
    Loader2, FileText, Camera, X, UserCircle, Briefcase,
    RefreshCw
} from 'lucide-react';
import OptimizedImage from '../../components/OptimizedImage';
import { compressImage, uploadImageDirectly } from '../../utils/cloudinary';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProfileData {
    name: string;
    email: string;
    role: string;
    age: number;
    kycStatus: 'NOT_SUBMITTED' | 'PENDING' | 'APPROVED' | 'REJECTED';
    accountStatus: 'REGISTERED' | 'ACTIVE' | 'FROZEN' | 'SUSPENDED' | 'INACTIVE' | 'DELETED';
    emailVerified: boolean;
    lastLoginAt?: string;
    createdAt: string;
    profilePictureUrl?: string;
    organizerStatus: 'NOT_APPLIED' | 'PENDING' | 'APPROVED' | 'REJECTED';
    kycRejectedReason?: string;
    city?: string;
    occupation?: string;
    incomeRange?: string;
    expectedChitValueRange?: string;
    expectedGroupSizeRange?: string;
    organizerApplicationReason?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const kycConfig = {
    NOT_SUBMITTED: { label: 'Not Submitted', cls: 'bg-slate-100 text-slate-500' },
    PENDING:       { label: 'Under Review',  cls: 'bg-amber-100 text-amber-700' },
    APPROVED:      { label: 'Verified',       cls: 'bg-green-100 text-green-700' },
    REJECTED:      { label: 'Rejected',       cls: 'bg-red-100 text-red-600'    },
};

const accountConfig: Record<string, string> = {
    ACTIVE:     'bg-green-100 text-green-700',
    REGISTERED: 'bg-emerald-50 text-emerald-600',
    FROZEN:     'bg-cyan-100 text-cyan-700',
    SUSPENDED:  'bg-red-100 text-red-600',
    INACTIVE:   'bg-slate-100 text-slate-500',
    DELETED:    'bg-red-200 text-red-800',
};

const fmt = (date?: string) =>
    date ? new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(date)) : '—';

// ─── KYC Viewer Modal ─────────────────────────────────────────────────────────

const KYCViewer = ({ field, label, onClose }: { field: 'document' | 'selfie'; label: string; onClose: () => void }) => {
    const [src, setSrc] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isPdf, setIsPdf] = useState(false);

    useEffect(() => {
        let url: string;
        api.get(`/user/kyc/view/${field}`, { responseType: 'blob' })
            .then(res => { setIsPdf(res.data.type === 'application/pdf'); url = URL.createObjectURL(res.data); setSrc(url); })
            .catch(() => setError('Failed to load. Please try again.'))
            .finally(() => setLoading(false));
        return () => { if (url) URL.revokeObjectURL(url); };
    }, [field]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden max-h-[85vh]">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-50">
                    <div className="flex items-center gap-2 text-xs font-black text-slate-800 uppercase tracking-widest">
                        {field === 'document' ? <FileText className="w-3.5 h-3.5 text-emerald-600" /> : <Camera className="w-3.5 h-3.5 text-emerald-600" />}
                        {label}
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-xl hover:bg-slate-50 flex items-center justify-center transition-colors">
                        <X className="w-4 h-4 text-slate-400" />
                    </button>
                </div>
                <div className="flex-1 overflow-auto p-4 bg-slate-50/30 flex items-center justify-center min-h-[300px]">
                    {loading && <div className="flex flex-col items-center gap-2 text-slate-400"><Loader2 className="w-6 h-6 animate-spin text-emerald-600" /><p className="text-[10px] font-bold uppercase tracking-widest">Loading Content…</p></div>}
                    {error  && <div className="flex flex-col items-center gap-2 text-red-500"><AlertTriangle className="w-6 h-6" /><p className="text-xs font-bold uppercase tracking-widest">{error}</p></div>}
                    {src && !loading && (
                        isPdf
                            ? <iframe src={src} className="w-full h-[55vh] rounded-2xl border border-slate-200" title={label} />
                            : <img src={src} alt={label} className="max-h-[55vh] rounded-2xl shadow-lg object-contain" />
                    )}
                </div>
            </div>
        </div>
    );
};

// ─── Change Password Modal ────────────────────────────────────────────────────

const ChangePasswordModal = ({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) => {
    const [form, setForm] = useState({ current: '', next: '', confirm: '' });
    const [show, setShow] = useState({ current: false, next: false, confirm: false });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handle = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (form.next !== form.confirm) return setError('New passwords do not match.');
        if (form.next.length < 8) return setError('New password must be at least 8 characters.');
        setLoading(true);
        try {
            await api.post('/user/change-password', { currentPassword: form.current, newPassword: form.next });
            onSuccess();
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Failed to change password.');
        } finally {
            setLoading(false);
        }
    };

    const PwField = ({ id, label, fkey, skey }: { id: string; label: string; fkey: 'current' | 'next' | 'confirm'; skey: 'current' | 'next' | 'confirm' }) => (
        <div className="space-y-1.5">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none ml-1">{label}</label>
            <div className="relative">
                <input
                    id={id}
                    type={show[skey] ? 'text' : 'password'}
                    value={form[fkey]}
                    placeholder="••••••••"
                    onChange={e => setForm(p => ({ ...p, [fkey]: e.target.value }))}
                    className="w-full px-4 py-2 rounded-xl border border-slate-100 bg-slate-50 focus:outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 focus:bg-white transition text-slate-900 text-xs font-bold"
                    required
                />
                <button type="button" onClick={() => setShow(p => ({ ...p, [skey]: !p[skey] }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-600">
                    {show[skey] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-50">
                    <div className="flex items-center gap-2 text-xs font-black text-slate-800 uppercase tracking-widest"><KeyRound className="w-3.5 h-3.5 text-emerald-600" />Change Password</div>
                    <button onClick={onClose} className="w-8 h-8 rounded-xl hover:bg-slate-50 flex items-center justify-center"><X className="w-4 h-4 text-slate-400" /></button>
                </div>
                <form onSubmit={handle} className="p-6 space-y-4">
                    {error && (
                        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-[9px] font-black uppercase tracking-widest">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />{error}
                        </div>
                    )}
                    <PwField id="cp-current" label="Current Credentials" fkey="current" skey="current" />
                    <PwField id="cp-new"     label="New Security Key"    fkey="next"    skey="next"    />
                    <PwField id="cp-confirm" label="Verify New Key"      fkey="confirm" skey="confirm" />
                    <div className="flex gap-2 pt-2">
                        <button type="button" onClick={onClose} className="flex-1 py-2.5 bg-slate-50 rounded-xl text-slate-400 font-black uppercase tracking-widest text-[9px] hover:bg-slate-100">Cancel</button>
                        <button type="submit" disabled={loading}
                            className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl font-black uppercase tracking-widest text-[9px] hover:bg-emerald-700 transition active:scale-95 shadow-md shadow-emerald-200 flex items-center justify-center gap-2 disabled:opacity-60">
                            {loading ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Saving…</> : 'Update Key'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// ─── Main Profile Page ────────────────────────────────────────────────────────

export const Profile = () => {
    const { logout, updateUser } = useAuth();
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [loading, setLoading] = useState(true);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const avatarInputRef = useRef<HTMLInputElement>(null);
    const [error, setError] = useState<string | null>(null);
    const [kycViewer, setKycViewer] = useState<'document' | 'selfie' | null>(null);
    const [showPw, setShowPw] = useState(false);
    const [pwSuccess, setPwSuccess] = useState(false);

    useEffect(() => {
        api.get('/user/profile')
            .then(res => setProfile(res.data.data.user))
            .catch(() => setError('Failed to load profile.'))
            .finally(() => setLoading(false));
    }, []);

    const handlePwSuccess = () => {
        setShowPw(false);
        setPwSuccess(true);
        setTimeout(() => logout(), 3000);
    };

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingAvatar(true);
        setError(null);
        try {
            // 1. "Fast Fast" - Compress client-side first
            const compressedBlob = await compressImage(file, 400, 0.8);
            
            // 2. Direct upload to Cloudinary (bypassing app server bottleneck)
            const uploadResult = await uploadImageDirectly(compressedBlob, `digichit/users/${profile?._id || 'unknown'}`);
            
            // 3. Update server with the new image info
            // We use a new endpoint or update the existing one to handle direct upload results
            const res = await api.post('/user/profile-picture', {
                publicId: uploadResult.public_id,
                url: uploadResult.secure_url
            });

            const newUrl = res.data.data.profilePictureUrl;
            setProfile(prev => prev ? { ...prev, profilePictureUrl: newUrl } : null);
            updateUser({ profilePictureUrl: newUrl });
        } catch (err: any) {
            console.error('Profile picture upload failed:', err);
            const errorMessage =
                err?.response?.data?.error?.message ||
                err?.response?.data?.message ||
                err?.message ||
                'Failed to upload image.';
            setError(errorMessage);
        } finally {
            setUploadingAvatar(false);
            if (avatarInputRef.current) avatarInputRef.current.value = '';
        }
    };

    const isAdmin = profile?.role === 'ADMIN';
    const hasKYC = !isAdmin && profile && ['PENDING', 'APPROVED', 'REJECTED'].includes(profile.kycStatus);

    if (loading) return (
        <div className="h-full flex items-center justify-center">
            <Loader size="lg" />
        </div>
    );

    if (error) return (
        <div className="h-full flex items-center justify-center gap-3 text-slate-400">
            <AlertTriangle className="w-6 h-6 text-red-400" /><p className="font-bold text-xs uppercase tracking-widest">{error}</p>
        </div>
    );

    const kyc    = kycConfig[profile!.kycStatus];
    const accCls = accountConfig[profile!.accountStatus] ?? 'bg-slate-100 text-slate-500';

    // Compact info row
    const Row = ({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: React.ReactNode }) => (
        <div className="flex items-center gap-3 py-2.5 border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors px-1 rounded-lg">
            <div className="w-8 h-8 rounded-xl bg-slate-50/50 border border-slate-100 flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4 text-slate-400" />
            </div>
            <div className="flex-1 min-w-0 flex items-center justify-between gap-3">
                <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest shrink-0">{label}</span>
                <div className="text-[13px] text-slate-800 font-bold text-right truncate">{value}</div>
            </div>
        </div>
    );

    return (
        <div className="h-full flex flex-col gap-4 animate-in fade-in duration-500">

            {/* Compact Header */}
            <div className="flex items-center justify-between bg-white/50 backdrop-blur-md px-6 py-4 rounded-3xl border border-white/40 shadow-lg shadow-slate-100/50">
                <div>
                    <h1 className="text-xl font-bold text-slate-900 tracking-tight uppercase leading-tight">Identity Suite</h1>
                    <p className="text-[9px] font-bold text-slate-400 mt-0.5 uppercase tracking-widest leading-none">Security credentials & verification status</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-2xl shadow-md">
                    <UserCircle className="w-4 h-4" />
                    <span className="font-bold text-[9px] uppercase tracking-[0.2em]">{profile?.role}</span>
                </div>
            </div>

            {/* Compact Grid */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-0">

                {/* Left: Avatar + Fast Actions */}
                <div className="flex flex-col gap-4">

                    {/* Compact Avatar Card */}
                    <div className="bg-white/70 backdrop-blur-sm rounded-3xl border border-slate-100 shadow-xl shadow-slate-100/30 p-6 flex flex-col items-center text-center gap-4">
                        <div className="relative group shrink-0">
                            <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                ref={avatarInputRef}
                                onChange={handleAvatarUpload}
                            />
                            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-400 flex items-center justify-center overflow-hidden relative shadow-lg group-hover:scale-105 transition-transform duration-500">
                                {profile?.profilePictureUrl ? (
                                    <OptimizedImage 
                                        publicId={profile.profilePictureUrl} 
                                        alt="Avatar" 
                                        width={80} 
                                        height={80} 
                                        priority
                                    />
                                ) : (
                                    <span className="text-3xl font-black text-white">
                                        {profile?.name?.charAt(0)?.toUpperCase()}
                                    </span>
                                )}
                                <button
                                    onClick={() => avatarInputRef.current?.click()}
                                    disabled={uploadingAvatar}
                                    className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-100"
                                >
                                    {uploadingAvatar ? <Loader2 className="w-6 h-6 text-white animate-spin" /> : <Camera className="w-6 h-6 text-white" />}
                                </button>
                            </div>
                        </div>
                        <div>
                            <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{profile?.name}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest truncate max-w-[180px] mt-1">{profile?.email}</p>
                        </div>
                        <div className="flex flex-wrap gap-1.5 justify-center">
                            <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-600 text-[8px] font-black uppercase tracking-widest border border-emerald-100">{profile?.role}</span>
                            <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest border border-current opacity-80 ${accCls}`}>{profile?.accountStatus}</span>
                        </div>
                    </div>

                    {/* Account Controls */}
                    <div className="bg-white/70 backdrop-blur-sm rounded-3xl border border-slate-100 shadow-xl shadow-slate-100/30 p-2">
                        <button onClick={() => setShowPw(true)}
                            className="w-full flex items-center gap-3 px-3 py-3 rounded-2xl hover:bg-slate-50 transition-all group">
                            <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/20 group-hover:scale-110 transition-transform">
                                <KeyRound className="w-4 h-4 text-white" />
                            </div>
                            <div className="text-left flex-1">
                                <p className="text-[11px] font-black text-slate-800 uppercase tracking-widest">Update Security</p>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.1em] mt-0.5">Change password</p>
                            </div>
                        </button>

                        {hasKYC && (
                            <div className="mt-1 space-y-1">
                                {[
                                    { field: 'document' as const, icon: FileText, label: 'ID Documents' },
                                    { field: 'selfie'   as const, icon: Camera,   label: 'Biometric Check' },
                                ].map(({ field, icon: Icon, label }) => (
                                    <button key={field} onClick={() => setKycViewer(field)}
                                        className="w-full flex items-center gap-3 px-3 py-3 rounded-2xl hover:bg-slate-50 transition-all group">
                                        <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 group-hover:bg-white transition-colors">
                                            <Icon className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition-colors" />
                                        </div>
                                        <div className="text-left flex-1">
                                            <p className="text-[11px] font-black text-slate-800 uppercase tracking-widest">{label}</p>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.1em] mt-0.5">Review current file</p>
                                        </div>
                                        <Eye className="w-3.5 h-3.5 text-slate-200 group-hover:text-emerald-500 transition-colors" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {pwSuccess && (
                        <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3 animate-in slide-in-from-bottom duration-500">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            <p className="text-[9px] font-black text-emerald-800 uppercase tracking-widest leading-relaxed">Identity key updated. Authenticating logout in 3s...</p>
                        </div>
                    )}
                </div>

                {/* Right: Detailed Metadata */}
                <div className="lg:col-span-2 flex flex-col gap-4 overflow-y-auto pr-1 custom-scrollbar">

                    {/* Professional Metadata */}
                    <div className="bg-white/70 backdrop-blur-sm rounded-3xl border border-slate-100 shadow-xl shadow-slate-100/30 p-6">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> System Identity
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1">
                            <Row icon={Mail} label="Contact Email" value={
                                <span className="flex items-center gap-1.5 justify-end">
                                    <span className="truncate max-w-[120px]">{profile?.email}</span>
                                    {profile?.emailVerified
                                        ? <CheckCircle2 className="w-2.5 h-2.5 text-green-500 shrink-0" />
                                        : <XCircle      className="w-2.5 h-2.5 text-red-400  shrink-0" />}
                                </span>
                            } />
                            {!isAdmin && <Row icon={Calendar} label="Registered Age" value={`${profile?.age} YRS`} />}
                            <Row icon={Shield} label="Verification" value={
                                <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest ${kyc.cls}`}>{kyc.label}</span>
                            } />
                            <Row icon={Clock} label="Member Since" value={fmt(profile?.createdAt).toUpperCase()} />
                            <Row icon={Lock} label="Compliance Status" value={
                                <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest ${accCls}`}>{profile?.accountStatus}</span>
                            } />
                            <Row icon={Clock} label="Pulse Check" value={fmt(profile?.lastLoginAt).toUpperCase()} />
                        </div>
                    </div>

                    {/* Organizer Specification */}
                    {profile?.role === 'ORGANIZER' && (
                        <div className="bg-white/70 backdrop-blur-sm rounded-3xl border border-slate-100 shadow-xl shadow-slate-100/30 p-6 animate-in slide-in-from-right duration-500 hover:scale-[1.01] transition-transform">
                            <p className="text-[9px] font-black text-emerald-600 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                                <Shield className="w-3.5 h-3.5" /> Professional Specifications
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1">
                                <Row icon={Briefcase} label="HQ Location" value={profile.city?.toUpperCase()} />
                                <Row icon={Briefcase} label="Primary Profession" value={profile.occupation?.toUpperCase()} />
                                <Row icon={Briefcase} label="Expected Scale" value={profile.expectedChitValueRange?.replace(/_/g, ' ')} />
                                <Row icon={Briefcase} label="Target Volume" value={profile.expectedGroupSizeRange?.replace(/_/g, ' ')} />
                            </div>
                        </div>
                    )}

                    {/* Alerts */}
                    {profile?.kycStatus === 'NOT_SUBMITTED' && (
                        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-5 flex items-start gap-4">
                            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0 text-amber-600">
                                <AlertTriangle className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                                <p className="text-[11px] font-black text-amber-900 uppercase tracking-widest">Compliance Required</p>
                                <p className="text-[10px] text-amber-700 mt-1 uppercase tracking-tight font-bold">Complete Identity verification to activate financial instruments.</p>
                            </div>
                            <Link 
                                to="/kyc/submit"
                                className="px-4 py-2 bg-amber-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-amber-700 transition shadow-lg shadow-amber-200 shrink-0"
                            >
                                Verify Now
                            </Link>
                        </div>
                    )}

                    {profile?.kycStatus === 'REJECTED' && (
                        <div className="bg-red-50 border border-red-200 rounded-3xl p-5 flex items-start gap-4 animate-in slide-in-from-bottom duration-700">
                            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0 text-red-600">
                                <XCircle className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                                <p className="text-[11px] font-black text-red-900 uppercase tracking-widest">Verification Failed</p>
                                <p className="text-[10px] text-red-700 mt-1 uppercase tracking-tight font-bold leading-relaxed">
                                    {profile?.kycRejectedReason || "Your previous submission was declined. Please review the requirements and submit clear documents."}
                                </p>
                            </div>
                            <Link 
                                to="/kyc/submit"
                                className="px-4 py-2 bg-red-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-red-700 transition shadow-lg shadow-red-200 shrink-0 flex items-center gap-2"
                            >
                                <RefreshCw className="w-3 h-3" /> Resubmit KYC
                            </Link>
                        </div>
                    )}
                </div>
            </div>

            {/* Premium Modals */}
            {kycViewer && (
                <KYCViewer
                    field={kycViewer}
                    label={kycViewer === 'document' ? 'Identity Artifact' : 'Biometric Snapshot'}
                    onClose={() => setKycViewer(null)}
                />
            )}
            {showPw && <ChangePasswordModal onClose={() => setShowPw(false)} onSuccess={handlePwSuccess} />}

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.05); border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,0.1); }
            `}</style>
        </div>
    );
};

// MapPin helper removed as it was unused.
