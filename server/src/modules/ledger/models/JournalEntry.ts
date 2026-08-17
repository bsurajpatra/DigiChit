import mongoose, { Schema, Document } from 'mongoose';
import { AccountType, AccountCategory, JournalDirection } from '../enums/account.enum.js';
import { AppError } from '@shared/errors/AppError.js';

export interface IJournalLine {
    lineId: string;
    accountId: mongoose.Types.ObjectId;
    accountNumber: string;
    accountType: AccountType;
    accountCategory: AccountCategory;
    direction: JournalDirection;
    amountPaise: number;
    memo?: string | null;
}

export interface IJournalEntry extends Document {
    entryNumber: string;
    entryType: string;
    referenceType: string;
    referenceId: string;
    transactionId?: mongoose.Types.ObjectId | null;
    groupId: mongoose.Types.ObjectId;
    cycleId?: mongoose.Types.ObjectId | null;
    memberId?: mongoose.Types.ObjectId | null;
    totalAmountPaise: number;
    lines: IJournalLine[];
    isBalanced: boolean;
    postedAt: Date;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
}

const JournalLineSchema = new Schema<IJournalLine>(
    {
        lineId: {
            type: String,
            required: [true, 'Line ID is required']
        },
        accountId: {
            type: Schema.Types.ObjectId,
            ref: 'Account',
            required: [true, 'Account ID is required']
        },
        accountNumber: {
            type: String,
            required: [true, 'Account number is required']
        },
        accountType: {
            type: String,
            enum: Object.values(AccountType),
            required: true
        },
        accountCategory: {
            type: String,
            enum: Object.values(AccountCategory),
            required: true
        },
        direction: {
            type: String,
            enum: Object.values(JournalDirection),
            required: true
        },
        amountPaise: {
            type: Number,
            required: [true, 'Amount in paise is required'],
            validate: {
                validator: function (v: number) {
                    return Number.isInteger(v) && v > 0;
                },
                message: 'Amount in paise must be a positive integer greater than zero'
            }
        },
        memo: {
            type: String,
            default: null,
            trim: true
        }
    },
    { _id: false }
);

const JournalEntrySchema = new Schema<IJournalEntry>(
    {
        entryNumber: {
            type: String,
            required: [true, 'Entry number is required'],
            unique: true,
            trim: true
        },
        entryType: {
            type: String,
            required: [true, 'Entry type is required'],
            trim: true
        },
        referenceType: {
            type: String,
            required: [true, 'Reference type is required'],
            trim: true
        },
        referenceId: {
            type: String,
            required: [true, 'Reference ID is required'],
            trim: true
        },
        transactionId: {
            type: Schema.Types.ObjectId,
            ref: 'Transaction',
            default: null
        },
        groupId: {
            type: Schema.Types.ObjectId,
            ref: 'ChitGroup',
            required: [true, 'Group ID is required']
        },
        cycleId: {
            type: Schema.Types.ObjectId,
            ref: 'ChitCycle',
            default: null
        },
        memberId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            default: null
        },
        totalAmountPaise: {
            type: Number,
            required: true,
            min: [1, 'Total amount paise must be greater than zero']
        },
        lines: {
            type: [JournalLineSchema],
            required: true,
            validate: {
                validator: function (lines: IJournalLine[]) {
                    return Array.isArray(lines) && lines.length >= 2;
                },
                message: 'A journal entry must contain at least 2 journal lines'
            }
        },
        isBalanced: {
            type: Boolean,
            required: true,
            default: true
        },
        postedAt: {
            type: Date,
            default: Date.now,
            required: true
        },
        createdBy: {
            type: String,
            default: 'SYSTEM'
        }
    },
    {
        timestamps: true
    }
);

// Invariant Pre-save Validation Hook
JournalEntrySchema.pre('save', function (this: IJournalEntry) {
    let totalDebitPaise = 0;
    let totalCreditPaise = 0;

    for (const line of this.lines) {
        if (!Number.isInteger(line.amountPaise) || line.amountPaise <= 0) {
            throw new AppError(`Line amount in paise (${line.amountPaise}) must be a positive integer greater than zero`, 400, 'INVALID_LINE_AMOUNT');
        }
        if (line.direction === JournalDirection.DEBIT) {
            totalDebitPaise += line.amountPaise;
        } else if (line.direction === JournalDirection.CREDIT) {
            totalCreditPaise += line.amountPaise;
        }
    }

    if (totalDebitPaise <= 0 || totalCreditPaise <= 0) {
        throw new AppError('Journal entry must contain both positive DEBIT and CREDIT lines', 400, 'UNBALANCED_JOURNAL_ENTRY');
    }

    if (totalDebitPaise !== totalCreditPaise) {
        throw new AppError(`Unbalanced journal entry: Total DEBITs (${totalDebitPaise}) does not equal Total CREDITs (${totalCreditPaise})`, 400, 'UNBALANCED_JOURNAL_ENTRY');
    }

    this.totalAmountPaise = totalDebitPaise;
    this.isBalanced = true;
});

// Immutability Enforcement
JournalEntrySchema.pre('updateOne', function (this: any) {
    throw new AppError('Journal entries are strictly immutable and cannot be updated.', 400, 'JOURNAL_ENTRY_IMMUTABLE');
});

JournalEntrySchema.pre('findOneAndUpdate', function (this: any) {
    throw new AppError('Journal entries are strictly immutable and cannot be updated.', 400, 'JOURNAL_ENTRY_IMMUTABLE');
});

JournalEntrySchema.pre('deleteOne', function (this: any) {
    throw new AppError('Journal entries are strictly immutable and cannot be deleted.', 400, 'JOURNAL_ENTRY_IMMUTABLE');
});

JournalEntrySchema.pre('findOneAndDelete', function (this: any) {
    throw new AppError('Journal entries are strictly immutable and cannot be deleted.', 400, 'JOURNAL_ENTRY_IMMUTABLE');
});

// Indexes
JournalEntrySchema.index({ groupId: 1, postedAt: -1 });
JournalEntrySchema.index({ referenceId: 1, referenceType: 1 });
JournalEntrySchema.index({ transactionId: 1, entryType: 1 }, { unique: true, sparse: true });
JournalEntrySchema.index({ transactionId: 1 }, { sparse: true });
JournalEntrySchema.index({ 'lines.accountId': 1, postedAt: -1 });

export default mongoose.model<IJournalEntry>('JournalEntry', JournalEntrySchema);
