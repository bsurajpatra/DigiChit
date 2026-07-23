export type CommissionType = 'PERCENTAGE' | 'FIXED';
export type LateFeeType = 'FIXED' | 'PERCENTAGE';
export type AuctionStrategy = 'LOWEST_BID' | 'HIGHEST_BID' | 'CUSTOM';

export interface IFinancialConfig {
    version: number;
    commission: {
        value: number;
        type: CommissionType;
    };
    lateFee: {
        value: number;
        type: LateFeeType;
    };
    gracePeriodDays: number;
    auctionStrategy: AuctionStrategy;
    allowPartialInstallment: boolean;
    allowPrepayment: boolean;
    allowPenaltyWaiver: boolean;
    currency: string;
}
