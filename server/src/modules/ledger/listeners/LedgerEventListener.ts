import mongoose from 'mongoose';
import { AppError } from '@shared/errors/AppError.js';
import Membership, { MembershipStatus } from '@modules/membership/models/Membership.js';
import Installment, { PaymentStatus } from '@modules/installment/models/Installment.js';
import JournalEntry from '../models/JournalEntry.js';
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



export interface IPrizePayoutJournalInput {
    auctionId: string;
    groupId?: string;
    cycleId?: string;
    winningMembershipId?: string;
    winnerUserId?: string;
    payoutAmountPaise?: number;
    disbursedBy?: string;
    remarks?: string;
}

/**
 * Processes double-entry prize payout disbursement journal posting for an auction winner (P6).
 * DEBIT: GRP-{groupId}-MEM-{winnerId}-PRIZE_PAYABLE (Extinguishes net prize liability)
 * CREDIT: GRP-{groupId}-BANK (Cash leaves group escrow bank account to winner)
 */
export async function processPrizePayoutJournalPosting(input: IPrizePayoutJournalInput): Promise<IJournalEntry> {
    if (!input || !input.auctionId) {
        throw new AppError('Auction ID is required for prize payout journal posting', 400, 'INVALID_INPUT');
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

    // 3. Resolve Winner Member User ID
    let winnerUserIdStr = input.winnerUserId?.toString();
    if (!winnerUserIdStr) {
        const winningMembershipIdStr = (input.winningMembershipId || cycle.winnerMembershipId || auction.winningMembershipId)?.toString();
        if (winningMembershipIdStr) {
            const membership = await auctionRepo.findMembershipById(winningMembershipIdStr);
            if (membership) {
                winnerUserIdStr = membership.userId.toString();
            }
        }
    }

    if (!winnerUserIdStr) {
        throw new AppError('Winner member user ID is required for prize payout journal posting', 400, 'WINNER_MEMBER_REQUIRED');
    }

    // 4. Idempotency Check: Verify if PRIZE_PAYOUT JournalEntry already exists
    const existingJournal = await JournalEntry.findOne({
        referenceId: auctionIdStr,
        entryType: DoubleEntryJournalType.PRIZE_PAYOUT
    }).populate('lines.accountId');

    if (existingJournal) {
        logger.info(`[LedgerEventListener P6] Duplicate prize payout event detected. Journal entry already exists: ${existingJournal.entryNumber}. Safely ignoring idempotent retry.`);
        return existingJournal;
    }

    // 5. Authoritative Net Prize Calculation (Integer Paise)
    let prizePaise = input.payoutAmountPaise;

    if (!prizePaise) {
        const monthlyContribution = group.monthlyContribution;
        const totalMembers = group.totalMembers;
        if (!monthlyContribution || !totalMembers) {
            throw new AppError('Invalid group financial parameters', 400, 'INVALID_FINANCIAL_CONFIG');
        }

        const totalPot = monthlyContribution * totalMembers;
        const totalPotPaise = Math.round(totalPot * 100);

        let bidPct = cycle.winningBidPercentage;
        if (bidPct === undefined || bidPct === null) {
            if (auction.winningBidId) {
                const bid = await auctionRepo.findBidById(auction.winningBidId.toString());
                if (bid) bidPct = bid.bidPercentage;
            }
        }
        if (bidPct === undefined || bidPct === null) {
            bidPct = auction.minimumBidPercentage || 0;
        }

        if (bidPct < 0 || bidPct > 100) {
            throw new AppError(`Invalid bid percentage: ${bidPct}%`, 400, 'INVALID_BID_PERCENTAGE');
        }

        const discountPaise = Math.round((totalPotPaise * bidPct) / 100);
        prizePaise = totalPotPaise - discountPaise;
    }

    if (!prizePaise || prizePaise <= 0) {
        throw new AppError(`Net prize amount must be a positive integer in paise. Received: ${prizePaise}`, 400, 'INVALID_PRIZE_AMOUNT');
    }

    // 6. Account Resolution via AccountProvisioningService
    const prizePayableAcc = await provisioningService.getAccountByNumber(
        `GRP-${groupIdStr}-MEM-${winnerUserIdStr}-PRIZE_PAYABLE`,
        groupIdStr,
        winnerUserIdStr
    );
    const bankEscrowAcc = await provisioningService.getGroupAccount(
        groupIdStr,
        AccountCategory.BANK
    );

    // 7. Assemble Journal Lines
    const lines = [
        {
            accountId: (prizePayableAcc._id as any).toString(),
            direction: JournalDirection.DEBIT,
            amountPaise: prizePaise,
            memo: `Net prize payable settlement for winning member (Cycle #${cycle.cycleNumber || (auction.auctionNumber || 1)})`
        },
        {
            accountId: (bankEscrowAcc._id as any).toString(),
            direction: JournalDirection.CREDIT,
            amountPaise: prizePaise,
            memo: `Escrow bank cash disbursement for winner prize (Cycle #${cycle.cycleNumber || (auction.auctionNumber || 1)})`
        }
    ];

    // 8. Post Double-Entry Journal Entry
    try {
        const journalEntry = await journalPostingService.postJournalEntry({
            entryType: DoubleEntryJournalType.PRIZE_PAYOUT,
            referenceType: 'AUCTION',
            referenceId: auctionIdStr,
            transactionId: null,
            groupId: groupIdStr,
            cycleId: cycleIdStr,
            memberId: winnerUserIdStr,
            createdBy: input.disbursedBy || 'SYSTEM',
            lines
        });

        logger.info(
            `[LedgerEventListener P6] Prize Payout Double-Entry Journal Posted | Entry Number: ${journalEntry.entryNumber} | Auction ID: ${auctionIdStr} | Prize Disbursed: ₹${prizePaise / 100} (${prizePaise} paise) | Winner: ${winnerUserIdStr}`
        );

        return journalEntry;
    } catch (postError: any) {
        if (postError.message && (postError.message.includes('E11000') || postError.message.includes('duplicate key'))) {
            const fallbackJournal = await JournalEntry.findOne({
                referenceId: auctionIdStr,
                entryType: DoubleEntryJournalType.PRIZE_PAYOUT
            }).populate('lines.accountId');
            if (fallbackJournal) return fallbackJournal;
        }
        throw postError;
    }
}


export interface IOrganizerCommissionPayoutInput {
    auctionId?: string;
    cycleId?: string;
    groupId?: string;
    organizerId?: string;
    payoutAmountPaise?: number;
    disbursedBy?: string;
    remarks?: string;
}

/**
 * Processes double-entry organizer commission payout journal posting (P7).
 * DEBIT: GRP-{groupId}-COMM_PAYABLE (Settles organizer commission liability)
 * CREDIT: GRP-{groupId}-BANK (Cash leaves group escrow bank account to organizer)
 */
export async function processOrganizerCommissionPayoutJournalPosting(input: IOrganizerCommissionPayoutInput): Promise<IJournalEntry> {
    if (!input || (!input.auctionId && !input.cycleId)) {
        throw new AppError('Auction ID or Cycle ID is required for commission payout journal posting', 400, 'INVALID_INPUT');
    }

    let auction: any = null;
    let auctionIdStr: string | null = null;
    let cycleIdStr = input.cycleId?.toString();
    let groupIdStr = input.groupId?.toString();
    let organizerIdStr = input.organizerId?.toString();

    if (input.auctionId) {
        auctionIdStr = input.auctionId.toString();
        auction = await auctionRepo.findById(auctionIdStr);
        if (!auction) {
            throw new AppError(`Auction ${auctionIdStr} not found`, 404, 'AUCTION_NOT_FOUND');
        }
        groupIdStr = groupIdStr || auction.groupId?.toString();
        cycleIdStr = cycleIdStr || auction.cycleId?.toString();
    }

    if (!auction && cycleIdStr) {
        auction = await auctionRepo.findById(cycleIdStr);
        if (auction) {
            auctionIdStr = auction._id.toString();
            groupIdStr = groupIdStr || auction.groupId?.toString();
        }
    }

    if (!groupIdStr || !cycleIdStr) {
        throw new AppError('Commission payout requires valid groupId and cycleId', 400, 'INVALID_PAYOUT_HEADER');
    }

    // 1. Fetch Group & Cycle
    const group = await auctionRepo.findGroupById(groupIdStr);
    if (!group) {
        throw new AppError(`Chit Group ${groupIdStr} not found`, 404, 'GROUP_NOT_FOUND');
    }

    const cycle = await auctionRepo.findCycleById(cycleIdStr);
    if (!cycle) {
        throw new AppError(`Chit Cycle ${cycleIdStr} not found`, 404, 'CYCLE_NOT_FOUND');
    }

    // 2. Validate Organizer Identity
    organizerIdStr = organizerIdStr || group.organizerId?.toString();
    if (!organizerIdStr) {
        throw new AppError('Organizer ID is required for commission payout journal posting', 400, 'ORGANIZER_REQUIRED');
    }

    if (group.organizerId && group.organizerId.toString() !== organizerIdStr) {
        throw new AppError('Provided organizer ID does not match group organizer', 400, 'ORGANIZER_GROUP_MISMATCH');
    }

    const referenceIdStr = auctionIdStr || cycleIdStr;

    // 3. Safety Check: Verify P5 Pot Allocation journal exists before allowing P7 payout
    const p5Journal = await JournalEntry.findOne({
        referenceId: referenceIdStr,
        entryType: DoubleEntryJournalType.WINNER_POT_ALLOCATION
    });
    if (!p5Journal) {
        throw new AppError('Cannot payout commission before winner pot allocation (P5) has been recognized', 400, 'PREMATURE_PAYOUT');
    }

    // 4. Idempotency Check: Verify if COMMISSION_PAYOUT JournalEntry already exists
    const existingJournal = await JournalEntry.findOne({
        referenceId: referenceIdStr,
        entryType: DoubleEntryJournalType.COMMISSION_PAYOUT
    }).populate('lines.accountId');

    if (existingJournal) {
        logger.info(`[LedgerEventListener P7] Duplicate commission payout event detected. Journal entry already exists: ${existingJournal.entryNumber}. Safely ignoring idempotent retry.`);
        return existingJournal;
    }

    // 5. Authoritative Commission Calculation (Integer Paise)
    let commissionPaise = input.payoutAmountPaise;

    if (commissionPaise === undefined || commissionPaise === null) {
        const monthlyContribution = group.monthlyContribution;
        const totalMembers = group.totalMembers;
        if (!monthlyContribution || !totalMembers) {
            throw new AppError('Invalid group financial parameters', 400, 'INVALID_FINANCIAL_CONFIG');
        }

        const totalPot = monthlyContribution * totalMembers;
        const totalPotPaise = Math.round(totalPot * 100);

        let commissionPercent = group.commissionPercent;
        if (commissionPercent === undefined && group.financialConfig?.commission?.value !== undefined) {
            commissionPercent = group.financialConfig.commission.value;
        }
        if (commissionPercent === undefined || commissionPercent === null) {
            commissionPercent = 5;
        }

        if (commissionPercent <= 0 || commissionPercent > 100) {
            throw new AppError(`Invalid commission percent: ${commissionPercent}%`, 400, 'INVALID_COMMISSION_PERCENT');
        }

        commissionPaise = Math.round((totalPotPaise * commissionPercent) / 100);
    }

    if (!commissionPaise || commissionPaise <= 0) {
        throw new AppError(`Commission amount must be a positive integer in paise. Received: ${commissionPaise}`, 400, 'INVALID_COMMISSION_AMOUNT');
    }

    // Verify payout does not exceed P5 recognized commission
    const p5CommissionLine = p5Journal.lines.find(
        (l: any) => l.direction === JournalDirection.CREDIT && (l.accountNumber.includes('COMM_INCOME') || l.accountNumber.includes('COMM_PAYABLE'))
    );
    const maxPayablePaise = p5CommissionLine?.amountPaise || commissionPaise;
    if (commissionPaise > maxPayablePaise) {
        throw new AppError(`Commission payout (${commissionPaise} paise) exceeds recognized commission (${maxPayablePaise} paise)`, 400, 'COMMISSION_EXCEEDS_ALLOCATION');
    }

    // 6. Account Resolution via AccountProvisioningService
    const commPayableAcc = await provisioningService.getAccountByNumber(
        `GRP-${groupIdStr}-COMM_PAYABLE`,
        groupIdStr
    );
    const bankEscrowAcc = await provisioningService.getGroupAccount(
        groupIdStr,
        AccountCategory.BANK
    );

    // 7. Assemble Journal Lines
    const lines = [
        {
            accountId: (commPayableAcc._id as any).toString(),
            direction: JournalDirection.DEBIT,
            amountPaise: commissionPaise,
            memo: `Organizer management commission settlement (Cycle #${cycle.cycleNumber || (auction?.auctionNumber || 1)})`
        },
        {
            accountId: (bankEscrowAcc._id as any).toString(),
            direction: JournalDirection.CREDIT,
            amountPaise: commissionPaise,
            memo: `Escrow bank cash disbursement for organizer commission (Cycle #${cycle.cycleNumber || (auction?.auctionNumber || 1)})`
        }
    ];

    // 8. Post Double-Entry Journal Entry
    try {
        const journalEntry = await journalPostingService.postJournalEntry({
            entryType: DoubleEntryJournalType.COMMISSION_PAYOUT,
            referenceType: auctionIdStr ? 'AUCTION' : 'CYCLE',
            referenceId: referenceIdStr,
            transactionId: null,
            groupId: groupIdStr,
            cycleId: cycleIdStr,
            memberId: organizerIdStr,
            createdBy: input.disbursedBy || 'SYSTEM',
            lines
        });

        logger.info(
            `[LedgerEventListener P7] Organizer Commission Payout Double-Entry Journal Posted | Entry Number: ${journalEntry.entryNumber} | Ref ID: ${referenceIdStr} | Commission Disbursed: ₹${commissionPaise / 100} (${commissionPaise} paise) | Organizer: ${organizerIdStr}`
        );

        return journalEntry;
    } catch (postError: any) {
        if (postError.message && (postError.message.includes('E11000') || postError.message.includes('duplicate key'))) {
            const fallbackJournal = await JournalEntry.findOne({
                referenceId: referenceIdStr,
                entryType: DoubleEntryJournalType.COMMISSION_PAYOUT
            }).populate('lines.accountId');
            if (fallbackJournal) return fallbackJournal;
        }
        throw postError;
    }
}


export interface IDividendAllocationJournalInput {
    auctionId?: string;
    cycleId?: string;
    groupId?: string;
    memberId: string;
    membershipId?: string;
    installmentId?: string;
    payoutMode?: 'OFFSET' | 'DIRECT_PAYOUT';
    amountPaise?: number;
    disbursedBy?: string;
    remarks?: string;
}

/**
 * Processes double-entry dividend allocation and member distribution / installment offset (P8).
 * Mode OFFSET:
 *   DEBIT:  GRP-{groupId}-DIV_PAYABLE (Extinguishes dividend pool liability)
 *   CREDIT: GRP-{groupId}-MEM-{memberId}-RECEIVABLE (Offsets member installment receivable)
 * Mode DIRECT_PAYOUT:
 *   DEBIT:  GRP-{groupId}-DIV_PAYABLE (Extinguishes dividend pool liability)
 *   CREDIT: GRP-{groupId}-BANK (Cash leaves escrow bank account to member)
 */
export async function processDividendAllocationJournalPosting(input: IDividendAllocationJournalInput): Promise<IJournalEntry> {
    if (!input || !input.memberId) {
        throw new AppError('Member User ID is required for dividend allocation journal posting', 400, 'INVALID_INPUT');
    }
    if (!input.auctionId && !input.cycleId) {
        throw new AppError('Auction ID or Cycle ID is required for dividend allocation journal posting', 400, 'INVALID_INPUT');
    }

    const memberIdStr = input.memberId.toString();
    let auction: any = null;
    let auctionIdStr: string | null = null;
    let cycleIdStr = input.cycleId?.toString();
    let groupIdStr = input.groupId?.toString();

    if (input.auctionId) {
        auctionIdStr = input.auctionId.toString();
        auction = await auctionRepo.findById(auctionIdStr);
        if (!auction) {
            throw new AppError(`Auction ${auctionIdStr} not found`, 404, 'AUCTION_NOT_FOUND');
        }
        groupIdStr = groupIdStr || auction.groupId?.toString();
        cycleIdStr = cycleIdStr || auction.cycleId?.toString();
    }

    if (!auction && cycleIdStr) {
        auction = await auctionRepo.findById(cycleIdStr);
        if (auction) {
            auctionIdStr = auction._id.toString();
            groupIdStr = groupIdStr || auction.groupId?.toString();
        }
    }

    if (!groupIdStr || !cycleIdStr) {
        throw new AppError('Dividend allocation requires valid groupId and cycleId', 400, 'INVALID_DIVIDEND_HEADER');
    }

    // 1. Fetch Group & Cycle
    const group = await auctionRepo.findGroupById(groupIdStr);
    if (!group) {
        throw new AppError(`Chit Group ${groupIdStr} not found`, 404, 'GROUP_NOT_FOUND');
    }

    const cycle = await auctionRepo.findCycleById(cycleIdStr);
    if (!cycle) {
        throw new AppError(`Chit Cycle ${cycleIdStr} not found`, 404, 'CYCLE_NOT_FOUND');
    }

    // 2. Validate Member & Membership
    let membership: any = null;
    if (input.membershipId) {
        membership = await auctionRepo.findMembershipById(input.membershipId.toString());
    } else {
        membership = await Membership.findOne({
            userId: new mongoose.Types.ObjectId(memberIdStr),
            chitGroupId: new mongoose.Types.ObjectId(groupIdStr),
            status: MembershipStatus.ACTIVE_MEMBER
        });
    }

    if (!membership) {
        throw new AppError(`Active membership not found for member ${memberIdStr} in group ${groupIdStr}`, 404, 'MEMBERSHIP_NOT_FOUND');
    }

    if (membership.chitGroupId.toString() !== groupIdStr) {
        throw new AppError('Member does not belong to this Chit Group', 400, 'MEMBER_GROUP_MISMATCH');
    }

    const potReferenceId = auctionIdStr || cycleIdStr;

    // 3. Pre-condition Safety Check: Verify P5 Pot Allocation journal exists
    const p5Journal = await JournalEntry.findOne({
        referenceId: potReferenceId,
        entryType: DoubleEntryJournalType.WINNER_POT_ALLOCATION
    });
    if (!p5Journal) {
        throw new AppError('Cannot allocate dividend before winner pot allocation (P5) has been recognized', 400, 'PREMATURE_DIVIDEND_ALLOCATION');
    }

    // Determine recognized total dividend pool from P5
    const p5DivLine = p5Journal.lines.find(
        (l: any) => l.direction === JournalDirection.CREDIT && l.accountNumber.includes('DIV_PAYABLE')
    );
    const totalDivPoolPaise = p5DivLine?.amountPaise || 0;
    if (totalDivPoolPaise <= 0) {
        throw new AppError('No dividend pool was recognized in pot allocation for this cycle', 400, 'ZERO_DIVIDEND_POOL');
    }

    // Calculate per-member entitlement
    const totalMembers = group.totalMembers || 1;
    const memberEntitlementPaise = Math.floor(totalDivPoolPaise / totalMembers);

    // 4. Determine Dividend Amount
    let dividendPaise = input.amountPaise;
    if (dividendPaise === undefined || dividendPaise === null) {
        dividendPaise = memberEntitlementPaise;
    }

    if (typeof dividendPaise !== 'number' || !Number.isInteger(dividendPaise) || dividendPaise <= 0) {
        throw new AppError(`Dividend amount must be a positive integer in paise. Received: ${dividendPaise}`, 400, 'INVALID_DIVIDEND_AMOUNT');
    }

    if (dividendPaise > memberEntitlementPaise) {
        throw new AppError(`Dividend amount (${dividendPaise} paise) exceeds member entitlement (${memberEntitlementPaise} paise)`, 400, 'DIVIDEND_EXCEEDS_ENTITLEMENT');
    }

    // Check existing dividend distributions for this cycle to prevent exceeding total pool
    const existingCycleDividends = await JournalEntry.find({
        cycleId: new mongoose.Types.ObjectId(cycleIdStr),
        entryType: DoubleEntryJournalType.DIVIDEND_DISTRIBUTION
    });
    const totalDistributedSoFarPaise = existingCycleDividends.reduce((sum, j) => sum + j.totalAmountPaise, 0);
    if (totalDistributedSoFarPaise + dividendPaise > totalDivPoolPaise) {
        throw new AppError(`Total distributed dividends (${totalDistributedSoFarPaise + dividendPaise} paise) would exceed recognized dividend pool (${totalDivPoolPaise} paise)`, 400, 'DIVIDEND_EXCEEDS_POOL');
    }

    // Unique reference identity per distribution
    const mode = input.payoutMode || 'OFFSET';
    const referenceIdStr = input.installmentId
        ? `${input.installmentId.toString()}-DIVIDEND`
        : `${potReferenceId}-MEM-${memberIdStr}-DIVIDEND`;

    // 5. Idempotency Check
    const existingJournal = await JournalEntry.findOne({
        referenceId: referenceIdStr,
        entryType: DoubleEntryJournalType.DIVIDEND_DISTRIBUTION
    }).populate('lines.accountId');

    if (existingJournal) {
        logger.info(`[LedgerEventListener P8] Duplicate dividend distribution event detected. Journal entry already exists: ${existingJournal.entryNumber}. Safely ignoring idempotent retry.`);
        return existingJournal;
    }

    // 6. Installment Offset Validation & Processing (if applicable)
    let installmentDoc: any = null;
    if (input.installmentId) {
        installmentDoc = await Installment.findById(input.installmentId.toString());
        if (!installmentDoc) {
            throw new AppError(`Installment ${input.installmentId} not found`, 404, 'INSTALLMENT_NOT_FOUND');
        }
        if (installmentDoc.userId.toString() !== memberIdStr) {
            throw new AppError('Installment does not belong to the specified member', 400, 'INSTALLMENT_MEMBER_MISMATCH');
        }
        if (installmentDoc.paymentStatus === PaymentStatus.PAID || installmentDoc.paymentStatus === PaymentStatus.WAIVED) {
            throw new AppError('Cannot offset an already fully settled installment', 400, 'INSTALLMENT_ALREADY_SETTLED');
        }

        const remainingObligationPaise = Math.round((installmentDoc.amount - installmentDoc.paidAmount) * 100);
        if (dividendPaise > remainingObligationPaise) {
            throw new AppError(`Dividend offset (${dividendPaise} paise) cannot exceed outstanding installment obligation (${remainingObligationPaise} paise)`, 400, 'OFFSET_EXCEEDS_OBLIGATION');
        }
    }

    // 7. Account Resolution via AccountProvisioningService
    const divPayableAcc = await provisioningService.getAccountByNumber(
        `GRP-${groupIdStr}-DIV_PAYABLE`,
        groupIdStr
    );

    let creditAccountId: string;
    let creditMemo: string;

    if (mode === 'DIRECT_PAYOUT') {
        const bankEscrowAcc = await provisioningService.getGroupAccount(groupIdStr, AccountCategory.BANK);
        creditAccountId = (bankEscrowAcc._id as any).toString();
        creditMemo = `Escrow bank cash disbursement for member dividend (Cycle #${cycle.cycleNumber || (auction?.auctionNumber || 1)})`;
    } else {
        const memberRecAcc = await provisioningService.getAccountByNumber(
            `GRP-${groupIdStr}-MEM-${memberIdStr}-RECEIVABLE`,
            groupIdStr,
            memberIdStr
        );
        creditAccountId = (memberRecAcc._id as any).toString();
        creditMemo = `Dividend offset applied against member installment obligation (Cycle #${cycle.cycleNumber || (auction?.auctionNumber || 1)})`;
    }

    // 8. Assemble Journal Lines
    const lines = [
        {
            accountId: (divPayableAcc._id as any).toString(),
            direction: JournalDirection.DEBIT,
            amountPaise: dividendPaise,
            memo: `Member dividend pool settlement for member ${memberIdStr} (Cycle #${cycle.cycleNumber || (auction?.auctionNumber || 1)})`
        },
        {
            accountId: creditAccountId,
            direction: JournalDirection.CREDIT,
            amountPaise: dividendPaise,
            memo: creditMemo
        }
    ];

    // 9. Post Double-Entry Journal Entry
    try {
        const journalEntry = await journalPostingService.postJournalEntry({
            entryType: DoubleEntryJournalType.DIVIDEND_DISTRIBUTION,
            referenceType: input.installmentId ? 'INSTALLMENT' : 'AUCTION',
            referenceId: referenceIdStr,
            transactionId: null,
            groupId: groupIdStr,
            cycleId: cycleIdStr,
            memberId: memberIdStr,
            createdBy: input.disbursedBy || 'SYSTEM',
            lines
        });

        // 10. Update Installment State if offset
        if (installmentDoc) {
            const offsetRupees = dividendPaise / 100;
            installmentDoc.paidAmount = Math.min(installmentDoc.amount, installmentDoc.paidAmount + offsetRupees);
            if (installmentDoc.paidAmount >= installmentDoc.amount) {
                installmentDoc.paymentStatus = PaymentStatus.PAID;
                installmentDoc.paidDate = new Date();
            } else {
                installmentDoc.paymentStatus = PaymentStatus.PARTIALLY_PAID;
            }
            await installmentDoc.save();
        }

        logger.info(
            `[LedgerEventListener P8] Dividend Allocation Double-Entry Journal Posted | Entry Number: ${journalEntry.entryNumber} | Ref ID: ${referenceIdStr} | Amount: ₹${dividendPaise / 100} (${dividendPaise} paise) | Member: ${memberIdStr} | Mode: ${mode}`
        );

        return journalEntry;
    } catch (postError: any) {
        if (postError.message && (postError.message.includes('E11000') || postError.message.includes('duplicate key'))) {
            const fallbackJournal = await JournalEntry.findOne({
                referenceId: referenceIdStr,
                entryType: DoubleEntryJournalType.DIVIDEND_DISTRIBUTION
            }).populate('lines.accountId');
            if (fallbackJournal) return fallbackJournal;
        }
        throw postError;
    }
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
                        createdBy: txn.updatedBy ? txn.updatedBy.toString() : (organizerIdStr || memberIdStr)
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

        // -------------------------------------------------------------------------
    // 4. PRIZE_DISBURSED / PRIZE_PAYOUT_INITIATED -> Create Prize Payout Journal (P6)
    // -------------------------------------------------------------------------
    eventBus.on('PRIZE_DISBURSED', async (event: any) => {
        try {
            if (event && event.data) {
                await processPrizePayoutJournalPosting(event.data);
            }
        } catch (error: any) {
            logger.error('[LedgerEventListener P6 Error] Failed to process prize payout journal:', error.message || error);
        }
    });

        // -------------------------------------------------------------------------
    // 5. ORGANIZER_COMMISSION_DISBURSED -> Create Organizer Commission Payout Journal (P7)
    // -------------------------------------------------------------------------
    eventBus.on('ORGANIZER_COMMISSION_DISBURSED', async (event: any) => {
        try {
            if (event && event.data) {
                await processOrganizerCommissionPayoutJournalPosting(event.data);
            }
        } catch (error: any) {
            logger.error('[LedgerEventListener P7 Error] Failed to process organizer commission payout journal:', error.message || error);
        }
    });

        // -------------------------------------------------------------------------
    // 6. DIVIDEND_DISTRIBUTED / DIVIDEND_ALLOCATED -> Create Dividend Distribution Journal (P8)
    // -------------------------------------------------------------------------
    eventBus.on('DIVIDEND_DISTRIBUTED', async (event: any) => {
        try {
            if (event && event.data) {
                await processDividendAllocationJournalPosting(event.data);
            }
        } catch (error: any) {
            logger.error('[LedgerEventListener P8 Error] Failed to process dividend distribution journal:', error.message || error);
        }
    });

    eventBus.on('DIVIDEND_ALLOCATED', async (event: any) => {
        try {
            if (event && event.data) {
                await processDividendAllocationJournalPosting(event.data);
            }
        } catch (error: any) {
            logger.error('[LedgerEventListener P8 Error] Failed to process dividend allocation journal:', error.message || error);
        }
    });

    logger.info('[LedgerEventListener] Event listeners registered for TRANSACTION_SUCCESS, TRANSACTION_REFUNDED, AUCTION_WINNER_DECLARED, PRIZE_DISBURSED, ORGANIZER_COMMISSION_DISBURSED, and DIVIDEND_DISTRIBUTED.');
};
