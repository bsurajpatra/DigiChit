import type { PaymentCollectionStatus, IPaymentCollectionInfo } from '../../types/chitCycle';
import { Lock, Unlock, Clock } from 'lucide-react';

interface PaymentCollectionBadgeProps {
    status?: PaymentCollectionStatus | IPaymentCollectionInfo | string;
    size?: 'sm' | 'md' | 'lg';
}

export const PaymentCollectionBadge = ({ status, size = 'md' }: PaymentCollectionBadgeProps) => {
    const rawStatus = typeof status === 'object' ? status?.status : (status || 'NOT_STARTED');

    let styles = 'bg-amber-50 text-amber-700 border-amber-200';
    let label = 'NOT STARTED';
    let Icon = Clock;

    if (rawStatus === 'OPEN') {
        styles = 'bg-emerald-50 text-emerald-700 border-emerald-200';
        label = 'COLLECTIONS OPEN';
        Icon = Unlock;
    } else if (rawStatus === 'CLOSED') {
        styles = 'bg-slate-100 text-slate-600 border-slate-200';
        label = 'COLLECTIONS CLOSED';
        Icon = Lock;
    }

    const sizeClasses = {
        sm: 'px-2 py-0.5 text-[10px]',
        md: 'px-2.5 py-1 text-xs',
        lg: 'px-3.5 py-1.5 text-xs font-black'
    }[size];

    return (
        <span className={`inline-flex items-center gap-1.5 font-bold rounded-xl border transition ${styles} ${sizeClasses}`}>
            <Icon className="w-3.5 h-3.5 shrink-0" />
            <span>{label}</span>
        </span>
    );
};
