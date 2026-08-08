import React from 'react';
import type { ITimelineItem } from '../../types/statement';
import { format } from 'date-fns';
import { formatCurrency } from '../../utils/currency';
import { ArrowUpRight, ArrowDownLeft, Receipt, Clock } from 'lucide-react';

interface LedgerTimelineTableProps {
    timeline: ITimelineItem[];
    currency?: string;
}

export const LedgerTimelineTable: React.FC<LedgerTimelineTableProps> = ({
    timeline,
    currency = 'INR'
}) => {
    const formatDate = (dateStr: string) => {
        try {
            return format(new Date(dateStr), 'MMM dd, yyyy HH:mm');
        } catch {
            return dateStr;
        }
    };

    const getEntryTypeColor = (type: string) => {
        switch (type) {
            case 'INSTALLMENT_PAYMENT':
                return 'bg-emerald-50 text-emerald-700 border-emerald-200';
            case 'REFUND':
                return 'bg-blue-50 text-blue-700 border-blue-200';
            case 'LATE_FEE':
                return 'bg-rose-50 text-rose-700 border-rose-200';
            case 'REVERSAL':
                return 'bg-amber-50 text-amber-700 border-amber-200';
            default:
                return 'bg-slate-50 text-slate-700 border-slate-200';
        }
    };

    if (timeline.length === 0) {
        return (
            <div className="py-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                    <Clock className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-700">No Financial Entries Found</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    There are no recorded ledger transactions matching your selected criteria.
                </p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        <th className="py-3 px-4">Entry Ref</th>
                        <th className="py-3 px-4">Date & Time</th>
                        <th className="py-3 px-4">Type</th>
                        <th className="py-3 px-4">Description</th>
                        <th className="py-3 px-4">Account</th>
                        <th className="py-3 px-4 text-right">Amount</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                    {timeline.map((item) => {
                        const isCredit = item.direction === 'CREDIT';

                        return (
                            <tr key={item._id} className="hover:bg-slate-50/80 transition">
                                <td className="py-4 px-4 font-mono font-bold text-slate-800 text-[11px]">
                                    <div className="flex items-center gap-2">
                                        <Receipt className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                        <span>{item.entryNumber}</span>
                                    </div>
                                </td>

                                <td className="py-4 px-4 text-slate-500 font-medium whitespace-nowrap">
                                    {formatDate(item.createdAt)}
                                </td>

                                <td className="py-4 px-4">
                                    <span className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg border ${getEntryTypeColor(item.entryType)}`}>
                                        {item.entryType.replace('_', ' ')}
                                    </span>
                                </td>

                                <td className="py-4 px-4">
                                    <span className="font-bold text-slate-900 block">{item.description}</span>
                                    {item.groupName && (
                                        <span className="text-[10px] text-slate-400 block mt-0.5">
                                            {item.groupName} {item.cycleNumber ? `• Cycle #${item.cycleNumber}` : ''}
                                        </span>
                                    )}
                                </td>

                                <td className="py-4 px-4 text-slate-600 font-medium">
                                    <span className="block font-bold text-slate-800">{item.account?.name}</span>
                                    <span className="text-[10px] text-slate-400 block">{item.account?.type}</span>
                                </td>

                                <td className="py-4 px-4 text-right">
                                    <div className="inline-flex items-center justify-end gap-1.5 font-black">
                                        {isCredit ? (
                                            <span className="text-emerald-600 flex items-center gap-1">
                                                <ArrowDownLeft className="w-3.5 h-3.5" />
                                                +{formatCurrency(item.amount, currency)}
                                            </span>
                                        ) : (
                                            <span className="text-slate-900 flex items-center gap-1">
                                                <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
                                                -{formatCurrency(item.amount, currency)}
                                            </span>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};
