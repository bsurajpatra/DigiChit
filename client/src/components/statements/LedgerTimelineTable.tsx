import React from 'react';
import type { ITimelineItem } from '../../types/statement';
import { format } from 'date-fns';
import { formatCurrency } from '../../utils/currency';
import {
    ArrowUpRight,
    ArrowDownLeft,
    Receipt,
    Clock,
    RotateCcw,
    ShieldCheck,
    AlertCircle,
    CheckCircle2
} from 'lucide-react';

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
            return format(new Date(dateStr), 'MMM dd, yyyy • HH:mm');
        } catch {
            return dateStr;
        }
    };

    const getEntryTypeBadge = (type: string) => {
        switch (type) {
            case 'INSTALLMENT_PAYMENT':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Payment</span>
                    </span>
                );
            case 'REFUND':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-full bg-sky-50 text-sky-700 border border-sky-200/80">
                        <RotateCcw className="w-3 h-3 text-sky-600" />
                        <span>Refund</span>
                    </span>
                );
            case 'REVERSAL':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-full bg-amber-50 text-amber-700 border border-amber-200/80">
                        <RotateCcw className="w-3 h-3 text-amber-600" />
                        <span>Reversal</span>
                    </span>
                );
            case 'LATE_FEE':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-full bg-rose-50 text-rose-700 border border-rose-200/80">
                        <AlertCircle className="w-3 h-3 text-rose-600" />
                        <span>Late Fee</span>
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                        <ShieldCheck className="w-3 h-3 text-slate-500" />
                        <span>{type.replace('_', ' ')}</span>
                    </span>
                );
        }
    };

    if (timeline.length === 0) {
        return (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto shrink-0 font-bold">
                    <Clock className="w-7 h-7" />
                </div>
                <h4 className="text-base font-black text-slate-900 tracking-tight">No Ledger Entries Found</h4>
                <p className="text-xs font-medium text-slate-400 max-w-sm mx-auto leading-relaxed">
                    There are no recorded ledger transactions matching your current search criteria or filter range.
                </p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                            <th className="py-4 px-6">Entry Ref</th>
                            <th className="py-4 px-6">Date & Time</th>
                            <th className="py-4 px-6">Type</th>
                            <th className="py-4 px-6">Description</th>
                            <th className="py-4 px-6">Account</th>
                            <th className="py-4 px-6 text-right">Amount</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                        {timeline.map((item) => {
                            const isCredit = item.direction === 'CREDIT';

                            return (
                                <tr key={item._id} className="hover:bg-slate-50/60 transition-colors duration-150">
                                    {/* Entry Ref */}
                                    <td className="py-4 px-6 whitespace-nowrap">
                                        <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-slate-100/80 text-slate-800 rounded-xl font-mono text-[11px] font-bold border border-slate-200/60">
                                            <Receipt className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                            <span>{item.entryNumber}</span>
                                        </div>
                                    </td>

                                    {/* Date & Time */}
                                    <td className="py-4 px-6 text-slate-500 font-medium whitespace-nowrap">
                                        {formatDate(item.createdAt)}
                                    </td>

                                    {/* Type */}
                                    <td className="py-4 px-6 whitespace-nowrap">
                                        {getEntryTypeBadge(item.entryType)}
                                    </td>

                                    {/* Description & Group Context */}
                                    <td className="py-4 px-6">
                                        <span className="font-black text-slate-900 block tracking-tight text-xs">
                                            {item.description}
                                        </span>
                                        {item.groupName && (
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                                                <span className="text-[11px] font-bold text-slate-400">
                                                    {item.groupName} {item.cycleNumber ? `• Cycle #${item.cycleNumber}` : ''}
                                                </span>
                                            </div>
                                        )}
                                    </td>

                                    {/* Account Details */}
                                    <td className="py-4 px-6 whitespace-nowrap">
                                        <span className="block font-bold text-slate-800 text-xs">
                                            {item.account?.name || 'General Ledger'}
                                        </span>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mt-0.5">
                                            {item.account?.type || 'ASSET'}
                                        </span>
                                    </td>

                                    {/* Amount */}
                                    <td className="py-4 px-6 text-right whitespace-nowrap">
                                        <div className="inline-flex items-center justify-end gap-1.5 font-black text-sm">
                                            {isCredit ? (
                                                <span className="text-emerald-600 bg-emerald-50 px-3 py-1 rounded-xl flex items-center gap-1 border border-emerald-100">
                                                    <ArrowDownLeft className="w-4 h-4" />
                                                    +{formatCurrency(item.amount, currency)}
                                                </span>
                                            ) : (
                                                <span className="text-slate-900 bg-slate-100 px-3 py-1 rounded-xl flex items-center gap-1 border border-slate-200/60">
                                                    <ArrowUpRight className="w-4 h-4 text-slate-400" />
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
        </div>
    );
};
