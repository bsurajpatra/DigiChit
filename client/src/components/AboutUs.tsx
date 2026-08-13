import { Link, useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';
import { ArrowLeft, ShieldCheck, Users, Target, Award } from 'lucide-react';

const AboutUs = () => {
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

            {/* Content Container */}
            <main className="max-w-4xl mx-auto px-6 py-8 pb-8 relative z-10 space-y-6">
                {/* Header Card */}
                <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-xs text-center space-y-4">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 text-blue-600 text-xs font-bold uppercase tracking-wider border border-blue-100 mx-auto">
                        <ShieldCheck className="w-4 h-4" />
                        <span>Platform Overview</span>
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">About DigiChit</h1>
                    <p className="text-slate-500 text-sm max-w-2xl mx-auto font-medium leading-relaxed">
                        Digitizing traditional community savings with bank-grade encryption, instant settlements, and zero ledger fraud.
                    </p>
                </div>

                {/* Section Cards */}
                <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-8">
                    <div className="pb-8 border-b border-slate-100">
                        <h2 className="text-xl font-black text-slate-900 mb-3 flex items-center gap-2.5">
                            <Target className="w-5 h-5 text-blue-600" />
                            <span>Our Mission</span>
                        </h2>
                        <p className="text-slate-600 text-sm leading-relaxed mb-3">
                            Welcome to DigiChit! We are revolutionizing the traditional chit fund industry by bringing it into the modern digital era. Our mission is to make chit fund groups accessible, transparent, and completely secure for both individual members and group organizers.
                        </p>
                        <p className="text-slate-500 text-xs leading-relaxed">
                            With decades of combined financial technology experience, our engineering team built DigiChit to eliminate manual accounting errors, physical cash handling hazards, and organizer default risks.
                        </p>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-6">
                        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                            <Users className="w-6 h-6 text-sky-600 mb-1" />
                            <h3 className="text-base font-black text-slate-900">Community Focused</h3>
                            <p className="text-xs text-slate-500 font-medium leading-relaxed">
                                Built for trust. Every participant undergoes Aadhaar-based eKYC verification before joining any circle.
                            </p>
                        </div>

                        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                            <Award className="w-6 h-6 text-emerald-600 mb-1" />
                            <h3 className="text-base font-black text-slate-900">Immutable Security</h3>
                            <p className="text-xs text-slate-500 font-medium leading-relaxed">
                                Automated dividend distribution engines ensuring fair-play digital bidding and instant settlements.
                            </p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AboutUs;
