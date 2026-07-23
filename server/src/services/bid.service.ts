import mongoose from 'mongoose';
import Bid, { IBid, BidStatus } from '../models/Bid.js';
import Auction, { AuctionStatus } from '../models/Auction.js';
import Membership, { MembershipStatus } from '../models/Membership.js';
import User, { AccountStatus, UserRole } from '../models/User.js';
import ChitGroup from '../models/ChitGroup.js';
import { AppError } from '../utils/appError.js';
import { logAction } from '../utils/auditLogger.js';

export interface ISubmitBidInput {
    auctionId: string;
    bidPercentage: number;
    bidAmount?: number;
    deviceFingerprint?: string;
    remarks?: string;
}

export interface IUpdateBidInput {
    bidPercentage: number;
    bidAmount?: number;
    remarks?: string;
}

/**
 * Submits a new bid for an active auction.
 * 
 * Business Rules Enforced:
 * - Rule 1: A member may submit only one active bid per auction.
 * - Rule 2: Only ACTIVE members of the corresponding ChitGroup may bid.
 * - Rule 3: Auction must be OPEN before accepting bids.
 * - Rule 4: Reject duplicate bids.
 * - Rule 5: Reject bids after auction closing.
 * - Rule 6: Reject bids from suspended, frozen, or inactive users.
 * - Rule 10: Validates bidPercentage against auction min/max boundaries.
 */
export const submitBid = async (
    actorId: string,
    actorRole: UserRole,
    data: ISubmitBidInput,
    ipAddress?: string
): Promise<IBid> => {
    const { auctionId, bidPercentage, bidAmount, deviceFingerprint, remarks } = data;

    // 1. Rule 6: Reject bids from suspended, frozen, or inactive users
    const user = await User.findById(actorId);
    if (!user || (user.accountStatus !== AccountStatus.ACTIVE && user.accountStatus !== AccountStatus.REGISTERED)) {
        throw new AppError('Account is inactive, suspended, or frozen. Bidding is restricted.', 403, 'USER_INACTIVE');
    }

    // 2. Rule 2 & 3 & 5: Fetch auction and verify it is OPEN
    const auction = await Auction.findOne({ _id: auctionId, isDeleted: false });
    if (!auction) {
        throw new AppError('Auction not found.', 404, 'AUCTION_NOT_FOUND');
    }

    if (auction.status !== AuctionStatus.OPEN) {
        throw new AppError(
            `Bids can only be submitted when the auction is OPEN. Current auction status is ${auction.status}.`,
            400,
            'AUCTION_NOT_OPEN'
        );
    }

    // 3. Rule 2: Verify user has an ACTIVE membership in the group
    const membership = await Membership.findOne({
        chitGroupId: auction.groupId,
        userId: new mongoose.Types.ObjectId(actorId)
    });

    if (!membership) {
        throw new AppError('You are not a member of this Chit Group.', 403, 'MEMBERSHIP_NOT_FOUND');
    }

    if (membership.status !== MembershipStatus.ACTIVE_MEMBER && membership.status !== MembershipStatus.APPROVED) {
        throw new AppError('Only active members of this Chit Group may place bids.', 403, 'MEMBERSHIP_INACTIVE');
    }

    // Check if member has already won a previous cycle in this group
    if (membership.isWinner) {
        throw new AppError('You have already won a previous auction in this Chit Group and are ineligible to bid again.', 400, 'MEMBER_ALREADY_WON');
    }

    // 4. Rule 1 & 4: Check for duplicate active bids by this member in this auction
    const existingActiveBid = await Bid.findOne({
        auctionId: auction._id,
        membershipId: membership._id,
        status: { $in: [BidStatus.SUBMITTED, BidStatus.VALID, BidStatus.WINNING] }
    });

    if (existingActiveBid) {
        throw new AppError(
            'You have already submitted an active bid for this auction. Update your existing bid instead of submitting a new one.',
            400,
            'DUPLICATE_BID'
        );
    }

    // 5. Rule 10: Validate bid bounds against auction configuration
    if (bidPercentage < auction.minimumBidPercentage || bidPercentage > auction.maximumBidPercentage) {
        throw new AppError(
            `Bid percentage (${bidPercentage}%) must be between auction minimum (${auction.minimumBidPercentage}%) and maximum (${auction.maximumBidPercentage}%).`,
            400,
            'BID_PERCENTAGE_OUT_OF_BOUNDS'
        );
    }

    // Calculate bid amount if not explicitly provided
    let calculatedBidAmount = bidAmount;
    if (calculatedBidAmount === undefined || calculatedBidAmount === null) {
        const group = await ChitGroup.findById(auction.groupId);
        if (group) {
            const totalChitValue = group.monthlyContribution * group.totalMembers;
            calculatedBidAmount = (totalChitValue * bidPercentage) / 100;
        }
    }

    // 6. Instantiate and save the Bid
    const bid = new Bid({
        auctionId: auction._id,
        cycleId: auction.cycleId,
        groupId: auction.groupId,
        membershipId: membership._id,
        userId: user._id,
        bidPercentage,
        bidAmount: calculatedBidAmount || 0,
        status: BidStatus.VALID,
        isWinningBid: false,
        submittedAt: new Date(),
        ipAddress: ipAddress || null,
        deviceFingerprint: deviceFingerprint || null,
        remarks: remarks || null
    });

    await bid.save();

    // 7. Audit Log
    await logAction(actorId, actorRole, 'BID_SUBMITTED', {
        newValue: {
            bidId: (bid._id as mongoose.Types.ObjectId).toString(),
            auctionId: auction._id.toString(),
            bidPercentage,
            bidAmount: bid.bidAmount
        },
        ...(ipAddress ? { ipAddress } : {})
    });

    return bid;
};

