import mongoose from 'mongoose';
import { ChitCycleRepository } from '../repositories/ChitCycleRepository.js';
import ChitCycle, { IChitCycle, ChitCycleStatus, PaymentCollectionStatus } from '../models/ChitCycle.js';
import { MembershipStatus } from '@modules/membership/models/Membership.js';
import { UserRole } from '@modules/user/models/User.js';
import { AppError } from '@shared/errors/AppError.js';
import { logAction } from '@shared/logger/auditLogger.js';
import { eventBus } from '@shared/event-bus/EventBus.js';
import { PaymentDomainEventType } from '@modules/payment/events/domainEvents.js';
import { ICreateCycleInput, IRecordWinnerInput } from '../interfaces/IChitCycle.js';
import Auction, { AuctionStatus } from '@modules/auction/models/Auction.js';

export class ChitCycleService {
    private repo: ChitCycleRepository;

    constructor() {
        this.repo = new ChitCycleRepository();
    }

    /**
     * Creates the next sequential ChitCycle for a given ChitGroup.
     */
    public async createCycle(
        actorId: string,
        actorRole: UserRole,
        data: ICreateCycleInput
    ): Promise<IChitCycle> {
        const { groupId, scheduledStartDate, scheduledEndDate, auctionDate, remarks } = data;

        // 1. Verify ChitGroup exists
        const group = await this.repo.findGroupById(groupId);
        if (!group) {
            throw new AppError('Chit Group not found.', 404, 'GROUP_NOT_FOUND');
        }

        // 2. Authorization check
        if (actorRole !== UserRole.ADMIN && group.organizerId.toString() !== actorId) {
            throw new AppError('Unauthorized to create cycles for this Chit Group.', 403, 'UNAUTHORIZED');
        }

        // 3. Find highest existing cycle for this group
        const latestCycle = await this.repo.findLatestByGroupId(groupId);

        let newCycleNumber = 1;
        if (latestCycle) {
            newCycleNumber = latestCycle.cycleNumber + 1;
        }

        // Rule 4: Prevent exceeding group duration
        if (newCycleNumber > group.durationMonths) {
            throw new AppError(
                `Cannot create Cycle ${newCycleNumber}. Group maximum duration is ${group.durationMonths} months.`,
                400,
                'CYCLE_LIMIT_EXCEEDED'
            );
        }

        // 4. Instantiate and save the new ChitCycle with financialConfigSnapshot
        const cycle = new ChitCycle({
            groupId: new mongoose.Types.ObjectId(groupId),
            cycleNumber: newCycleNumber,
            status: ChitCycleStatus.UPCOMING,
            financialConfigSnapshot: group.financialConfig ? ((group.financialConfig as any).toObject ? (group.financialConfig as any).toObject() : group.financialConfig) : undefined,
            scheduledStartDate: new Date(scheduledStartDate),
            scheduledEndDate: scheduledEndDate ? new Date(scheduledEndDate) : null,
            auctionDate: auctionDate ? new Date(auctionDate) : null,
            remarks: remarks || null
        });

        await this.repo.save(cycle);

        // 4B. Auto-provision Auction for this cycle (Enforce 1:1 cycle-to-auction lifecycle)
        try {
            const existingAuction = await Auction.findOne({ cycleId: cycle._id, isDeleted: false });
            if (!existingAuction) {
                const auctionStartTime = cycle.auctionDate || cycle.scheduledStartDate || new Date();
                const minBidPct = group.financialConfig?.commission?.value ?? group.commissionPercent ?? 0;
                const maxBidPct = 50;

                const auction = new Auction({
                    cycleId: cycle._id,
                    groupId: group._id,
                    organizerId: group.organizerId,
                    auctionNumber: cycle.cycleNumber,
                    scheduledStartTime: auctionStartTime,
                    scheduledEndTime: cycle.scheduledEndDate || null,
                    minimumBidPercentage: minBidPct,
                    maximumBidPercentage: maxBidPct,
                    status: (AuctionStatus as any).SCHEDULED || 'SCHEDULED',
                    createdBy: new mongoose.Types.ObjectId(actorId)
                });
                await auction.save();
            }
        } catch (auctionErr) {
            console.error('[ChitCycleService] Failed to auto-provision auction for cycle:', auctionErr);
        }

        // 5. Audit Log
        await logAction(actorId, actorRole, 'CHIT_CYCLE_CREATED', {
            newValue: {
                cycleId: (cycle._id as mongoose.Types.ObjectId).toString(),
                groupId,
                cycleNumber: newCycleNumber,
                status: cycle.status
            }
        });

        return cycle;
    }

