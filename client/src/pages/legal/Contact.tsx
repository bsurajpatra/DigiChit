import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { AlertTriangle, CheckCircle2, Loader2, ArrowLeft, Mail, MapPin, Phone, MessageSquare } from 'lucide-react';
import logo from '../../assets/logo.png';

const Contact = () => {
    const navigate = useNavigate();
    const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleBack = () => {
        if (window.history.length > 1) {
            navigate(-1);
        } else {
            navigate('/');
        }
    };

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
                        <MessageSquare className="w-4 h-4" />
                        <span>Support & Contact</span>
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">Contact Us</h1>
                    <p className="text-slate-500 text-sm max-w-lg mx-auto font-medium">
                        Have questions about chit fund groups, eKYC verification, or hosting your own circle? We are here to help.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                    {/* Info Cards */}
                    <div className="space-y-4">
                        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
                            <Mail className="w-5 h-5 text-blue-600" />
                            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Email Us</h3>
                            <p className="text-xs text-slate-500 font-medium">support@digichit.in</p>
                        </div>

                        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
                            <Phone className="w-5 h-5 text-emerald-600" />
                            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Call Support</h3>
                            <p className="text-xs text-slate-500 font-medium">+91 80 4567 8900</p>
                        </div>

                        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
                            <MapPin className="w-5 h-5 text-amber-600" />
                            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">HQ Address</h3>
                            <p className="text-xs text-slate-500 font-medium leading-relaxed">
                                DigiChit Tech Ltd, Indiranagar, Bengaluru, Karnataka 560038
                            </p>
                        </div>
                    </div>

                    {/* Contact Form Card */}
                    <div className="md:col-span-2 bg-white p-8 rounded-3xl border border-slate-200/80 shadow-xs">
                        {success ? (
                            <div className="py-12 text-center space-y-3">
                                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                                    <CheckCircle2 className="w-6 h-6" />
                                </div>
                                <h3 className="text-lg font-black text-slate-900">Message Received!</h3>
                                <p className="text-xs text-slate-500 font-medium max-w-sm mx-auto">
                                    Thank you for reaching out. Our support team will get back to you within 24 business hours.
                                </p>
                                <button
                                    onClick={() => setSuccess(false)}
                                    className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition cursor-pointer mt-2"
                                >
                                    Send Another Message
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                {error && (
                                    <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-xl flex items-center gap-2">
                                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                                        <span>{error}</span>
                                    </div>
                                )}

                                <div className="grid sm:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold uppercase text-slate-400">Your Name</label>
                                        <input
                                            type="text"
                                            required
                                            value={form.name}
                                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                                            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                            placeholder="Rahul Sharma"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold uppercase text-slate-400">Email Address</label>
                                        <input
                                            type="email"
                                            required
                                            value={form.email}
                                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                                            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                            placeholder="rahul@example.com"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold uppercase text-slate-400">Subject</label>
                                    <input
                                        type="text"
                                        required
                                        value={form.subject}
                                        onChange={(e) => setForm({ ...form, subject: e.target.value })}
                                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                        placeholder="Inquiry about organizer approval..."
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold uppercase text-slate-400">Message</label>
                                    <textarea
                                        required
                                        rows={4}
                                        value={form.message}
                                        onChange={(e) => setForm({ ...form, message: e.target.value })}
                                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
                                        placeholder="Type your message here..."
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                                >
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send Message'}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Contact;
