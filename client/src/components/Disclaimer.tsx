import { Link } from 'react-router-dom';
import logo from '../assets/logo.png';
import { ArrowLeft } from 'lucide-react';

const Disclaimer = () => {
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
                <h1 className="text-4xl font-bold mb-8">Disclaimer</h1>
                <div className="prose prose-slate max-w-none text-slate-600 space-y-6">
                    <p>
                        The information contained on the DigiChit platform is for general informational purposes only. DigiChit provides this service on an "as-is" and "as available" basis without any warranties of any kind.
                    </p>
                    <p>
                        Financial decisions, particularly those involving participation in chit funds and online pools of money, come with inherent risks. Nothing on our website or platform should be construed directly as strict financial advice. You are solely responsible for evaluating the risks and merits before committing to a chit fund group.
                    </p>
                    <p>
                        By using the DigiChit platform to join or manage a chit, you acknowledge that past financial returns generated through a chit group and other users' interactions on the site do not guarantee any future outcomes or performance.
                    </p>
                    <p>
                        We aim for complete transparency, but do not claim absolute liability for disputes arising natively out of organizer commitments external to our ledger tracking.
                    </p>
                </div>
            </main>
        </div>
    );
};

export default Disclaimer;
