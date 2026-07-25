import type { Installment } from '../../types/installment';
import { PaymentStatusBadge } from './PaymentStatusBadge';
import { History, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { formatCurrency } from '../../utils/currency';

interface PaymentHistoryProps {
    installments: Installment[];
    currency?: string;
}

export const PaymentHistory = ({ installments, currency }: PaymentHistoryProps) => {
    const paidInstallments = installments.filter((i) => (i.paymentStatus || i.status) === 'PAID');

    if (paidInstallments.length === 0) {
        return (
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 text-center text-slate-400 text-xs">
                <History className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                <p>No completed payment receipts found.</p>
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Paid Installment Receipts ({paidInstallments.length})</span>
            </h3>

            <div className="space-y-3">
                {paidInstallments.map((inst) => {
                    const groupObj = typeof inst.groupId === 'object' ? inst.groupId : null;
                    const activeCurrency = currency || (groupObj as any)?.financialConfig?.currency;

                    return (
                        <div
                            key={inst._id}
                            className="p-3.5 rounded-2xl bg-emerald-50/40 border border-emerald-100 flex items-center justify-between gap-3 text-xs"
                        >
                            <div>
                                <span className="font-bold text-slate-900 block">
                                    {groupObj?.name ? groupObj.name : `Installment #${inst.installmentNumber}`}
                                </span>
                                <span className="text-[10px] text-slate-400 block">
                                    Paid on {inst.paidDate ? format(new Date(inst.paidDate), 'PP') : 'Completed'}
                                </span>
                            </div>

                            <div className="text-right">
                                <span className="font-black text-emerald-700 text-xs block">
                                    {formatCurrency(inst.amount, activeCurrency)}
                                </span>
                                <PaymentStatusBadge status="PAID" size="sm" />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
