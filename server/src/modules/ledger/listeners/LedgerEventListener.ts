import { logger } from '@shared/logger/logger.js';
import { eventBus } from '@shared/event-bus/EventBus.js';
import { PaymentDomainEvent, PaymentDomainEventType, type ITransaction, TransactionStatus } from '@modules/payment/index.js';
import { LedgerService } from '../services/LedgerService.js';
import { LedgerRepository } from '../repositories/LedgerRepository.js';
import { JournalPostingService } from '../services/JournalPostingService.js';
import { AccountProvisioningService } from '../services/AccountProvisioningService.js';
import { JournalEntryRepository } from '../repositories/JournalEntryRepository.js';
import { AccountCategory, JournalDirection, DoubleEntryJournalType } from '../enums/account.enum.js';
import { logAction } from '@shared/logger/auditLogger.js';
import {
    LedgerEntryType,
    LedgerDirection,
    LedgerReferenceType,
    LedgerAccountType
} from '../enums/ledger.enum.js';

const ledgerService = new LedgerService();
const ledgerRepo = new LedgerRepository();
const journalPostingService = new JournalPostingService();
const provisioningService = new AccountProvisioningService();
const journalRepo = new JournalEntryRepository();

/**
 * Processes double-entry journal posting for a successful payment transaction (P3).
 * DEBIT: GROUP_BANK_ESCROW (Category: BANK, Scope: GROUP)
 * CREDIT: MEMBER_RECEIVABLE (Category: RECEIVABLE, Scope: MEMBER)
 */
export async function processPaymentJournalPosting(txn: ITransaction): Promise<void> {
    if (!txn || !txn._id) {
        return;
    }

    // Rule: Only process successful transactions (Ignore PENDING, FAILED, CANCELLED, REFUNDED)
    if (txn.status !== TransactionStatus.SUCCESS) {
        return;
    }

    const transactionIdStr = txn._id.toString();
    const groupIdStr = txn.groupId.toString();
    const memberIdStr = txn.memberId.toString();
    const cycleIdStr = txn.cycleId ? txn.cycleId.toString() : null;

    // 1. Idempotency Check: verify journal does not already exist
    const existingJournal = await journalRepo.findByTransactionId(transactionIdStr, DoubleEntryJournalType.INSTALLMENT_PAYMENT);
    if (existingJournal) {
        logger.info(`[LedgerEventListener P3] Duplicate event detected. Journal entry already exists for Transaction ID: ${transactionIdStr}. Safely ignoring idempotent retry.`);
        return;
    }

    // 2. Account Provisioning (Group Bank Escrow & Member Receivable)
    const bankEscrowAcc = await provisioningService.getGroupAccount(groupIdStr, AccountCategory.BANK);
    const memberReceivableAcc = await provisioningService.getMemberAccount(groupIdStr, memberIdStr, AccountCategory.RECEIVABLE);

    // 3. Amount Conversion (authoritative transaction amount in integer paise)
    const amountPaise = Math.round(txn.amount * 100);
    if (amountPaise <= 0 || !Number.isInteger(amountPaise)) {
        logger.error(`[LedgerEventListener P3 Error] Invalid transaction amount: ${txn.amount} (paise: ${amountPaise}) for transaction ${transactionIdStr}`);
        return;
    }

    // 4. Post Double-Entry Journal Entry
    const journalEntry = await journalPostingService.postJournalEntry({
        entryType: DoubleEntryJournalType.INSTALLMENT_PAYMENT,
        referenceType: 'TRANSACTION',
        referenceId: transactionIdStr,
        transactionId: transactionIdStr,
        groupId: groupIdStr,
        cycleId: cycleIdStr,
        memberId: memberIdStr,
        createdBy: txn.memberId ? txn.memberId.toString() : 'SYSTEM',
        lines: [
            {
                accountId: (bankEscrowAcc._id as any).toString(),
                direction: JournalDirection.DEBIT,
                amountPaise,
                memo: `Bank escrow receipt for installment payment (Txn: ${txn.transactionNumber || transactionIdStr})`
            },
            {
                accountId: (memberReceivableAcc._id as any).toString(),
                direction: JournalDirection.CREDIT,
                amountPaise,
                memo: `Member receivable settlement for installment payment (Txn: ${txn.transactionNumber || transactionIdStr})`
            }
        ]
    });

    logger.info(
        `[LedgerEventListener P3] Double-Entry Journal Posted | Entry Number: ${journalEntry.entryNumber} | Txn ID: ${transactionIdStr} | Amount: ₹${txn.amount} (${amountPaise} paise) | Debit: GRP-${groupIdStr}-BANK | Credit: GRP-${groupIdStr}-MEM-${memberIdStr}-RECEIVABLE`
    );
}

