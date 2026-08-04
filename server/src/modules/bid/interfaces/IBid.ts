import { IBid, BidStatus } from '../models/Bid.js';

export interface ISubmitBidInput {
    auctionId: string;
    bidPercentage: number;
    bidAmount?: number;
    deviceFingerprint?: string;
    remarks?: string;
}

export interface IUpdateBidInput {
    bidPercentage: number;
    bidAmount?: number;
    remarks?: string;
}

export type { IBid, BidStatus };
