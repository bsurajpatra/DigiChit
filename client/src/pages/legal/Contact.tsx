import { Link } from 'react-router-dom';
import { ArrowLeft, Mail, MapPin, Phone } from 'lucide-react';
import logo from '../../assets/logo.png';

const Contact = () => {
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
                                <Icon className="w-5 h-5 text-emerald-600" />
                            </div>
                            <p className="text-xs text-slate-400 uppercase font-bold tracking-widest">{label}</p>
                            <p className="text-slate-700 font-medium">{value}</p>
                        </div>
                    ))}
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-3xl p-8 md:p-12">
                    <h2 className="text-2xl font-bold mb-8 text-slate-900">Send us a message</h2>
                    <form className="space-y-6" onSubmit={e => e.preventDefault()}>
                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Full Name</label>
                                <input
                                    type="text"
                                    placeholder="Your name"
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition text-slate-900"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Email Address</label>
                                <input
                                    type="email"
                                    placeholder="you@email.com"
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition text-slate-900"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Subject</label>
                            <input
                                type="text"
                                placeholder="How can we help?"
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition text-slate-900"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Message</label>
                            <textarea
                                rows={5}
                                placeholder="Tell us more about your query..."
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition text-slate-900 resize-none"
                            />
                        </div>
                        <button
                            type="submit"
                            className="px-8 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-all active:scale-95 shadow-md shadow-emerald-200"
                        >
                            Send Message
                        </button>
                    </form>
                </div>
            </main>

            <footer className="border-t border-slate-100 py-8 text-center text-xs text-slate-400 uppercase tracking-widest font-bold">
                © 2026 DigiChit Technologies
            </footer>
        </div>
    );
};

export default Contact;