    /**
     * Initializes Cycle 1 when a ChitGroup becomes ACTIVE.
     */
    public async initializeFirstCycle(
        actorId: string,
        actorRole: UserRole,
        groupId: string,
        startDate: Date
    ): Promise<IChitCycle> {
        const existingCycle = await this.repo.findByGroupIdAndCycleNumber(groupId, 1);
        if (existingCycle) {
            return existingCycle;
        }

        return this.createCycle(actorId, actorRole, {
            groupId,
            scheduledStartDate: startDate
        });
    }

    /**
     * Activates an UPCOMING cycle.
     */
    public async startCycle(
        actorId: string,
        actorRole: UserRole,
        cycleId: string,
        actualStartDate?: Date | string
    ): Promise<IChitCycle> {
        const cycle = await this.repo.findById(cycleId);
        if (!cycle) {
            throw new AppError('Chit Cycle not found.', 404, 'CYCLE_NOT_FOUND');
        }

        const group = await this.repo.findGroupById(cycle.groupId.toString());
        if (!group) {
            throw new AppError('Associated Chit Group not found.', 404, 'GROUP_NOT_FOUND');
        }

        // Authorization
        if (actorRole !== UserRole.ADMIN && group.organizerId.toString() !== actorId) {
            throw new AppError('Unauthorized to manage cycles for this Chit Group.', 403, 'UNAUTHORIZED');
        }

        if (cycle.status !== ChitCycleStatus.UPCOMING) {
            throw new AppError(
                `Cannot start cycle. Current status is ${cycle.status}. Only UPCOMING cycles can be started.`,
                400,
                'INVALID_CYCLE_STATE'
            );
        }

        // Rule 6: Check for any existing ACTIVE cycle in the same group
        const activeCycleExists = await this.repo.findActiveByGroupId(cycle.groupId.toString());
        if (activeCycleExists) {
            throw new AppError(
                `Group already has an ACTIVE cycle (Cycle ${activeCycleExists.cycleNumber}). Complete or cancel it before starting a new cycle.`,
                400,
                'ACTIVE_CYCLE_EXISTS'
            );
        }

        // Rule 5: Check if previous cycle is completed/cancelled (for cycleNumber > 1)
        if (cycle.cycleNumber > 1) {
            const previousCycle = await this.repo.findByGroupIdAndCycleNumber(cycle.groupId, cycle.cycleNumber - 1);

            if (!previousCycle) {
                throw new AppError(
                    `Previous cycle (Cycle ${cycle.cycleNumber - 1}) was not found. Cycles cannot be skipped.`,
                    400,
                    'PREVIOUS_CYCLE_MISSING'
                );
            }

            if (previousCycle.status !== ChitCycleStatus.COMPLETED && previousCycle.status !== ChitCycleStatus.CANCELLED) {
                throw new AppError(
                    `Previous cycle (Cycle ${previousCycle.cycleNumber}) is currently ${previousCycle.status}. It must be COMPLETED or CANCELLED first.`,
                    400,
                    'PREVIOUS_CYCLE_NOT_FINISHED'
                );
            }
        }

        cycle.status = ChitCycleStatus.ACTIVE;
        cycle.actualStartDate = actualStartDate ? new Date(actualStartDate) : new Date();

        await this.repo.save(cycle);

        // Auto-transition associated Auction to OPEN
        try {
            let auction = await Auction.findOne({ cycleId: cycle._id, isDeleted: false });
            if (!auction) {
                const auctionStartTime = cycle.auctionDate || cycle.scheduledStartDate || cycle.actualStartDate || new Date();
                const minBidPct = group.financialConfig?.commission?.value ?? group.commissionPercent ?? 0;
                auction = new Auction({
                    cycleId: cycle._id,
                    groupId: group._id,
                    organizerId: group.organizerId,
                    auctionNumber: cycle.cycleNumber,
                    scheduledStartTime: auctionStartTime,
                    scheduledEndTime: cycle.scheduledEndDate || null,
                    minimumBidPercentage: minBidPct,
                    maximumBidPercentage: 50,
                    status: (AuctionStatus as any).OPEN || 'OPEN',
                    actualStartTime: cycle.actualStartDate,
                    createdBy: new mongoose.Types.ObjectId(actorId)
                });
                await auction.save();
            } else if (auction.status === (AuctionStatus as any).SCHEDULED || auction.status === 'SCHEDULED') {
                auction.status = (AuctionStatus as any).OPEN || 'OPEN';
                auction.actualStartTime = cycle.actualStartDate;
                await auction.save();
            }
        } catch (auctionErr) {
            console.error('[ChitCycleService] Failed to transition auction to OPEN:', auctionErr);
        }

        await logAction(actorId, actorRole, 'CHIT_CYCLE_STARTED', {
            newValue: {
                cycleId: (cycle._id as mongoose.Types.ObjectId).toString(),
                groupId: cycle.groupId.toString(),
                cycleNumber: cycle.cycleNumber,
                actualStartDate: cycle.actualStartDate
            }
        });

        return cycle;
    }