/**
 * Updates a submitted bid while the auction is OPEN.
 * 
 * Business Rules Enforced:
 * - Rule 8: Bid updates should only be allowed while the auction is OPEN.
 * - Rule 9: Once the auction closes, bids become immutable.
 */
export const updateBid = async (
    actorId: string,
    actorRole: UserRole,
    bidId: string,
    data: IUpdateBidInput
): Promise<IBid> => {
    const bid = await Bid.findById(bidId);
    if (!bid) {
        throw new AppError('Bid not found.', 404, 'BID_NOT_FOUND');
    }

    // Ownership check: Only the bidder or Admin can modify the bid
    if (actorRole !== UserRole.ADMIN && bid.userId.toString() !== actorId) {
        throw new AppError('Unauthorized to update this bid.', 403, 'UNAUTHORIZED');
    }

    // Rule 8 & 9: Verify auction is still OPEN
    const auction = await Auction.findById(bid.auctionId);
    if (!auction || auction.status !== AuctionStatus.OPEN) {
        throw new AppError('Bids are immutable because the auction is closed or unavailable.', 400, 'AUCTION_CLOSED');
    }

    if (bid.status === BidStatus.WITHDRAWN || bid.status === BidStatus.REJECTED) {
        throw new AppError(`Cannot update a ${bid.status} bid. Submit a new bid if eligible.`, 400, 'BID_INACTIVE');
    }

    // Validate percentage bounds
    if (data.bidPercentage < auction.minimumBidPercentage || data.bidPercentage > auction.maximumBidPercentage) {
        throw new AppError(
            `Bid percentage (${data.bidPercentage}%) must be between auction minimum (${auction.minimumBidPercentage}%) and maximum (${auction.maximumBidPercentage}%).`,
            400,
            'BID_PERCENTAGE_OUT_OF_BOUNDS'
        );
    }

    let calculatedBidAmount = data.bidAmount;
    if (calculatedBidAmount === undefined || calculatedBidAmount === null) {
        const group = await ChitGroup.findById(auction.groupId);
        if (group) {
            const totalChitValue = group.monthlyContribution * group.totalMembers;
            calculatedBidAmount = (totalChitValue * data.bidPercentage) / 100;
        }
    }

    bid.bidPercentage = data.bidPercentage;
    if (calculatedBidAmount !== undefined) {
        bid.bidAmount = calculatedBidAmount;
    }
    if (data.remarks !== undefined) {
        bid.remarks = data.remarks;
    }
    bid.submittedAt = new Date();

    await bid.save();

    await logAction(actorId, actorRole, 'BID_UPDATED', {
        newValue: {
            bidId,
            bidPercentage: bid.bidPercentage,
            bidAmount: bid.bidAmount
        }
    });

    return bid;
};

