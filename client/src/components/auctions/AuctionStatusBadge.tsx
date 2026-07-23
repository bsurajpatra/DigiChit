import type { AuctionStatus } from '../../types/auction';
import { StatusIndicator } from './StatusIndicator';
import { Calendar, CheckCircle2, Trophy, XCircle } from 'lucide-react';

interface AuctionStatusBadgeProps {
    status: AuctionStatus;
    size?: 'sm' | 'md' | 'lg';
}

export const AuctionStatusBadge = ({ status, size = 'md' }: AuctionStatusBadgeProps) => {
    const sizeClasses = {
        sm: 'px-2 py-0.5 text-xs gap-1.5',
        md: 'px-3 py-1 text-xs gap-2 font-bold',
        lg: 'px-4 py-1.5 text-sm gap-2 font-black'
    };

    switch (status) {
        case 'OPEN':
            return (
                <span className={`inline-flex items-center rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-xs ${sizeClasses[size]}`}>
                    <StatusIndicator status="OPEN" size={size} />
                    <span>LIVE AUCTION</span>
                </span>
            );
        case 'SCHEDULED':
            return (
                <span className={`inline-flex items-center rounded-full bg-amber-50 text-amber-700 border border-amber-200/80 ${sizeClasses[size]}`}>
                    <Calendar className="w-3.5 h-3.5 text-amber-600" />
                    <span>SCHEDULED</span>
                </span>
            );
        case 'CLOSED':
            return (
                <span className={`inline-flex items-center rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/80 ${sizeClasses[size]}`}>
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                    <span>CLOSED</span>
                </span>
            );
        case 'WINNER_DECLARED':
            return (
                <span className={`inline-flex items-center rounded-full bg-purple-50 text-purple-700 border border-purple-200/80 ${sizeClasses[size]}`}>
                    <Trophy className="w-3.5 h-3.5 text-purple-600" />
                    <span>WINNER DECLARED</span>
                </span>
            );
        case 'CANCELLED':
            return (
                <span className={`inline-flex items-center rounded-full bg-rose-50 text-rose-700 border border-rose-200/80 ${sizeClasses[size]}`}>
                    <XCircle className="w-3.5 h-3.5 text-rose-600" />
                    <span>CANCELLED</span>
                </span>
            );
        default:
            return null;
    }
};
