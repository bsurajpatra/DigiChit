import { Link } from 'react-router-dom';
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
                    <p className="text-xs text-amber-600 uppercase font-bold tracking-widest mb-3">Legal</p>
                    <h1 className="text-4xl font-bold mb-4 text-slate-900">Disclaimer</h1>
                    <p className="text-slate-500">Last updated: March 2026</p>
                </div>

                <div className="flex items-start gap-4 p-6 bg-amber-50 border border-amber-200 rounded-2xl mb-12">
                    <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                    <p className="text-amber-800 text-sm leading-relaxed">
                        Please read this disclaimer carefully before using the DigiChit platform. By accessing our service, you acknowledge and agree to the terms outlined below.
                    </p>
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

export default Disclaimer;
