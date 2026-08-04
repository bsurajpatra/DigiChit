import mongoose, { Schema, Document } from 'mongoose';

/**
 * Lifecycle status of an auction event.
 */
export enum AuctionStatus {
    SCHEDULED = 'SCHEDULED',
    OPEN = 'OPEN',
    CLOSED = 'CLOSED',
    WINNER_DECLARED = 'WINNER_DECLARED',
    CANCELLED = 'CANCELLED'
}

/**
 * Interface representing an Auction document in MongoDB.
 * Manages the monthly auction event and lifecycle state transitions for a ChitCycle.
 */
export interface IAuction extends Document {
    cycleId: mongoose.Types.ObjectId;
    groupId: mongoose.Types.ObjectId;
    organizerId: mongoose.Types.ObjectId;
    auctionNumber: number;
    scheduledStartTime: Date;
    actualStartTime?: Date | null;
    scheduledEndTime?: Date | null;
    actualEndTime?: Date | null;
    status: AuctionStatus;
    minimumBidPercentage: number;
    maximumBidPercentage: number;
    winningMembershipId?: mongoose.Types.ObjectId | null;
    winningBidId?: mongoose.Types.ObjectId | null;
    remarks?: string | null;
    createdBy: mongoose.Types.ObjectId;
    isDeleted: boolean;
    deletedAt?: Date | null;
    createdAt: Date;
    updatedAt: Date;
}

const AuctionSchema: Schema = new Schema<IAuction>(
    {
        cycleId: {
            type: Schema.Types.ObjectId,
            ref: 'ChitCycle',
            required: [true, 'Cycle ID is required'],
            unique: true
        },
        groupId: {
            type: Schema.Types.ObjectId,
            ref: 'ChitGroup',
            required: [true, 'Group ID is required']
        },
        organizerId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Organizer ID is required']
        },
        auctionNumber: {
            type: Number,
            required: [true, 'Auction number is required'],
            min: [1, 'Auction number must be at least 1']
        },
        scheduledStartTime: {
            type: Date,
            required: [true, 'Scheduled start time is required']
        },
        actualStartTime: {
            type: Date,
            default: null
        },
        scheduledEndTime: {
            type: Date,
            default: null
        },
        actualEndTime: {
            type: Date,
            default: null
        },
        status: {
            type: String,
            enum: Object.values(AuctionStatus),
            default: AuctionStatus.SCHEDULED,
            required: true
        },
        minimumBidPercentage: {
            type: Number,
            default: 0,
            min: [0, 'Minimum bid percentage cannot be negative'],
            max: [100, 'Minimum bid percentage cannot exceed 100%']
        },
        maximumBidPercentage: {
            type: Number,
            default: 50,
            min: [0, 'Maximum bid percentage cannot be negative'],
            max: [100, 'Maximum bid percentage cannot exceed 100%']
        },
        winningMembershipId: {
            type: Schema.Types.ObjectId,
            ref: 'Membership',
            default: null
        },
        winningBidId: {
            type: Schema.Types.ObjectId,
            ref: 'Bid',
            default: null
        },
        remarks: {
            type: String,
            trim: true,
            default: null
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Creator User ID is required']
        },
        isDeleted: {
            type: Boolean,
            default: false
        },
        deletedAt: {
            type: Date,
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

// Business Rule 1: Every ChitCycle can have only ONE Auction
AuctionSchema.index({ cycleId: 1 }, { unique: true });

// Enforce unique auction number per group
AuctionSchema.index({ groupId: 1, auctionNumber: 1 }, { unique: true });

// Optimize status and timeline queries
AuctionSchema.index({ groupId: 1, status: 1 });
AuctionSchema.index({ status: 1, scheduledStartTime: 1 });

export default mongoose.model<IAuction>('Auction', AuctionSchema);
