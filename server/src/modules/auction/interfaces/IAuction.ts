import { IAuction, AuctionStatus } from '../models/Auction.js';

export interface ICreateAuctionInput {
    cycleId: string;
    scheduledStartTime: Date | string;
    scheduledEndTime?: Date | string;
    minimumBidPercentage?: number;
    maximumBidPercentage?: number;
    remarks?: string;
}

export interface IUpdateAuctionInput {
    scheduledStartTime?: Date | string;
    scheduledEndTime?: Date | string;
    minimumBidPercentage?: number;
    maximumBidPercentage?: number;
    remarks?: string;
}

export interface IDeclareWinnerInput {
    winningMembershipId: string;
    winningBidId?: string;
    remarks?: string;
}

export type { IAuction, AuctionStatus };
