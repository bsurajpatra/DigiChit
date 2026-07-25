import type { InstallmentGroupStats } from '../../types/installment';
import { Wallet, Coins, PieChart, AlertCircle, TrendingUp } from 'lucide-react';
import { formatCurrency } from '../../utils/currency';

interface StatisticsCardsProps {
    stats: InstallmentGroupStats | null;
    currency?: string;
}

export const StatisticsCards = ({ stats, currency }: StatisticsCardsProps) => {
    if (!stats) return null;

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Collected */}
            <div className="bg-white p-5 rounded-2xl border-none shadow-none relative overflow-hidden">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Total Collected</span>
                    <div className="w-10 h-10 rounded-xl bg-slate-900 text-emerald-400 flex items-center justify-center font-bold shrink-0">
                        <Wallet className="w-5 h-5" />
                    </div>
                </div>
                <div className="text-2xl font-black text-slate-900">
                    {formatCurrency(stats.totalCollectedAmount, currency)}
                </div>
                <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 mt-2">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>{stats.paidCount} of {stats.totalInstallments} Paid</span>
                </div>
            </div>

            {/* Pending Amount */}
            <div className="bg-white p-5 rounded-2xl border-none shadow-none relative overflow-hidden">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Pending Amount</span>
                    <div className="w-10 h-10 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center font-bold shrink-0">
                        <Coins className="w-5 h-5" />
                    </div>
                </div>
                <div className="text-2xl font-black text-slate-900">
                    {formatCurrency(stats.totalPendingAmount, currency)}
                </div>
                <p className="text-[11px] font-medium text-slate-400 mt-2">
                    {stats.pendingCount} Installments Pending
                </p>
            </div>

            {/* Collection Percentage */}
            <div className="bg-white p-5 rounded-2xl border-none shadow-none relative overflow-hidden">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Collection Progress</span>
                    <div className="w-10 h-10 rounded-xl bg-slate-900 text-sky-400 flex items-center justify-center font-bold shrink-0">
                        <PieChart className="w-5 h-5" />
                    </div>
                </div>
                <div className="text-2xl font-black text-slate-900">
                    {stats.collectionPercentage.toFixed(1)}%
                </div>
                <p className="text-[11px] font-medium text-slate-400 mt-2">
                    Target: {formatCurrency(stats.totalExpectedAmount, currency)}
                </p>
            </div>

            {/* Late Fees Accrued */}
            <div className="bg-white p-5 rounded-2xl border-none shadow-none relative overflow-hidden">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Late Fees Accrued</span>
                    <div className="w-10 h-10 rounded-xl bg-slate-900 text-rose-400 flex items-center justify-center font-bold shrink-0">
                        <AlertCircle className="w-5 h-5" />
                    </div>
                </div>
                <div className="text-2xl font-black text-slate-900">
                    {formatCurrency(stats.totalLateFeesAccrued, currency)}
                </div>
                <p className="text-[11px] font-medium text-slate-400 mt-2">
                    Penalty Charges Total
                </p>
            </div>
        </div>
    );
};

