import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';
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
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 text-blue-600 text-xs font-bold uppercase tracking-wider border border-blue-100 mx-auto">
                        <FileText className="w-4 h-4" />
                        <span>Legal Specifications</span>
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">Terms & Conditions</h1>
                    <p className="text-slate-400 text-xs font-bold">Last updated: March 2026</p>
                </div>

                {/* Terms Body Card */}
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

export default TermsAndConditions;
