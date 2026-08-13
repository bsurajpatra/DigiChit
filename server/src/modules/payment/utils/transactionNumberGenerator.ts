import { TransactionRepository } from '../repositories/TransactionRepository.js';

const repo = new TransactionRepository();

/**
 * Generates human readable unique transaction number (e.g. TXN-2026-000001).
 */
export const generateTransactionNumber = async (): Promise<string> => {
    const year = new Date().getFullYear();
    const prefix = `TXN-${year}-`;

    const latestTxnNumber = await repo.findLatestTransactionNumber(prefix);

    let nextSeq = 1;
    if (latestTxnNumber) {
        const parts = latestTxnNumber.split('-');
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

    const latestReceiptNumber = await repo.findLatestReceiptNumber(prefix);

    let nextSeq = 1;
    if (latestReceiptNumber) {
        const parts = latestReceiptNumber.split('-');
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
