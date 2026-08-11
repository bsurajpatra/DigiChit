import { logger } from '@shared/logger/logger.js';
import { eventBus } from '@shared/event-bus/EventBus.js';
import { PaymentDomainEvent, PaymentDomainEventType, type ITransaction, TransactionStatus } from '@modules/payment/index.js';
import ChitGroup from '@modules/chit-group/models/ChitGroup.js';
import { LedgerService } from '../services/LedgerService.js';
import { LedgerRepository } from '../repositories/LedgerRepository.js';
import { logAction } from '@shared/logger/auditLogger.js';
import {
    LedgerEntryType,
    LedgerDirection,
    LedgerReferenceType,
    LedgerAccountType
} from '../enums/ledger.enum.js';

const ledgerService = new LedgerService();
const ledgerRepo = new LedgerRepository();

/**
 * Initializes listeners for Ledger Domain Events.
 * Listens to TRANSACTION_SUCCESS domain events to create corresponding immutable Ledger Entries.
 */
export const initLedgerEventListeners = (): void => {
    eventBus.on(PaymentDomainEventType.TRANSACTION_SUCCESS, async (event: PaymentDomainEvent<ITransaction>) => {
        try {
            const txn = event.data;

            if (!txn || !txn._id) {
                return;
            }

            // Rule: Only process successful transactions (Ignore PENDING, FAILED, CANCELLED)
            if (txn.status !== TransactionStatus.SUCCESS) {
                return;
            }

            const transactionIdStr = txn._id.toString();

            // Duplicate Protection (Idempotency Check)
            const existingEntry = await ledgerRepo.findByTransactionId(transactionIdStr);
            if (existingEntry) {
                logger.info(`[LedgerEventListener] Duplicate event detected. Ledger entry already exists for Transaction ID: ${transactionIdStr}. Safely ignoring.`);
                return;
            }

            // Fetch associated ChitGroup to obtain organizerId
            const group = await ChitGroup.findById(txn.groupId);
            if (!group) {
                logger.error(`[LedgerEventListener Error] Associated ChitGroup ${txn.groupId} not found for transaction ${transactionIdStr}`);
                return;
            }

            const organizerIdStr = group.organizerId.toString();

            // Create Immutable Ledger Entry
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

            // Structured Audit Output Log
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
        } catch (error: any) {
            // Error Isolation: Prevent Ledger failures from corrupting Transaction status
            logger.error('[LedgerEventListener Error] Failed to create ledger entry for transaction:', error.message || error);
        }
    });

    logger.info('[LedgerEventListener] Event listeners registered for TRANSACTION_SUCCESS.');
};
