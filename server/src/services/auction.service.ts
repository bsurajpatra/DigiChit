import mongoose from 'mongoose';
import Auction, { IAuction, AuctionStatus } from '../models/Auction.js';
import ChitCycle, { ChitCycleStatus } from '../models/ChitCycle.js';
import ChitGroup from '../models/ChitGroup.js';
import Membership, { MembershipStatus } from '../models/Membership.js';
import { AppError } from '../utils/appError.js';
import { logAction } from '../utils/auditLogger.js';
import { UserRole } from '../models/User.js';

export interface ICreateAuctionInput {
    cycleId: string;
    scheduledStartTime: Date | string;
    scheduledEndTime?: Date | string;
    minimumBidPercentage?: number;
    maximumBidPercentage?: number;
    remarks?: string;
}

export interface IUpdateAuctionInput {
    scheduledStartTime?: Date | string;
    scheduledEndTime?: Date | string;
    minimumBidPercentage?: number;
    maximumBidPercentage?: number;
    remarks?: string;
}

export interface IDeclareWinnerInput {
    winningMembershipId: string;
    winningBidId?: string;
    remarks?: string;
}

/**
 * Valid state transitions for the Auction lifecycle.
 */
const VALID_STATUS_TRANSITIONS: Record<AuctionStatus, AuctionStatus[]> = {
    [AuctionStatus.SCHEDULED]: [AuctionStatus.OPEN, AuctionStatus.CANCELLED],
    [AuctionStatus.OPEN]: [AuctionStatus.CLOSED, AuctionStatus.CANCELLED],
    [AuctionStatus.CLOSED]: [AuctionStatus.WINNER_DECLARED, AuctionStatus.CANCELLED],
    [AuctionStatus.WINNER_DECLARED]: [], // Immutable end state
    [AuctionStatus.CANCELLED]: []        // Terminal state
};

/**
 * Creates an Auction for a ChitCycle.
 * 
 * Business Rules Enforced:
 * - 1. Every ChitCycle can have only ONE auction.
 * - 2. Auction cannot exist without a ChitCycle.
 * - 5. Only organizers/admins can create auctions.
 * - 6. Scheduled start time must fall within reasonable bounds of cycle start date.
 */
