import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import { ArrowLeft, Mail, MapPin, Phone } from 'lucide-react';
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
                <h1 className="text-4xl font-bold mb-4 text-slate-900">Contact Us</h1>
                <p className="text-slate-500 mb-12 text-lg">Have a question or need help? We're here for you.</p>

                <div className="grid md:grid-cols-3 gap-8 mb-16">
                    {[
                        { icon: Mail, label: 'Email', value: 'support@digichit.in' },
                        { icon: Phone, label: 'Phone', value: '+91 98765 43210' },
                        { icon: MapPin, label: 'Address', value: 'Bengaluru, Karnataka, India' },
                    ].map(({ icon: Icon, label, value }) => (
                        <div key={label} className="p-6 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center">
                                <Icon className="w-5 h-5 text-white" />
                            </div>
                            <p className="text-xs text-slate-400 uppercase font-bold tracking-widest">{label}</p>
                            <p className="text-slate-700 font-medium">{value}</p>
                        </div>
                    ))}
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-3xl p-8 md:p-12">
                    <h2 className="text-2xl font-bold mb-8 text-slate-900">Send us a message</h2>
                    
                    {success ? (
                        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-8 text-center animate-in zoom-in duration-300">
                            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle2 className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">Message Received!</h3>
                            <p className="text-slate-600 mb-6">Thank you for reaching out. Our team will review your query and respond via email shortly.</p>
                            <button 
                                onClick={() => setSuccess(false)}
                                className="text-emerald-600 font-bold hover:text-emerald-700 transition-colors"
                            >
                                Send another message
                            </button>
                        </div>
                    ) : (
                        <form className="space-y-6" onSubmit={handleSubmit}>
                            {error && (
                                <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
                                    <AlertTriangle className="w-4 h-4 shrink-0" />
                                    {error}
                                </div>
                            )}
                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Full Name</label>
                                    <input
                                        type="text"
                                        placeholder="Your name"
                                        value={form.name}
                                        onChange={e => setForm({ ...form, name: e.target.value })}
                                        required
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition text-slate-900"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Email Address</label>
                                    <input
                                        type="email"
                                        placeholder="you@email.com"
                                        value={form.email}
                                        onChange={e => setForm({ ...form, email: e.target.value })}
                                        required
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition text-slate-900"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Subject</label>
                                <input
                                    type="text"
                                    placeholder="How can we help?"
                                    value={form.subject}
                                    onChange={e => setForm({ ...form, subject: e.target.value })}
                                    required
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition text-slate-900"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Message</label>
                                <textarea
                                    rows={5}
                                    placeholder="Tell us more about your query..."
                                    value={form.message}
                                    onChange={e => setForm({ ...form, message: e.target.value })}
                                    required
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition text-slate-900 resize-none"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-8 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-all active:scale-95 shadow-md shadow-emerald-200 disabled:opacity-60 flex items-center gap-2"
                            >
                                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                                Send Message
                            </button>
                        </form>
                    )}
                </div>
            </main>

            <footer className="border-t border-slate-100 py-8 text-center text-xs text-slate-400 uppercase tracking-widest font-bold">
                © 2026 DigiChit Technologies
            </footer>
        </div>
    );
};

export default Contact;