/**
 * Initializes listeners for Ledger Domain Events.
 * Listens to TRANSACTION_SUCCESS and TRANSACTION_REFUNDED domain events to create immutable Ledger Entries.
 */
export const initLedgerEventListeners = (): void => {
    // -------------------------------------------------------------------------
    // 1. TRANSACTION_SUCCESS -> Create Original Immutable Ledger Entry & Double-Entry Journal
    // -------------------------------------------------------------------------
    eventBus.on(PaymentDomainEventType.TRANSACTION_SUCCESS, async (event: PaymentDomainEvent<ITransaction>) => {
        const txn = event.data;

        if (!txn || !txn._id) {
            return;
        }

        // Rule: Only process successful transactions (Ignore PENDING, FAILED, CANCELLED)
        if (txn.status !== TransactionStatus.SUCCESS) {
            return;
        }

        // 1A. Legacy Single-Entry Ledger Entry (Temporary Dual Bookkeeping)
        try {
            const transactionIdStr = txn._id.toString();

            // Duplicate Protection (Idempotency Check)
            const existingEntry = await ledgerRepo.findOriginalByTransactionId(transactionIdStr);
            if (!existingEntry) {
                const group = await ledgerRepo.findGroupById(txn.groupId);
                if (group) {
                    const organizerIdStr = group.organizerId.toString();

                    const ledgerEntry = await ledgerService.createEntry({
                        entryType: LedgerEntryType.INSTALLMENT_PAYMENT,
                        referenceType: LedgerReferenceType.TRANSACTION,
                        referenceId: transactionIdStr,
                        transactionId: transactionIdStr,
                        memberId: txn.memberId.toString(),
                        organizerId: organizerIdStr,
                        groupId: txn.groupId.toString(),
                        cycleId: txn.cycleId.toString(),
                        installmentId: txn.installmentId.toString(),
                        amount: txn.amount,
                        direction: LedgerDirection.CREDIT,
                        account: {
                            type: LedgerAccountType.MEMBER_RECEIVABLE,
                            name: 'Member Receivable'
                        },
                        description: 'Installment Payment',
                        remarks: `Installment payment created for group ${group.name}`,
                        createdBy: txn.memberId.toString()
                    });

                    await logAction(txn.memberId.toString(), 'USER', 'LEDGER_ENTRY_CREATED', {
                        targetUserId: organizerIdStr,
                        newValue: {
                            ledgerEntryNumber: ledgerEntry.entryNumber,
                            transactionId: transactionIdStr,
                            amount: txn.amount,
                            groupId: txn.groupId.toString()
                        }
                    });

                    logger.info(
                        `[LedgerEventListener] Ledger Entry Created | Transaction ID: ${transactionIdStr} | Ledger Entry Number: ${ledgerEntry.entryNumber} | Timestamp: ${new Date(ledgerEntry.createdAt).toISOString()}`
                    );
                } else {
                    logger.error(`[LedgerEventListener Error] Associated ChitGroup ${txn.groupId} not found for transaction ${transactionIdStr}`);
                }
            } else {
                logger.info(`[LedgerEventListener] Duplicate event detected. Ledger entry already exists for Transaction ID: ${transactionIdStr}. Safely ignoring.`);
            }
        } catch (error: any) {
            // Error Isolation: Prevent Ledger failures from corrupting Transaction status
            logger.error('[LedgerEventListener Error] Failed to create legacy ledger entry for transaction:', error.message || error);
        }

        // 1B. Double-Entry Journal Posting (P3)
        try {
            await processPaymentJournalPosting(txn);
        } catch (journalError: any) {
            // Error Isolation: Prevent Journal failures from corrupting Transaction status
            logger.error('[LedgerEventListener P3 Error] Failed to process double-entry payment journal posting:', journalError.message || journalError);
        }
    });

    // -------------------------------------------------------------------------
    // 2. TRANSACTION_REFUNDED -> Create Immutable Reversal Ledger Entry (P0.2)
    // -------------------------------------------------------------------------
    eventBus.on(PaymentDomainEventType.TRANSACTION_REFUNDED, async (event: PaymentDomainEvent<ITransaction>) => {
        try {
            const txn = event.data;

            if (!txn || !txn._id) {
                return;
            }

            // Rule: Only process refunded or partially refunded transactions
            if (txn.status !== TransactionStatus.REFUNDED && txn.status !== TransactionStatus.PARTIALLY_REFUNDED) {
                return;
            }

            const transactionIdStr = txn._id.toString();

            // STEP 1: Verify original LedgerEntry exists
            const originalEntry = await ledgerRepo.findOriginalByTransactionId(transactionIdStr);
            if (!originalEntry) {
                logger.error(`[LedgerEventListener Error] Cannot create reversal: Original ledger entry not found for Transaction ID ${transactionIdStr}`);
                return;
            }

            // STEP 2: Duplicate Protection (Idempotency Check for Reversals)
            const existingReversal = await ledgerRepo.findReversalByTransactionId(transactionIdStr);
            if (existingReversal) {
                logger.info(`[LedgerEventListener] Duplicate reversal event detected. Reversal ledger entry already exists for Transaction ID: ${transactionIdStr}. Safely ignoring idempotent retry.`);
                return;
            }

            const refundInfo = txn.metadata?.refund || {};
            const refundAmount = refundInfo.amount || originalEntry.amount;
            const refundReason = txn.metadata?.refundReason || 'Payment Reversal / Refund';

            // Determine opposite direction (CREDIT -> DEBIT)
            const oppositeDirection = originalEntry.direction === LedgerDirection.CREDIT ? LedgerDirection.DEBIT : LedgerDirection.CREDIT;

            // Extract string ObjectIds securely
            const extractIdStr = (val: any): string => (val && val._id ? val._id.toString() : val ? val.toString() : '');

            const memberIdStr = extractIdStr(originalEntry.memberId);
            const organizerIdStr = extractIdStr(originalEntry.organizerId);
            const groupIdStr = extractIdStr(originalEntry.groupId);
            const cycleIdStr = extractIdStr(originalEntry.cycleId);
            const installmentIdStr = extractIdStr(originalEntry.installmentId);

            // Create New Immutable Reversal Ledger Entry (Original entry remains untouched)
            const reversalEntry = await ledgerService.createEntry({
                entryType: LedgerEntryType.REVERSAL,
                referenceType: LedgerReferenceType.REFUND,
                referenceId: refundInfo.refundId || transactionIdStr,
                transactionId: transactionIdStr,
                memberId: memberIdStr,
                organizerId: organizerIdStr,
                groupId: groupIdStr,
                cycleId: cycleIdStr,
                installmentId: installmentIdStr,
                amount: refundAmount,
                direction: oppositeDirection,
                account: {
                    type: LedgerAccountType.MEMBER_RECEIVABLE,
                    name: 'Member Receivable'
                },
                description: 'Payment Reversal / Refund',
                remarks: refundReason,
                metadata: {
                    originalLedgerEntryNumber: originalEntry.entryNumber,
                    refundId: refundInfo.refundId || null,
                    reason: refundReason
                },
                createdBy: txn.updatedBy ? txn.updatedBy.toString() : 'SYSTEM'
            });

            // Structured Audit Log
            await logAction(memberIdStr, 'USER', 'LEDGER_REVERSAL_CREATED', {
                targetUserId: organizerIdStr,
                newValue: {
                    originalLedgerEntryNumber: originalEntry.entryNumber,
                    reversalLedgerEntryNumber: reversalEntry.entryNumber,
                    transactionId: transactionIdStr,
                    amount: refundAmount,
                    groupId: groupIdStr,
                    reason: refundReason
                }
            });

            logger.info(
                `[LedgerEventListener] Reversal Ledger Entry Created | Transaction ID: ${transactionIdStr} | Reversal Number: ${reversalEntry.entryNumber} | Original Entry: ${originalEntry.entryNumber} | Timestamp: ${new Date(reversalEntry.createdAt).toISOString()}`
            );
        } catch (error: any) {
            logger.error('[LedgerEventListener Error] Failed to create reversal ledger entry for transaction:', error.message || error);
        }
    });

    logger.info('[LedgerEventListener] Event listeners registered for TRANSACTION_SUCCESS and TRANSACTION_REFUNDED.');
};
