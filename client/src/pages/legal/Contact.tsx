import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { AlertTriangle, CheckCircle2, Loader2, ArrowLeft, Mail, MapPin, Phone, MessageSquare } from 'lucide-react';
import logo from '../../assets/logo.png';

const Contact = () => {
    const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            await api.post('/contact/submit', form);
            setSuccess(true);
            setForm({ name: '', email: '', subject: '', message: '' });
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Failed to send message. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased relative overflow-hidden">
            {/* Glowing Ambient Orbs */}
            <div className="absolute top-[-10%] right-[15%] w-[500px] h-[500px] rounded-full bg-emerald-600/10 blur-[130px] pointer-events-none" />
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
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-500/10 text-teal-400 text-xs font-bold uppercase tracking-wider mb-4 border border-teal-500/20">
                        <MessageSquare className="w-4 h-4" />
                        <span>Get In Touch</span>
                    </div>
                    <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight mb-4">Contact Support</h1>
                    <p className="text-slate-400 text-base max-w-xl mx-auto">
                        Have questions about chit groups, eKYC verification, or organizer tools? We're here to help.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-6 mb-16">
                    {[
                        { icon: Mail, label: 'Email', value: 'support@digichit.in' },
                        { icon: Phone, label: 'Phone', value: '+91 98765 43210' },
                        { icon: MapPin, label: 'Location', value: 'Bengaluru, Karnataka, India' },
                    ].map(({ icon: Icon, label, value }) => (
                        <div key={label} className="py-4 flex flex-col gap-2">
                            <Icon className="w-6 h-6 text-emerald-400" />
                            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">{label}</p>
                            <p className="text-white font-bold text-sm">{value}</p>
                        </div>
                    ))}
                </div>

                <div className="py-6 border-t border-slate-800/60">
                    <h2 className="text-2xl font-bold mb-8 text-white">Send us a message</h2>
                    
                    {success ? (
                        <div className="py-8 text-center">
                            <div className="w-16 h-16 text-emerald-400 flex items-center justify-center mx-auto mb-4">
                                <CheckCircle2 className="w-12 h-12" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Message Received!</h3>
                            <p className="text-slate-400 text-sm mb-6">Thank you for reaching out. Our support team will review your query and respond via email shortly.</p>
                            <button 
                                onClick={() => setSuccess(false)}
                                className="text-emerald-400 font-bold hover:text-emerald-300 transition-colors text-sm"
                            >
                                Send another message
                            </button>
                        </div>
                    ) : (
                        <form className="space-y-6 max-w-2xl" onSubmit={handleSubmit}>
                            {error && (
                                <div className="flex items-center gap-3 p-4 bg-rose-950/40 border border-rose-500/30 rounded-xl text-rose-400 text-sm">
                                    <AlertTriangle className="w-4 h-4 shrink-0" />
                                    {error}
                                </div>
                            )}
                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">Full Name</label>
                                    <input
                                        type="text"
                                        placeholder="Your full name"
                                        value={form.name}
                                        onChange={e => setForm({ ...form, name: e.target.value })}
                                        required
                                        className="w-full px-4 py-3 rounded-xl border border-slate-800 bg-slate-900 text-white focus:outline-none focus:border-emerald-500 transition text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">Email Address</label>
                                    <input
                                        type="email"
                                        placeholder="your@email.com"
                                        value={form.email}
                                        onChange={e => setForm({ ...form, email: e.target.value })}
                                        required
                                        className="w-full px-4 py-3 rounded-xl border border-slate-800 bg-slate-900 text-white focus:outline-none focus:border-emerald-500 transition text-sm"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">Subject</label>
                                <input
                                    type="text"
                                    placeholder="How can we help?"
                                    value={form.subject}
                                    onChange={e => setForm({ ...form, subject: e.target.value })}
                                    required
                                    className="w-full px-4 py-3 rounded-xl border border-slate-800 bg-slate-900 text-white focus:outline-none focus:border-emerald-500 transition text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">Message</label>
                                <textarea
                                    rows={5}
                                    placeholder="Write your message here..."
                                    value={form.message}
                                    onChange={e => setForm({ ...form, message: e.target.value })}
                                    required
                                    className="w-full px-4 py-3 rounded-xl border border-slate-800 bg-slate-900 text-white focus:outline-none focus:border-emerald-500 transition text-sm"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-8 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send Message'}
                            </button>
                        </form>
                    )}
                </div>
            </main>
        </div>
    );
};

export default Contact;
