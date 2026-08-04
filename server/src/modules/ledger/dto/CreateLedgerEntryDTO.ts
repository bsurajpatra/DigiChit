import {
    LedgerEntryType,
    LedgerDirection,
    LedgerReferenceType,
    LedgerAccountType
} from '../enums/ledger.enum.js';

export interface CreateLedgerAccountDTO {
    type: LedgerAccountType;
    name: string;
}

export interface CreateLedgerEntryDTO {
    entryType: LedgerEntryType;
    referenceType: LedgerReferenceType;
    referenceId: string;
    transactionId?: string | null;
    memberId: string;
    organizerId: string;
    groupId: string;
    cycleId: string;
    installmentId: string;
    amount: number;
    direction: LedgerDirection;
    account: CreateLedgerAccountDTO;
    description: string;
    remarks?: string | null;
    metadata?: Record<string, any>;
    createdBy?: string | null;
}
