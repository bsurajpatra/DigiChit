export type AuctionStatus = 'SCHEDULED' | 'OPEN' | 'CLOSED' | 'WINNER_DECLARED' | 'CANCELLED';

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
    isWinner: boolean;
}

export interface Auction {
    _id: string;
    cycleId: string | { _id: string; cycleNumber: number; status: string; scheduledStartDate: string };
    groupId: string | { _id: string; name: string; totalMembers: number; monthlyContribution: number };
    organizerId: string;
    auctionNumber: number;
    scheduledStartTime: string;
    actualStartTime?: string | null;
    scheduledEndTime?: string | null;
    actualEndTime?: string | null;
    status: AuctionStatus;
    minimumBidPercentage: number;
    maximumBidPercentage: number;
    winningMembershipId?: WinnerMembership | string | null;
    winningBidId?: string | null;
    remarks?: string | null;
    createdBy?: string | { _id: string; name: string; email: string };
    isDeleted: boolean;
    deletedAt?: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface CreateAuctionInput {
    cycleId: string;
    scheduledStartTime: string;
    scheduledEndTime?: string;
    minimumBidPercentage?: number;
    maximumBidPercentage?: number;
    remarks?: string;
}

export interface UpdateAuctionInput {
    scheduledStartTime?: string;
    scheduledEndTime?: string;
    minimumBidPercentage?: number;
    maximumBidPercentage?: number;
    remarks?: string;
}

export interface DeclareAuctionWinnerInput {
    winningMembershipId: string;
    winningBidId?: string;
    remarks?: string;
}