/**
 * Withdraws a bid while the auction is OPEN.
 * 
 * Business Rules Enforced:
 * - Rule 8 & 9: Withdrawal is only permitted while auction is OPEN.
 */
export const withdrawBid = async (
    actorId: string,
    actorRole: UserRole,
    bidId: string
): Promise<IBid> => {
    const bid = await Bid.findById(bidId);
    if (!bid) {
        throw new AppError('Bid not found.', 404, 'BID_NOT_FOUND');
    }

    if (actorRole !== UserRole.ADMIN && bid.userId.toString() !== actorId) {
        throw new AppError('Unauthorized to withdraw this bid.', 403, 'UNAUTHORIZED');
    }

    const auction = await Auction.findById(bid.auctionId);
    if (!auction || auction.status !== AuctionStatus.OPEN) {
        throw new AppError('Bids cannot be withdrawn after the auction has closed.', 400, 'AUCTION_CLOSED');
    }

    if (bid.status === BidStatus.WITHDRAWN) {
        throw new AppError('Bid is already withdrawn.', 400, 'BID_ALREADY_WITHDRAWN');
    }

    bid.status = BidStatus.WITHDRAWN;
    await bid.save();

    await logAction(actorId, actorRole, 'BID_WITHDRAWN', {
        newValue: { bidId, status: bid.status }
    });

    return bid;
};

/**
 * Fetches single bid by ID with population.
 */
export const getBidById = async (actorId: string, actorRole: UserRole, bidId: string): Promise<IBid> => {
    const bid = await Bid.findById(bidId)
        .populate('userId', 'name email')
        .populate('membershipId')
        .populate('auctionId', 'auctionNumber status scheduledStartTime')
        .populate('cycleId', 'cycleNumber status')
        .populate('groupId', 'name monthlyContribution totalMembers');

    if (!bid) {
        throw new AppError('Bid not found.', 404, 'BID_NOT_FOUND');
    }

    const group = await ChitGroup.findById(bid.groupId);
    const isOrganizer = group && group.organizerId.toString() === actorId;

    // Check read access
    if (actorRole !== UserRole.ADMIN && !isOrganizer && bid.userId.toString() !== actorId) {
        throw new AppError('Unauthorized to view this bid.', 403, 'UNAUTHORIZED');
    }

    return bid;
};

/**
 * Retrieves all bids for a specific auction.
 * Organizers/Admins get full view; members get valid bids.
 */
export const getBidsByAuction = async (
    actorId: string,
    actorRole: UserRole,
    auctionId: string
): Promise<IBid[]> => {
    const auction = await Auction.findById(auctionId);
    if (!auction) {
        throw new AppError('Auction not found.', 404, 'AUCTION_NOT_FOUND');
    }

    const group = await ChitGroup.findById(auction.groupId);
    const isOrganizer = group && group.organizerId.toString() === actorId;

    const query: any = { auctionId };

    // Members see valid/submitted bids; organizers/admins see all including withdrawn
    if (!isOrganizer && actorRole !== UserRole.ADMIN) {
        query.status = { $in: [BidStatus.SUBMITTED, BidStatus.VALID, BidStatus.WINNING] };
    }

    return Bid.find(query)
        .sort({ bidPercentage: -1, submittedAt: 1 })
        .populate('userId', 'name email')
        .populate('membershipId');
};

/**
 * Retrieves all bids submitted by a specific member.
 */
export const getBidsByMember = async (
    actorId: string,
    actorRole: UserRole,
    membershipId: string
): Promise<IBid[]> => {
    const membership = await Membership.findById(membershipId);
    if (!membership) {
        throw new AppError('Membership not found.', 404, 'MEMBERSHIP_NOT_FOUND');
    }

    const group = await ChitGroup.findById(membership.chitGroupId);
    const isOrganizer = group && group.organizerId.toString() === actorId;

    if (actorRole !== UserRole.ADMIN && !isOrganizer && membership.userId.toString() !== actorId) {
        throw new AppError('Unauthorized to view these member bids.', 403, 'UNAUTHORIZED');
    }

    return Bid.find({ membershipId })
        .sort({ createdAt: -1 })
        .populate('auctionId', 'auctionNumber status scheduledStartTime')
        .populate('cycleId', 'cycleNumber');
};
