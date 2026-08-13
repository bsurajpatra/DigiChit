import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import logo from '../../assets/logo.png';

const sections = [
    {
        title: '1. Information We Collect',
        body: 'We collect information you provide directly to us, such as your name, email address, phone number, and government-issued ID (Aadhaar number and card image) during registration and KYC verification. We also collect a selfie photograph for biometric identity verification.',
    },
    {
        title: '2. How We Use Your Information',
        body: 'Your information is used solely to operate, improve, and secure the DigiChit platform. This includes verifying your identity, processing transactions, communicating with you about your account, and complying with legal obligations.',
    },
    {
        title: '3. KYC Document Storage',
        body: 'All KYC documents (Aadhaar images and selfies) are stored securely using Cloudinary with a zero-disk-footprint approach. Documents are encrypted at rest and only accessible to authorized DigiChit administrators for the purpose of identity verification.',
    },
    {
        title: '4. Data Sharing',
        body: 'We do not sell, trade, or otherwise transfer your personally identifiable information to outside parties. We may share data with trusted service providers who assist us in operating our platform, under strict confidentiality agreements.',
    },
    {
        title: '5. Data Retention',
        body: 'We retain your personal data for as long as your account is active or as needed to provide services and comply with legal obligations under the Prevention of Money Laundering Act (PMLA) and related RBI guidelines.',
    },
    {
        title: '6. Security',
        body: 'We implement industry-standard security measures including AES-256 encryption, secure HTTPS connections, and access controls to protect your personal information from unauthorized access, alteration, or disclosure.',
    },
    {
        title: '7. Your Rights',
        body: 'You have the right to access, correct, or request deletion of your personal data, subject to legal retention requirements. To exercise these rights, please contact us at privacy@digichit.in.',
    },
    {
        title: '8. Cookies',
        body: 'We use session cookies to authenticate users and maintain security. We do not use tracking cookies for advertising purposes.',
    },
    {
        title: '9. Changes to This Policy',
        body: 'We may update this Privacy Policy periodically. We will notify you of significant changes via email or a prominent notice on our platform.',
    },
];

const PrivacyPolicy = () => {
    const navigate = useNavigate();

    const handleBack = () => {
        if (window.history.length > 1) {
            navigate(-1);
        } else {
            navigate('/');
        }
    };

    return (
        <div className="min-h-screen bg-slate-50/60 text-slate-900 font-sans antialiased relative overflow-hidden">
            {/* Navigation */}
            <nav className="w-full z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/80 sticky top-0">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between relative">
                    {/* Left: Dynamic Back Button */}
                    <button 
                        onClick={handleBack}
                        className="flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors z-10 cursor-pointer"
                    >
                        <ArrowLeft className="w-4 h-4 text-blue-600" />
                        <span>Back</span>
                    </button>

                    {/* Center: Logo & Title */}
                    <Link to="/" className="absolute left-1/2 -translate-x-1/2 flex items-center gap-3 group z-10">
                        <img src={logo} alt="DigiChit Logo" className="w-9 h-9 object-contain group-hover:scale-105 transition-transform" />
                        <span className="text-xl font-black tracking-tight text-slate-900">DigiChit</span>
                    </Link>

                    {/* Right spacer for balance */}
                    <div className="w-16 z-10" />
                </div>
            </nav>

            {/* Main Content Container */}
            <main className="max-w-4xl mx-auto px-6 py-8 pb-8 relative z-10 space-y-6">
                {/* Header Card */}
                <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-xs text-center space-y-3">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-600 text-xs font-bold uppercase tracking-wider border border-emerald-100 mx-auto">
                        <ShieldCheck className="w-4 h-4" />
                        <span>Data Protection & Privacy</span>
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">Privacy Policy</h1>
                    <p className="text-slate-400 text-xs font-bold">Last updated: March 2026</p>
                </div>

                {/* Privacy Body Card */}
                <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-xs divide-y divide-slate-100">
                    {sections.map((section, idx) => (
                        <div key={idx} className="py-6 first:pt-0 last:pb-0 space-y-2">
                            <h2 className="text-base font-black text-slate-900">{section.title}</h2>
                            <p className="text-slate-600 text-xs font-medium leading-relaxed">{section.body}</p>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
};

export default PrivacyPolicy;
