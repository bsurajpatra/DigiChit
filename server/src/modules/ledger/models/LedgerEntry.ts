import mongoose, { Schema } from 'mongoose';
import { ILedgerEntry } from '../interfaces/ILedgerEntry.js';
import {
    LedgerEntryType,
    LedgerDirection,
    LedgerReferenceType,
    LedgerAccountType
} from '../enums/ledger.enum.js';

const LedgerAccountSchema = new Schema(
    {
        type: {
            type: String,
            enum: Object.values(LedgerAccountType),
            required: [true, 'Account type is required']
        },
        name: {
            type: String,
            required: [true, 'Account name is required'],
            trim: true
        }
    },
    { _id: false }
);

const LedgerEntrySchema = new Schema<ILedgerEntry>(
    {
        entryNumber: {
            type: String,
            required: [true, 'Entry number is required'],
            unique: true,
            trim: true
        },
        entryType: {
            type: String,
            enum: Object.values(LedgerEntryType),
            required: [true, 'Entry type is required']
        },
        referenceType: {
            type: String,
            enum: Object.values(LedgerReferenceType),
            required: [true, 'Reference type is required']
        },
        referenceId: {
            type: Schema.Types.ObjectId,
            required: [true, 'Reference ID is required']
        },
        transactionId: {
            type: Schema.Types.ObjectId,
            ref: 'Transaction',
            default: null
        },
        memberId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Member ID is required']
        },
        organizerId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Organizer ID is required']
        },
        groupId: {
            type: Schema.Types.ObjectId,
            ref: 'ChitGroup',
            required: [true, 'Group ID is required']
        },
        cycleId: {
            type: Schema.Types.ObjectId,
            ref: 'ChitCycle',
            required: [true, 'Cycle ID is required']
        },
        installmentId: {
            type: Schema.Types.ObjectId,
            ref: 'Installment',
            required: [true, 'Installment ID is required']
        },
        amount: {
            type: Number,
            required: [true, 'Amount is required'],
            min: [0.01, 'Amount must be a positive number']
        },
        direction: {
            type: String,
            enum: Object.values(LedgerDirection),
            required: [true, 'Ledger direction is required']
        },
        account: {
            type: LedgerAccountSchema,
            required: [true, 'Ledger account info is required']
        },
        description: {
            type: String,
            required: [true, 'Description is required'],
            trim: true
        },
        remarks: {
            type: String,
            default: null,
            trim: true
        },
        metadata: {
            type: Schema.Types.Mixed,
            default: {}
        },
        createdBy: {
            type: Schema.Types.Mixed,
            default: 'SYSTEM'
        }
    },
    {
        timestamps: true
    }
);

// Immutability Enforcement: Prevent updates and deletions on ledger records
LedgerEntrySchema.pre('updateOne', function (this: any) {
    throw new Error('Ledger entries are immutable and cannot be updated. Use REVERSAL entries for corrections.');
});

LedgerEntrySchema.pre('findOneAndUpdate', function (this: any) {
    throw new Error('Ledger entries are immutable and cannot be updated. Use REVERSAL entries for corrections.');
});

LedgerEntrySchema.pre('deleteOne', function (this: any) {
    throw new Error('Ledger entries are immutable and cannot be deleted.');
});

LedgerEntrySchema.pre('findOneAndDelete', function (this: any) {
    throw new Error('Ledger entries are immutable and cannot be deleted.');
});

// Indexes
LedgerEntrySchema.index({ entryNumber: 1 }, { unique: true });
LedgerEntrySchema.index({ transactionId: 1 }, { sparse: true });
LedgerEntrySchema.index({ memberId: 1, createdAt: -1 });
LedgerEntrySchema.index({ groupId: 1, createdAt: -1 });
LedgerEntrySchema.index({ cycleId: 1 });
LedgerEntrySchema.index({ installmentId: 1 });
LedgerEntrySchema.index({ entryType: 1 });
LedgerEntrySchema.index({ createdAt: -1 });

export default mongoose.model<ILedgerEntry>('LedgerEntry', LedgerEntrySchema);
