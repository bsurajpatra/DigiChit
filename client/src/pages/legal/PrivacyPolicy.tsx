import { Link } from 'react-router-dom';
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
    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased relative overflow-hidden">
            {/* Glowing Ambient Orbs */}
            <div className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] rounded-full bg-emerald-600/10 blur-[130px] pointer-events-none" />
            <div className="absolute bottom-[10%] right-[10%] w-[500px] h-[500px] rounded-full bg-teal-500/10 blur-[140px] pointer-events-none" />

            {/* Navigation */}
            <nav className="w-full z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80 sticky top-0">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between relative">
                    {/* Left: Back Link */}
                    <Link 
                        to="/#footer" 
                        state={{ scrollToFooter: true }}
                        className="flex items-center gap-2 text-sm font-medium text-slate-300 hover:text-emerald-400 transition-colors z-10"
                    >
                        <ArrowLeft className="w-4 h-4 text-emerald-400" /> Back
                    </Link>

                    {/* Center: Logo & Title */}
                    <Link to="/" className="absolute left-1/2 -translate-x-1/2 flex items-center gap-3 group z-10">
                        <img src={logo} alt="DigiChit Logo" className="w-9 h-9 object-contain group-hover:scale-105 transition-transform" />
                        <span className="text-xl font-bold tracking-tight text-white">DigiChit</span>
                    </Link>

                    {/* Right spacer for balance */}
                    <div className="w-16 z-10" />
                </div>
            </nav>

            {/* Main Content */}
            <main className="max-w-4xl mx-auto px-6 py-16 relative z-10">
                <div className="text-center mb-16">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-4 border border-emerald-500/20">
                        <ShieldCheck className="w-4 h-4" />
                        <span>Data Protection</span>
                    </div>
                    <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight mb-4">Privacy Policy</h1>
                    <p className="text-slate-400 text-sm">Last updated: March 2026</p>
                </div>

                <div className="divide-y divide-slate-800/60">
                    {sections.map((section, idx) => (
                        <div key={idx} className="py-6 first:pt-0">
                            <h2 className="text-lg font-bold text-white mb-2">{section.title}</h2>
                            <p className="text-slate-300 text-sm leading-relaxed">{section.body}</p>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
};

export default PrivacyPolicy;
