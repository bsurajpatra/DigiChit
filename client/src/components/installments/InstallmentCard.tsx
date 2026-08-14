import { useState } from 'react';
import type { Installment } from '../../types/installment';
import { PaymentStatusBadge } from './PaymentStatusBadge';
import { PayNowModal } from './PayNowModal';
import { CreditCard, Download, AlertCircle, CheckCircle2, Coins } from 'lucide-react';
import { format } from 'date-fns';
import { formatCurrency } from '../../utils/currency';

interface InstallmentCardProps {
    installment: Installment;
    currency?: string;
    onDownloadReceipt?: (installmentId: string) => void;
    onPaymentSuccess?: () => void;
}

const formatDateSafe = (dateVal: any) => {
    if (!dateVal) return 'N/A';
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return 'N/A';
    return format(d, 'PP');
};

export const InstallmentCard = ({ installment, currency, onDownloadReceipt, onPaymentSuccess }: InstallmentCardProps) => {
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

    const groupObj = typeof installment.groupId === 'object' ? installment.groupId : null;
    const cycleObj = typeof installment.cycleId === 'object' ? installment.cycleId : null;
    const activeCurrency = currency || (groupObj as any)?.financialConfig?.currency;

    const currentStatus = installment.paymentStatus || installment.status || 'PENDING';
    const netAmount = (installment.amount || 0) + (installment.lateFee || 0);
    const isPaid = currentStatus === 'PAID';

    const collectionStatus = (cycleObj as any)?.paymentCollection?.status || (cycleObj as any)?.paymentCollectionStatus || 'NOT_STARTED';

    return (
        <>
            <div className={`
                bg-white p-6 rounded-3xl border transition-all duration-300 relative overflow-hidden shadow-xs hover:shadow-md
                ${installment.status === 'OVERDUE'
                    ? 'border-rose-300 ring-1 ring-rose-400/20'
                    : isPaid
                        ? 'border-emerald-200 bg-emerald-50/10'
                        : 'border-slate-200/80 hover:border-slate-300'
                }
            `}>
                <div className="flex items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-2.5">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black ${isPaid ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700'}`}>
                            {isPaid ? <CheckCircle2 className="w-5 h-5" /> : <Coins className="w-5 h-5" />}
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-slate-900">
                                {groupObj?.name ? groupObj.name : `Cycle #${cycleObj?.cycleNumber || installment.installmentNumber}`}
                            </h4>
                            <p className="text-[11px] font-medium text-slate-400">
                                Installment #{installment.installmentNumber}
                            </p>
                        </div>
                    </div>

                    <PaymentStatusBadge status={currentStatus} size="sm" />
                </div>

                {/* Financial Summary */}
                <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-xs mb-4">
                    <div>
                        <span className="text-slate-400 font-medium block text-[10px] uppercase">Base Amount</span>
                        <span className="text-base font-black text-slate-900">{formatCurrency(installment.amount || 0, activeCurrency)}</span>
                    </div>

                    <div>
                        <span className="text-slate-400 font-medium block text-[10px] uppercase">Due Date</span>
                        <span className="text-xs font-bold text-slate-700 mt-1 block">
                            {formatDateSafe(installment.dueDate)}
                        </span>
                    </div>
                </div>

                {/* Late Fee Notice if accrued */}
                {installment.lateFee > 0 && (
                    <div className="mb-4 p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs flex items-center justify-between text-rose-700 font-bold">
                        <span className="flex items-center gap-1.5">
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span>Late Fee Accrued</span>
                        </span>
                        <span>+ {formatCurrency(installment.lateFee, activeCurrency)}</span>
                    </div>
                )}

                {/* Paid Date info */}
                {isPaid && installment.paidDate && (
                    <p className="text-xs font-medium text-emerald-700 mb-4 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Paid on {formatDateSafe(installment.paidDate)}</span>
                    </p>
                )}

                {/* Card Action Controls */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    {isPaid ? (
                        <button
                            onClick={() => onDownloadReceipt && onDownloadReceipt(installment._id)}
                            className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer"
                        >
                            <Download className="w-3.5 h-3.5" />
                            <span>Download Receipt</span>
                        </button>
                    ) : collectionStatus === 'CLOSED' ? (
                        <div className="w-full py-2.5 px-3 bg-slate-100 border border-slate-200 text-slate-600 text-[11px] font-bold rounded-xl text-center flex items-center justify-center gap-1.5">
                            <AlertCircle className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            <span>Collections for this cycle have been closed.</span>
                        </div>
                    ) : collectionStatus === 'OPEN' ? (
                        <button
                            onClick={() => setIsPaymentModalOpen(true)}
                            className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl flex items-center justify-center gap-1.5 transition shadow-xs cursor-pointer active:scale-95"
                        >
                            <CreditCard className="w-3.5 h-3.5" />
                            <span>Pay Now ({formatCurrency(netAmount, activeCurrency)})</span>
                        </button>
                    ) : (
                        <div className="w-full py-2.5 px-3 bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold rounded-xl text-center flex items-center justify-center gap-1.5">
                            <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span>Collections have not been opened by the organizer yet.</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Pay Now Placeholder Modal */}
            <PayNowModal
                isOpen={isPaymentModalOpen}
                installment={installment}
                currency={activeCurrency}
                onClose={() => setIsPaymentModalOpen(false)}
                onPaymentSuccess={() => {
                    if (onPaymentSuccess) onPaymentSuccess();
                }}
            />
        </>
    );
};

