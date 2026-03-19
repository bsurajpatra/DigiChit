import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
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
        <div className="min-h-screen bg-white text-slate-900 font-sans">
            <nav className="w-full z-50 bg-white border-b border-slate-100">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2">
                        <img src={logo} alt="DigiChit Logo" className="w-10 h-10 object-contain" />
                        <span className="text-xl font-bold tracking-tight text-slate-900">DigiChit</span>
                    </Link>
                    <Link to="/" className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-emerald-700 transition-colors">
                        <ArrowLeft className="w-4 h-4" /> Back to Home
                    </Link>
                </div>
            </nav>
            <main className="max-w-4xl mx-auto px-6 py-24">
                <div className="mb-12">
                    <p className="text-xs text-emerald-600 uppercase font-bold tracking-widest mb-3">Legal</p>
                    <h1 className="text-4xl font-bold mb-4 text-slate-900">Privacy Policy</h1>
                    <p className="text-slate-500">Last updated: March 2026</p>
                </div>
                <div className="space-y-10">
                    {sections.map((section) => (
                        <div key={section.title} className="border-b border-slate-100 pb-10 last:border-0">
                            <h2 className="text-lg font-bold text-slate-900 mb-3">{section.title}</h2>
                            <p className="text-slate-600 leading-relaxed">{section.body}</p>
                        </div>
                    ))}
                </div>
            </main>
            <footer className="border-t border-slate-100 py-8 text-center text-xs text-slate-400 uppercase tracking-widest font-bold">
                © 2026 DigiChit Technologies
            </footer>
        </div>
    );
};

export default PrivacyPolicy;
