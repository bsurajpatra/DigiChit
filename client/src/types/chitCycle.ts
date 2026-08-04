export type ChitCycleStatus = 'UPCOMING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
export type PaymentCollectionStatus = 'NOT_STARTED' | 'OPEN' | 'CLOSED';

export interface IPaymentCollectionInfo {
    status: PaymentCollectionStatus;
    openedAt?: string | null;
    openedBy?: string | null;
    closedAt?: string | null;
    closedBy?: string | null;
    remarks?: string | null;
}

export interface WinnerUser {
    _id: string;
    name: string;
    email: string;
}

export interface WinnerMembership {
    _id: string;
    userId: WinnerUser;
    chitGroupId: string;
    status: string;
    joinedAt?: string;
    payoutMonth?: number;
    isWinner: boolean;
}

export interface ChitCycle {
    _id: string;
    groupId: string | { _id: string; name: string; totalMembers: number; monthlyContribution: number; organizerId: string; status: string };
    cycleNumber: number;
    status: ChitCycleStatus;
    paymentCollection?: IPaymentCollectionInfo;
    paymentCollectionStatus?: PaymentCollectionStatus;
    collectionsOpenedAt?: string | null;
    collectionsOpenedBy?: string | null;
    collectionsClosedAt?: string | null;
    collectionsClosedBy?: string | null;
    scheduledStartDate: string;
    actualStartDate?: string | null;
    scheduledEndDate?: string | null;
    actualEndDate?: string | null;
    auctionDate?: string | null;
    winnerMembershipId?: WinnerMembership | string | null;
    winningBidPercentage?: number | null;
    winningBidAmount?: number | null;
    prizeAmount?: number | null;
    dividendAmount?: number | null;
    remarks?: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface CreateCycleInput {
    groupId: string;
    scheduledStartDate: string;
    scheduledEndDate?: string;
    auctionDate?: string;
    remarks?: string;
}

export interface RecordWinnerInput {
    winnerMembershipId: string;
    winningBidPercentage?: number;
    winningBidAmount?: number;
    prizeAmount?: number;
    dividendAmount?: number;
    auctionDate?: string;
    remarks?: string;
}
