import { Link } from 'react-router-dom';
import logo from '../assets/logo.png';
import { ArrowLeft } from 'lucide-react';

const TermsAndConditions = () => {
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
                <h1 className="text-4xl font-bold mb-8">Terms & Conditions</h1>
                <div className="prose prose-slate max-w-none text-slate-600 space-y-6">
                    <p>Last updated: March 14, 2026</p>
                    <p>
                        Welcome to DigiChit! By accessing or using our platform, you agree to comply with and be bound by these Terms & Conditions.
                    </p>
                    <h2 className="text-xl font-bold text-slate-900 mt-8 mb-4">1. Acceptance of Terms</h2>
                    <p>
                        By creating an account, you signify your unreserved acceptance of all provisions of these Terms. If you do not agree, please do not use our services.
                    </p>
                    <h2 className="text-xl font-bold text-slate-900 mt-8 mb-4">2. Eligibility</h2>
                    <p>
                        You must be at least 18 years of age and hold a valid Aadhaar or equivalent identity verification to register or participate in any digital chit fund transactions on our platform.
                    </p>
                    <h2 className="text-xl font-bold text-slate-900 mt-8 mb-4">3. User Responsibilities</h2>
                    <p>
                        You are entirely responsible for keeping your login credentials secure. Any funds deposited or auctioned are done so under digital smart contracts which are firm and binding. Defaulting on payments may incur penalties and risk your account's standing.
                    </p>
                    <p className="pt-8 text-sm text-slate-500">
                        For any queries regarding the terms, contact legal@digichit.tech.
                    </p>
                </div>
            </main>
        </div>
    );
};

export default TermsAndConditions;