export const createAuction = async (
    actorId: string,
    actorRole: UserRole,
    data: ICreateAuctionInput
): Promise<IAuction> => {
    const { cycleId, scheduledStartTime, scheduledEndTime, minimumBidPercentage, maximumBidPercentage, remarks } = data;

    // 1. Verify ChitCycle exists
    const cycle = await ChitCycle.findById(cycleId);
    if (!cycle) {
        throw new AppError('Chit Cycle not found.', 404, 'CYCLE_NOT_FOUND');
    }

    if (cycle.status === ChitCycleStatus.CANCELLED) {
        throw new AppError('Cannot create an auction for a CANCELLED Chit Cycle.', 400, 'CYCLE_CANCELLED');
    }

    // 2. Verify ChitGroup exists & authorization
    const group = await ChitGroup.findById(cycle.groupId);
    if (!group) {
        throw new AppError('Associated Chit Group not found.', 404, 'GROUP_NOT_FOUND');
    }

    if (actorRole !== UserRole.ADMIN && group.organizerId.toString() !== actorId) {
        throw new AppError('Unauthorized to create an auction for this Chit Group.', 403, 'UNAUTHORIZED');
    }

    // 3. Rule 1: Verify no existing auction for this cycle
    const existingAuction = await Auction.findOne({ cycleId, isDeleted: false });
    if (existingAuction) {
        throw new AppError('An active or scheduled auction already exists for this Chit Cycle.', 400, 'AUCTION_ALREADY_EXISTS');
    }

    // 4. Rule 6: Validate date parameters (scheduledStartTime >= cycle start date)
    const cycleStart = new Date(cycle.scheduledStartDate);
    const auctionStart = new Date(scheduledStartTime);
    
    if (isNaN(auctionStart.getTime())) {
        throw new AppError('Invalid scheduled start time.', 400, 'INVALID_DATE');
    }

    if (auctionStart < cycleStart) {
        throw new AppError('Auction start time cannot precede the scheduled start date of the Chit Cycle.', 400, 'INVALID_AUCTION_TIMING');
    }

    if (scheduledEndTime && new Date(scheduledEndTime) <= auctionStart) {
        throw new AppError('Scheduled end time must be after scheduled start time.', 400, 'INVALID_AUCTION_TIMING');
    }

    const minBidPct = minimumBidPercentage !== undefined ? minimumBidPercentage : 0;
    const maxBidPct = maximumBidPercentage !== undefined ? maximumBidPercentage : (group.commissionPercent ? Math.max(50, group.commissionPercent) : 50);

    if (minBidPct > maxBidPct) {
        throw new AppError('Minimum bid percentage cannot exceed maximum bid percentage.', 400, 'INVALID_BID_LIMITS');
    }

    // 5. Instantiate and save Auction
    const auction = new Auction({
        cycleId: new mongoose.Types.ObjectId(cycleId),
        groupId: group._id,
        organizerId: group.organizerId,
        auctionNumber: cycle.cycleNumber,
        scheduledStartTime: auctionStart,
        scheduledEndTime: scheduledEndTime ? new Date(scheduledEndTime) : null,
        status: AuctionStatus.SCHEDULED,
        minimumBidPercentage: minBidPct,
        maximumBidPercentage: maxBidPct,
        remarks: remarks || null,
        createdBy: new mongoose.Types.ObjectId(actorId)
    });

    await auction.save();

    // 6. Audit Logging
    await logAction(actorId, actorRole, 'AUCTION_CREATED', {
        newValue: {
            auctionId: (auction._id as mongoose.Types.ObjectId).toString(),
            cycleId,
            groupId: group._id.toString(),
            auctionNumber: auction.auctionNumber,
            scheduledStartTime: auction.scheduledStartTime
        }
    });

    return auction;
};

/**
 * Updates schedule and metadata for an auction in SCHEDULED status.
 * 
 * Business Rule 7: Immutability once WINNER_DECLARED or CLOSED.
 */
export const updateAuction = async (
    actorId: string,
    actorRole: UserRole,
    auctionId: string,
    data: IUpdateAuctionInput
): Promise<IAuction> => {
    const auction = await Auction.findOne({ _id: auctionId, isDeleted: false });
    if (!auction) {
        throw new AppError('Auction not found.', 404, 'AUCTION_NOT_FOUND');
    }

    if (actorRole !== UserRole.ADMIN && auction.organizerId.toString() !== actorId) {
        throw new AppError('Unauthorized to modify this auction.', 403, 'UNAUTHORIZED');
    }

    // Rule 7: Only SCHEDULED auctions can be freely updated
    if (auction.status !== AuctionStatus.SCHEDULED && actorRole !== UserRole.ADMIN) {
        throw new AppError(`Cannot update auction in ${auction.status} status. Only SCHEDULED auctions can be modified.`, 400, 'AUCTION_IMMUTABLE');
    }

    if (data.scheduledStartTime) {
        auction.scheduledStartTime = new Date(data.scheduledStartTime);
    }
    if (data.scheduledEndTime) {
        auction.scheduledEndTime = new Date(data.scheduledEndTime);
    }
    if (data.minimumBidPercentage !== undefined) {
        auction.minimumBidPercentage = data.minimumBidPercentage;
    }
    if (data.maximumBidPercentage !== undefined) {
        auction.maximumBidPercentage = data.maximumBidPercentage;
    }
    if (data.remarks !== undefined) {
        auction.remarks = data.remarks;
    }

    if (auction.scheduledEndTime && auction.scheduledEndTime <= auction.scheduledStartTime) {
        throw new AppError('Scheduled end time must be after scheduled start time.', 400, 'INVALID_AUCTION_TIMING');
    }

    await auction.save();

    await logAction(actorId, actorRole, 'AUCTION_UPDATED', {
        newValue: { auctionId, status: auction.status, scheduledStartTime: auction.scheduledStartTime }
    });

    return auction;
};

