export type ChitCycleStatus = 'UPCOMING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

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
