import mongoose from 'mongoose';
import { AccountRepository } from '../repositories/AccountRepository.js';
import { JournalEntryRepository } from '../repositories/JournalEntryRepository.js';
import { IJournalEntry, IJournalLine } from '../models/JournalEntry.js';
import { JournalDirection, AccountScope } from '../enums/account.enum.js';
import { AppError } from '@shared/errors/AppError.js';

export interface ICreateJournalLineInput {
    lineId?: string;
    accountId: string;
    direction: JournalDirection;
    amountPaise: number;
    memo?: string;
}

export interface ICreateJournalEntryInput {
    entryType: string;
    referenceType: string;
    referenceId: string;
    transactionId?: string | null;
    groupId: string;
    cycleId?: string | null;
    memberId?: string | null;
    createdBy?: string;
    lines: ICreateJournalLineInput[];
}

export class JournalPostingService {
    private accountRepo: AccountRepository;
    private journalRepo: JournalEntryRepository;

    constructor() {
        this.accountRepo = new AccountRepository();
        this.journalRepo = new JournalEntryRepository();
    }

    /**
     * Generates a unique sequential/timestamp-based journal entry number (JN-YYYY-XXXXXX).
     */
    private generateEntryNumber(): string {
        const year = new Date().getFullYear();
        const randomDigits = Math.floor(100000 + Math.random() * 900000);
        return `JN-${year}-${randomDigits}`;
    }

    /**
     * CORE DOUBLE-ENTRY POSTING ENGINE
     * Validates accounts, amounts, scope rules, and DEBIT == CREDIT invariant.
     * Persists an immutable JournalEntry in MongoDB.
     */
    public async postJournalEntry(input: ICreateJournalEntryInput): Promise<IJournalEntry> {
        const {
            entryType,
            referenceType,
            referenceId,
            transactionId,
            groupId,
            cycleId,
            memberId,
            createdBy,
            lines
        } = input;

        // 1. Basic Header Validation
        if (!entryType || !referenceType || !referenceId || !groupId) {
            throw new AppError('Missing required journal entry header fields (entryType, referenceType, referenceId, groupId)', 400, 'INVALID_JOURNAL_HEADER');
        }

        if (!mongoose.Types.ObjectId.isValid(groupId)) {
            throw new AppError('Invalid Group ID', 400, 'INVALID_GROUP_ID');
        }

        // 2. Lines Array Validation
        if (!Array.isArray(lines) || lines.length < 2) {
            throw new AppError('A journal entry must contain at least 2 journal lines', 400, 'MINIMUM_LINES_REQUIRED');
        }

        let totalDebitPaise = 0;
        let totalCreditPaise = 0;
        const validatedLines: IJournalLine[] = [];

        // 3. Process & Validate Each Line
        let lineIdx = 0;
        for (const line of lines) {
            lineIdx++;

            if (!line) {
                throw new AppError(`Line #${lineIdx} is empty or undefined`, 400, 'INVALID_JOURNAL_LINE');
            }

            // Money Validation: Positive Integer Paise ONLY
            if (typeof line.amountPaise !== 'number' || !Number.isInteger(line.amountPaise) || line.amountPaise <= 0 || !Number.isFinite(line.amountPaise)) {
                throw new AppError(`Line #${lineIdx} amountPaise must be a positive integer greater than zero. Received: ${line.amountPaise}`, 400, 'INVALID_MONEY_AMOUNT');
            }

            // Direction Validation
            if (line.direction !== JournalDirection.DEBIT && line.direction !== JournalDirection.CREDIT) {
                throw new AppError(`Line #${lineIdx} direction must be DEBIT or CREDIT`, 400, 'INVALID_JOURNAL_DIRECTION');
            }

            // Account Existence Check
            if (!line.accountId || !mongoose.Types.ObjectId.isValid(line.accountId)) {
                throw new AppError(`Line #${lineIdx} contains an invalid Account ID`, 400, 'INVALID_ACCOUNT_ID');
            }

            const account = await this.accountRepo.findById(line.accountId);
            if (!account) {
                throw new AppError(`Line #${lineIdx} referenced Account ${line.accountId} which does not exist`, 404, 'ACCOUNT_NOT_FOUND');
            }

            if (!account.isActive) {
                throw new AppError(`Line #${lineIdx} referenced Account ${account.accountNumber} (${account.name}) which is INACTIVE`, 400, 'ACCOUNT_INACTIVE');
            }

            // Scope & Reference Consistency Check
            if (account.scope === AccountScope.GROUP && account.groupId?.toString() !== groupId) {
                throw new AppError(`Line #${lineIdx} account ${account.accountNumber} belongs to group ${account.groupId}, but entry group is ${groupId}`, 400, 'ACCOUNT_SCOPE_MISMATCH');
            }

            if (account.scope === AccountScope.MEMBER) {
                if (account.groupId?.toString() !== groupId) {
                    throw new AppError(`Line #${lineIdx} member account ${account.accountNumber} group mismatch`, 400, 'ACCOUNT_SCOPE_MISMATCH');
                }
                if (memberId && account.memberId?.toString() !== memberId) {
                    throw new AppError(`Line #${lineIdx} member account ${account.accountNumber} member mismatch`, 400, 'ACCOUNT_SCOPE_MISMATCH');
                }
            }

            // Calculate totals
            if (line.direction === JournalDirection.DEBIT) {
                totalDebitPaise += line.amountPaise;
            } else {
                totalCreditPaise += line.amountPaise;
            }

            validatedLines.push({
                lineId: line.lineId || `LN-0${lineIdx}`,
                accountId: account._id as mongoose.Types.ObjectId,
                accountNumber: account.accountNumber,
                accountType: account.type,
                accountCategory: account.category,
                direction: line.direction,
                amountPaise: line.amountPaise,
                memo: line.memo || null
            });
        }

        // 4. Double-Entry Invariant Check (SUM(DEBIT) === SUM(CREDIT) > 0)
        if (totalDebitPaise <= 0 || totalCreditPaise <= 0) {
            throw new AppError('Journal entry must contain both positive DEBIT and CREDIT lines', 400, 'UNBALANCED_JOURNAL_ENTRY');
        }

        if (totalDebitPaise !== totalCreditPaise) {
            throw new AppError(`Unbalanced journal entry: Total DEBITs (${totalDebitPaise} paise) does not equal Total CREDITs (${totalCreditPaise} paise)`, 400, 'UNBALANCED_JOURNAL_ENTRY');
        }

        // 5. Build & Persist Immutable Entry
        const entryNumber = this.generateEntryNumber();

        const journalEntryData: Partial<IJournalEntry> = {
            entryNumber,
            entryType,
            referenceType,
            referenceId,
            transactionId: transactionId ? new mongoose.Types.ObjectId(transactionId) : null,
            groupId: new mongoose.Types.ObjectId(groupId),
            cycleId: cycleId ? new mongoose.Types.ObjectId(cycleId) : null,
            memberId: memberId ? new mongoose.Types.ObjectId(memberId) : null,
            totalAmountPaise: totalDebitPaise,
            lines: validatedLines,
            isBalanced: true,
            postedAt: new Date(),
            createdBy: createdBy || 'SYSTEM'
        };

        return await this.journalRepo.create(journalEntryData);
    }
}
