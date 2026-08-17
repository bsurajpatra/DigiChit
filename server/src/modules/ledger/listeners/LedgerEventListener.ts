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
 * Processes double-entry reversal journal posting for a refunded payment transaction (P4).
 * DEBIT: MEMBER_RECEIVABLE (Category: RECEIVABLE, Scope: MEMBER)
 * CREDIT: GROUP_BANK_ESCROW (Category: BANK, Scope: GROUP)
 */
export async function processPaymentRefundJournalPosting(txn: ITransaction): Promise<void> {
    if (!txn || !txn._id) {
        return;
    }

    // Rule: Only process refunded or partially refunded transactions
    if (txn.status !== TransactionStatus.REFUNDED && txn.status !== TransactionStatus.PARTIALLY_REFUNDED) {
        return;
    }

    const transactionIdStr = txn._id.toString();
    const groupIdStr = txn.groupId.toString();
    const memberIdStr = txn.memberId.toString();
    const cycleIdStr = txn.cycleId ? txn.cycleId.toString() : null;

    // STEP 1: Verify original P3 payment JournalEntry exists (prevent orphan reversals)
    const originalPaymentJournal = await journalRepo.findByTransactionId(
        transactionIdStr,
        DoubleEntryJournalType.INSTALLMENT_PAYMENT
    );

    if (!originalPaymentJournal) {
        logger.error(
            `[LedgerEventListener P4 Error] Cannot create reversal: Original P3 payment journal entry not found for Transaction ID: ${transactionIdStr}`
        );
        return;
    }

    // STEP 2: Duplicate Protection (Idempotency Check for Reversals)
    const existingReversal = await journalRepo.findByTransactionId(
        transactionIdStr,
        DoubleEntryJournalType.PAYMENT_REFUND
    );

    if (existingReversal) {
        logger.info(
            `[LedgerEventListener P4] Duplicate refund reversal event detected. Reversal journal entry already exists for Transaction ID: ${transactionIdStr}. Safely ignoring idempotent retry.`
        );
        return;
    }

    // STEP 3: Dynamic Account Provisioning (Member Receivable & Group Bank Escrow)
    const memberReceivableAcc = await provisioningService.getMemberAccount(
        groupIdStr,
        memberIdStr,
        AccountCategory.RECEIVABLE
    );
    const bankEscrowAcc = await provisioningService.getGroupAccount(
        groupIdStr,
        AccountCategory.BANK
    );

    // STEP 4: Authoritative Refund Amount Conversion to Integer Paise
    const refundInfo = txn.metadata?.refund || {};
    const refundAmount = refundInfo.amount || txn.amount;
    const amountPaise = Math.round(refundAmount * 100);

    if (amountPaise <= 0 || !Number.isInteger(amountPaise)) {
        logger.error(
            `[LedgerEventListener P4 Error] Invalid refund amount: ${refundAmount} (paise: ${amountPaise}) for transaction ${transactionIdStr}`
        );
        return;
    }

    // STEP 5: Post Double-Entry Reversal Journal Entry
    const reversalJournal = await journalPostingService.postJournalEntry({
        entryType: DoubleEntryJournalType.PAYMENT_REFUND,
        referenceType: 'REFUND',
        referenceId: refundInfo.refundId || transactionIdStr,
        transactionId: transactionIdStr,
        groupId: groupIdStr,
        cycleId: cycleIdStr,
        memberId: memberIdStr,
        createdBy: txn.updatedBy ? txn.updatedBy.toString() : (txn.memberId ? txn.memberId.toString() : 'SYSTEM'),
        lines: [
            {
                accountId: (memberReceivableAcc._id as any).toString(),
                direction: JournalDirection.DEBIT,
                amountPaise,
                memo: `Member receivable reinstatement upon installment refund (Txn: ${txn.transactionNumber || transactionIdStr})`
            },
            {
                accountId: (bankEscrowAcc._id as any).toString(),
                direction: JournalDirection.CREDIT,
                amountPaise,
                memo: `Bank escrow disbursement upon installment refund (Txn: ${txn.transactionNumber || transactionIdStr})`
            }
        ]
    });

    logger.info(
        `[LedgerEventListener P4] Double-Entry Reversal Journal Posted | Entry Number: ${reversalJournal.entryNumber} | Txn ID: ${transactionIdStr} | Original Payment: ${originalPaymentJournal.entryNumber} | Amount: ₹${refundAmount} (${amountPaise} paise) | Debit: GRP-${groupIdStr}-MEM-${memberIdStr}-RECEIVABLE | Credit: GRP-${groupIdStr}-BANK`
    );
}

