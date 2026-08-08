import { LedgerEntryType, LedgerDirection } from '@modules/ledger/enums/ledger.enum.js';

export interface StatementQueryDTO {
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
    cycleId?: string;
    groupId?: string;
    memberId?: string;
    entryType?: LedgerEntryType;
    direction?: LedgerDirection;
    minAmount?: number;
    maxAmount?: number;
    search?: string;
    format?: 'json' | 'csv' | 'pdf';
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
