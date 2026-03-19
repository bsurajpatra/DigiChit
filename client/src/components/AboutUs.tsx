import { Link } from 'react-router-dom';
import logo from '../assets/logo.png';
import { ArrowLeft } from 'lucide-react';

const AboutUs = () => {
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
                <h1 className="text-4xl font-bold mb-8">About Us</h1>
                <div className="prose prose-slate max-w-none text-slate-600 space-y-6">
                    <p className="text-lg">
                        Welcome to DigiChit! We are revolutionizing the traditional chit fund industry by bringing it into the digital age. Our mission is to make chit funds accessible, transparent, and secure for everyone.
                    </p>
                    <p>
                        With decades of collective experience in finance and technology, our team built DigiChit to solve the common issues with manual accounting, fraud risks, and lack of transparency. Our platform uses state-of-the-art encryption and continuous monitoring to ensure your investments are safe.
                    </p>
                    <p>
                        We believe in a future where community-based saving and borrowing is seamless and completely trustless, thanks to digital verification and automated processes.
                    </p>
                </div>
            </main>
        </div>
    );
};

export default AboutUs;