    /**
     * Completes an ACTIVE cycle.
     */
    public async completeCycle(
        actorId: string,
        actorRole: UserRole,
        cycleId: string,
        actualEndDate?: Date | string
    ): Promise<IChitCycle> {
        const cycle = await this.repo.findById(cycleId);
        if (!cycle) {
            throw new AppError('Chit Cycle not found.', 404, 'CYCLE_NOT_FOUND');
        }

        const group = await this.repo.findGroupById(cycle.groupId.toString());
        if (!group) {
            throw new AppError('Associated Chit Group not found.', 404, 'GROUP_NOT_FOUND');
        }

        if (actorRole !== UserRole.ADMIN && group.organizerId.toString() !== actorId) {
            throw new AppError('Unauthorized to manage cycles for this Chit Group.', 403, 'UNAUTHORIZED');
        }

        if (cycle.status !== ChitCycleStatus.ACTIVE) {
            throw new AppError(
                `Cannot complete cycle. Current status is ${cycle.status}. Only ACTIVE cycles can be completed.`,
                400,
                'INVALID_CYCLE_STATE'
            );
        }

        cycle.status = ChitCycleStatus.COMPLETED;
        cycle.actualEndDate = actualEndDate ? new Date(actualEndDate) : new Date();

        await this.repo.save(cycle);

        await logAction(actorId, actorRole, 'CHIT_CYCLE_COMPLETED', {
            newValue: {
                cycleId: (cycle._id as mongoose.Types.ObjectId).toString(),
                groupId: cycle.groupId.toString(),
                cycleNumber: cycle.cycleNumber,
                actualEndDate: cycle.actualEndDate
            }
        });

        return cycle;
    }

    /**
     * Cancels a cycle.
     */
    public async cancelCycle(
        actorId: string,
        actorRole: UserRole,
        cycleId: string,
        remarks?: string
    ): Promise<IChitCycle> {
        const cycle = await this.repo.findById(cycleId);
        if (!cycle) {
            throw new AppError('Chit Cycle not found.', 404, 'CYCLE_NOT_FOUND');
        }

        const group = await this.repo.findGroupById(cycle.groupId.toString());
        if (!group) {
            throw new AppError('Associated Chit Group not found.', 404, 'GROUP_NOT_FOUND');
        }

        if (actorRole !== UserRole.ADMIN && group.organizerId.toString() !== actorId) {
            throw new AppError('Unauthorized to manage cycles for this Chit Group.', 403, 'UNAUTHORIZED');
        }

        if (cycle.status === ChitCycleStatus.COMPLETED) {
            throw new AppError('Completed cycles cannot be cancelled.', 400, 'INVALID_CYCLE_STATE');
        }

        const previousStatus = cycle.status;
        cycle.status = ChitCycleStatus.CANCELLED;
        if (remarks) {
            cycle.remarks = remarks;
        }

        await this.repo.save(cycle);

        await logAction(actorId, actorRole, 'CHIT_CYCLE_CANCELLED', {
            previousValue: { status: previousStatus },
            newValue: {
                cycleId: (cycle._id as mongoose.Types.ObjectId).toString(),
                groupId: cycle.groupId.toString(),
                cycleNumber: cycle.cycleNumber,
                status: cycle.status,
                remarks
            }
        });

        return cycle;
    }

