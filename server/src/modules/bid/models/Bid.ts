import mongoose, { Schema, Document } from 'mongoose';

/**
 * Status enum for member bids submitted during an auction.
 */
export enum BidStatus {
    SUBMITTED = 'SUBMITTED',
    VALID = 'VALID',
    REJECTED = 'REJECTED',
    WITHDRAWN = 'WITHDRAWN',
    WINNING = 'WINNING'
}

/**
 * Interface representing a Bid document in MongoDB.
 * Records individual member bids placed during a ChitGroup auction.
 */
export interface IBid extends Document {
    auctionId: mongoose.Types.ObjectId;
    cycleId: mongoose.Types.ObjectId;
    groupId: mongoose.Types.ObjectId;
    membershipId: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    bidPercentage: number;
    bidAmount?: number | null;
    status: BidStatus;
    isWinningBid: boolean;
    submittedAt: Date;
    ipAddress?: string | null;
    deviceFingerprint?: string | null;
    remarks?: string | null;
    createdAt: Date;
    updatedAt: Date;
}

const BidSchema: Schema = new Schema<IBid>(
    {
        auctionId: {
            type: Schema.Types.ObjectId,
            ref: 'Auction',
            required: [true, 'Auction ID is required']
        },
        cycleId: {
            type: Schema.Types.ObjectId,
            ref: 'ChitCycle',
            required: [true, 'Cycle ID is required']
        },
        groupId: {
            type: Schema.Types.ObjectId,
            ref: 'ChitGroup',
            required: [true, 'Group ID is required']
        },
        membershipId: {
            type: Schema.Types.ObjectId,
            ref: 'Membership',
            required: [true, 'Membership ID is required']
        },
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'User ID is required']
        },
        bidPercentage: {
            type: Number,
            required: [true, 'Bid percentage is required'],
            min: [0, 'Bid percentage cannot be negative'],
            max: [100, 'Bid percentage cannot exceed 100%']
        },
        bidAmount: {
            type: Number,
            default: null,
            min: [0, 'Bid amount cannot be negative']
        },
        status: {
            type: String,
            enum: Object.values(BidStatus),
            default: BidStatus.SUBMITTED,
            required: true
        },
        isWinningBid: {
            type: Boolean,
            default: false
        },
        submittedAt: {
            type: Date,
            default: Date.now,
            required: true
        },
        ipAddress: {
            type: String,
            trim: true,
            default: null
        },
        deviceFingerprint: {
            type: String,
            trim: true,
            default: null
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

// Business Rule 1 & 4: Ensure one active bid per membership per auction
// Partial unique index so withdrawn/rejected bids don't block submitting a new bid if re-attempting
BidSchema.index(
    { auctionId: 1, membershipId: 1 },
    {
        unique: true,
        partialFilterExpression: { status: { $in: [BidStatus.SUBMITTED, BidStatus.VALID, BidStatus.WINNING] } }
    }
);

// Query optimization for auction bidding history & audit trails
BidSchema.index({ auctionId: 1, bidPercentage: -1 });
BidSchema.index({ groupId: 1, userId: 1 });
BidSchema.index({ membershipId: 1 });

export default mongoose.model<IBid>('Bid', BidSchema);
