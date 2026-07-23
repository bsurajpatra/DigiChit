import type { InstallmentPaymentStatus } from '../../types/installment';
import { CheckCircle2, Clock, AlertCircle, AlertTriangle } from 'lucide-react';

interface PaymentStatusBadgeProps {
    status: InstallmentPaymentStatus;
    size?: 'sm' | 'md' | 'lg';
}

export const PaymentStatusBadge = ({ status, size = 'md' }: PaymentStatusBadgeProps) => {
    const sizeClasses = {
        sm: 'px-2 py-0.5 text-[10px] gap-1 font-bold',
        md: 'px-3 py-1 text-xs gap-1.5 font-bold',
        lg: 'px-4 py-1.5 text-sm gap-2 font-black'
    };

    switch (status) {
        case 'PAID':
            return (
                <span className={`inline-flex items-center rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 ${sizeClasses[size]}`}>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>PAID</span>
                </span>
            );
        case 'OVERDUE':
            return (
                <span className={`inline-flex items-center rounded-full bg-rose-50 text-rose-700 border border-rose-200 animate-pulse ${sizeClasses[size]}`}>
                    <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                    <span>OVERDUE</span>
                </span>
            );
        case 'PARTIALLY_PAID':
            return (
                <span className={`inline-flex items-center rounded-full bg-amber-50 text-amber-700 border border-amber-200 ${sizeClasses[size]}`}>
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    <span>PARTIALLY PAID</span>
                </span>
            );
        case 'PENDING':
        default:
            return (
                <span className={`inline-flex items-center rounded-full bg-sky-50 text-sky-700 border border-sky-200 ${sizeClasses[size]}`}>
                    <Clock className="w-3.5 h-3.5 text-sky-600" />
                    <span>DUE (PENDING)</span>
                </span>
            );
    }
};