    /**
     * Records auction winner details for a ChitCycle.
     */
    public async recordWinner(
        actorId: string,
        actorRole: UserRole,
        cycleId: string,
        data: IRecordWinnerInput
    ): Promise<IChitCycle> {
        const cycle = await this.repo.findById(cycleId);
        if (!cycle) {
            throw new AppError('Chit Cycle not found.', 404, 'CYCLE_NOT_FOUND');
        }

        const group = await this.repo.findGroupById(cycle.groupId.toString());
        if (!group) {
            throw new AppError('Associated Chit Group not found.', 404, 'GROUP_NOT_FOUND');
        }

        if (actorRole !== UserRole.ADMIN && group.organizerId.toString() !== actorId) {
            throw new AppError('Unauthorized to manage cycles for this Chit Group.', 403, 'UNAUTHORIZED');
        }

        if (cycle.status !== ChitCycleStatus.ACTIVE) {
            throw new AppError(
                `Winner can only be recorded for an ACTIVE cycle. Current status is ${cycle.status}.`,
                400,
                'INVALID_CYCLE_STATE'
            );
        }

        const membership = await this.repo.findMembershipById(data.winnerMembershipId);
        if (!membership) {
            throw new AppError('Winner membership record not found.', 404, 'MEMBERSHIP_NOT_FOUND');
        }

        if (membership.chitGroupId.toString() !== cycle.groupId.toString()) {
            throw new AppError('Membership does not belong to this Chit Group.', 400, 'MEMBERSHIP_MISMATCH');
        }

        if (membership.status !== MembershipStatus.ACTIVE_MEMBER && membership.status !== MembershipStatus.APPROVED) {
            throw new AppError('Member is not active in this Chit Group.', 400, 'INACTIVE_MEMBER');
        }

        cycle.winnerMembershipId = new mongoose.Types.ObjectId(data.winnerMembershipId);
        if (data.winningBidPercentage !== undefined) cycle.winningBidPercentage = data.winningBidPercentage;
        if (data.winningBidAmount !== undefined) cycle.winningBidAmount = data.winningBidAmount;
        if (data.prizeAmount !== undefined) cycle.prizeAmount = data.prizeAmount;
        if (data.dividendAmount !== undefined) cycle.dividendAmount = data.dividendAmount;
        if (data.auctionDate) cycle.auctionDate = new Date(data.auctionDate);
        if (data.remarks) cycle.remarks = data.remarks;

        await this.repo.save(cycle);

        // Also update matching Auction document if present
        const auction = await Auction.findOne({ cycleId: cycle._id, isDeleted: false });
        if (auction) {
            auction.winningMembershipId = new mongoose.Types.ObjectId(data.winnerMembershipId);
            auction.status = 'WINNER_DECLARED' as any;
            if (data.remarks) auction.remarks = data.remarks;
            await auction.save();
        }

        membership.isWinner = true;
        membership.payoutMonth = cycle.cycleNumber;
        await membership.save();

        await logAction(actorId, actorRole, 'CHIT_CYCLE_WINNER_RECORDED', {
            newValue: {
                cycleId: (cycle._id as mongoose.Types.ObjectId).toString(),
                winnerMembershipId: data.winnerMembershipId,
                winningBidAmount: data.winningBidAmount,
                prizeAmount: data.prizeAmount
            }
        });

        return cycle;
    }

    /**
     * Retrieves all cycles for a specific group.
     */
    public async getCyclesByGroup(groupId: string, status?: ChitCycleStatus): Promise<IChitCycle[]> {
        return await this.repo.findByGroup(groupId, status);
    }

    /**
     * Retrieves single cycle details by ID.
     */
    public async getCycleById(cycleId: string): Promise<IChitCycle> {
        const cycle = await this.repo.findPopulatedById(cycleId);
        if (!cycle) {
            throw new AppError('Chit Cycle not found.', 404, 'CYCLE_NOT_FOUND');
        }
        return cycle;
    }

    /**
     * Retrieves current ACTIVE cycle for a group.
     */
    public async getActiveCycle(groupId: string): Promise<IChitCycle | null> {
        return await this.repo.findPopulatedActiveByGroupId(groupId);
    }

