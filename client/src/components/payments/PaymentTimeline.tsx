import { CheckCircle2, Clock, ShieldCheck, RefreshCw, XCircle, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import type { TransactionRecord } from '../../api/transaction.api';

interface PaymentTimelineProps {
    transaction: TransactionRecord;
}

export const PaymentTimeline = ({ transaction }: PaymentTimelineProps) => {
    const formatDateSafe = (dateVal?: string | null) => {
        if (!dateVal) return null;
        try {
            const d = new Date(dateVal);
            return isNaN(d.getTime()) ? null : format(d, 'MMM dd, h:mm a');
        } catch {
            return null;
        }
    };

    const steps = [
        {
            title: 'Payment Initiated',
            description: `Order created via ${transaction.paymentGateway}`,
            time: formatDateSafe(transaction.initiatedAt || transaction.createdAt),
            completed: true,
            icon: Clock,
            color: 'bg-emerald-500 text-white'
        },
        {
            title: 'Gateway Processing',
            description: `Gateway Order ID: ${transaction.gatewayOrderId || 'N/A'}`,
            time: formatDateSafe(transaction.initiatedAt),
            completed: transaction.status !== 'CANCELLED',
            icon: ShieldCheck,
            color: 'bg-emerald-500 text-white'
        },
        {
            title: transaction.status === 'FAILED' ? 'Payment Failed' : transaction.status === 'REFUNDED' ? 'Payment Refunded' : 'Payment Verified & Completed',
            description: transaction.failureReason || (transaction.receiptNumber ? `Receipt #${transaction.receiptNumber}` : 'Payment captured'),
            time: formatDateSafe(transaction.completedAt || transaction.refundedAt || transaction.updatedAt),
            completed: transaction.status === 'SUCCESS' || transaction.status === 'REFUNDED',
            failed: transaction.status === 'FAILED',
            icon: transaction.status === 'FAILED' ? XCircle : transaction.status === 'REFUNDED' ? RefreshCw : CheckCircle2,
            color: transaction.status === 'FAILED' ? 'bg-rose-500 text-white' : transaction.status === 'REFUNDED' ? 'bg-sky-500 text-white' : 'bg-emerald-600 text-white'
        }
    ];

    return (
        <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Payment Lifecycle Event Progress</h4>
            <div className="relative pl-6 space-y-4 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {steps.map((step, idx) => {
                    const IconComp = step.icon;
                    return (
                        <div key={idx} className="relative flex items-start justify-between gap-4">
                            <div className={`
                                absolute -left-[29px] top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shadow-xs
                                ${step.failed ? 'bg-rose-500 text-white' : step.completed ? step.color : 'bg-slate-200 text-slate-500'}
                            `}>
                                <IconComp className="w-3 h-3" />
                            </div>

                            <div className="space-y-0.5">
                                <h5 className="text-xs font-bold text-slate-900">{step.title}</h5>
                                <p className="text-[11px] text-slate-500">{step.description}</p>
                            </div>

                            {step.time && (
                                <span className="text-[10px] text-slate-400 font-medium shrink-0">{step.time}</span>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
