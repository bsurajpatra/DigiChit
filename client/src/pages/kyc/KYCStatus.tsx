import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { motion } from 'framer-motion';
import { FileSearch, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import logo from '../../assets/logo.png';

export const KYCStatus = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const statusMap = {
        NOT_SUBMITTED: {
            icon: <AlertCircle className="w-10 h-10" />,
            title: "Verification Required",
            description: "You need to submit your government documents to unlock your account and start participating in digital chit funds.",
            action: () => navigate('/kyc/submit'),
            buttonText: "Start KYC Verification",
            colorClass: "bg-yellow-50 text-yellow-600",
            sidebarTitle: <>Verify your <span className="text-yellow-400">Identity</span>.</>,
            sidebarSubtitle: "For regulatory reasons, we require a quick identity check before you can invest or borrow."
        },
        PENDING: {
            icon: <FileSearch className="w-10 h-10" />,
            title: "Verification in Progress",
            description: "Your KYC documents have been successfully submitted. Our automated system and team are currently reviewing them. This process usually completes within 24-48 hours.",
            action: () => navigate('/dashboard'),
            buttonText: "Go to Dashboard",
            colorClass: "bg-emerald-50 text-emerald-600",
            sidebarTitle: <>Under <span className="text-emerald-600">Review</span>.</>,
            sidebarSubtitle: "We are carefully reviewing your submitted credentials to ensure the absolute security of the DigiChit ecosystem."
        },
        APPROVED: {
            icon: <CheckCircle2 className="w-10 h-10" />,
            title: "Verification Successful!",
            description: "Your account is fully verified. Your digital profile has been secured, and you can now seamlessly join or create chit funds.",
            action: () => navigate('/dashboard'),
            buttonText: "Access Dashboard",
            colorClass: "bg-green-50 text-green-600",
            sidebarTitle: <>You are <span className="text-green-400">Approved</span>!</>,
            sidebarSubtitle: "Welcome to the future of chit funds. You now have full access to all features."
        },
        REJECTED: {
            icon: <XCircle className="w-10 h-10" />,
            title: "Verification Rejected",
            description: "Unfortunately, we couldn't verify your latest document submission. This can happen if the photos were blurry or fields were incorrect. Please review your documents and try again.",
            action: () => navigate('/kyc/submit'),
            buttonText: "Resubmit KYC",
            colorClass: "bg-red-50 text-red-600",
            sidebarTitle: <>Submission <span className="text-red-400">Declined</span>.</>,
            sidebarSubtitle: "We need a bit more clarity. Please upload high-quality, clearly visible government credentials."
        }
    };

    const currentStatus = user?.kycStatus || 'NOT_SUBMITTED';
    const uiData = statusMap[currentStatus];

    return (
        <div className="h-screen overflow-hidden grid lg:grid-cols-2 bg-white font-sans">
            <div className="hidden lg:flex flex-col justify-between p-12 bg-slate-900 text-white relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full">
                    <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-emerald-600 blur-[120px] rounded-full" />
                </div>
                <Link to="/" className="flex items-center gap-2 relative z-10">
                    <img src={logo} alt="DigiChit Logo" className="w-10 h-10 object-contain" />
                    <span className="text-xl font-bold tracking-tight">DigiChit</span>
                </Link>
                <div className="relative z-10 max-w-sm">
                    <h2 className="text-4xl font-bold leading-tight mb-6">{uiData.sidebarTitle}</h2>
                    <p className="text-base text-slate-400">{uiData.sidebarSubtitle}</p>
                </div>
                <div className="relative z-10 text-[10px] text-slate-500 uppercase tracking-widest font-bold">© 2026 DigiChit Technologies</div>
            </div>

            <div className="flex-1 flex flex-col min-h-0 bg-slate-50/50">
                <div className="shrink-0 flex items-center justify-between bg-white/40 backdrop-blur-md p-6 rounded-[2.5rem] border border-white/40 shadow-xl shadow-slate-100 m-6 mb-0">
                    <div>
                        <h2 className="text-3xl font-medium text-slate-900 tracking-tight uppercase leading-none">{uiData.title}</h2>
                        <p className="text-xs font-medium text-slate-400 mt-2 uppercase tracking-widest tracking-widest">Global Verification Status</p>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto flex items-center justify-center p-6 md:p-10 lg:p-12">
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="max-w-lg w-full text-center lg:text-left">
                        <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mx-auto lg:mx-0 mb-8 shadow-inner ${uiData.colorClass}`}>
                            {uiData.icon}
                        </div>
                    
                    <h2 className="text-4xl font-medium text-slate-900 mb-4 tracking-tight uppercase">{uiData.title}</h2>
                    
                    <div className="mb-6 flex justify-center lg:justify-start">
                        <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest ${uiData.colorClass}`}>
                            Status: {currentStatus}
                        </span>
                    </div>

                    <p className="text-base text-slate-600 mb-10 leading-relaxed">
                        {uiData.description}
                    </p>

                    <button
                        onClick={uiData.action}
                        className="w-full py-4.5 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 text-lg active:scale-[0.98]"
                    >
                        {uiData.buttonText}
                    </button>
                    
                    {currentStatus === 'PENDING' && (
                        <div className="mt-8 text-center lg:text-left">
                            <button onClick={() => window.location.reload()} className="text-sm font-bold text-slate-500 hover:text-emerald-700">
                                Refresh Status
                            </button>
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    </div>
);
};
