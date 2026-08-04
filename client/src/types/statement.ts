export interface ITimelineItem {
    _id: string;
    entryNumber: string;
    entryType: string;
    referenceType: string;
    referenceId: string;
    transactionId?: string | null;
    amount: number;
    direction: 'DEBIT' | 'CREDIT';
    account: {
        type: string;
        name: string;
    };
    description: string;
    remarks?: string | null;
    createdAt: string;
    groupName?: string;
    cycleNumber?: number | null;
    installmentNumber?: number | null;
}

export interface IMemberStatementData {
    member: {
        _id: string;
        name: string;
        email: string;
    };
    summary: {
        totalPaid: number;
        totalOutstanding: number;
        totalInstallmentsCount: number;
        paidInstallmentsCount: number;
        pendingInstallmentsCount: number;
        totalLateFeesPaid: number;
        totalRefunds: number;
    };
    pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
    timeline: ITimelineItem[];
}

export interface IOrganizerStatementData {
    organizer: {
        _id: string;
        name: string;
        email: string;
    };
    summary: {
        totalGroupsCount: number;
        totalMembersCount: number;
        totalCollectionsExpected: number;
        totalAmountCollected: number;
        totalPendingAmount: number;
        completedCyclesCount: number;
        activeCyclesCount: number;
        overallCollectionPercentage: number;
    };
    pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
    timeline: ITimelineItem[];
}

export interface IStatementFilterParams {
    startDate?: string;
    endDate?: string;
    cycleId?: string;
    groupId?: string;
    memberId?: string;
    entryType?: string;
    direction?: string;
    minAmount?: number;
    maxAmount?: number;
    search?: string;
    page?: number;
    limit?: number;
}
