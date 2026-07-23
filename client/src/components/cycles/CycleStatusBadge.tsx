import type { ChitCycleStatus } from '../../types/chitCycle';
import { Clock, PlayCircle, CheckCircle, XCircle } from 'lucide-react';

interface CycleStatusBadgeProps {
    status: ChitCycleStatus;
    size?: 'sm' | 'md' | 'lg';
}

export const CycleStatusBadge = ({ status, size = 'md' }: CycleStatusBadgeProps) => {
    const sizeClasses = {
        sm: 'px-2 py-0.5 text-xs gap-1',
        md: 'px-3 py-1 text-xs gap-1.5 font-bold',
        lg: 'px-4 py-1.5 text-sm gap-2 font-black'
    };

    switch (status) {
        case 'ACTIVE':
            return (
                <span className={`inline-flex items-center rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-xs ${sizeClasses[size]}`}>
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <PlayCircle className="w-3.5 h-3.5 text-emerald-600" />
                    <span>ACTIVE</span>
                </span>
            );
        case 'UPCOMING':
            return (
                <span className={`inline-flex items-center rounded-full bg-amber-50 text-amber-700 border border-amber-200/80 ${sizeClasses[size]}`}>
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    <span>UPCOMING</span>
                </span>
            );
        case 'COMPLETED':
            return (
                <span className={`inline-flex items-center rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/80 ${sizeClasses[size]}`}>
                    <CheckCircle className="w-3.5 h-3.5 text-indigo-600" />
                    <span>COMPLETED</span>
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
