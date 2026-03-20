import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import logo from '../../assets/logo.png';

const sections = [
    {
        title: '1. Acceptance of Terms',
        body: 'By accessing or using the DigiChit platform ("Service"), you agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use our Service.',
    },
    {
        title: '2. Eligibility',
        body: 'You must be at least 21 years old and a resident of India to use DigiChit. By registering, you confirm that all information provided is accurate and complete.',
    },
    {
        title: '3. KYC Verification',
        body: 'All users are required to complete a Know Your Customer (KYC) verification process before participating in any chit fund group. This includes submitting a valid government-issued ID (Aadhaar) and a selfie for identity verification.',
    },
    {
        title: '4. User Responsibilities',
        body: 'You are responsible for maintaining the confidentiality of your account credentials. You agree not to share your login information with any third party. Any activity conducted through your account is your sole responsibility.',
    },
    {
        title: '5. Financial Obligations',
        body: 'Members who join a chit group are obligated to make timely monthly contributions as agreed upon at the time of joining. Failure to make payments may result in penalties, suspension from the auction, or termination of membership.',
    },
    {
        title: '6. Auction Conduct',
        body: 'Bidding in auctions is a binding financial commitment. Any bid placed cannot be retracted. The platform reserves the right to disqualify any member found engaging in bid manipulation or collusion.',
    },
    {
        title: '7. Limitation of Liability',
        body: 'DigiChit Technologies shall not be liable for any indirect, incidental, special, or consequential damages arising from the use of, or inability to use, our Service.',
    },
    {
        title: '8. Modifications',
        body: 'We reserve the right to modify these Terms at any time. Continued use of the Service after changes constitutes acceptance of the new Terms.',
    },
    {
        title: '9. Governing Law',
        body: 'These Terms shall be governed by and construed in accordance with the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts in Bengaluru, Karnataka.',
    },
];

const TermsAndConditions = () => {
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
                    <h1 className="text-4xl font-bold mb-4 text-slate-900">Terms & Conditions</h1>
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

export default TermsAndConditions;
