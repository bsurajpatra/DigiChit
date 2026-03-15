import { Link } from 'react-router-dom';
import logo from '../assets/logo.png';
import { ArrowLeft, Mail, Phone, MapPin } from 'lucide-react';

const Contact = () => {
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
                <h1 className="text-4xl font-bold mb-8">Contact Us</h1>
                <div className="grid md:grid-cols-2 gap-12 text-slate-600">
                    <div>
                        <p className="text-lg mb-8">
                            Have questions or need support? We're here to help. Reach out to our team through any of the channels below.
                        </p>
                        <div className="space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
                                    <Mail className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="font-bold text-slate-900">Email</p>
                                    <p>support@digichit.tech</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
                                    <Phone className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="font-bold text-slate-900">Phone</p>
                                    <p>+91 (123) 456-7890</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
                                    <MapPin className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="font-bold text-slate-900">Office</p>
                                    <p>123 Innovation Drive, Tech Park, India</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Contact;
