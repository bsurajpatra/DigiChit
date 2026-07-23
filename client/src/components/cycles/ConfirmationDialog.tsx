import type { ReactNode } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ConfirmationDialogProps {
    isOpen: boolean;
    title: string;
    description: string;
    confirmLabel?: string;
    confirmVariant?: 'emerald' | 'amber' | 'indigo' | 'rose';
    isLoading?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
    children?: ReactNode;
}

export const ConfirmationDialog = ({
    isOpen,
    title,
    description,
    confirmLabel = 'Confirm',
    confirmVariant = 'emerald',
    isLoading = false,
    onConfirm,
    onCancel,
    children
}: ConfirmationDialogProps) => {
    if (!isOpen) return null;

    const variantStyles = {
        emerald: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20',
        amber: 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/20',
        indigo: 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/20',
        rose: 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20'
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onCancel}
                    className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
                />

                {/* Modal Container */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 z-10 overflow-hidden"
                >
                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                            <AlertTriangle className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-base font-bold text-slate-900">{title}</h3>
                            <p className="text-xs text-slate-500 mt-1 leading-relaxed">{description}</p>
                        </div>
                    </div>

                    {children && <div className="mt-4">{children}</div>}

                    <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
                        <button
                            type="button"
                            disabled={isLoading}
                            onClick={onCancel}
                            className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            disabled={isLoading}
                            onClick={onConfirm}
                            className={`inline-flex items-center gap-2 px-5 py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition shadow-md active:scale-95 cursor-pointer ${variantStyles[confirmVariant]}`}
                        >
                            {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                            <span>{confirmLabel}</span>
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