/**
 * Initializes listeners for Ledger Domain Events.
 * Listens to TRANSACTION_SUCCESS and TRANSACTION_REFUNDED domain events to create immutable Ledger Entries.
 */

import { AuctionRepository } from '@modules/auction/repositories/AuctionRepository.js';
import { IJournalEntry } from '../models/JournalEntry.js';
import { AppError } from '@shared/errors/AppError.js';

const auctionRepo = new AuctionRepository();

export interface IWinnerPotAllocationInput {
    auctionId: string;
    groupId?: string;
    cycleId?: string;
    winningMembershipId?: string;
    winningBidId?: string | null;
    winnerUserId?: string;
    winningBidPercentage?: number;
    winningBidAmount?: number;
    declaredBy?: string;
}

/**
 * Processes double-entry pot allocation accrual journal posting for an auction winner declaration (P5).
 * DEBIT: CHIT_CYCLE_CLEARING (Total Pot Value)
 * CREDIT: MEMBER_PRIZE_PAYABLE (Net Prize Amount)
 * CREDIT: COMM_INCOME (Organizer Commission Income)
 * CREDIT: DIV_PAYABLE (Dividend Pool Payable)
 */
export async function processWinnerPotAllocationJournalPosting(input: IWinnerPotAllocationInput): Promise<IJournalEntry> {
    if (!input || !input.auctionId) {
        throw new AppError('Auction ID is required for pot allocation journal posting', 400, 'INVALID_INPUT');
    }

    const auctionIdStr = input.auctionId.toString();

    // 1. Fetch & Validate Auction
    const auction = await auctionRepo.findById(auctionIdStr);
    if (!auction) {
        throw new AppError(`Auction ${auctionIdStr} not found`, 404, 'AUCTION_NOT_FOUND');
    }

    const groupIdStr = (auction.groupId || input.groupId)?.toString();
    const cycleIdStr = (auction.cycleId || input.cycleId)?.toString();

    if (!groupIdStr || !cycleIdStr) {
        throw new AppError('Auction must have associated groupId and cycleId', 400, 'INVALID_AUCTION_HEADER');
    }

    // 2. Fetch Group & Cycle
    const group = await auctionRepo.findGroupById(groupIdStr);
    if (!group) {
        throw new AppError(`Chit Group ${groupIdStr} not found`, 404, 'GROUP_NOT_FOUND');
    }

    const cycle = await auctionRepo.findCycleById(cycleIdStr);
    if (!cycle) {
        throw new AppError(`Chit Cycle ${cycleIdStr} not found`, 404, 'CYCLE_NOT_FOUND');
    }

    // 3. Fetch & Validate Winning Membership
    const winningMembershipIdStr = (input.winningMembershipId || auction.winningMembershipId)?.toString();
    if (!winningMembershipIdStr) {
        throw new AppError('Winning membership ID is required', 400, 'WINNER_MEMBERSHIP_REQUIRED');
    }

    const membership = await auctionRepo.findMembershipById(winningMembershipIdStr);
    if (!membership) {
        throw new AppError(`Winning membership ${winningMembershipIdStr} not found`, 404, 'MEMBERSHIP_NOT_FOUND');
    }

    if (membership.chitGroupId.toString() !== groupIdStr) {
        throw new AppError('Winning membership does not belong to this Chit Group', 400, 'MEMBERSHIP_GROUP_MISMATCH');
    }

    const winnerMemberIdStr = membership.userId.toString();

    // 4. Idempotency Check: Verify if JournalEntry already exists for this auction
    const existingJournal = await journalRepo.findByReference(
        auctionIdStr,
        DoubleEntryJournalType.WINNER_POT_ALLOCATION
    );
    if (existingJournal) {
        logger.info(`[LedgerEventListener P5] Duplicate winner pot allocation event detected. Journal entry already exists: ${existingJournal.entryNumber}. Safely ignoring idempotent retry.`);
        return existingJournal;
    }

    // 5. Authoritative Financial Calculations (Integer Paise)
    const monthlyContribution = group.monthlyContribution;
    const totalMembers = group.totalMembers;

    if (!monthlyContribution || monthlyContribution <= 0 || !totalMembers || totalMembers <= 0) {
        throw new AppError('Invalid group financial parameters (monthlyContribution or totalMembers)', 400, 'INVALID_FINANCIAL_CONFIG');
    }

    // Total Pot Value (V)
    const totalPot = monthlyContribution * totalMembers;
    const totalPotPaise = Math.round(totalPot * 100);

    // Winning Bid Percentage (B)
    let bidPct = input.winningBidPercentage ?? cycle.winningBidPercentage;
    const winningBidId = input.winningBidId || (auction.winningBidId ? auction.winningBidId.toString() : null);

    if (bidPct === undefined || bidPct === null) {
        if (winningBidId) {
            const bid = await auctionRepo.findBidById(winningBidId);
            if (bid) {
                bidPct = bid.bidPercentage;
            }
        }
    }
    if (bidPct === undefined || bidPct === null) {
        bidPct = auction.minimumBidPercentage || 0;
    }

    if (bidPct < 0 || bidPct > 100) {
        throw new AppError(`Invalid winning bid percentage: ${bidPct}%`, 400, 'INVALID_BID_PERCENTAGE');
    }

    // Discount Amount (D = V * B / 100)
    const discountPaise = Math.round((totalPotPaise * bidPct) / 100);

    // Organizer Commission Percentage (C%)
    const commissionPercent = group.financialConfig?.commission?.value ?? group.commissionPercent ?? 0;
    if (commissionPercent < 0 || commissionPercent > 100) {
        throw new AppError(`Invalid commission percent: ${commissionPercent}%`, 400, 'INVALID_COMMISSION_PERCENT');
    }

    // Commission Amount (C = V * C% / 100)
    const commissionPaise = Math.round((totalPotPaise * commissionPercent) / 100);

    if (commissionPaise > discountPaise) {
        throw new AppError(`Commission (${commissionPaise} paise) cannot exceed discount (${discountPaise} paise)`, 400, 'COMMISSION_EXCEEDS_DISCOUNT');
    }

    // Net Prize (P = V - D)
    const prizePaise = totalPotPaise - discountPaise;

    // Dividend Pool (Div = D - C)
    const dividendPaise = discountPaise - commissionPaise;

    // Invariant Verification: Total DEBIT (V) === Total CREDIT (P + C + Div)
    const totalCreditPaise = prizePaise + commissionPaise + dividendPaise;
    if (totalPotPaise !== totalCreditPaise) {
        throw new AppError(`Unbalanced pot allocation: Total Pot (${totalPotPaise}) !== Credits (${totalCreditPaise})`, 400, 'UNBALANCED_POT_ALLOCATION');
    }

    // 6. Account Resolution via AccountProvisioningService
    const clearingAcc = await provisioningService.getGroupAccount(groupIdStr, AccountCategory.CLEARING);
    const prizePayableAcc = await provisioningService.getAccountByNumber(`GRP-${groupIdStr}-MEM-${winnerMemberIdStr}-PRIZE_PAYABLE`, groupIdStr, winnerMemberIdStr);
    const commIncomeAcc = await provisioningService.getAccountByNumber(`GRP-${groupIdStr}-COMM_INCOME`, groupIdStr);
    const divPayableAcc = await provisioningService.getAccountByNumber(`GRP-${groupIdStr}-DIV_PAYABLE`, groupIdStr);

    // 7. Assemble Journal Lines
    const lines: any[] = [
        {
            accountId: (clearingAcc._id as any).toString(),
            direction: JournalDirection.DEBIT,
            amountPaise: totalPotPaise,
            memo: `Chit cycle pot clearing allocation for Cycle #${cycle.cycleNumber || auction.auctionNumber}`
        },
        {
            accountId: (prizePayableAcc._id as any).toString(),
            direction: JournalDirection.CREDIT,
            amountPaise: prizePaise,
            memo: `Net prize payable recognized for winning member (Cycle #${cycle.cycleNumber || auction.auctionNumber})`
        }
    ];

    if (commissionPaise > 0) {
        lines.push({
            accountId: (commIncomeAcc._id as any).toString(),
            direction: JournalDirection.CREDIT,
            amountPaise: commissionPaise,
            memo: `Organizer management commission revenue (Cycle #${cycle.cycleNumber || auction.auctionNumber})`
        });
    }

    if (dividendPaise > 0) {
        lines.push({
            accountId: (divPayableAcc._id as any).toString(),
            direction: JournalDirection.CREDIT,
            amountPaise: dividendPaise,
            memo: `Member dividend pool payable (Cycle #${cycle.cycleNumber || auction.auctionNumber})`
        });
    }

    // 8. Post Double-Entry Journal Entry
    const journalEntry = await journalPostingService.postJournalEntry({
        entryType: DoubleEntryJournalType.WINNER_POT_ALLOCATION,
        referenceType: 'AUCTION',
        referenceId: auctionIdStr,
        transactionId: null,
        groupId: groupIdStr,
        cycleId: cycleIdStr,
        memberId: winnerMemberIdStr,
        createdBy: input.declaredBy || 'SYSTEM',
        lines
    });

    logger.info(
        `[LedgerEventListener P5] Winner Pot Allocation Double-Entry Journal Posted | Entry Number: ${journalEntry.entryNumber} | Auction ID: ${auctionIdStr} | Total Pot: ₹${totalPot} (${totalPotPaise} paise) | Net Prize: ₹${prizePaise / 100} | Commission: ₹${commissionPaise / 100} | Dividend: ₹${dividendPaise / 100}`
    );

    return journalEntry;
}


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
    // 2. TRANSACTION_REFUNDED -> Create Immutable Reversal Ledger Entry & Double-Entry Reversal
    // -------------------------------------------------------------------------
    eventBus.on(PaymentDomainEventType.TRANSACTION_REFUNDED, async (event: PaymentDomainEvent<ITransaction>) => {
        const txn = event.data;

        if (!txn || !txn._id) {
            return;
        }

        // Rule: Only process refunded or partially refunded transactions
        if (txn.status !== TransactionStatus.REFUNDED && txn.status !== TransactionStatus.PARTIALLY_REFUNDED) {
            return;
        }

        // 2A. Legacy Single-Entry Reversal Ledger Entry (Temporary Dual Bookkeeping - P0.2)
        try {
            const transactionIdStr = txn._id.toString();

            // STEP 1: Verify original LedgerEntry exists
            const originalEntry = await ledgerRepo.findOriginalByTransactionId(transactionIdStr);
            if (originalEntry) {
                // STEP 2: Duplicate Protection (Idempotency Check for Reversals)
                const existingReversal = await ledgerRepo.findReversalByTransactionId(transactionIdStr);
                if (!existingReversal) {
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
                } else {
                    logger.info(`[LedgerEventListener] Duplicate reversal event detected. Reversal ledger entry already exists for Transaction ID: ${transactionIdStr}. Safely ignoring idempotent retry.`);
                }
            } else {
                logger.error(`[LedgerEventListener Error] Cannot create legacy reversal: Original ledger entry not found for Transaction ID ${transactionIdStr}`);
            }
        } catch (error: any) {
            logger.error('[LedgerEventListener Error] Failed to create legacy reversal ledger entry for transaction:', error.message || error);
        }

        // 2B. Double-Entry Reversal Journal Posting (P4)
        try {
            await processPaymentRefundJournalPosting(txn);
        } catch (refundJournalErr: any) {
            logger.error('[LedgerEventListener P4 Error] Failed to process double-entry refund reversal journal posting:', refundJournalErr.message || refundJournalErr);
        }
    });

    
    // -------------------------------------------------------------------------
    // 3. AUCTION_WINNER_DECLARED -> Create Winner Pot Allocation Journal (P5)
    // -------------------------------------------------------------------------
    eventBus.on('AUCTION_WINNER_DECLARED', async (event: any) => {
        try {
            if (event && event.data) {
                await processWinnerPotAllocationJournalPosting(event.data);
            }
        } catch (error: any) {
            logger.error('[LedgerEventListener P5 Error] Failed to process winner pot allocation journal:', error.message || error);
        }
    });

    logger.info('[LedgerEventListener] Event listeners registered for TRANSACTION_SUCCESS, TRANSACTION_REFUNDED, and AUCTION_WINNER_DECLARED.');
};
