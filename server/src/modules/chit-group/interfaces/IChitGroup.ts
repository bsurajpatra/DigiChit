import {
    IChitGroup,
    ChitGroupStatus,
    AuctionType,
    CommissionType,
    LateFeeType,
    AuctionStrategy,
    IFinancialConfig
} from '../models/ChitGroup.js';

export interface ICreateChitGroupInput {
    name: string;
    totalMembers: number;
    monthlyContribution: number;
    commissionPercent?: number;
    startDate: Date;
    auctionType: AuctionType;
    description?: string;
    financialConfig?: Partial<IFinancialConfig>;
}

export type {
    IChitGroup,
    ChitGroupStatus,
    AuctionType,
    CommissionType,
    LateFeeType,
    AuctionStrategy,
    IFinancialConfig
};
