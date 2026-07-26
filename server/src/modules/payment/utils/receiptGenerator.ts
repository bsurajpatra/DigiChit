import { ITransaction, IReceiptMetadata } from '../models/Transaction.js';
import { generateReceiptNumber } from './transactionNumberGenerator.js';

export const buildReceiptMetadata = async (
    transaction: ITransaction,
    payerName?: string,
    payerEmail?: string
): Promise<IReceiptMetadata> => {
    const receiptNumber = transaction.receiptNumber || (await generateReceiptNumber());
    const issuedAt = new Date();

    return {
        receiptNumber,
        receiptUrl: `/api/transactions/receipt/${transaction._id}`,
        issuedAt,
        payerName: payerName || 'Chit Circle Member',
        payerEmail: payerEmail || '',
        details: {
            transactionNumber: transaction.transactionNumber,
            amount: transaction.amount,
            currency: transaction.currency,
            paymentMethod: transaction.paymentMethod,
            paymentGateway: transaction.paymentGateway,
            installmentId: transaction.installmentId,
            groupId: transaction.groupId,
            cycleId: transaction.cycleId
        }
    };
};
