import { LedgerEntryType, LedgerDirection } from '../enums/ledger.enum.js';

export interface LedgerQueryDTO {
    page?: number;
    limit?: number;
    memberId?: string;
    groupId?: string;
    cycleId?: string;
    installmentId?: string;
    transactionId?: string;
    entryType?: LedgerEntryType;
    direction?: LedgerDirection;
    startDate?: string;
    endDate?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