/**
 * Transitions the auction through its valid lifecycle states:
 * SCHEDULED -> OPEN -> CLOSED -> WINNER_DECLARED / CANCELLED
 * 
 * Business Rule 3: Strict lifecycle state transitions.
 */
export const updateAuctionStatus = async (
    actorId: string,
    actorRole: UserRole,
    auctionId: string,
    targetStatus: AuctionStatus,
    remarks?: string
): Promise<IAuction> => {
    const auction = await Auction.findOne({ _id: auctionId, isDeleted: false });
    if (!auction) {
        throw new AppError('Auction not found.', 404, 'AUCTION_NOT_FOUND');
    }

    if (actorRole !== UserRole.ADMIN && auction.organizerId.toString() !== actorId) {
        throw new AppError('Unauthorized to update status for this auction.', 403, 'UNAUTHORIZED');
    }

    const currentStatus = auction.status;

    // Rule 3: Validate state transition
    const allowedTransitions = VALID_STATUS_TRANSITIONS[currentStatus] || [];
    if (!allowedTransitions.includes(targetStatus) && actorRole !== UserRole.ADMIN) {
        throw new AppError(
            `Invalid status transition from ${currentStatus} to ${targetStatus}. Allowed transitions: ${allowedTransitions.join(', ') || 'None'}.`,
            400,
            'INVALID_STATUS_TRANSITION'
        );
    }

    // Direct transition to WINNER_DECLARED should be performed via declareWinner() method
    if (targetStatus === AuctionStatus.WINNER_DECLARED && !auction.winningMembershipId) {
        throw new AppError(
            'Cannot transition to WINNER_DECLARED without declaring a winner. Use the declare-winner endpoint.',
            400,
            'WINNER_REQUIRED'
        );
    }

    auction.status = targetStatus;

    // Record timestamps based on transition
    if (targetStatus === AuctionStatus.OPEN) {
        auction.actualStartTime = new Date();
    } else if (targetStatus === AuctionStatus.CLOSED) {
        auction.actualEndTime = new Date();
    }

    if (remarks) {
        auction.remarks = remarks;
    }

    await auction.save();

    await logAction(actorId, actorRole, 'AUCTION_STATUS_CHANGED', {
        previousValue: { status: currentStatus },
        newValue: { auctionId, status: targetStatus, remarks }
    });

    return auction;
};

/**
 * Declares the winner of an auction and transitions status to WINNER_DECLARED.
 * 
 * Business Rule 4: Winner fields remain null until winner declaration.
 * Business Rule 7: Auction becomes immutable once WINNER_DECLARED.
 */
export const declareWinner = async (
    actorId: string,
    actorRole: UserRole,
    auctionId: string,
    data: IDeclareWinnerInput
): Promise<IAuction> => {
    const auction = await Auction.findOne({ _id: auctionId, isDeleted: false });
    if (!auction) {
        throw new AppError('Auction not found.', 404, 'AUCTION_NOT_FOUND');
    }

    if (actorRole !== UserRole.ADMIN && auction.organizerId.toString() !== actorId) {
        throw new AppError('Unauthorized to declare winner for this auction.', 403, 'UNAUTHORIZED');
    }

    // Winner declaration can only happen when auction is CLOSED or OPEN
    if (auction.status !== AuctionStatus.CLOSED && auction.status !== AuctionStatus.OPEN && actorRole !== UserRole.ADMIN) {
        throw new AppError(
            `Cannot declare winner when auction is in ${auction.status} status. Auction must be OPEN or CLOSED.`,
            400,
            'INVALID_AUCTION_STATE'
        );
    }

    // Verify membership exists and belongs to the same Chit Group
    const membership = await Membership.findById(data.winningMembershipId);
    if (!membership) {
        throw new AppError('Winning membership record not found.', 404, 'MEMBERSHIP_NOT_FOUND');
    }

    if (membership.chitGroupId.toString() !== auction.groupId.toString()) {
        throw new AppError('Winning membership does not belong to this Chit Group.', 400, 'MEMBERSHIP_MISMATCH');
    }

    if (membership.status !== MembershipStatus.ACTIVE_MEMBER && membership.status !== MembershipStatus.APPROVED) {
        throw new AppError('Winner member is not active in this Chit Group.', 400, 'INACTIVE_MEMBER');
    }

    auction.winningMembershipId = new mongoose.Types.ObjectId(data.winningMembershipId);
    if (data.winningBidId) {
        auction.winningBidId = new mongoose.Types.ObjectId(data.winningBidId);
    }
    
    auction.status = AuctionStatus.WINNER_DECLARED;
    if (!auction.actualEndTime) {
        auction.actualEndTime = new Date();
    }
    if (data.remarks) {
        auction.remarks = data.remarks;
    }

    await auction.save();

    await logAction(actorId, actorRole, 'AUCTION_WINNER_DECLARED', {
        newValue: {
            auctionId,
            winningMembershipId: data.winningMembershipId,
            winningBidId: data.winningBidId,
            status: auction.status
        }
    });

    return auction;
};

