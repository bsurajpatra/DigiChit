import { Link } from 'react-router-dom';
import logo from '../assets/logo.png';
import { ArrowLeft, ShieldCheck, Users, Target, Award } from 'lucide-react';

const AboutUs = () => {
    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased relative overflow-hidden">
            {/* Glowing Ambient Orbs */}
            <div className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] rounded-full bg-emerald-600/10 blur-[130px] pointer-events-none" />
            <div className="absolute bottom-[10%] right-[10%] w-[500px] h-[500px] rounded-full bg-teal-500/10 blur-[140px] pointer-events-none" />

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

            {/* Content */}
            <main className="max-w-4xl mx-auto px-6 py-16 relative z-10">
                <div className="text-center mb-16">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-4 border border-emerald-500/20">
                        <ShieldCheck className="w-4 h-4" />
                        <span>Platform Overview</span>
                    </div>
                    <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight mb-4">About DigiChit</h1>
                    <p className="text-slate-400 text-base max-w-2xl mx-auto">
                        Digitizing traditional community savings with bank-grade encryption, instant settlements, and zero ledger fraud.
                    </p>
                </div>

                <div className="space-y-12">
                    <div className="py-6 border-b border-slate-800/60">
                        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                            <Target className="w-6 h-6 text-emerald-400" />
                            Our Mission
                        </h2>
                        <p className="text-slate-300 text-base leading-relaxed mb-4">
                            Welcome to DigiChit! We are revolutionizing the traditional chit fund industry by bringing it into the modern digital era. Our mission is to make chit fund groups accessible, transparent, and completely secure for both individual members and group organizers.
                        </p>
                        <p className="text-slate-400 text-sm leading-relaxed">
                            With decades of combined financial technology experience, our engineering team built DigiChit to eliminate manual accounting errors, physical cash handling hazards, and organizer default risks.
                        </p>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-8 pt-4">
                        <div className="py-4">
                            <Users className="w-8 h-8 text-teal-400 mb-3" />
                            <h3 className="text-xl font-bold text-white mb-2">Community Focused</h3>
                            <p className="text-sm text-slate-400 leading-relaxed">
                                Built for trust. Every participant undergoes Aadhaar-based eKYC verification before joining any circle.
                            </p>
                        </div>
                        <div className="py-4">
                            <Award className="w-8 h-8 text-emerald-400 mb-3" />
                            <h3 className="text-xl font-bold text-white mb-2">Immutable Security</h3>
                            <p className="text-sm text-slate-400 leading-relaxed">
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
