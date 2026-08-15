import { useState } from 'react';
import { X, CreditCard, CheckCircle2, AlertCircle, Loader2, Smartphone, Building2, Zap, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatCurrency } from '../../utils/currency';
import { initiatePayment, verifyPayment, type TransactionRecord, type PaymentMethod } from '../../api/transaction.api';
import type { Installment } from '../../types/installment';

interface PayNowModalProps {
    isOpen: boolean;
    installment: Installment;
    currency?: string;
    onClose: () => void;
    onPaymentSuccess?: (transaction: TransactionRecord) => void;
}

export const PayNowModal = ({
    isOpen,
    installment,
    currency,
    onClose,
    onPaymentSuccess
}: PayNowModalProps) => {
    const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('UPI');
    const [step, setStep] = useState<'IDLE' | 'PROCESSING' | 'SUCCESS' | 'FAILED'>('IDLE');
    const [processingMessage, setProcessingMessage] = useState('Initiating payment gateway order...');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [completedTransaction, setCompletedTransaction] = useState<TransactionRecord | null>(null);

    if (!isOpen) return null;

    const baseAmount = installment.amount || 0;
    const lateFee = installment.lateFee || 0;
    const netAmount = baseAmount + lateFee;

    const handleReset = () => {
        setStep('IDLE');
        setErrorMessage(null);
        setCompletedTransaction(null);
    };

    const handleModalClose = () => {
        if (step === 'PROCESSING') return;
        handleReset();
        onClose();
    };

    const handleExecutePayment = async () => {
        setStep('PROCESSING');
        setErrorMessage(null);

        try {
            setProcessingMessage('Creating secure transaction order...');
            const initiatedTxn = await initiatePayment({
                installmentId: installment._id,
                paymentMethod: selectedMethod,
                paymentGateway: 'MOCK',
                amount: netAmount,
                currency: currency || 'INR'
            });

            setProcessingMessage('Authorizing payment with gateway...');
            const verifiedTxn = await verifyPayment({
                transactionId: initiatedTxn._id,
                gatewayOrderId: initiatedTxn.gatewayOrderId || '',
                gatewayPaymentId: 'pay_mock_' + Date.now()
            });

            setCompletedTransaction(verifiedTxn);
            setStep('SUCCESS');

            if (onPaymentSuccess) {
                onPaymentSuccess(verifiedTxn);
            }
        } catch (err: any) {
            const msg = err.response?.data?.message || err.message || 'Payment processing failed. Please try again.';
            setErrorMessage(msg);
            setStep('FAILED');
        }
    };

    const paymentMethods: { id: PaymentMethod; label: string; icon: any; desc: string }[] = [
        { id: 'UPI', label: 'UPI / QR', icon: Smartphone, desc: 'Google Pay, PhonePe, Paytm, BHIM' },
        { id: 'CARD', label: 'Debit / Credit Card', icon: CreditCard, desc: 'Visa, Mastercard, RuPay' },
        { id: 'NET_BANKING', label: 'Net Banking', icon: Building2, desc: 'All Major Indian Banks' },
        { id: 'MOCK', label: 'Instant Simulator', icon: Zap, desc: 'Mock Gateway Instant Approval' }
    ];

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={handleModalClose}
                    className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
                />

                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 z-10 overflow-hidden"
                >
                    <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-2xl bg-slate-900 text-emerald-400 flex items-center justify-center font-black shadow-xs`}>
                                {step === 'SUCCESS' ? <CheckCircle2 className="w-5 h-5" /> : <CreditCard className="w-5 h-5" />}
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-slate-900">
                                    {step === 'SUCCESS' ? 'Payment Successful' : `Installment #${installment.installmentNumber} Payment`}
                                </h3>
                                <p className="text-xs text-slate-500">
                                    {step === 'SUCCESS' ? 'Receipt generated & verified' : 'Secure Online Payment Gateway'}
                                </p>
                            </div>
                        </div>
                        {step !== 'PROCESSING' && (
                            <button
                                onClick={handleModalClose}
                                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        )}
                    </div>

                    {step === 'IDLE' && (
                        <div className="space-y-5">
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2 text-xs">
                                <div className="flex justify-between text-slate-600">
                                    <span>Base Monthly Dues:</span>
                                    <span className="font-bold text-slate-900">{formatCurrency(baseAmount, currency)}</span>
                                </div>
                                {lateFee > 0 && (
                                    <div className="flex justify-between text-rose-600">
                                        <span>Late Fee Accrued:</span>
                                        <span className="font-bold">+ {formatCurrency(lateFee, currency)}</span>
                                    </div>
                                )}
                                <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-black text-slate-900">
                                    <span>Total Payable Amount:</span>
                                    <span className="text-emerald-600 font-mono text-base">{formatCurrency(netAmount, currency)}</span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                                    Select Payment Method
                                </label>
                                <div className="grid grid-cols-1 gap-2">
                                    {paymentMethods.map((m) => {
                                        const Icon = m.icon;
                                        const isSelected = selectedMethod === m.id;
                                        return (
                                            <button
                                                key={m.id}
                                                type="button"
                                                onClick={() => setSelectedMethod(m.id)}
                                                className={`
                                                    w-full p-3 rounded-2xl border text-left flex items-center gap-3 transition cursor-pointer
                                                    ${isSelected
                                                        ? 'border-emerald-500 bg-emerald-50/40 text-emerald-950 ring-1 ring-emerald-500/20'
                                                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/60 text-slate-700'
                                                    }
                                                `}
                                            >
                                                <div className={`p-2 rounded-xl shrink-0 ${isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-emerald-400'}`}>
                                                    <Icon className="w-4 h-4" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs font-bold text-slate-900">{m.label}</span>
                                                        {isSelected && <span className="w-2 h-2 rounded-full bg-emerald-600" />}
                                                    </div>
                                                    <p className="text-[10px] text-slate-400 truncate">{m.desc}</p>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="flex items-center gap-2 p-2.5 bg-emerald-50/50 border border-emerald-100 rounded-xl text-[11px] text-emerald-800">
                                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                                <span>Secured with end-to-end 256-bit encrypted gateway verification</span>
                            </div>

                            <div className="pt-2 flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={handleModalClose}
                                    className="w-1/3 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleExecutePayment}
                                    className="w-2/3 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition shadow-md shadow-emerald-600/20 cursor-pointer active:scale-98"
                                >
                                    Pay {formatCurrency(netAmount, currency)}
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 'PROCESSING' && (
                        <div className="py-8 flex flex-col items-center justify-center text-center space-y-4">
                            <div className="relative">
                                <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                                    <Loader2 className="w-8 h-8 animate-spin" />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <h4 className="text-sm font-bold text-slate-900">Processing Payment...</h4>
                                <p className="text-xs text-slate-500 font-medium">{processingMessage}</p>
                            </div>
                            <p className="text-[11px] text-slate-400 max-w-xs">
                                Please do not refresh the page or click back while the payment is being verified.
                            </p>
                        </div>
                    )}

                    {step === 'SUCCESS' && completedTransaction && (
                        <div className="space-y-5">
                            <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200 text-center space-y-2">
                                <div className="w-12 h-12 mx-auto rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
                                    <CheckCircle2 className="w-6 h-6" />
                                </div>
                                <h4 className="text-sm font-black text-emerald-950">Payment Successfully Recorded!</h4>
                                <p className="text-xs text-emerald-800">
                                    Your installment obligation has been marked as <strong>PAID</strong>.
                                </p>
                            </div>

                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2 text-xs font-medium">
                                <div className="flex justify-between text-slate-600">
                                    <span>Amount Paid:</span>
                                    <span className="font-bold text-slate-900">{formatCurrency(completedTransaction.amount, completedTransaction.currency)}</span>
                                </div>
                                <div className="flex justify-between text-slate-600">
                                    <span>Transaction ID:</span>
                                    <span className="font-mono text-slate-900">{completedTransaction.transactionNumber}</span>
                                </div>
                                {completedTransaction.receiptNumber && (
                                    <div className="flex justify-between text-slate-600">
                                        <span>Receipt #:</span>
                                        <span className="font-mono text-emerald-700 font-bold">{completedTransaction.receiptNumber}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-slate-600">
                                    <span>Payment Method:</span>
                                    <span className="font-bold text-slate-900">{completedTransaction.paymentMethod}</span>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={handleModalClose}
                                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition shadow-md cursor-pointer"
                            >
                                Done & Close
                            </button>
                        </div>
                    )}

                    {step === 'FAILED' && (
                        <div className="space-y-5">
                            <div className="bg-rose-50 p-4 rounded-2xl border border-rose-200 flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                                <div className="space-y-1">
                                    <h4 className="text-xs font-bold text-rose-900">Payment Failed</h4>
                                    <p className="text-xs text-rose-700 leading-relaxed">{errorMessage}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={handleModalClose}
                                    className="w-1/2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleReset}
                                    className="w-1/2 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition cursor-pointer"
                                >
                                    Try Again
                                </button>
                            </div>
                        </div>
                    )}
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
