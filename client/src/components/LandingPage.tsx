import {
    Shield,
    Lock,
    ArrowRight,
    CheckCircle2,
    Users,
    BarChart3,
    Zap,
    AlertTriangle,
    ChevronRight,
    TrendingUp,
    Receipt,
    CreditCard
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import heroMockup from '../assets/hero_mockup_light.png';
import logo from '../assets/logo.png';

const LandingPage = () => {
    const fadeIn = {
        initial: { opacity: 0, y: 20 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true },
        transition: { duration: 0.6 }
    };

    return (
        <div className="min-h-screen bg-white text-slate-900 selection:bg-emerald-600 font-sans">
            {/* Navbar */}
            <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <img src={logo} alt="DigiChit Logo" className="w-10 h-10 object-contain" />
                        <span className="text-xl font-bold tracking-tight text-slate-900">DigiChit</span>
                    </div>
                    <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-500">
                        <a href="#how-it-works" className="hover:text-emerald-700 transition-colors">How it works</a>
                        <a href="#security" className="hover:text-emerald-700 transition-colors">Security</a>
                        <Link to="/signup" className="px-5 py-2.5 bg-emerald-600 text-white rounded-full hover:bg-emerald-700 transition-all font-semibold shadow-md shadow-emerald-200">
                            Get Started
                        </Link>
                    </div>
                </div>
            </nav>

            <main>
                {/* 1️⃣ Hero Section */}
                <section className="relative pt-32 pb-20 overflow-hidden bg-slate-50">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none">
                        <div className="absolute bottom-[10%] right-[-5%] w-[30%] h-[30%] bg-teal-500/5 blur-[100px] rounded-full" />
                    </div>

                    <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8 }}
                        >
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-600 border border-emerald-300 text-white text-xs font-bold uppercase tracking-wider mb-6">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                                </span>
                                The Future of Chit Funds
                            </div>
                            <h1 className="text-5xl lg:text-7xl font-bold text-slate-900 leading-[1.1] mb-6">
                                Digital Chit Funds. <br />
                                <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">Transparent. Secure.</span>
                            </h1>
                            <p className="text-lg text-slate-600 mb-10 max-w-xl leading-relaxed">
                                DigiChit brings traditional chit funds into a secure digital ecosystem with automated auctions, verified members, and full financial transparency.
                            </p>
                            <div className="flex flex-wrap gap-4">
                                <Link to="/signup" className="group px-8 py-4 bg-emerald-600 text-white rounded-2xl flex items-center gap-2 font-bold hover:shadow-xl hover:shadow-emerald-300 transition-all active:scale-95 text-center justify-center">
                                    🚀 Get Started
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </Link>
                                <Link to="/login" className="px-8 py-4 bg-white border border-slate-200 text-slate-700 rounded-2xl font-bold hover:bg-slate-50 transition-all active:scale-95 shadow-sm text-center justify-center">
                                    🔐 Login
                                </Link>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 1 }}
                            className="relative"
                        >
                            <div className="relative z-10 rounded-3xl border border-slate-200 bg-white p-2 shadow-2xl overflow-hidden">
                                <img
                                    src={heroMockup}
                                    alt="DigiChit Dashboard Mockup"
                                    className="rounded-2xl w-full"
                                />
                            </div>
                            {/* Decorative elements */}
                            <div className="absolute -top-6 -right-6 w-32 h-32 bg-emerald-600 blur-3xl" />
                            <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-teal-200/40 blur-3xl" />
                        </motion.div>
                    </div>
                </section>

                {/* 2️⃣ Problem Section */}
                <section className="py-24 relative border-y border-slate-100 bg-white">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="grid lg:grid-cols-2 gap-20 items-center">
                            <motion.div {...fadeIn}>
                                <h2 className="text-4xl font-bold mb-8 text-red-600">
                                    Why Traditional Chit Funds Fail
                                </h2>
                                <div className="space-y-4">
                                    {[
                                        "Manual accounting errors",
                                        "Organizer fraud",
                                        "No audit trail",
                                        "Cash handling risk",
                                        "No transparency"
                                    ].map((point) => (
                                        <div key={point} className="flex items-center gap-4 text-slate-600">
                                            <div className="w-6 h-6 rounded-full bg-red-50 flex items-center justify-center border border-red-100">
                                                <AlertTriangle className="w-3 h-3 text-red-600" />
                                            </div>
                                            <span className="text-lg">{point}</span>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>

                            <motion.div
                                {...fadeIn}
                                className="bg-slate-50 p-12 rounded-[2rem] border border-slate-200 text-center shadow-inner"
                            >
                                <h3 className="text-3xl font-bold mb-6 text-slate-900">DigiChit solves all of this.</h3>
                                <p className="text-slate-600 mb-8">
                                    We've built a platform that eliminates human error and fraud through automation and secure digital verification.
                                </p>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
                                        <div className="text-2xl font-bold text-emerald-600">100%</div>
                                        <div className="text-xs text-slate-500 uppercase font-bold">Transparent</div>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
                                        <div className="text-2xl font-bold text-teal-600">Zero</div>
                                        <div className="text-xs text-slate-500 uppercase font-bold">Fraud Risk</div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </section>

                {/* 3️⃣ How DigiChit Works */}
                <section className="py-24 bg-slate-50" id="how-it-works">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="text-center mb-16">
                            <h2 className="text-4xl font-bold mb-4 text-slate-900">How DigiChit Works</h2>
                            <p className="text-slate-600">Simple 4-step process to get started</p>
                        </div>
                        <div className="grid md:grid-cols-4 gap-8">
                            {[
                                { step: "1", title: "Register & Complete eKYC", icon: Users },
                                { step: "2", title: "Join or Create a Chit Group", icon: Zap },
                                { step: "3", title: "Participate in Secure Digital Auction", icon: TrendingUp },
                                { step: "4", title: "Get Transparent Dividend Distribution", icon: Receipt }
                            ].map((item, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.1 }}
                                    className="relative p-8 rounded-3xl bg-white border border-slate-200 hover:border-emerald-400 hover:shadow-lg transition-all group"
                                >
                                    <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center mb-6">
                                        <item.icon className="w-6 h-6 text-white" />
                                    </div>
                                    <div className="text-5xl font-extrabold text-emerald-600 mb-2">{item.step}</div>
                                    <h4 className="text-xl font-bold leading-tight text-slate-900">{item.title}</h4>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* 4️⃣ Security & Trust Section */}
                <section className="py-24 bg-white" id="security">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="bg-slate-900 text-white rounded-[3rem] p-8 md:p-16 relative overflow-hidden shadow-2xl">
                            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-600 blur-[100px] -mr-64 -mt-64" />

                            <div className="grid lg:grid-cols-2 gap-16 items-center">
                                <div>
                                    <h2 className="text-4xl font-bold mb-6 text-white">Built for Transparency & <br /><span className="text-teal-400">Fraud Prevention</span></h2>
                                    <p className="text-slate-400 mb-10 leading-relaxed text-lg">
                                        Security isn't just a feature; it's our core architecture. We use bank-grade encryption and multi-step verification to ensure your funds are always safe.
                                    </p>
                                    <div className="grid sm:grid-cols-2 gap-6">
                                        {[
                                            { icon: Shield, text: "Aadhaar-based verification" },
                                            { icon: Lock, text: "Immutable transaction logs" },
                                            { icon: Zap, text: "Automated dividend calculation" },
                                            { icon: Users, text: "Admin verification system" },
                                            { icon: BarChart3, text: "Real-time dashboards" }
                                        ].map((feature, i) => (
                                            <div key={i} className="flex items-center gap-3">
                                                <feature.icon className="w-5 h-5 text-teal-400" />
                                                <span className="text-slate-300 font-medium">{feature.text}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="relative">
                                    <div className="bg-white/10 p-8 rounded-3xl border border-white/10 backdrop-blur-md">
                                        <div className="flex items-center justify-between mb-8">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-teal-500/20 flex items-center justify-center">
                                                    <CheckCircle2 className="w-6 h-6 text-teal-500" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-white">Security Status</p>
                                                    <p className="text-xs text-slate-500 uppercase tracking-widest">Active & Protected</p>
                                                </div>
                                            </div>
                                            <div className="px-3 py-1 bg-teal-500/20 text-teal-400 text-[10px] font-bold rounded-lg border border-teal-500/20">VERIFIED</div>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    whileInView={{ width: '92%' }}
                                                    transition={{ duration: 1.5, delay: 0.5 }}
                                                    className="h-full bg-gradient-to-r from-teal-500 to-emerald-400"
                                                />
                                            </div>
                                            <div className="flex justify-between text-xs text-slate-500">
                                                <span>Encryption Level</span>
                                                <span>AES-256</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 5️⃣ & 6️⃣ Benefits Section */}
                <section className="py-24 bg-slate-50">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="grid lg:grid-cols-2 gap-8">
                            {/* Organizer Benefits */}
                            <motion.div {...fadeIn} className="p-8 md:p-12 rounded-[2.5rem] bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                                <div className="w-14 h-14 bg-emerald-600 rounded-2xl flex items-center justify-center mb-8 shadow-lg shadow-emerald-200">
                                    <BarChart3 className="w-7 h-7 text-white" />
                                </div>
                                <h3 className="text-3xl font-bold mb-6 text-slate-900">Organizer Benefits</h3>
                                <ul className="space-y-4">
                                    {[
                                        "Commission automation",
                                        "No manual calculation",
                                        "Defaulter tracking",
                                        "Risk monitoring"
                                    ].map(item => (
                                        <li key={item} className="flex items-center gap-3 text-slate-600">
                                            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </motion.div>

                            {/* Member Benefits */}
                            <motion.div {...fadeIn} className="p-8 md:p-12 rounded-[2.5rem] bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                                <div className="w-14 h-14 bg-teal-500 rounded-2xl flex items-center justify-center mb-8 shadow-lg shadow-teal-100">
                                    <CreditCard className="w-7 h-7 text-white" />
                                </div>
                                <h3 className="text-3xl font-bold mb-6 text-slate-900">Member Benefits</h3>
                                <ul className="space-y-4">
                                    {[
                                        "Full visibility",
                                        "Clear dividend breakdown",
                                        "Digital receipts",
                                        "Secure payments"
                                    ].map(item => (
                                        <li key={item} className="flex items-center gap-3 text-slate-600">
                                            <CheckCircle2 className="w-5 h-5 text-teal-500" />
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </motion.div>
                        </div>
                    </div>
                </section>

                {/* 7️⃣ Call To Action */}
                <section className="py-24 pb-32 bg-white">
                    <div className="max-w-4xl mx-auto px-6 text-center">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.6 }}
                            className="bg-emerald-600 text-white rounded-[3rem] p-12 md:p-20 relative overflow-hidden shadow-2xl shadow-emerald-200"
                        >
                            <h2 className="text-4xl md:text-5xl font-bold mb-8 relative z-10">
                                Ready to Digitize Your <br />Chit Fund?
                            </h2>
                            <div className="flex flex-wrap justify-center gap-4 relative z-10">
                                <Link to="/signup" className="px-10 py-4 bg-white text-emerald-600 rounded-2xl font-bold hover:bg-slate-50 transition-all active:scale-95 flex items-center gap-2 shadow-lg">
                                    Start as Member
                                    <ChevronRight className="w-5 h-5" />
                                </Link>
                                <button className="px-10 py-4 bg-emerald-600 text-white border border-emerald-300 rounded-2xl font-bold hover:bg-emerald-700 transition-all active:scale-95">
                                    Apply as Organizer
                                </button>
                            </div>
                        </motion.div>
                    </div>
                </section>
            </main>

            {/* 8️⃣ Footer */}
            <footer className="bg-slate-50 border-t border-slate-200 pt-20 pb-10">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid md:grid-cols-4 gap-12 mb-20">
                        <div className="col-span-2">
                            <div className="flex items-center gap-2 mb-6">
                                <img src={logo} alt="DigiChit Logo" className="w-10 h-10 object-contain" />
                                <span className="text-xl font-bold tracking-tight text-slate-900">DigiChit</span>
                            </div>
                            <p className="text-slate-500 max-w-sm mb-6">
                                Redefining traditional financial instruments through digital innovation and absolute transparency.
                            </p>
                        </div>
                        <div>
                            <h5 className="font-bold mb-6 text-slate-900">Company</h5>
                            <ul className="space-y-3 text-sm text-slate-500">
                                <li><Link to="/about-us" className="hover:text-emerald-700 transition-colors">About Us</Link></li>
                                <li><Link to="/contact" className="hover:text-emerald-700 transition-colors">Contact</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h5 className="font-bold mb-6 text-slate-900">Legal</h5>
                            <ul className="space-y-3 text-sm text-slate-500">
                                <li><Link to="/terms-and-conditions" className="hover:text-emerald-700 transition-colors">Terms & Conditions</Link></li>
                                <li><Link to="/privacy-policy" className="hover:text-emerald-700 transition-colors">Privacy Policy</Link></li>
                                <li><Link to="/disclaimer" className="hover:text-emerald-700 transition-colors">Disclaimer</Link></li>
                            </ul>
                        </div>
                    </div>
                    <div className="pt-10 border-t border-slate-200 flex items-center justify-center gap-6 text-xs text-slate-400 uppercase tracking-widest font-bold">
                        <span>© 2026 DigiChit Technologies</span>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
