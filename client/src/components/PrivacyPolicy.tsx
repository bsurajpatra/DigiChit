import { Link } from 'react-router-dom';
import logo from '../assets/logo.png';
import { ArrowLeft } from 'lucide-react';

const PrivacyPolicy = () => {
    return (
        <div className="min-h-screen bg-white text-slate-900 font-sans">
            <nav className="w-full z-50 bg-white border-b border-slate-100">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2">
                        <img src={logo} alt="DigiChit Logo" className="w-10 h-10 object-contain" />
                        <span className="text-xl font-bold tracking-tight text-slate-900">DigiChit</span>
                    </Link>
                    <Link to="/" className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors">
                        <ArrowLeft className="w-4 h-4" /> Back to Home
                    </Link>
                </div>
            </nav>
            <main className="max-w-4xl mx-auto px-6 py-24">
                <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
                <div className="prose prose-slate max-w-none text-slate-600 space-y-6">
                    <p>Last updated: March 14, 2026</p>
                    <p>
                        At DigiChit, we take your privacy very seriously. This Privacy Policy describes our policies and procedures on the collection, use, and disclosure of your information when you use our service.
                    </p>
                    <h2 className="text-xl font-bold text-slate-900 mt-8 mb-4">Data We Collect</h2>
                    <p>
                        We collect the personal data you voluntarily provide us when creating an account, such as your name, email address, phone number, and KYC (Know Your Customer) documents.
                    </p>
                    <h2 className="text-xl font-bold text-slate-900 mt-8 mb-4">How We Use Your Data</h2>
                    <p>
                        Your data is used exclusively to facilitate secure and legally compliant chit fund management on the DigiChit Platform. We use this information to calculate risk, verify identities to deter fraudulent actions, and to directly communicate account-related notices.
                    </p>
                    <h2 className="text-xl font-bold text-slate-900 mt-8 mb-4">Security</h2>
                    <p>
                        We use bank-grade AES-256 encryption. We never sell your personal information to third parties. We are continuously updating our architectural security measures to thwart unauthorized access.
                    </p>
                </div>
            </main>
        </div>
    );
};

export default PrivacyPolicy;
