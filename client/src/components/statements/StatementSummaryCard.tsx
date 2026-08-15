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
    variant?: 'primary' | 'success' | 'warning' | 'danger' | 'neutral' | 'info';
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
    const isHero = variant === 'primary';

    const getIconTextColor = () => {
        switch (variant) {
            case 'primary':
                return 'text-emerald-400';
            case 'success':
                return 'text-emerald-400';
            case 'warning':
                return 'text-amber-400';
            case 'danger':
                return 'text-rose-400';
            case 'info':
                return 'text-sky-400';
            default:
                return 'text-emerald-400';
        }
    };

    const displayValue = isCurrency && typeof value === 'number'
        ? formatCurrency(value, currency)
        : value;

    if (isHero) {
        return (
            <div className="bg-slate-900 text-white p-6 rounded-3xl border border-slate-800 shadow-md flex flex-col justify-between relative overflow-hidden group hover:shadow-lg transition-all">
                {/* Background ambient glow effect */}
                <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-emerald-500/20 transition-all" />

                <div className="flex items-center justify-between relative z-10">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        {title}
                    </span>
                    <div className={`w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center font-bold shrink-0 transition-transform group-hover:scale-105 shadow-xs ${getIconTextColor()}`}>
                        <Icon className="w-5 h-5" />
                    </div>
                </div>

                <div className="mt-4 relative z-10">
                    <span className="text-2xl sm:text-3xl font-black tracking-tight text-white block">
                        {displayValue}
                    </span>
                    {subtitle && (
                        <div className="flex items-center gap-1.5 mt-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                            <p className="text-[11px] font-bold text-slate-400">
                                {subtitle}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between hover:shadow-md transition-all group">
            <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    {title}
                </span>
                <div className={`w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center font-bold shrink-0 transition-transform group-hover:scale-105 shadow-xs ${getIconTextColor()}`}>
                    <Icon className="w-5 h-5" />
                </div>
            </div>

            <div className="mt-4">
                <span className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 block">
                    {displayValue}
                </span>
                {subtitle && (
                    <p className="text-[11px] font-bold text-slate-400 mt-1">
                        {subtitle}
                    </p>
                )}
            </div>
        </div>
    );
};
