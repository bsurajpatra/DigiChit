export interface CreateAuctionDto {
    cycleId: string;
    scheduledStartTime: Date | string;
    scheduledEndTime?: Date | string;
    minimumBidPercentage?: number;
    maximumBidPercentage?: number;
    remarks?: string;
}

export interface UpdateAuctionDto {
    scheduledStartTime?: Date | string;
    scheduledEndTime?: Date | string;
    minimumBidPercentage?: number;
    maximumBidPercentage?: number;
    remarks?: string;
}

export interface DeclareWinnerDto {
    winningMembershipId: string;
    winningBidId?: string;
    remarks?: string;
}
