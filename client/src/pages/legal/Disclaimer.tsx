import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import logo from '../../assets/logo.png';

const sections = [
    {
        title: 'General Disclaimer',
        body: 'The information provided on the DigiChit platform is for general informational and operational purposes only. While we strive to keep the information accurate and up to date, we make no representations or warranties of any kind, express or implied, about the completeness, accuracy, reliability, or suitability of the information.',
    },
    {
        title: 'Financial Disclaimer',
        body: 'DigiChit is a chit fund management platform and does not provide financial, investment, legal, or tax advice. Participation in a chit fund involves financial risk. Past performance of any chit group is not indicative of future results. You should consult a qualified financial advisor before participating.',
    },
    {
        title: 'Regulatory Compliance',
        body: 'DigiChit operates as a technology platform to facilitate chit fund management. Individual chit fund groups may be subject to regulations under the Chit Funds Act, 1982, and applicable state laws. Organizers are responsible for ensuring their groups meet all regulatory requirements.',
    },
    {
        title: 'Third-Party Links',
        body: 'Our platform may contain links to third-party websites or services. DigiChit has no control over the content, privacy policies, or practices of those sites and accepts no responsibility for them.',
    },
    {
        title: 'Limitation of Liability',
        body: 'In no event shall DigiChit Technologies, its directors, employees, or affiliates be liable for any loss or damage, including without limitation, indirect or consequential loss or damage, arising from the use or inability to use the platform.',
    },
    {
        title: 'Technical Issues',
        body: 'DigiChit makes reasonable efforts to ensure continuous platform availability, but we cannot guarantee the platform will be error-free or uninterrupted. We are not liable for any losses caused by technical disruptions, server downtime, or connectivity issues.',
    },
];

const Disclaimer = () => {
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
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-50 text-amber-600 text-xs font-bold uppercase tracking-wider border border-amber-100 mx-auto">
                        <AlertTriangle className="w-4 h-4" />
                        <span>Regulatory & Platform Notice</span>
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">Legal Disclaimer</h1>
                    <p className="text-slate-400 text-xs font-bold">Last updated: March 2026</p>
                </div>

                {/* Disclaimer Body Card */}
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

export default Disclaimer;
