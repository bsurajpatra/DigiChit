import { useState } from 'react';
import {
    Shield,
    Lock,
    ArrowRight,
    CheckCircle2,
    Users,
    BarChart3,
    Zap,
    ChevronRight,
    TrendingUp,
    Receipt,
    CreditCard,
    ShieldCheck,
    Check,
    X,
    ArrowUpRight,
    Sparkles,
    Activity,
    Layers,
    Scale,
    Clock,
    Award,
    Hammer,
    Wallet,
    Fingerprint
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import logo from '../assets/logo.png';

/* 🌌 Fixed 3D Depth Layer with Real-Life Financial & Banking Elements */
const Background3D = () => (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-slate-950 text-slate-100">
        {/* Glowing Atmospheric Gradient Orbs */}
        <div className="absolute top-[-10%] left-[20%] w-[600px] h-[600px] rounded-full bg-emerald-600/20 blur-[140px] animate-pulse" />
        <div className="absolute top-[40%] right-[-5%] w-[600px] h-[600px] rounded-full bg-teal-500/15 blur-[160px]" />
        <div className="absolute bottom-[-10%] left-[10%] w-[500px] h-[500px] rounded-full bg-emerald-500/15 blur-[140px]" />

        {/* 3D Perspective Wireframe Matrix */}
        <div className="absolute inset-0 opacity-20 [perspective:1000px] overflow-hidden">
            <div 
                className="absolute -inset-[100%] w-[300%] h-[300%] bg-[linear-gradient(to_right,#05966920_1px,transparent_1px),linear-gradient(to_bottom,#05966920_1px,transparent_1px)] bg-[size:4rem_4rem] [transform:rotateX(60deg)_translateZ(-100px)] origin-center"
            />
        </div>

        {/* 🪙 Real-Life Element 1: Large 3D Metallic Golden Rupee Coin */}
        <motion.div
            animate={{ 
                y: [0, -20, 0], 
                rotateY: [0, 180, 360],
                rotateZ: [0, 8, 0]
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-[8%] right-[4%] w-20 h-20 rounded-full bg-gradient-to-tr from-amber-500 via-yellow-300 to-amber-100 border-2 border-amber-300/40 shadow-[0_0_30px_rgba(245,158,11,0.2)] flex items-center justify-center text-amber-950 font-black text-2xl opacity-20 select-none pointer-events-none"
        >
            <div className="w-14 h-14 rounded-full border border-amber-600/50 flex items-center justify-center font-serif text-2xl font-black">
                ₹
            </div>
        </motion.div>

        {/* 🧾 Real-Life Element 2: Digital Bank Payout Slip */}
        <motion.div
            animate={{ 
                y: [0, 25, 0], 
                rotateX: [0, 10, 0],
                rotateZ: [-4, 2, -4]
            }}
            transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-[70%] left-[2%] bg-slate-900/90 border border-emerald-500/30 rounded-2xl p-3.5 shadow-xl backdrop-blur-md opacity-15 max-w-[210px] select-none pointer-events-none"
        >
            <div className="flex items-center gap-2 mb-1.5">
                <Receipt className="w-4 h-4 text-emerald-400" />
                <span className="text-[9px] font-bold text-slate-300 uppercase tracking-wider">Bank Payout Slip</span>
            </div>
            <p className="text-[11px] font-bold text-white">Dividend Credited</p>
            <p className="text-sm font-extrabold text-emerald-400 mt-0.5">₹12,500.00</p>
            <div className="mt-1.5 pt-1.5 border-t border-slate-800 flex justify-between text-[8px] text-slate-400 font-mono">
                <span>TXN: #8942-CHIT</span>
                <span className="text-emerald-400 font-bold">SUCCESS</span>
            </div>
        </motion.div>

        {/* 🔐 Real-Life Element 3: 3D Bank Vault Security Dial */}
        <motion.div
            animate={{ 
                y: [0, -18, 0],
                rotateZ: [0, -8, 0]
            }}
            transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-[68%] right-[2%] bg-slate-900/90 border border-slate-700/80 rounded-2xl p-4 shadow-xl backdrop-blur-md opacity-15 flex items-center gap-3 select-none pointer-events-none"
        >
            <div className="w-10 h-10 rounded-xl bg-slate-800 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-inner">
                <Lock className="w-5 h-5" />
            </div>
            <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Bank Vault Security</p>
                <p className="text-[11px] font-extrabold text-white">AES-256 Multi-Key Lock</p>
                <span className="text-[8px] font-bold text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    100% Encrypted
                </span>
            </div>
        </motion.div>

        {/* 💳 Real-Life Element 4: Digital Member Savings Card */}
        <motion.div
            animate={{ 
                y: [0, 20, 0],
                rotateY: [0, -15, 0]
            }}
            transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-[88%] left-[6%] bg-gradient-to-br from-emerald-950/90 via-slate-900/90 to-slate-900 border border-emerald-500/30 rounded-2xl p-3.5 shadow-xl backdrop-blur-md opacity-15 flex items-center gap-3 select-none pointer-events-none"
        >
            <div className="w-9 h-9 rounded-xl bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                <CreditCard className="w-4 h-4" />
            </div>
            <div>
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Digital Chit Savings Card</p>
                <p className="text-[11px] font-bold text-white">•••• •••• •••• 4021</p>
                <p className="text-[8px] text-emerald-400 font-semibold">Verified Active Circle Member</p>
            </div>
        </motion.div>

        {/* 🖐️ Real-Life Element 5: Aadhaar Biometric eKYC Verification Scanner */}
        <motion.div
            animate={{ 
                y: [0, -15, 0],
                rotateZ: [0, 4, 0]
            }}
            transition={{ duration: 13, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-[4%] left-[2%] bg-slate-900/90 border border-teal-500/30 rounded-2xl p-3.5 shadow-xl backdrop-blur-md opacity-15 flex items-center gap-3 select-none pointer-events-none"
        >
            <div className="w-9 h-9 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-400 flex items-center justify-center">
                <Fingerprint className="w-5 h-5" />
            </div>
            <div>
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Aadhaar Biometric eKYC</p>
                <p className="text-[11px] font-extrabold text-white">Identity Verified</p>
                <span className="text-[8px] font-bold text-teal-400">Govt Reg. Compliant</span>
            </div>
        </motion.div>

        {/* 🔨 Real-Life Element 6: Live Auction Bidding Gavel Badge */}
        <motion.div
            animate={{ 
                y: [0, 18, 0],
                rotateZ: [0, -6, 0]
            }}
            transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-[35%] right-[1%] bg-slate-900/90 border border-emerald-500/30 rounded-2xl p-3.5 shadow-xl backdrop-blur-md opacity-15 flex items-center gap-3 select-none pointer-events-none"
        >
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                <Hammer className="w-4 h-4" />
            </div>
            <div>
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Live Chit Auction</p>
                <p className="text-[11px] font-extrabold text-white">Round 4 Bidding Active</p>
                <span className="text-[8px] font-extrabold text-emerald-400">Highest Bid: ₹1,85,000</span>
            </div>
        </motion.div>

        {/* 💼 Real-Life Element 7: Digital Vault Reserve Balance */}
        <motion.div
            animate={{ 
                y: [0, -22, 0],
                rotateX: [0, 8, 0]
            }}
            transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-[90%] right-[3%] bg-slate-900/90 border border-amber-500/30 rounded-2xl p-3.5 shadow-xl backdrop-blur-md opacity-15 flex items-center gap-3 select-none pointer-events-none"
        >
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
                <Wallet className="w-4 h-4" />
            </div>
            <div>
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Digital Vault Reserve</p>
                <p className="text-[11px] font-extrabold text-white">₹50,00,000 Guaranteed</p>
                <span className="text-[8px] font-semibold text-amber-400">Bank Multi-Sig Protected</span>
            </div>
        </motion.div>

        {/* 🪙 Real-Life Element 8: Secondary Gold Rupee Coin */}
        <motion.div
            animate={{ 
                y: [0, -25, 0], 
                rotateY: [360, 180, 0]
            }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-[45%] left-[1%] w-12 h-12 rounded-full bg-gradient-to-tr from-amber-500 via-yellow-300 to-amber-100 border border-amber-300/40 shadow-[0_0_15px_rgba(245,158,11,0.2)] flex items-center justify-center text-amber-950 font-serif font-black text-lg opacity-15 select-none pointer-events-none"
        >
            ₹
        </motion.div>

        {/* 🪙 Real-Life Element 9: Third Gold Rupee Coin */}
        <motion.div
            animate={{ 
                y: [0, 20, 0], 
                rotateY: [0, 180, 360]
            }}
            transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-[80%] right-[18%] w-10 h-10 rounded-full bg-gradient-to-tr from-amber-500 via-yellow-300 to-amber-100 border border-amber-300/40 shadow-[0_0_15px_rgba(245,158,11,0.2)] flex items-center justify-center text-amber-950 font-serif font-black text-base opacity-15 select-none pointer-events-none"
        >
            ₹
        </motion.div>

        {/* Ambient Dots Pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(#05966920_1px,transparent_1px)] [background-size:32px_32px] opacity-50" />
    </div>
);

/* 💎 Native 3D Floating Chit Vault Card (No mockup image needed) */
const Hero3DCard = () => (
    <div className="relative group [perspective:1000px] max-w-lg mx-auto">
        <motion.div
            initial={{ opacity: 0, y: 30, rotateX: 10, rotateY: -10 }}
            animate={{ opacity: 1, y: 0, rotateX: 4, rotateY: -4 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            whileHover={{ rotateX: 0, rotateY: 0, scale: 1.02 }}
            className="relative bg-slate-900/90 border border-slate-800/90 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-emerald-950/50 backdrop-blur-2xl text-white transition-transform duration-500 ease-out"
        >
            {/* Header */}
            <div className="flex items-center justify-between pb-6 border-b border-slate-800">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                        <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-white tracking-tight">Apex Platinum Circle #104</h4>
                        <p className="text-[11px] font-semibold text-slate-400">Monthly Circle • Verified Members</p>
                    </div>
                </div>
                <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span>Live Auction</span>
                </div>
            </div>

            {/* Pool Statistics */}
            <div className="grid grid-cols-2 gap-4 my-6">
                <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/50">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Pool Value</p>
                    <p className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">₹10,000,000</p>
                    <span className="text-[10px] font-semibold text-emerald-400 mt-1 inline-block">100% Audit Guaranteed</span>
                </div>
                <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/50">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Est. Monthly Dividend</p>
                    <p className="text-2xl sm:text-3xl font-extrabold text-teal-400 tracking-tight">₹12,500</p>
                    <span className="text-[10px] font-semibold text-slate-400 mt-1 inline-block">Distributed per member</span>
                </div>
            </div>

            {/* Live Bidding Status */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/20 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center">
                        <TrendingUp className="w-4 h-4" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-200">Current Highest Bid</p>
                        <p className="text-xs text-slate-400 font-medium">Round 3 • Active Bidding</p>
                    </div>
                </div>
                <span className="text-sm font-extrabold text-emerald-400 font-mono">₹1,85,000</span>
            </div>

            {/* Members & Verification */}
            <div className="mt-6 pt-5 border-t border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="flex -space-x-2">
                        <div className="w-7 h-7 rounded-full bg-emerald-600 text-white font-bold text-[10px] flex items-center justify-center border-2 border-slate-900">JD</div>
                        <div className="w-7 h-7 rounded-full bg-teal-600 text-white font-bold text-[10px] flex items-center justify-center border-2 border-slate-900">SK</div>
                        <div className="w-7 h-7 rounded-full bg-slate-700 text-white font-bold text-[10px] flex items-center justify-center border-2 border-slate-900">AM</div>
                        <div className="w-7 h-7 rounded-full bg-emerald-700 text-white font-bold text-[10px] flex items-center justify-center border-2 border-slate-900">+17</div>
                    </div>
                    <span className="text-xs font-medium text-slate-400 ml-2">20 KYC Verified Members</span>
                </div>
                <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-400">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Aadhaar Secured</span>
                </div>
            </div>
        </motion.div>

        {/* Floating Ambient Badges */}
        <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -top-6 -right-4 sm:-right-6 bg-slate-900/90 border border-emerald-500/30 text-white px-4 py-2.5 rounded-2xl shadow-xl backdrop-blur-xl flex items-center gap-2.5 text-xs font-bold pointer-events-none z-20"
        >
            <Zap className="w-4 h-4 text-emerald-400" />
            <span>Automated Dividends</span>
        </motion.div>

        <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -bottom-6 -left-4 sm:-left-6 bg-slate-900/90 border border-slate-700/80 text-white px-4 py-2.5 rounded-2xl shadow-xl backdrop-blur-xl flex items-center gap-2.5 text-xs font-bold pointer-events-none z-20"
        >
            <Lock className="w-4 h-4 text-teal-400" />
            <span>Bank-Grade Encryption</span>
        </motion.div>
    </div>
);

const LandingPage = () => {
    const [activeTab, setActiveTab] = useState<'members' | 'organizers'>('members');

    const fadeIn = {
        initial: { opacity: 0, y: 20 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true },
        transition: { duration: 0.5 }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-emerald-600 font-sans antialiased relative">
            {/* 🌌 Fixed 3D Depth Layer */}
            <Background3D />

            {/* 0️⃣ Navigation */}
            <nav className="fixed top-0 w-full z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-3 group">
                        <img src={logo} alt="DigiChit Logo" className="w-9 h-9 object-contain group-hover:scale-105 transition-transform" />
                        <span className="text-xl font-bold tracking-tight text-white">DigiChit</span>
                    </Link>

                    <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-400">
                        <a href="#comparison" className="hover:text-emerald-400 transition-colors">Comparison</a>
                        <a href="#how-it-works" className="hover:text-emerald-400 transition-colors">How it Works</a>
                        <a href="#security" className="hover:text-emerald-400 transition-colors">Security</a>
                        <a href="#benefits" className="hover:text-emerald-400 transition-colors">Benefits</a>
                    </div>

                    <div className="flex items-center gap-4">
                        <Link to="/login" className="hidden sm:inline-flex text-sm font-bold text-slate-300 hover:text-emerald-400 transition-colors px-3 py-2">
                            Log In
                        </Link>
                        <Link 
                            to="/signup" 
                            className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-500 transition-all font-bold text-sm shadow-md shadow-emerald-950 active:scale-95 flex items-center gap-1.5"
                        >
                            Get Started
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                </div>
            </nav>

            {/* 🚀 Foreground Scrollable Content */}
            <main className="relative z-10 pt-20">
                {/* 1️⃣ Hero Section */}
                <section className="relative pt-16 pb-24 lg:pt-24 lg:pb-32 overflow-hidden">
                    <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-12 gap-12 items-center">
                        <div className="lg:col-span-7 text-center lg:text-left">
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4 }}
                                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-8"
                            >
                                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                                <span>The Next Gen of Community Savings</span>
                            </motion.div>

                            <motion.h1 
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.1 }}
                                className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-white tracking-tight leading-[1.1] mb-6"
                            >
                                Digital Chit Funds. <br />
                                <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500 bg-clip-text text-transparent">
                                    Transparent & Secure.
                                </span>
                            </motion.h1>

                            <motion.p 
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.2 }}
                                className="text-lg sm:text-xl text-slate-400 leading-relaxed font-normal mb-10 max-w-2xl mx-auto lg:mx-0"
                            >
                                Experience traditional chit funds redefined with automated auctions, verified members, and instant dividend distributions.
                            </motion.p>

                            <motion.div 
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.3 }}
                                className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4"
                            >
                                <Link 
                                    to="/signup" 
                                    className="w-full sm:w-auto px-8 py-4 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-500 transition-all shadow-xl shadow-emerald-950 active:scale-98 flex items-center justify-center gap-2 text-base"
                                >
                                    Start Saving Now
                                    <ArrowRight className="w-5 h-5" />
                                </Link>
                                <Link 
                                    to="/login" 
                                    className="w-full sm:w-auto px-8 py-4 bg-slate-900 border border-slate-800 text-slate-300 rounded-2xl font-bold hover:bg-slate-850 transition-all shadow-sm active:scale-98 flex items-center justify-center gap-2 text-base"
                                >
                                    Access Account
                                    <ArrowUpRight className="w-4 h-4 text-slate-400" />
                                </Link>
                            </motion.div>
                        </div>

                        {/* 3D Floating Card Component */}
                        <div className="lg:col-span-5">
                            <Hero3DCard />
                        </div>
                    </div>
                </section>

                {/* 2️⃣ Live Metrics Bar */}
                <section className="border-y border-slate-800/80 bg-slate-900/40 backdrop-blur-md py-12">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                            <div>
                                <p className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">100%</p>
                                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mt-1">Audit Transparency</p>
                            </div>
                            <div>
                                <p className="text-3xl sm:text-4xl font-extrabold text-emerald-400 tracking-tight">0%</p>
                                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mt-1">Manual Ledger Fraud</p>
                            </div>
                            <div>
                                <p className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">Bank-Grade</p>
                                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mt-1">AES-256 Encryption</p>
                            </div>
                            <div>
                                <p className="text-3xl sm:text-4xl font-extrabold text-teal-400 tracking-tight">Instant</p>
                                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mt-1">Dividend Settlements</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 3️⃣ Comparison Section (Legacy vs DigiChit) */}
                <section id="comparison" className="py-24 relative">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="text-center max-w-2xl mx-auto mb-16">
                            <h2 className="text-xs font-bold uppercase tracking-widest text-emerald-400 mb-3">Comparison</h2>
                            <h3 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
                                Why Traditional Chit Funds Fail
                            </h3>
                            <p className="text-slate-400 mt-3 text-base">
                                Traditional chit funds suffer from manual errors, lack of verification, and organizer risk. DigiChit digitizes the entire lifecycle.
                            </p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                            {/* Traditional Card */}
                            <motion.div {...fadeIn} className="bg-slate-900/60 p-8 rounded-3xl border border-slate-800/80 shadow-sm relative">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold uppercase tracking-wider mb-6">
                                    <X className="w-3.5 h-3.5" />
                                    <span>Legacy Offline Process</span>
                                </div>
                                <ul className="space-y-4 text-sm font-medium text-slate-400">
                                    {[
                                        "Opaque manual paper ledgers prone to calculation errors",
                                        "High risk of organizer defaults or unverified members",
                                        "No real-time tracking or digital receipts for payments",
                                        "Physical cash collection hazards and delays",
                                        "Non-transparent manual bidding and lottery draws"
                                    ].map((item, idx) => (
                                        <li key={idx} className="flex items-start gap-3">
                                            <div className="w-5 h-5 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center shrink-0 mt-0.5">
                                                <X className="w-3 h-3" />
                                            </div>
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </motion.div>

                            {/* DigiChit Card */}
                            <motion.div {...fadeIn} className="bg-gradient-to-b from-slate-900 to-slate-900/90 text-white p-8 rounded-3xl border border-emerald-500/30 shadow-xl shadow-emerald-950/30 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-6 border border-emerald-500/30">
                                    <Check className="w-3.5 h-3.5" />
                                    <span>DigiChit Platform</span>
                                </div>
                                <ul className="space-y-4 text-sm font-medium text-slate-300 relative z-10">
                                    {[
                                        "Immutable digital ledger with automated dividend calculation",
                                        "Strict Aadhaar-based eKYC verification for all members",
                                        "Instant digital transaction receipts and audit history",
                                        "Direct bank-to-bank settlement with zero cash risks",
                                        "Real-time competitive online auctions and transparent draws"
                                    ].map((item, idx) => (
                                        <li key={idx} className="flex items-start gap-3">
                                            <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                                                <Check className="w-3.5 h-3.5" />
                                            </div>
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </motion.div>
                        </div>
                    </div>
                </section>

                {/* 4️⃣ How It Works Workflow */}
                <section id="how-it-works" className="py-24">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="text-center max-w-2xl mx-auto mb-20">
                            <h2 className="text-xs font-bold uppercase tracking-widest text-emerald-400 mb-3">Workflow</h2>
                            <h3 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
                                How DigiChit Operates
                            </h3>
                            <p className="text-slate-400 mt-3 text-base">
                                Four simple, automated steps to create or participate in financial circles.
                            </p>
                        </div>

                        <div className="grid md:grid-cols-4 gap-6">
                            {[
                                {
                                    step: "01",
                                    title: "Identity Verification",
                                    desc: "Complete swift eKYC using government Aadhaar & selfie verification.",
                                    icon: ShieldCheck
                                },
                                {
                                    step: "02",
                                    title: "Circle Formation",
                                    desc: "Join an existing verified group or launch your own chit circle.",
                                    icon: Users
                                },
                                {
                                    step: "03",
                                    title: "Digital Auction",
                                    desc: "Participate in real-time competitive bidding or lottery draws.",
                                    icon: TrendingUp
                                },
                                {
                                    step: "04",
                                    title: "Automated Payouts",
                                    desc: "Receive winning pot amounts and monthly dividend distributions.",
                                    icon: Receipt
                                }
                            ].map((item, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.4, delay: i * 0.1 }}
                                    className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800/80 hover:border-emerald-500/40 transition-all shadow-sm hover:shadow-md group"
                                >
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700/80 flex items-center justify-center text-emerald-400 shadow-sm group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                                            <item.icon className="w-6 h-6" />
                                        </div>
                                        <span className="text-2xl font-black text-slate-700 group-hover:text-emerald-400 transition-colors">
                                            {item.step}
                                        </span>
                                    </div>
                                    <h4 className="text-lg font-bold text-white mb-2">{item.title}</h4>
                                    <p className="text-xs text-slate-400 leading-relaxed font-medium">{item.desc}</p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* 5️⃣ Security Bento Grid */}
                <section id="security" className="py-24">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="text-center max-w-2xl mx-auto mb-16">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-4 border border-emerald-500/20">
                                <Lock className="w-3.5 h-3.5" />
                                <span>Security & Compliance</span>
                            </div>
                            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
                                Bank-Grade Infrastructure
                            </h2>
                            <p className="text-slate-400 mt-3 text-base">
                                Engineered with enterprise-grade data protection, biometric authentication, and immutable log trails.
                            </p>
                        </div>

                        {/* Bento Grid */}
                        <div className="grid md:grid-cols-3 gap-6">
                            {/* Bento 1: Large Tile */}
                            <div className="md:col-span-2 p-8 rounded-3xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-sm relative overflow-hidden">
                                <div className="max-w-md">
                                    <Shield className="w-10 h-10 text-emerald-400 mb-6" />
                                    <h3 className="text-2xl font-bold mb-3 text-white">Biometric & Aadhaar eKYC Verification</h3>
                                    <p className="text-slate-400 text-sm leading-relaxed mb-6">
                                        Every participant undergoes strict identity verification before joining any financial circle. Our zero-disk-footprint architecture ensures your Aadhaar numbers are never stored in plaintext.
                                    </p>
                                    <div className="inline-flex items-center gap-2 text-xs font-bold text-teal-400 bg-teal-500/10 px-3.5 py-2 rounded-xl border border-teal-500/20">
                                        <CheckCircle2 className="w-4 h-4" />
                                        <span>100% Identity Authenticated</span>
                                    </div>
                                </div>
                            </div>

                            {/* Bento 2: Automated Dividend Engine */}
                            <div className="p-8 rounded-3xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-sm">
                                <Zap className="w-10 h-10 text-teal-400 mb-6" />
                                <h3 className="text-xl font-bold mb-3 text-white">Automated Ledger Engine</h3>
                                <p className="text-slate-400 text-xs leading-relaxed">
                                    Calculates payouts, commissions, and member dividends instantly without human intervention or manual accounting errors.
                                </p>
                            </div>

                            {/* Bento 3: Real-Time Auditing */}
                            <div className="p-8 rounded-3xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-sm">
                                <BarChart3 className="w-10 h-10 text-emerald-400 mb-6" />
                                <h3 className="text-xl font-bold mb-3 text-white">Real-Time Audit Logs</h3>
                                <p className="text-slate-400 text-xs leading-relaxed">
                                    Every bid, payout, and contribution is recorded in an audit-ready log, giving both organizers and members total visibility.
                                </p>
                            </div>

                            {/* Bento 4: Defaulter Prevention */}
                            <div className="md:col-span-2 p-8 rounded-3xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-sm flex flex-col justify-between">
                                <div>
                                    <Lock className="w-10 h-10 text-teal-400 mb-6" />
                                    <h3 className="text-2xl font-bold mb-3 text-white">Organizer Risk & Defaulter Controls</h3>
                                    <p className="text-slate-400 text-sm leading-relaxed mb-4">
                                        Automated reminders, payment tracking, and organizer oversight ensure maximum financial stability across all active circles.
                                    </p>
                                </div>
                                <div className="flex flex-wrap gap-3 mt-4 text-xs font-semibold text-slate-300">
                                    <span className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700/80">Defaulter Warnings</span>
                                    <span className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700/80">Automated Reminders</span>
                                    <span className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700/80">Bank Grade Security</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 6️⃣ Benefits Segment */}
                <section id="benefits" className="py-24">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="text-center max-w-2xl mx-auto mb-12">
                            <h2 className="text-xs font-bold uppercase tracking-widest text-emerald-400 mb-3">Tailored Experience</h2>
                            <h3 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
                                Designed for Both Members & Organizers
                            </h3>
                        </div>

                        {/* Toggle Tabs */}
                        <div className="flex justify-center mb-12">
                            <div className="inline-flex p-1.5 bg-slate-900 border border-slate-800 rounded-2xl">
                                <button
                                    onClick={() => setActiveTab('members')}
                                    className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'members' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
                                >
                                    For Members
                                </button>
                                <button
                                    onClick={() => setActiveTab('organizers')}
                                    className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'organizers' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
                                >
                                    For Organizers
                                </button>
                            </div>
                        </div>

                        {/* Feature Content */}
                        <div className="max-w-4xl mx-auto">
                            {activeTab === 'members' ? (
                                <motion.div 
                                    key="members"
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="bg-slate-900/80 p-8 sm:p-12 rounded-3xl border border-slate-800 shadow-sm grid md:grid-cols-2 gap-8 items-center"
                                >
                                    <div>
                                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-6">
                                            <CreditCard className="w-6 h-6" />
                                        </div>
                                        <h4 className="text-2xl font-bold text-white mb-4">Empowering Individual Savers</h4>
                                        <p className="text-sm text-slate-400 leading-relaxed mb-6">
                                            Join verified chit circles with total confidence. Track monthly contributions, participate in live digital bidding, and receive your payouts seamlessly.
                                        </p>
                                    </div>
                                    <ul className="space-y-3.5 text-sm font-semibold text-slate-300">
                                        {[
                                            "100% Visibility on Group Dividend Yields",
                                            "Instant Digital Receipts for Every Payment",
                                            "Transparent Fair-Play Auction System",
                                            "Direct Settlement to Bank Accounts"
                                        ].map((item, i) => (
                                            <li key={i} className="flex items-center gap-3">
                                                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                                                <span>{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </motion.div>
                            ) : (
                                <motion.div 
                                    key="organizers"
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="bg-slate-900/80 p-8 sm:p-12 rounded-3xl border border-slate-800 shadow-sm grid md:grid-cols-2 gap-8 items-center"
                                >
                                    <div>
                                        <div className="w-12 h-12 rounded-2xl bg-teal-500/10 text-teal-400 flex items-center justify-center mb-6">
                                            <BarChart3 className="w-6 h-6" />
                                        </div>
                                        <h4 className="text-2xl font-bold text-white mb-4">Complete Management Suite</h4>
                                        <p className="text-sm text-slate-400 leading-relaxed mb-6">
                                            Manage multiple chit groups effortlessly. Automate commission deductions, track member attendance, and eliminate manual accounting overhead.
                                        </p>
                                    </div>
                                    <ul className="space-y-3.5 text-sm font-semibold text-slate-300">
                                        {[
                                            "Automated Fixed 2% Organizer Fee Billing",
                                            "Real-Time Member Application Approvals",
                                            "Defaulter Risk Identification Dashboard",
                                            "Automated Monthly Schedule Announcements"
                                        ].map((item, i) => (
                                            <li key={i} className="flex items-center gap-3">
                                                <CheckCircle2 className="w-5 h-5 text-teal-400 shrink-0" />
                                                <span>{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </motion.div>
                            )}
                        </div>
                    </div>
                </section>

                {/* 7️⃣ Call To Action */}
                <section className="py-20">
                    <div className="max-w-5xl mx-auto px-6">
                        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white rounded-3xl p-10 sm:p-16 text-center relative overflow-hidden shadow-2xl shadow-emerald-950">
                            <h2 className="text-3xl sm:text-5xl font-extrabold mb-6 tracking-tight">
                                Ready to Digitize Your Financial Circle?
                            </h2>
                            <p className="text-emerald-100 text-base max-w-xl mx-auto mb-10 font-medium">
                                Join thousands of members and organizers enjoying zero-friction, transparent chit fund management.
                            </p>
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                <Link 
                                    to="/signup" 
                                    className="w-full sm:w-auto px-8 py-4 bg-white text-emerald-900 rounded-2xl font-bold hover:bg-slate-100 transition-all shadow-md active:scale-95 text-base flex items-center justify-center gap-2"
                                >
                                    Create Free Account
                                    <ArrowRight className="w-5 h-5 text-emerald-600" />
                                </Link>
                                <Link 
                                    to="/login" 
                                    className="w-full sm:w-auto px-8 py-4 bg-emerald-800/80 text-white border border-emerald-400/40 rounded-2xl font-bold hover:bg-emerald-800 transition-all active:scale-95 text-base"
                                >
                                    Log In to Dashboard
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            {/* 8️⃣ Footer */}
            <footer className="relative z-10 bg-slate-950 border-t border-slate-800/80 pt-16 pb-12 text-slate-400">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
                        <div className="col-span-2">
                            <div className="flex items-center gap-2.5 mb-4">
                                <img src={logo} alt="DigiChit Logo" className="w-8 h-8 object-contain" />
                                <span className="text-lg font-bold tracking-tight text-white">DigiChit</span>
                            </div>
                            <p className="text-xs text-slate-500 max-w-sm leading-relaxed font-medium">
                                Redefining traditional financial circles through digital verification, automated auction engines, and bank-grade security.
                            </p>
                        </div>
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-white mb-4">Platform</p>
                            <ul className="space-y-2.5 text-xs font-semibold text-slate-400">
                                <li><Link to="/about-us" className="hover:text-emerald-400 transition-colors">About Us</Link></li>
                                <li><Link to="/contact" className="hover:text-emerald-400 transition-colors">Contact Support</Link></li>
                            </ul>
                        </div>
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-white mb-4">Legal & Trust</p>
                            <ul className="space-y-2.5 text-xs font-semibold text-slate-400">
                                <li><Link to="/terms-and-conditions" className="hover:text-emerald-400 transition-colors">Terms & Conditions</Link></li>
                                <li><Link to="/privacy-policy" className="hover:text-emerald-400 transition-colors">Privacy Policy</Link></li>
                                <li><Link to="/disclaimer" className="hover:text-emerald-400 transition-colors">Disclaimer</Link></li>
                            </ul>
                        </div>
                    </div>

                    <div className="pt-8 border-t border-slate-800/60 flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-widest">
                        <span>© 2026 DigiChit Technologies. All rights reserved.</span>
                        <div className="flex items-center gap-2 text-emerald-400">
                            <ShieldCheck className="w-4 h-4" />
                            <span>Encrypted & Verified</span>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;

