import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { formatCurrency } from '../../utils/currency';

interface StatementSummaryCardProps {
    title: string;
    value: number | string;
    subtitle?: string;
    icon: LucideIcon;
    isCurrency?: boolean;
    currency?: string;
    variant?: 'primary' | 'success' | 'warning' | 'danger' | 'neutral';
}

export const StatementSummaryCard: React.FC<StatementSummaryCardProps> = ({
    title,
    value,
    subtitle,
    icon: Icon,
    isCurrency = true,
    currency = 'INR',
    variant = 'neutral'
}) => {
    const getVariantStyles = () => {
        switch (variant) {
            case 'primary':
                return 'bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow-sm';
            case 'success':
                return 'bg-white border border-slate-200/80 shadow-xs text-emerald-600';
            case 'warning':
                return 'bg-white border border-slate-200/80 shadow-xs text-amber-600';
            case 'danger':
                return 'bg-white border border-slate-200/80 shadow-xs text-rose-600';
            default:
                return 'bg-white border border-slate-200/80 shadow-xs text-slate-700';
        }
    };

    const displayValue = isCurrency && typeof value === 'number'
        ? formatCurrency(value, currency)
        : value;

    const isGradient = variant === 'primary';

    return (
        <div className={`p-5 rounded-3xl flex flex-col justify-between transition-all hover:shadow-md ${getVariantStyles()}`}>
            <div className="flex items-center justify-between">
                <span className={`text-[10px] font-black uppercase tracking-widest ${isGradient ? 'text-blue-100' : 'text-slate-400'}`}>
                    {title}
                </span>
                <Icon className={`w-5 h-5 ${isGradient ? 'text-blue-200' : ''}`} />
            </div>

            <div className="mt-3">
                <span className={`text-2xl font-black block tracking-tight ${isGradient ? 'text-white' : 'text-slate-900'}`}>
                    {displayValue}
                </span>
                {subtitle && (
                    <p className={`text-[11px] font-medium mt-1 ${isGradient ? 'text-blue-100' : 'text-slate-400'}`}>
                        {subtitle}
                    </p>
                )}
            </div>
        </div>
    );
};
