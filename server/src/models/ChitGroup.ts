import mongoose, { Schema, Document } from 'mongoose';

export enum ChitGroupStatus {
    DRAFT = 'DRAFT',
    FORMING = 'FORMING',
    ACTIVE = 'ACTIVE',
    COMPLETED = 'COMPLETED',
    CANCELLED = 'CANCELLED'
}

export enum AuctionType {
    AUCTION = 'AUCTION',
    LOTTERY = 'LOTTERY'
}

export enum CommissionType {
    PERCENTAGE = 'PERCENTAGE',
    FIXED = 'FIXED'
}

export enum LateFeeType {
    FIXED = 'FIXED',
    PERCENTAGE = 'PERCENTAGE'
}

export enum AuctionStrategy {
    LOWEST_BID = 'LOWEST_BID',
    HIGHEST_BID = 'HIGHEST_BID',
    CUSTOM = 'CUSTOM'
}

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

export interface IChitGroup extends Document {
    organizerId: mongoose.Types.ObjectId;
    name: string;
    totalMembers: number;
    monthlyContribution: number;
    durationMonths: number;
    startDate: Date;
    commissionPercent: number;
    auctionType: AuctionType;
    financialConfig: IFinancialConfig;
    status: ChitGroupStatus;
    currentMemberCount: number;
    description?: string;
    createdAt: Date;
    updatedAt: Date;
}

const FinancialConfigSchema = new Schema<IFinancialConfig>({
    version: { type: Number, default: 1 },
    commission: {
        value: { type: Number, required: true, default: 2, min: 0, max: 10 },
        type: { type: String, enum: Object.values(CommissionType), default: CommissionType.PERCENTAGE }
    },
    lateFee: {
        value: { type: Number, default: 0, min: 0 },
        type: { type: String, enum: Object.values(LateFeeType), default: LateFeeType.FIXED }
    },
    gracePeriodDays: { type: Number, default: 3, min: 0 },
    auctionStrategy: { type: String, enum: Object.values(AuctionStrategy), default: AuctionStrategy.LOWEST_BID },
    allowPartialInstallment: { type: Boolean, default: false },
    allowPrepayment: { type: Boolean, default: true },
    allowPenaltyWaiver: { type: Boolean, default: true },
    currency: { type: String, default: 'INR' }
}, { _id: false });

const ChitGroupSchema = new Schema<IChitGroup>({
    organizerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true },
    totalMembers: { type: Number, required: true, min: 2, max: 50 },
    monthlyContribution: { type: Number, required: true, min: 100 },
    durationMonths: { type: Number, required: true },
    startDate: { type: Date, required: true },
    commissionPercent: { type: Number, required: true, min: 0, max: 100 },
    auctionType: { type: String, enum: Object.values(AuctionType), default: AuctionType.AUCTION },
    financialConfig: { 
        type: FinancialConfigSchema, 
        default: () => ({
            version: 1,
            commission: { value: 2, type: CommissionType.PERCENTAGE },
            lateFee: { value: 0, type: LateFeeType.FIXED },
            gracePeriodDays: 3,
            auctionStrategy: AuctionStrategy.LOWEST_BID,
            allowPartialInstallment: false,
            allowPrepayment: true,
            allowPenaltyWaiver: true,
            currency: 'INR'
        })
    },
    status: { type: String, enum: Object.values(ChitGroupStatus), default: ChitGroupStatus.FORMING },
    currentMemberCount: { type: Number, default: 0 },
    description: { type: String, trim: true }
}, {
    timestamps: true
});

// Validation & sync pre-save hook
ChitGroupSchema.pre('save', async function(this: IChitGroup) {
    if (this.durationMonths !== this.totalMembers) {
        // Business rule: One member per month
        this.durationMonths = this.totalMembers;
    }

    // Keep legacy commissionPercent and financialConfig.commission.value in sync
    if (this.financialConfig && this.financialConfig.commission) {
        this.commissionPercent = this.financialConfig.commission.value;
    } else if (this.commissionPercent !== undefined) {
        this.financialConfig = {
            version: 1,
            commission: { value: this.commissionPercent, type: CommissionType.PERCENTAGE },
            lateFee: { value: 0, type: LateFeeType.FIXED },
            gracePeriodDays: 3,
            auctionStrategy: AuctionStrategy.LOWEST_BID,
            allowPartialInstallment: false,
            allowPrepayment: true,
            allowPenaltyWaiver: true,
            currency: 'INR'
        };
    }
});

export default mongoose.model<IChitGroup>('ChitGroup', ChitGroupSchema);
