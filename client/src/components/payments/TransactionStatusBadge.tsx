import { CheckCircle2, Clock, XCircle, RefreshCw, AlertCircle } from 'lucide-react';
import type { TransactionStatus } from '../../api/transaction.api';

interface TransactionStatusBadgeProps {
    status: TransactionStatus;
    size?: 'sm' | 'md' | 'lg';
}

export const TransactionStatusBadge = ({ status, size = 'sm' }: TransactionStatusBadgeProps) => {
    const sizeClasses = {
        sm: 'px-2.5 py-0.5 text-[10px]',
        md: 'px-3 py-1 text-xs',
        lg: 'px-4 py-1.5 text-sm'
    };

    switch (status) {
        case 'SUCCESS':
            return (
                <span className={`inline-flex items-center gap-1.5 font-black uppercase tracking-wider rounded-full bg-emerald-100 text-emerald-800 ${sizeClasses[size]}`}>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>SUCCESS</span>
                </span>
            );

        case 'PENDING':
            return (
                <span className={`inline-flex items-center gap-1.5 font-black uppercase tracking-wider rounded-full bg-amber-100 text-amber-800 ${sizeClasses[size]}`}>
                    <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                    <span>PENDING</span>
                </span>
            );

        case 'FAILED':
            return (
                <span className={`inline-flex items-center gap-1.5 font-black uppercase tracking-wider rounded-full bg-rose-100 text-rose-800 ${sizeClasses[size]}`}>
                    <XCircle className="w-3.5 h-3.5 text-rose-600" />
                    <span>FAILED</span>
                </span>
            );

        case 'REFUNDED':
        case 'PARTIALLY_REFUNDED':
            return (
                <span className={`inline-flex items-center gap-1.5 font-black uppercase tracking-wider rounded-full bg-sky-100 text-sky-800 ${sizeClasses[size]}`}>
                    <RefreshCw className="w-3.5 h-3.5 text-sky-600" />
                    <span>{status.replace('_', ' ')}</span>
                </span>
            );

        case 'CANCELLED':
        case 'EXPIRED':
        default:
            return (
                <span className={`inline-flex items-center gap-1.5 font-black uppercase tracking-wider rounded-full bg-slate-100 text-slate-700 ${sizeClasses[size]}`}>
                    <AlertCircle className="w-3.5 h-3.5 text-slate-500" />
                    <span>{status}</span>
                </span>
            );
    }
};
