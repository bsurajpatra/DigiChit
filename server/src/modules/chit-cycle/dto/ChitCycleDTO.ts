export interface CreateCycleDto {
    groupId: string;
    scheduledStartDate: Date | string;
    scheduledEndDate?: Date | string;
    auctionDate?: Date | string;
    remarks?: string;
}

export interface RecordWinnerDto {
    winnerMembershipId: string;
    winningBidPercentage?: number;
    winningBidAmount?: number;
    prizeAmount?: number;
    dividendAmount?: number;
    auctionDate?: Date | string;
    remarks?: string;
}
