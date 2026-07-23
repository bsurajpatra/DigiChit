import { useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, FileSearch, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface KYCChitGuardProps {
    title?: string;
    subtitle?: string;
}

export const KYCChitGuard = ({}: KYCChitGuardProps) => {
    const { user, refreshUser } = useAuth();
    const navigate = useNavigate();

    const status = user?.kycStatus || 'NOT_SUBMITTED';

    useEffect(() => {
        if (status !== 'APPROVED') {
            refreshUser();
        }
    }, [status, refreshUser]);

    const config = {
        PENDING: {
            iconBoxClass: "bg-amber-50 border-amber-100 text-amber-500",
            icon: <FileSearch className="w-8 h-8 text-amber-500" />,
            title: "VERIFICATION PENDING",
            description: (
                <>
                    YOUR KYC IS CURRENTLY <span className="text-slate-900 font-black">UNDER REVIEW</span>. YOU MUST HAVE AN <span className="text-slate-900 font-black">APPROVED KYC</span> TO ACCESS CHIT FEATURES.
                </>
            ),
            primaryBtnText: "CHECK STATUS",
            primaryAction: () => navigate('/kyc/status'),
            secondaryBtnText: null,
            secondaryAction: null
        },
        REJECTED: {
            iconBoxClass: "bg-red-50 border-red-100 text-red-500",
            icon: <AlertTriangle className="w-8 h-8 text-red-500" />,
            title: "NOT ELIGIBLE",
            description: (
                <>
                    YOU MUST HAVE A FULLY <span className="text-slate-900 font-black">ACTIVE ACCOUNT</span> AND AN <span className="text-slate-900 font-black">APPROVED KYC</span> TO ACCESS CHIT FEATURES.
                </>
            ),
            primaryBtnText: "RESUBMIT KYC",
            primaryAction: () => navigate('/kyc/submit'),
            secondaryBtnText: "VIEW DETAILS",
            secondaryAction: () => navigate('/kyc/status')
        },
        NOT_SUBMITTED: {
            iconBoxClass: "bg-red-50 border-red-100 text-red-500",
            icon: <AlertTriangle className="w-8 h-8 text-red-500" />,
            title: "NOT ELIGIBLE",
            description: (
                <>
                    YOU MUST HAVE A FULLY <span className="text-slate-900 font-black">ACTIVE ACCOUNT</span> AND AN <span className="text-slate-900 font-black">APPROVED KYC</span> TO ACCESS CHIT FEATURES.
                </>
            ),
            primaryBtnText: "START VERIFICATION",
            primaryAction: () => navigate('/kyc/submit'),
            secondaryBtnText: null,
            secondaryAction: null
        }
    };

    const currentConfig = config[status as keyof typeof config] || config.NOT_SUBMITTED;

    return (
        <div className="min-h-[75vh] w-full flex-1 flex flex-col items-center justify-center p-6 sm:p-12 my-auto text-center">
            <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="max-w-md w-full flex flex-col items-center text-center mx-auto my-auto"
            >
                {/* Soft rounded 3D icon box */}
                <div className={`w-20 h-20 rounded-3xl border flex items-center justify-center mb-6 shadow-sm ${currentConfig.iconBoxClass}`}>
                    {currentConfig.icon}
                </div>

                {/* Bold title */}
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-wider uppercase mb-3">
                    {currentConfig.title}
                </h2>
                
                {/* Uppercase text with bold highlights matching reference UI */}
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em] leading-relaxed max-w-sm mx-auto mb-4">
                    {currentConfig.description}
                </p>

                {/* Simple plain transparent admin rejection remark text */}
                {status === 'REJECTED' && user?.kycRejectedReason && (
                    <div className="w-full mb-6 text-left">
                        <p className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-1 flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                            Admin Remark:
                        </p>
                        <p className="text-xs font-semibold text-red-500 leading-relaxed">
                            "{user.kycRejectedReason}"
                        </p>
                    </div>
                )}

                {/* Dark pill button */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full">
                    <button
                        onClick={currentConfig.primaryAction}
                        className="px-8 py-3.5 bg-slate-950 hover:bg-slate-800 text-white rounded-2xl text-[10px] font-black tracking-[0.2em] uppercase flex items-center justify-center gap-2 shadow-lg shadow-slate-950/20 transition-all hover:scale-[1.02] active:scale-95"
                    >
                        <span>{currentConfig.primaryBtnText}</span>
                        <ArrowRight className="w-4 h-4 text-slate-300" />
                    </button>

                    {currentConfig.secondaryBtnText && currentConfig.secondaryAction && (
                        <button
                            onClick={currentConfig.secondaryAction}
                            className="px-6 py-3.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 rounded-2xl text-[10px] font-black tracking-[0.2em] uppercase transition-all active:scale-95"
                        >
                            {currentConfig.secondaryBtnText}
                        </button>
                    )}
                </div>
            </motion.div>
        </div>
    );
};
