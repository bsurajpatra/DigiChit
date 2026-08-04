import { IChitCycle, ChitCycleStatus, PaymentCollectionStatus, IPaymentCollectionInfo } from '../models/ChitCycle.js';

export interface ICreateCycleInput {
    groupId: string;
    scheduledStartDate: Date | string;
    scheduledEndDate?: Date | string;
    auctionDate?: Date | string;
    remarks?: string;
}

export interface IRecordWinnerInput {
    winnerMembershipId: string;
    winningBidPercentage?: number;
    winningBidAmount?: number;
    prizeAmount?: number;
    dividendAmount?: number;
    auctionDate?: Date | string;
    remarks?: string;
}

export type { IChitCycle, ChitCycleStatus, PaymentCollectionStatus, IPaymentCollectionInfo };
