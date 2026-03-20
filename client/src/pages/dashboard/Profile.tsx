import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import api from '../../api/axios';
import { Loader } from '../../components/ui/Loader';
import {
    Mail, Shield, Clock, Calendar, AlertTriangle,
    KeyRound, Eye, EyeOff, Lock, CheckCircle2, XCircle,
    Loader2, FileText, Camera, X, UserCircle, Briefcase
} from 'lucide-react';

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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl flex flex-col overflow-hidden max-h-[85vh]">
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
                        {field === 'document' ? <FileText className="w-4 h-4 text-emerald-600" /> : <Camera className="w-4 h-4 text-emerald-600" />}
                        {label}
                    </div>
                    <button onClick={onClose} className="w-7 h-7 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors">
                        <X className="w-4 h-4 text-slate-500" />
                    </button>
                </div>
                <div className="flex-1 overflow-auto p-4 bg-slate-50 flex items-center justify-center min-h-[240px]">
                    {loading && <div className="flex flex-col items-center gap-2 text-slate-400"><Loader2 className="w-7 h-7 animate-spin text-emerald-600" /><p className="text-sm">Loading…</p></div>}
                    {error  && <div className="flex flex-col items-center gap-2 text-red-500"><AlertTriangle className="w-7 h-7" /><p className="text-sm">{error}</p></div>}
                    {src && !loading && (
                        isPdf
                            ? <iframe src={src} className="w-full h-[55vh] rounded-xl border border-slate-200" title={label} />
                            : <img src={src} alt={label} className="max-h-[55vh] rounded-xl shadow-md object-contain" />
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
        <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</label>
            <div className="relative">
                <input
                    id={id}
                    type={show[skey] ? 'text' : 'password'}
                    value={form[fkey]}
                    placeholder="••••••••"
                    onChange={e => setForm(p => ({ ...p, [fkey]: e.target.value }))}
                    className="w-full px-4 py-2.5 pr-10 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition text-slate-900 text-sm"
                    required
                />
                <button type="button" onClick={() => setShow(p => ({ ...p, [skey]: !p[skey] }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {show[skey] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-800"><KeyRound className="w-4 h-4 text-emerald-600" />Change Password</div>
                    <button onClick={onClose} className="w-7 h-7 rounded-full hover:bg-slate-100 flex items-center justify-center"><X className="w-4 h-4 text-slate-500" /></button>
                </div>
                <form onSubmit={handle} className="p-5 space-y-3">
                    {error && (
                        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />{error}
                        </div>
                    )}
                    <PwField id="cp-current" label="Current Password" fkey="current" skey="current" />
                    <PwField id="cp-new"     label="New Password"     fkey="next"    skey="next"    />
                    <PwField id="cp-confirm" label="Confirm New"      fkey="confirm" skey="confirm" />
                    <div className="flex gap-2 pt-1">
                        <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-slate-600 font-semibold hover:bg-slate-50 transition text-sm">Cancel</button>
                        <button type="submit" disabled={loading}
                            className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition active:scale-95 shadow-md shadow-emerald-200 text-sm flex items-center justify-center gap-2 disabled:opacity-60">
                            {loading ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Saving…</> : 'Update'}
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
            const formData = new FormData();
            formData.append('profilePicture', file);
            const res = await api.post('/user/profile-picture', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            const newUrl = res.data.data.profilePictureUrl;
            setProfile(prev => prev ? { ...prev, profilePictureUrl: newUrl } : null);
            updateUser({ profilePictureUrl: newUrl });
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Failed to upload image.');
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
            <AlertTriangle className="w-6 h-6 text-red-400" /><p className="font-medium">{error}</p>
        </div>
    );

    const kyc    = kycConfig[profile!.kycStatus];
    const accCls = accountConfig[profile!.accountStatus] ?? 'bg-slate-100 text-slate-500';

    // Compact info row
    const Row = ({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: React.ReactNode }) => (
        <div className="flex items-center gap-3 py-2.5 border-b border-slate-100 last:border-0">
            <div className="w-7 h-7 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                <Icon className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
                <span className="text-xs text-slate-400 font-semibold uppercase tracking-wide shrink-0">{label}</span>
                <div className="text-sm text-slate-800 font-medium text-right truncate">{value}</div>
            </div>
        </div>
    );

    return (
        <div className="h-full flex flex-col gap-4">

            {/* ── Page title (compact) ── */}
            <div className="shrink-0 flex items-center justify-between bg-white/40 backdrop-blur-md p-6 rounded-[2.5rem] border border-white/40 shadow-xl shadow-slate-100 mb-2">
                <div>
                    <h1 className="text-3xl font-medium text-slate-900 tracking-tight uppercase">My Profile</h1>
                    <p className="text-xs font-medium text-slate-400 mt-1 uppercase tracking-widest leading-none">Account metadata & Secure Credentials</p>
                </div>
                <div className="flex items-center gap-3 px-5 py-2.5 bg-transparent">
                    <div className="w-8 h-8 bg-slate-900 text-white rounded-lg flex items-center justify-center font-black text-sm">
                        <UserCircle className="w-5 h-5" />
                    </div>
                </div>
            </div>

            {/* ── Main grid ── */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-0">

                {/* ── Left: Avatar + Actions ── */}
                <div className="flex flex-col gap-3">

                    {/* Avatar */}
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col items-center text-center gap-3">
                        <div className="relative group shrink-0">
                            <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                ref={avatarInputRef}
                                onChange={handleAvatarUpload}
                            />
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-400 flex items-center justify-center overflow-hidden relative">
                                {profile?.profilePictureUrl ? (
                                    <img src={profile.profilePictureUrl} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-2xl font-extrabold text-white">
                                        {profile?.name?.charAt(0)?.toUpperCase()}
                                    </span>
                                )}
                                <button
                                    onClick={() => avatarInputRef.current?.click()}
                                    disabled={uploadingAvatar}
                                    className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-100"
                                >
                                    {uploadingAvatar ? <Loader2 className="w-5 h-5 text-white animate-spin" /> : <Camera className="w-5 h-5 text-white" />}
                                </button>
                            </div>
                        </div>
                        <div>
                            <p className="font-bold text-slate-900">{profile?.name}</p>
                            <p className="text-xs text-slate-400 truncate">{profile?.email}</p>
                        </div>
                        <div className="flex flex-wrap gap-1.5 justify-center">
                            <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[11px] font-bold uppercase tracking-wider">{profile?.role}</span>
                            <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${accCls}`}>{profile?.accountStatus}</span>
                        </div>
                    </div>

                    {/* Change Password */}
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-3">
                        <button onClick={() => setShowPw(true)}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors group">
                            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center shrink-0">
                                <KeyRound className="w-3.5 h-3.5 text-white" />
                            </div>
                            <div className="text-left flex-1">
                                <p className="text-sm font-bold text-slate-800">Change Password</p>
                                <p className="text-xs text-slate-400">Update your login credentials</p>
                            </div>
                        </button>
                    </div>

                    {pwSuccess && (
                        <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-2xl text-green-700 text-xs">
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                            Password updated! Logging out shortly…
                        </div>
                    )}

                    {/* KYC Documents */}
                    {hasKYC && (
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-3">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-2">KYC Documents</p>
                            {[
                                { field: 'document' as const, icon: FileText, label: 'Aadhaar / ID Card' },
                                { field: 'selfie'   as const, icon: Camera,   label: 'Selfie Photo'     },
                            ].map(({ field, icon: Icon, label }) => (
                                <button key={field} onClick={() => setKycViewer(field)}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors group">
                                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                                        <Icon className="w-3.5 h-3.5 text-slate-500" />
                                    </div>
                                    <div className="text-left flex-1">
                                        <p className="text-sm font-bold text-slate-800">{label}</p>
                                        <p className="text-xs text-slate-400">Tap to preview</p>
                                    </div>
                                    <Eye className="w-3.5 h-3.5 text-slate-300 group-hover:text-emerald-600 transition-colors" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* ── Right: Info cards ── */}
                <div className="lg:col-span-2 flex flex-col gap-4 min-h-0">

                    {/* Personal Info */}
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Personal Information</p>
                        <Row icon={Mail}     label="Email"  value={
                            <span className="flex items-center gap-1.5 justify-end">
                                <span className="truncate">{profile?.email}</span>
                                {profile?.emailVerified
                                    ? <CheckCircle2 className="w-3 h-3 text-green-500 shrink-0" />
                                    : <XCircle      className="w-3 h-3 text-red-400  shrink-0" />}
                            </span>
                        } />
                        {!isAdmin && <Row icon={Calendar} label="Age"   value={`${profile?.age} years`} />}
                    </div>

                    {/* Account Status */}
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Account Status</p>
                        {!isAdmin && (
                            <>
                                <Row icon={Shield}   label="KYC Status"      value={
                                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${kyc.cls}`}>{kyc.label}</span>
                                } />
                                <Row icon={Calendar} label="Member Since"    value={fmt(profile?.createdAt)} />
                            </>
                        )}
                        <Row icon={Lock}     label="Account Status"  value={
                            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${accCls}`}>{profile?.accountStatus}</span>
                        } />
                        <Row icon={Clock}    label="Last Login"       value={fmt(profile?.lastLoginAt)} />
                    </div>

                    {/* Organizer Profile */}
                    {profile?.role === 'ORGANIZER' && (
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 animate-in slide-in-from-right duration-500">
                            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1 flex items-center gap-2">
                                <Shield className="w-3 h-3" /> Organizer Profile
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
                                <Row icon={Briefcase} label="Operation City" value={profile.city} />
                                <Row icon={UserCircle} label="Primary Profession" value={profile.occupation} />
                            </div>
                        </div>
                    )}

                    {/* KYC not-submitted notice */}
                    {profile?.kycStatus === 'NOT_SUBMITTED' && (
                        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
                            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-bold text-amber-800">KYC Not Submitted</p>
                                <p className="text-xs text-amber-700 mt-0.5">Complete your KYC to unlock all platform features.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modals */}
            {kycViewer && (
                <KYCViewer
                    field={kycViewer}
                    label={kycViewer === 'document' ? 'Aadhaar / ID Card' : 'Selfie Photo'}
                    onClose={() => setKycViewer(null)}
                />
            )}
            {showPw && <ChangePasswordModal onClose={() => setShowPw(false)} onSuccess={handlePwSuccess} />}
        </div>
    );
};
