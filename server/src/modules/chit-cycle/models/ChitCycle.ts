import mongoose, { Schema, Document } from 'mongoose';
import { IFinancialConfig } from '../../chit-group/models/ChitGroup.js';

/**
 * Lifecycle status of a single monthly chit cycle.
 */
export enum ChitCycleStatus {
    UPCOMING = 'UPCOMING',
    ACTIVE = 'ACTIVE',
    COMPLETED = 'COMPLETED',
    CANCELLED = 'CANCELLED'
}

/**
 * Payment collection status for a chit cycle controlled by organizer.
 */
export enum PaymentCollectionStatus {
    NOT_STARTED = 'NOT_STARTED',
    OPEN = 'OPEN',
    CLOSED = 'CLOSED'
}

export interface IPaymentCollectionInfo {
    status: PaymentCollectionStatus;
    openedAt?: Date | null;
    openedBy?: mongoose.Types.ObjectId | null;
    closedAt?: Date | null;
    closedBy?: mongoose.Types.ObjectId | null;
    remarks?: string | null;
}

/**
 * Interface representing a ChitCycle document in MongoDB.
 * Represents one monthly financial and operational cycle of a ChitGroup.
 */
export interface IChitCycle extends Document {
    groupId: mongoose.Types.ObjectId;
    cycleNumber: number;
    status: ChitCycleStatus;
    paymentCollection: IPaymentCollectionInfo;
    financialConfigSnapshot?: IFinancialConfig;
    scheduledStartDate: Date;
    actualStartDate?: Date | null;
    scheduledEndDate?: Date | null;
    actualEndDate?: Date | null;
    auctionDate?: Date | null;
    winnerMembershipId?: mongoose.Types.ObjectId | null;
    winningBidPercentage?: number | null;
    winningBidAmount?: number | null;
    prizeAmount?: number | null;
    dividendAmount?: number | null;
    remarks?: string | null;
    createdAt: Date;
    updatedAt: Date;
}

const PaymentCollectionSchema = new Schema<IPaymentCollectionInfo>(
    {
        status: {
            type: String,
            enum: Object.values(PaymentCollectionStatus),
            default: PaymentCollectionStatus.NOT_STARTED,
            required: true
        },
        openedAt: {
            type: Date,
            default: null
        },
        openedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            default: null
        },
        closedAt: {
            type: Date,
            default: null
        },
        closedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            default: null
        },
        remarks: {
            type: String,
            trim: true,
            default: null
        }
    },
    { _id: false }
);

const ChitCycleSchema: Schema = new Schema<IChitCycle>(
    {
        groupId: {
            type: Schema.Types.ObjectId,
            ref: 'ChitGroup',
            required: [true, 'Group ID is required']
        },
        cycleNumber: {
            type: Number,
            required: [true, 'Cycle number is required'],
            min: [1, 'Cycle number must start at 1']
        },
        status: {
            type: String,
            enum: Object.values(ChitCycleStatus),
            default: ChitCycleStatus.UPCOMING,
            required: true
        },
        paymentCollection: {
            type: PaymentCollectionSchema,
            default: () => ({
                status: PaymentCollectionStatus.NOT_STARTED,
                openedAt: null,
                openedBy: null,
                closedAt: null,
                closedBy: null,
                remarks: null
            })
        },
        financialConfigSnapshot: {
            type: Schema.Types.Mixed,
            required: false
        },
        scheduledStartDate: {
            type: Date,
            required: [true, 'Scheduled start date is required']
        },
        actualStartDate: {
            type: Date,
            default: null
        },
        scheduledEndDate: {
            type: Date,
            default: null
        },
        actualEndDate: {
            type: Date,
            default: null
        },
        auctionDate: {
            type: Date,
            default: null
        },
        winnerMembershipId: {
            type: Schema.Types.ObjectId,
            ref: 'Membership',
            default: null
        },
        winningBidPercentage: {
            type: Number,
            default: null,
            min: [0, 'Winning bid percentage cannot be negative'],
            max: [100, 'Winning bid percentage cannot exceed 100%']
        },
        winningBidAmount: {
            type: Number,
            default: null,
            min: [0, 'Winning bid amount cannot be negative']
        },
        prizeAmount: {
            type: Number,
            default: null,
            min: [0, 'Prize amount cannot be negative']
        },
        dividendAmount: {
            type: Number,
            default: null,
            min: [0, 'Dividend amount cannot be negative']
        },
        remarks: {
            type: String,
            trim: true,
            default: null
        }
    },
    {
        timestamps: true
    }
);

// Indexes
ChitCycleSchema.index({ groupId: 1, cycleNumber: 1 }, { unique: true });
ChitCycleSchema.index(
    { groupId: 1, status: 1 },
    {
        unique: true,
        partialFilterExpression: { status: ChitCycleStatus.ACTIVE }
    }
);
ChitCycleSchema.index({ groupId: 1, status: 1 });

export default mongoose.model<IChitCycle>('ChitCycle', ChitCycleSchema);