    /**
     * Opens payment collections for a chit cycle.
     */
    public async openCollections(
        actorId: string,
        actorRole: UserRole,
        cycleId: string
    ): Promise<IChitCycle> {
        const cycle = await this.repo.findById(cycleId);
        if (!cycle) {
            throw new AppError('Chit Cycle not found.', 404, 'CYCLE_NOT_FOUND');
        }

        const group = await this.repo.findGroupById(cycle.groupId.toString());
        if (!group) {
            throw new AppError('Associated Chit Group not found.', 404, 'GROUP_NOT_FOUND');
        }

        if (actorRole !== UserRole.ADMIN && group.organizerId.toString() !== actorId) {
            throw new AppError('Unauthorized to manage payment collections for this Chit Group.', 403, 'UNAUTHORIZED');
        }

        if (!cycle.winnerMembershipId) {
            throw new AppError(
                'Cannot open payment collections. Winner must be declared for this cycle first.',
                400,
                'WINNER_NOT_DECLARED'
            );
        }

        const currentStatus = cycle.paymentCollection?.status || PaymentCollectionStatus.NOT_STARTED;

        if (currentStatus === PaymentCollectionStatus.OPEN) {
            throw new AppError('Payment collections are already OPEN for this cycle.', 400, 'COLLECTIONS_ALREADY_OPEN');
        }

        if (currentStatus === PaymentCollectionStatus.CLOSED) {
            throw new AppError('Payment collections are CLOSED for this cycle and cannot be reopened.', 400, 'COLLECTIONS_CLOSED');
        }

        cycle.paymentCollection = {
            status: PaymentCollectionStatus.OPEN,
            openedAt: new Date(),
            openedBy: new mongoose.Types.ObjectId(actorId),
            closedAt: cycle.paymentCollection?.closedAt || null,
            closedBy: cycle.paymentCollection?.closedBy || null,
            remarks: cycle.paymentCollection?.remarks || null
        };

        await this.repo.save(cycle);

        eventBus.publish({
            eventType: PaymentDomainEventType.COLLECTIONS_OPENED,
            timestamp: new Date(),
            data: {
                cycleId: (cycle._id as mongoose.Types.ObjectId).toString(),
                groupId: cycle.groupId.toString(),
                openedBy: actorId
            } as any
        });

        await logAction(actorId, actorRole, 'COLLECTIONS_OPENED', {
            newValue: {
                cycleId: (cycle._id as mongoose.Types.ObjectId).toString(),
                groupId: cycle.groupId.toString(),
                cycleNumber: cycle.cycleNumber,
                paymentCollection: cycle.paymentCollection
            }
        });

        return cycle;
    }

    /**
     * Closes payment collections for a chit cycle.
     */
    public async closeCollections(
        actorId: string,
        actorRole: UserRole,
        cycleId: string
    ): Promise<IChitCycle> {
        const cycle = await this.repo.findById(cycleId);
        if (!cycle) {
            throw new AppError('Chit Cycle not found.', 404, 'CYCLE_NOT_FOUND');
        }

        const group = await this.repo.findGroupById(cycle.groupId.toString());
        if (!group) {
            throw new AppError('Associated Chit Group not found.', 404, 'GROUP_NOT_FOUND');
        }

        if (actorRole !== UserRole.ADMIN && group.organizerId.toString() !== actorId) {
            throw new AppError('Unauthorized to manage payment collections for this Chit Group.', 403, 'UNAUTHORIZED');
        }

        const currentStatus = cycle.paymentCollection?.status || PaymentCollectionStatus.NOT_STARTED;

        if (currentStatus === PaymentCollectionStatus.NOT_STARTED) {
            throw new AppError('Cannot close payment collections before opening them.', 400, 'COLLECTIONS_NOT_STARTED');
        }

        if (currentStatus === PaymentCollectionStatus.CLOSED) {
            throw new AppError('Payment collections are already CLOSED for this cycle.', 400, 'COLLECTIONS_ALREADY_CLOSED');
        }

        cycle.paymentCollection = {
            status: PaymentCollectionStatus.CLOSED,
            openedAt: cycle.paymentCollection?.openedAt || null,
            openedBy: cycle.paymentCollection?.openedBy || null,
            closedAt: new Date(),
            closedBy: new mongoose.Types.ObjectId(actorId),
            remarks: cycle.paymentCollection?.remarks || null
        };

        await this.repo.save(cycle);

        eventBus.publish({
            eventType: PaymentDomainEventType.COLLECTIONS_CLOSED,
            timestamp: new Date(),
            data: {
                cycleId: (cycle._id as mongoose.Types.ObjectId).toString(),
                groupId: cycle.groupId.toString(),
                closedBy: actorId
            } as any
        });

        await logAction(actorId, actorRole, 'COLLECTIONS_CLOSED', {
            newValue: {
                cycleId: (cycle._id as mongoose.Types.ObjectId).toString(),
                groupId: cycle.groupId.toString(),
                cycleNumber: cycle.cycleNumber,
                paymentCollection: cycle.paymentCollection
            }
        });

        return cycle;
    }

    /**
     * Gets payment collection status for a cycle.
     */
    public async getPaymentStatus(cycleId: string) {
        const cycle = await this.repo.findById(cycleId);
        if (!cycle) {
            throw new AppError('Chit Cycle not found.', 404, 'CYCLE_NOT_FOUND');
        }

        return {
            cycleId: cycle._id,
            groupId: cycle.groupId,
            cycleNumber: cycle.cycleNumber,
            paymentCollection: cycle.paymentCollection || { status: PaymentCollectionStatus.NOT_STARTED }
        };
    }
}
