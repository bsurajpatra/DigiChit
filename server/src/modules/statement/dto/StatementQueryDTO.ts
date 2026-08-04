import { LedgerEntryType, LedgerDirection } from '../../ledger/enums/ledger.enum.js';

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
