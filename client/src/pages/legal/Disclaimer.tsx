import { Link } from 'react-router-dom';
import { ArrowLeft, AlertTriangle, Scale } from 'lucide-react';
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
    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased relative overflow-hidden">
            {/* Glowing Ambient Orbs */}
            <div className="absolute top-[-10%] right-[20%] w-[500px] h-[500px] rounded-full bg-emerald-600/10 blur-[130px] pointer-events-none" />
            <div className="absolute bottom-[10%] left-[10%] w-[500px] h-[500px] rounded-full bg-teal-500/10 blur-[140px] pointer-events-none" />

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
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 text-amber-400 text-xs font-bold uppercase tracking-wider mb-4 border border-amber-500/20">
                        <Scale className="w-4 h-4" />
                        <span>Regulatory Notice</span>
                    </div>
                    <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight mb-4">Disclaimer</h1>
                    <p className="text-slate-400 text-sm">Last updated: March 2026</p>
                </div>

                <div className="flex items-start gap-4 p-6 bg-amber-950/20 border border-amber-500/20 rounded-2xl mb-10">
                    <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
                    <p className="text-amber-200/90 text-xs sm:text-sm leading-relaxed">
                        Please read this disclaimer carefully before using the DigiChit platform. By accessing our service, you acknowledge and agree to the terms outlined below.
                    </p>
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

export default Disclaimer;
