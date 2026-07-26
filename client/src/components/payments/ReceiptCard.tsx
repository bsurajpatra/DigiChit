import { Printer, Download, CheckCircle2, ShieldCheck, Copy, Sparkles, Building2, User, Hash } from 'lucide-react';
import { format } from 'date-fns';
import { formatCurrency } from '../../utils/currency';
import type { TransactionRecord } from '../../api/transaction.api';

interface ReceiptCardProps {
    transaction: TransactionRecord;
    onClose?: () => void;
}

export const ReceiptCard = ({ transaction, onClose }: ReceiptCardProps) => {
    const formatDateSafe = (dateVal?: string | null) => {
        if (!dateVal) return 'N/A';
        try {
            const d = new Date(dateVal);
            return isNaN(d.getTime()) ? 'N/A' : format(d, 'MMM dd, yyyy h:mm a');
        } catch {
            return 'N/A';
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const receipt = transaction.metadata?.receipt;
    const receiptNum = transaction.receiptNumber || receipt?.receiptNumber || `RCP-${transaction._id.substring(0, 8).toUpperCase()}`;

    return (
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-xl max-w-lg mx-auto space-y-6 print:shadow-none print:border-none">
            {/* Top Brand Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black text-lg">
                        <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-base font-black text-slate-900 leading-none tracking-tight">DigiChit Official Receipt</h3>
                        <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Secured Digital Receipt</span>
                    </div>
                </div>

                <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-200/60 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>VERIFIED</span>
                </span>
            </div>

            {/* Amount Banner */}
            <div className="p-5 bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl text-center space-y-1 shadow-sm">
                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">Total Paid Amount</span>
                <h2 className="text-3xl font-black tracking-tight text-white">
                    {formatCurrency(transaction.amount, transaction.currency)}
                </h2>
                <p className="text-xs text-slate-300 font-medium">
                    Paid via {transaction.paymentMethod} ({transaction.paymentGateway})
                </p>
            </div>

            {/* Transaction Metadata Grid */}
            <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div>
                    <span className="text-slate-400 font-bold block uppercase text-[9px]">Receipt No</span>
                    <span className="font-bold text-slate-900 text-xs font-mono">{receiptNum}</span>
                </div>
                <div>
                    <span className="text-slate-400 font-bold block uppercase text-[9px]">Transaction No</span>
                    <span className="font-bold text-slate-900 text-xs font-mono">{transaction.transactionNumber}</span>
                </div>
                <div>
                    <span className="text-slate-400 font-bold block uppercase text-[9px]">Payment Date</span>
                    <span className="font-bold text-slate-800 text-xs">{formatDateSafe(transaction.completedAt || transaction.createdAt)}</span>
                </div>
                <div>
                    <span className="text-slate-400 font-bold block uppercase text-[9px]">Gateway Reference</span>
                    <span className="font-bold text-slate-800 text-xs font-mono truncate block">{transaction.gatewayPaymentId || transaction.gatewayOrderId || 'MOCK_REF'}</span>
                </div>
            </div>

            {/* Entity Details */}
            <div className="space-y-3 text-xs border-t border-slate-100 pt-4">
                <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>Payer Name:</span>
                    </span>
                    <span className="font-bold text-slate-900">{receipt?.payerName || transaction.memberId?.name || 'Chit Member'}</span>
                </div>

                <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        <span>Chit Group:</span>
                    </span>
                    <span className="font-bold text-slate-900">{transaction.groupId?.name || 'Chit Circle'}</span>
                </div>

                <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium flex items-center gap-1.5">
                        <Hash className="w-3.5 h-3.5 text-slate-400" />
                        <span>Cycle / Installment:</span>
                    </span>
                    <span className="font-bold text-slate-900">
                        Cycle #{transaction.cycleId?.cycleNumber || 1} (Installment #{transaction.installmentId?.installmentNumber || 1})
                    </span>
                </div>
            </div>

            {/* Footer Action Buttons */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 print:hidden">
                {onClose && (
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
                    >
                        Close Window
                    </button>
                )}

                <button
                    onClick={handlePrint}
                    className="ml-auto px-5 py-2.5 bg-slate-900 hover:bg-emerald-600 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition flex items-center gap-2 shadow-xs cursor-pointer active:scale-95"
                >
                    <Printer className="w-4 h-4 text-emerald-400" />
                    <span>Print / Save Receipt</span>
                </button>
            </div>
        </div>
    );
};
