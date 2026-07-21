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

export interface IChitGroup extends Document {
    organizerId: mongoose.Types.ObjectId;
    name: string;
    totalMembers: number;
    monthlyContribution: number;
    durationMonths: number;
    startDate: Date;
    commissionPercent: number;
    auctionType: AuctionType;
    status: ChitGroupStatus;
    currentMemberCount: number;
    description?: string;
    createdAt: Date;
    updatedAt: Date;
}

const ChitGroupSchema = new Schema<IChitGroup>({
    organizerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true },
    totalMembers: { type: Number, required: true, min: 2, max: 50 },
    monthlyContribution: { type: Number, required: true, min: 100 },
    durationMonths: { type: Number, required: true },
    startDate: { type: Date, required: true },
    commissionPercent: { type: Number, required: true, min: 0, max: 100 },
    auctionType: { type: String, enum: Object.values(AuctionType), default: AuctionType.AUCTION },
    status: { type: String, enum: Object.values(ChitGroupStatus), default: ChitGroupStatus.FORMING },
    currentMemberCount: { type: Number, default: 0 },
    description: { type: String, trim: true }
}, {
    timestamps: true
});

// Validation to ensure durationMonths equals totalMembers as per business rules
ChitGroupSchema.pre('save', async function(this: IChitGroup) {
    if (this.durationMonths !== this.totalMembers) {
        // Business rule: One member per month
        this.durationMonths = this.totalMembers;
    }
});

export default mongoose.model<IChitGroup>('ChitGroup', ChitGroupSchema);
