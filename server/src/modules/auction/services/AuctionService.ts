import { eventBus } from '@shared/event-bus/EventBus.js';
import mongoose from 'mongoose';
import { AuctionRepository } from '../repositories/AuctionRepository.js';
import Auction, { IAuction, AuctionStatus } from '../models/Auction.js';
import { ChitCycleStatus } from '@modules/chit-cycle/models/ChitCycle.js';
import { MembershipStatus } from '@modules/membership/models/Membership.js';
import { UserRole } from '@modules/user/models/User.js';
import { AppError } from '@shared/errors/AppError.js';
import { logAction } from '@shared/logger/auditLogger.js';
import {
    ICreateAuctionInput,
    IUpdateAuctionInput,
    IDeclareWinnerInput
} from '../interfaces/IAuction.js';

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

export class AuctionService {
    private repo: AuctionRepository;

    constructor() {
        this.repo = new AuctionRepository();
    }

    /**
     * Creates an Auction for a ChitCycle.
     */
    public async createAuction(
        actorId: string,
        actorRole: UserRole,
        data: ICreateAuctionInput
    ): Promise<IAuction> {
        const { cycleId, scheduledStartTime, scheduledEndTime, minimumBidPercentage, maximumBidPercentage, remarks } = data;

        // 1. Verify ChitCycle exists
        const cycle = await this.repo.findCycleById(cycleId);
        if (!cycle) {
            throw new AppError('Chit Cycle not found.', 404, 'CYCLE_NOT_FOUND');
        }

        if (cycle.status === ChitCycleStatus.CANCELLED) {
            throw new AppError('Cannot create an auction for a CANCELLED Chit Cycle.', 400, 'CYCLE_CANCELLED');
        }

        // 2. Verify ChitGroup exists & authorization
        const group = await this.repo.findGroupById(cycle.groupId);
        if (!group) {
            throw new AppError('Associated Chit Group not found.', 404, 'GROUP_NOT_FOUND');
        }

        if (actorRole !== UserRole.ADMIN && group.organizerId.toString() !== actorId) {
            throw new AppError('Unauthorized to create an auction for this Chit Group.', 403, 'UNAUTHORIZED');
        }

        // 3. Rule 1: Verify no existing auction for this cycle
        const existingAuction = await this.repo.findActiveByCycleId(cycleId);
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

        await this.repo.save(auction);

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
    }

    /**
     * Updates schedule and metadata for an auction in SCHEDULED status.
     */
    public async updateAuction(
        actorId: string,
        actorRole: UserRole,
        auctionId: string,
        data: IUpdateAuctionInput
    ): Promise<IAuction> {
        const auction = await this.repo.findById(auctionId);
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

        await this.repo.save(auction);

        await logAction(actorId, actorRole, 'AUCTION_UPDATED', {
            newValue: { auctionId, status: auction.status, scheduledStartTime: auction.scheduledStartTime }
        });

        return auction;
    }

    /**
     * Transitions auction through its valid lifecycle states.
     */
    public async updateAuctionStatus(
        actorId: string,
        actorRole: UserRole,
        auctionId: string,
        targetStatus: AuctionStatus,
        remarks?: string
    ): Promise<IAuction> {
        const auction = await this.repo.findById(auctionId);
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

        await this.repo.save(auction);

        await logAction(actorId, actorRole, 'AUCTION_STATUS_CHANGED', {
            previousValue: { status: currentStatus },
            newValue: { auctionId, status: targetStatus, remarks }
        });

        return auction;
    }

    /**
     * Declares winner of an auction.
     */
    public async declareWinner(
        actorId: string,
        actorRole: UserRole,
        auctionId: string,
        data: IDeclareWinnerInput
    ): Promise<IAuction> {
        const auction = await this.repo.findById(auctionId);
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
        const membership = await this.repo.findMembershipById(data.winningMembershipId);
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

        await this.repo.save(auction);

        // Sync winner details to ChitCycle document
        const cycle = await this.repo.findCycleById(auction.cycleId.toString());
        if (cycle) {
            cycle.winnerMembershipId = new mongoose.Types.ObjectId(data.winningMembershipId);
            let winningBid: any = null;
            if (data.winningBidId) {
                winningBid = await this.repo.findBidById(data.winningBidId);
                if (winningBid) {
                    cycle.winningBidPercentage = winningBid.bidPercentage;
                    cycle.winningBidAmount = winningBid.bidAmount || null;
                }
            }
            if (!cycle.winningBidAmount) {
                const group = await this.repo.findGroupById(auction.groupId);
                const pct = cycle.winningBidPercentage || winningBid?.bidPercentage || auction.minimumBidPercentage;
                if (group && pct) {
                    const totalVal = group.monthlyContribution * group.totalMembers;
                    cycle.winningBidAmount = (totalVal * pct) / 100;
                }
            }
            if (data.remarks) {
                cycle.remarks = data.remarks;
            }
            await this.repo.saveCycle(cycle);
        }

        membership.isWinner = true;
        membership.payoutMonth = cycle?.cycleNumber || 1;
        await membership.save();

        await logAction(actorId, actorRole, 'AUCTION_WINNER_DECLARED', {
            newValue: {
                auctionId,
                winningMembershipId: data.winningMembershipId,
                winningBidId: data.winningBidId,
                status: auction.status
            }
        });
        eventBus.publish({
            eventType: 'AUCTION_WINNER_DECLARED',
            timestamp: new Date(),
            data: {
                auctionId: (auction._id as mongoose.Types.ObjectId).toString(),
                groupId: auction.groupId.toString(),
                cycleId: auction.cycleId.toString(),
                winningMembershipId: data.winningMembershipId,
                winningBidId: data.winningBidId || (auction.winningBidId ? auction.winningBidId.toString() : null),
                winnerUserId: membership.userId.toString(),
                winningBidPercentage: cycle?.winningBidPercentage,
                winningBidAmount: cycle?.winningBidAmount,
                declaredBy: actorId
            }
        });


        return auction;
    }

    /**
     * Retrieves details for a specific auction by ID.
     */
    public async getAuctionById(auctionId: string): Promise<IAuction> {
        const auction = await this.repo.findPopulatedById(auctionId);
        if (!auction) {
            throw new AppError('Auction not found.', 404, 'AUCTION_NOT_FOUND');
        }
        return auction;
    }

    /**
     * Retrieves auction by cycleId.
     */
    public async getAuctionByCycle(cycleId: string): Promise<IAuction> {
        const auction = await this.repo.findPopulatedByCycleId(cycleId);
        if (!auction) {
            throw new AppError('No auction found for this Chit Cycle.', 404, 'AUCTION_NOT_FOUND');
        }
        return auction;
    }

    /**
     * Retrieves all auctions for a Chit Group.
     */
    public async getAuctionsByGroup(groupId: string, status?: AuctionStatus): Promise<IAuction[]> {
        return await this.repo.findByGroup(groupId, status);
    }

    /**
     * Soft deletes an auction (only allowed in SCHEDULED status).
     */
    public async deleteAuction(
        actorId: string,
        actorRole: UserRole,
        auctionId: string
    ): Promise<{ success: boolean; message: string }> {
        const auction = await this.repo.findById(auctionId);
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

        await this.repo.save(auction);

        await logAction(actorId, actorRole, 'AUCTION_DELETED', {
            newValue: { auctionId, deletedAt: auction.deletedAt }
        });

        return { success: true, message: 'Auction deleted successfully.' };
    }
}
