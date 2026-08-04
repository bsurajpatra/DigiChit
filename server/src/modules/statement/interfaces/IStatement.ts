export interface ITimelineEntry {
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
    createdAt: Date;
    groupName?: string;
    cycleNumber?: number;
    installmentNumber?: number;
}

export interface IMemberStatement {
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
    timeline: ITimelineEntry[];
}

export interface IOrganizerStatement {
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
    timeline: ITimelineEntry[];
}

export interface IGroupStatement {
    group: {
        _id: string;
        name: string;
        totalChitValue: number;
        monthlyContribution: number;
        totalMembers: number;
        totalDurationMonths: number;
    };
    summary: {
        totalCollectionsExpected: number;
        totalAmountCollected: number;
        pendingAmount: number;
        paidMembersCount: number;
        pendingMembersCount: number;
        collectionPercentage: number;
    };
    pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
    timeline: ITimelineEntry[];
}