/**
 * Retrieves details for a specific auction by ID.
 */
export const getAuctionById = async (auctionId: string): Promise<IAuction> => {
    const auction = await Auction.findOne({ _id: auctionId, isDeleted: false })
        .populate('cycleId', 'cycleNumber status scheduledStartDate')
        .populate('groupId', 'name totalMembers monthlyContribution')
        .populate({
            path: 'winningMembershipId',
            populate: { path: 'userId', select: 'name email' }
        })
        .populate('createdBy', 'name email');

    if (!auction) {
        throw new AppError('Auction not found.', 404, 'AUCTION_NOT_FOUND');
    }

    return auction;
};

/**
 * Retrieves auction by cycleId.
 */
export const getAuctionByCycle = async (cycleId: string): Promise<IAuction> => {
    const auction = await Auction.findOne({ cycleId, isDeleted: false })
        .populate('cycleId', 'cycleNumber status scheduledStartDate')
        .populate('groupId', 'name totalMembers monthlyContribution')
        .populate({
            path: 'winningMembershipId',
            populate: { path: 'userId', select: 'name email' }
        });

    if (!auction) {
        throw new AppError('No auction found for this Chit Cycle.', 404, 'AUCTION_NOT_FOUND');
    }

    return auction;
};

/**
 * Retrieves all auctions for a Chit Group.
 */
export const getAuctionsByGroup = async (groupId: string, status?: AuctionStatus): Promise<IAuction[]> => {
    const query: any = { groupId, isDeleted: false };
    if (status) {
        query.status = status;
    }

    return Auction.find(query)
        .sort({ auctionNumber: 1 })
        .populate('cycleId', 'cycleNumber status')
        .populate({
            path: 'winningMembershipId',
            populate: { path: 'userId', select: 'name email' }
        });
};

/**
 * Soft deletes an auction (only allowed in SCHEDULED status).
 */
export const deleteAuction = async (
    actorId: string,
    actorRole: UserRole,
    auctionId: string
): Promise<{ success: boolean; message: string }> => {
    const auction = await Auction.findOne({ _id: auctionId, isDeleted: false });
    if (!auction) {
        throw new AppError('Auction not found.', 404, 'AUCTION_NOT_FOUND');
    }

    if (actorRole !== UserRole.ADMIN && auction.organizerId.toString() !== actorId) {
        throw new AppError('Unauthorized to delete this auction.', 403, 'UNAUTHORIZED');
    }

    if (auction.status !== AuctionStatus.SCHEDULED && actorRole !== UserRole.ADMIN) {
        throw new AppError(
            `Cannot delete auction in ${auction.status} status. Only SCHEDULED auctions can be deleted.`,
            400,
            'CANNOT_DELETE_ACTIVE_AUCTION'
        );
    }

    auction.isDeleted = true;
    auction.deletedAt = new Date();
    auction.status = AuctionStatus.CANCELLED;

    await auction.save();

    await logAction(actorId, actorRole, 'AUCTION_DELETED', {
        newValue: { auctionId, deletedAt: auction.deletedAt }
    });

    return { success: true, message: 'Auction deleted successfully.' };
};
