export interface SubmitBidDto {
    auctionId: string;
    bidPercentage: number;
    bidAmount?: number;
    deviceFingerprint?: string;
    remarks?: string;
}

export interface UpdateBidDto {
    bidPercentage: number;
    bidAmount?: number;
    remarks?: string;
}
