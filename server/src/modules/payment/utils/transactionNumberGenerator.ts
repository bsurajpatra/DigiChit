import Transaction from '../models/Transaction.js';

/**
 * Generates human readable unique transaction number (e.g. TXN-2026-000001).
 */
export const generateTransactionNumber = async (): Promise<string> => {
    const year = new Date().getFullYear();
    const prefix = `TXN-${year}-`;

    // Find latest transaction with matching prefix
    const latestTxn = await Transaction.findOne({
        transactionNumber: new RegExp(`^${prefix}`)
    })
        .sort({ createdAt: -1 })
        .select('transactionNumber')
        .lean();

    let nextSeq = 1;
    if (latestTxn && latestTxn.transactionNumber) {
        const parts = latestTxn.transactionNumber.split('-');
        const seqPart = parts[2];
        if (parts.length === 3 && seqPart) {
            const currentSeq = parseInt(seqPart, 10);
            if (!isNaN(currentSeq)) {
                nextSeq = currentSeq + 1;
            }
        }
    }

    const paddedSeq = String(nextSeq).padStart(6, '0');
    return `${prefix}${paddedSeq}`;
};

/**
 * Generates human readable unique receipt number (e.g. RCP-2026-000001).
 */
export const generateReceiptNumber = async (): Promise<string> => {
    const year = new Date().getFullYear();
    const prefix = `RCP-${year}-`;

    const latestTxn = await Transaction.findOne({
        receiptNumber: new RegExp(`^${prefix}`)
    })
        .sort({ createdAt: -1 })
        .select('receiptNumber')
        .lean();

    let nextSeq = 1;
    if (latestTxn && latestTxn.receiptNumber) {
        const parts = latestTxn.receiptNumber.split('-');
        const seqPart = parts[2];
        if (parts.length === 3 && seqPart) {
            const currentSeq = parseInt(seqPart, 10);
            if (!isNaN(currentSeq)) {
                nextSeq = currentSeq + 1;
            }
        }
    }

    const paddedSeq = String(nextSeq).padStart(6, '0');
    return `${prefix}${paddedSeq}`;
};
