import mongoose, { Schema, Document } from 'mongoose';

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
 * Interface representing a ChitCycle document in MongoDB.
 * Represents one monthly financial and operational cycle of a ChitGroup.
 */
export interface IChitCycle extends Document {
    groupId: mongoose.Types.ObjectId;
    cycleNumber: number;
    status: ChitCycleStatus;
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

// -----------------------------------------------------------------------------
// INDEXES
// -----------------------------------------------------------------------------

// Business Rule 1 & 2: Ensure cycleNumber is unique within a specific chit group
ChitCycleSchema.index({ groupId: 1, cycleNumber: 1 }, { unique: true });

// Business Rule 6: DB-level constraint to guarantee only ONE active cycle exists per group
ChitCycleSchema.index(
    { groupId: 1, status: 1 },
    {
        unique: true,
        partialFilterExpression: { status: ChitCycleStatus.ACTIVE }
    }
);

// Efficient querying by group and cycle status
ChitCycleSchema.index({ groupId: 1, status: 1 });

export default mongoose.model<IChitCycle>('ChitCycle', ChitCycleSchema);
