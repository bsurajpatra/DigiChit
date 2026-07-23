import { PieChart } from 'lucide-react';

interface CollectionProgressProps {
    collectedAmount: number;
    expectedAmount: number;
    percentage: number;
}

export const CollectionProgress = ({
    collectedAmount,
    expectedAmount,
    percentage
}: CollectionProgressProps) => {
    const safePercentage = Math.min(Math.max(percentage, 0), 100);

    return (
        <div className="bg-white p-6 rounded-2xl border-none shadow-none space-y-4">
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <PieChart className="w-5 h-5 text-slate-900" />
                    <h4 className="text-sm font-bold text-slate-900">Group Collection Rate</h4>
                </div>
                <span className="text-xs font-bold text-slate-900 bg-slate-100 px-3 py-1 rounded-full border-none">
                    {safePercentage.toFixed(1)}% Collected
                </span>
            </div>

            {/* Progress Bar Container */}
            <div className="space-y-2">
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border-none">
                    <div
                        className="h-full bg-slate-900 rounded-full transition-all duration-700 ease-out"
                        style={{ width: `${safePercentage}%` }}
                    />
                </div>

                <div className="flex justify-between text-[11px] font-bold text-slate-500">
                    <span>Collected: ₹{collectedAmount.toLocaleString('en-IN')}</span>
                    <span>Target: ₹{expectedAmount.toLocaleString('en-IN')}</span>
                </div>
            </div>
        </div>
    );
};
