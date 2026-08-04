import mongoose, { Document } from 'mongoose';
import {
    LedgerEntryType,
    LedgerDirection,
    LedgerReferenceType,
    LedgerAccountType
} from '../enums/ledger.enum.js';

export interface ILedgerAccount {
    type: LedgerAccountType;
    name: string;
}

export interface ILedgerEntry extends Document {
    entryNumber: string;
    entryType: LedgerEntryType;
    referenceType: LedgerReferenceType;
    referenceId: mongoose.Types.ObjectId;
    transactionId?: mongoose.Types.ObjectId | null;
    memberId: mongoose.Types.ObjectId;
    organizerId: mongoose.Types.ObjectId;
    groupId: mongoose.Types.ObjectId;
    cycleId: mongoose.Types.ObjectId;
    installmentId: mongoose.Types.ObjectId;
    amount: number;
    direction: LedgerDirection;
    account: ILedgerAccount;
    description: string;
    remarks?: string | null;
    metadata?: Record<string, any>;
    createdBy?: mongoose.Types.ObjectId | string | null;
    createdAt: Date;
    updatedAt: Date;
}
