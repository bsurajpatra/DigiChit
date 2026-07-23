import type { BidStatus } from '../../types/bid';
import { CheckCircle2, Trophy, XCircle, Clock, AlertTriangle } from 'lucide-react';

interface BidStatusBadgeProps {
    status: BidStatus;
    isWinning?: boolean;
    size?: 'sm' | 'md';
}

export const BidStatusBadge = ({ status, isWinning = false, size = 'md' }: BidStatusBadgeProps) => {
    const sizeClasses = {
        sm: 'px-2 py-0.5 text-[10px] gap-1 font-bold',
        md: 'px-3 py-1 text-xs gap-1.5 font-black'
    };

    if (isWinning || status === 'WINNING') {
        return (
            <span className={`inline-flex items-center rounded-full bg-amber-50 text-amber-700 border border-amber-300 shadow-xs ${sizeClasses[size]}`}>
                <Trophy className="w-3.5 h-3.5 text-amber-600 animate-bounce" />
                <span>WINNING BID</span>
            </span>
        );
    }

    switch (status) {
        case 'SUBMITTED':
        case 'VALID':
            return (
                <span className={`inline-flex items-center rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 ${sizeClasses[size]}`}>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>ACTIVE BID</span>
                </span>
            );
        case 'REJECTED':
            return (
                <span className={`inline-flex items-center rounded-full bg-rose-50 text-rose-700 border border-rose-200 ${sizeClasses[size]}`}>
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                    <span>REJECTED</span>
                </span>
            );
        case 'WITHDRAWN':
            return (
                <span className={`inline-flex items-center rounded-full bg-slate-100 text-slate-600 border border-slate-200 ${sizeClasses[size]}`}>
                    <XCircle className="w-3.5 h-3.5 text-slate-400" />
                    <span>WITHDRAWN</span>
                </span>
            );
        default:
            return (
                <span className={`inline-flex items-center rounded-full bg-slate-50 text-slate-600 border border-slate-200 ${sizeClasses[size]}`}>
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{status}</span>
                </span>
            );
    }
};
