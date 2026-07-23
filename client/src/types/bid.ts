export type BidStatus = 'SUBMITTED' | 'VALID' | 'REJECTED' | 'WITHDRAWN' | 'WINNING';

export interface BidUser {
    _id: string;
    name: string;
    email: string;
}

export interface BidMembership {
    _id: string;
    userId: string | BidUser;
    chitGroupId: string;
    status: string;
    joinedAt?: string;
    isWinner: boolean;
}

export interface Bid {
    _id: string;
    auctionId: string | { _id: string; auctionNumber: number; status: string; scheduledStartTime: string };
    cycleId: string | { _id: string; cycleNumber: number; status: string };
    groupId: string | { _id: string; name: string; monthlyContribution: number; totalMembers: number };
    membershipId: string | BidMembership;
    userId: string | BidUser;
    bidPercentage: number;
    bidAmount: number;
    status: BidStatus;
    isWinningBid: boolean;
    submittedAt: string;
    ipAddress?: string | null;
    deviceFingerprint?: string | null;
    remarks?: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface SubmitBidInput {
    auctionId: string;
    bidPercentage: number;
    bidAmount?: number;
    deviceFingerprint?: string;
    remarks?: string;
}

export interface UpdateBidInput {
    bidPercentage: number;
    bidAmount?: number;
    remarks?: string;
}
