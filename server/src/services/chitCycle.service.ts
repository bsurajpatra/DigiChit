import mongoose from 'mongoose';
import ChitCycle, { IChitCycle, ChitCycleStatus } from '../models/ChitCycle.js';
import ChitGroup from '../models/ChitGroup.js';
import Membership, { MembershipStatus } from '../models/Membership.js';
import { AppError } from '../utils/appError.js';
import { logAction } from '../utils/auditLogger.js';
import { UserRole } from '../models/User.js';

export interface ICreateCycleInput {
    groupId: string;
    scheduledStartDate: Date | string;
    scheduledEndDate?: Date | string;
    auctionDate?: Date | string;
    remarks?: string;
}

export interface IRecordWinnerInput {
    winnerMembershipId: string;
    winningBidPercentage?: number;
    winningBidAmount?: number;
    prizeAmount?: number;
    dividendAmount?: number;
    auctionDate?: Date | string;
    remarks?: string;
}

/**
 * Creates the next sequential ChitCycle for a given ChitGroup.
 * 
 * Business Rules Enforced:
 * - Cycle numbering starts at 1.
 * - One group can have only one Cycle 1.
 * - Cycle numbers are sequential and cannot be skipped (next = currentMax + 1).
 * - Total cycles cannot exceed the group's total durationMonths.
 */
export const createCycle = async (
    actorId: string,
    actorRole: UserRole,
    data: ICreateCycleInput
): Promise<IChitCycle> => {
    const { groupId, scheduledStartDate, scheduledEndDate, auctionDate, remarks } = data;

    // 1. Verify ChitGroup exists
    const group = await ChitGroup.findById(groupId);
    if (!group) {
        throw new AppError('Chit Group not found.', 404, 'GROUP_NOT_FOUND');
    }

    // 2. Authorization check: Only group organizer or Admin can create cycles
    if (actorRole !== UserRole.ADMIN && group.organizerId.toString() !== actorId) {
        throw new AppError('Unauthorized to create cycles for this Chit Group.', 403, 'UNAUTHORIZED');
    }

    // 3. Find highest existing cycle for this group
    const latestCycle = await ChitCycle.findOne({ groupId }).sort({ cycleNumber: -1 });

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
        financialConfigSnapshot: group.financialConfig ? (group.financialConfig.toObject ? group.financialConfig.toObject() : group.financialConfig) : undefined,
        scheduledStartDate: new Date(scheduledStartDate),
        scheduledEndDate: scheduledEndDate ? new Date(scheduledEndDate) : null,
        auctionDate: auctionDate ? new Date(auctionDate) : null,
        remarks: remarks || null
    });

    await cycle.save();

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
};

/**
 * Initializes Cycle 1 when a ChitGroup becomes ACTIVE.
 * Utility function to be invoked during group activation.
 */
export const initializeFirstCycle = async (
    actorId: string,
    actorRole: UserRole,
    groupId: string,
    startDate: Date
): Promise<IChitCycle> => {
    const existingCycle = await ChitCycle.findOne({ groupId, cycleNumber: 1 });
    if (existingCycle) {
        return existingCycle;
    }

    return createCycle(actorId, actorRole, {
        groupId,
        scheduledStartDate: startDate
    });
};

/**
 * Activates an UPCOMING cycle.
 * 
 * Business Rules Enforced:
 * - Only one ACTIVE cycle may exist for a group at any given time.
 * - Previous cycle (cycleNumber - 1) must be COMPLETED or CANCELLED before starting next cycle.
 */
export const startCycle = async (
    actorId: string,
    actorRole: UserRole,
    cycleId: string,
    actualStartDate?: Date | string
): Promise<IChitCycle> => {
    const cycle = await ChitCycle.findById(cycleId);
    if (!cycle) {
        throw new AppError('Chit Cycle not found.', 404, 'CYCLE_NOT_FOUND');
    }

    const group = await ChitGroup.findById(cycle.groupId);
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
    const activeCycleExists = await ChitCycle.findOne({
        groupId: cycle.groupId,
        status: ChitCycleStatus.ACTIVE
    });

    if (activeCycleExists) {
        throw new AppError(
            `Group already has an ACTIVE cycle (Cycle ${activeCycleExists.cycleNumber}). Complete or cancel it before starting a new cycle.`,
            400,
            'ACTIVE_CYCLE_EXISTS'
        );
    }

    // Rule 5: Check if previous cycle is completed/cancelled (for cycleNumber > 1)
    if (cycle.cycleNumber > 1) {
        const previousCycle = await ChitCycle.findOne({
            groupId: cycle.groupId,
            cycleNumber: cycle.cycleNumber - 1
        });

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

    await cycle.save();

    await logAction(actorId, actorRole, 'CHIT_CYCLE_STARTED', {
        newValue: {
            cycleId: (cycle._id as mongoose.Types.ObjectId).toString(),
            groupId: cycle.groupId.toString(),
            cycleNumber: cycle.cycleNumber,
            actualStartDate: cycle.actualStartDate
        }
    });

    return cycle;
};

/**
 * Completes an ACTIVE cycle.
 */
export const completeCycle = async (
    actorId: string,
    actorRole: UserRole,
    cycleId: string,
    actualEndDate?: Date | string
): Promise<IChitCycle> => {
    const cycle = await ChitCycle.findById(cycleId);
    if (!cycle) {
        throw new AppError('Chit Cycle not found.', 404, 'CYCLE_NOT_FOUND');
    }

    const group = await ChitGroup.findById(cycle.groupId);
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

    await cycle.save();

    await logAction(actorId, actorRole, 'CHIT_CYCLE_COMPLETED', {
        newValue: {
            cycleId: (cycle._id as mongoose.Types.ObjectId).toString(),
            groupId: cycle.groupId.toString(),
            cycleNumber: cycle.cycleNumber,
            actualEndDate: cycle.actualEndDate
        }
    });

    return cycle;
};

/**
 * Cancels a cycle (e.g. operational override or emergency cancellation).
 */
export const cancelCycle = async (
    actorId: string,
    actorRole: UserRole,
    cycleId: string,
    remarks?: string
): Promise<IChitCycle> => {
    const cycle = await ChitCycle.findById(cycleId);
    if (!cycle) {
        throw new AppError('Chit Cycle not found.', 404, 'CYCLE_NOT_FOUND');
    }

    const group = await ChitGroup.findById(cycle.groupId);
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

    await cycle.save();

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
};

/**
 * Records auction winner details for a ChitCycle.
 * 
 * Rule 7: Winner fields remain null until auction completion.
 */
export const recordWinner = async (
    actorId: string,
    actorRole: UserRole,
    cycleId: string,
    data: IRecordWinnerInput
): Promise<IChitCycle> => {
    const cycle = await ChitCycle.findById(cycleId);
    if (!cycle) {
        throw new AppError('Chit Cycle not found.', 404, 'CYCLE_NOT_FOUND');
    }

    const group = await ChitGroup.findById(cycle.groupId);
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

    // Verify winner membership exists and belongs to this chit group
    const membership = await Membership.findById(data.winnerMembershipId);
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

    await cycle.save();

    // Mark member as winner in membership record
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
};

/**
 * Retrieves all cycles for a specific group, sorted by cycleNumber.
 */
export const getCyclesByGroup = async (groupId: string, status?: ChitCycleStatus): Promise<IChitCycle[]> => {
    const query: any = { groupId };
    if (status) {
        query.status = status;
    }

    return ChitCycle.find(query)
        .sort({ cycleNumber: 1 })
        .populate({
            path: 'winnerMembershipId',
            populate: {
                path: 'userId',
                select: 'name email'
            }
        });
};

/**
 * Retrieves single cycle details by ID.
 */
export const getCycleById = async (cycleId: string): Promise<IChitCycle> => {
    const cycle = await ChitCycle.findById(cycleId)
        .populate('groupId', 'name totalMembers monthlyContribution organizerId status')
        .populate({
            path: 'winnerMembershipId',
            populate: {
                path: 'userId',
                select: 'name email'
            }
        });

    if (!cycle) {
        throw new AppError('Chit Cycle not found.', 404, 'CYCLE_NOT_FOUND');
    }

    return cycle;
};

/**
 * Retrieves the current ACTIVE cycle for a specific group.
 */
export const getActiveCycle = async (groupId: string): Promise<IChitCycle | null> => {
    return ChitCycle.findOne({ groupId, status: ChitCycleStatus.ACTIVE })
        .populate({
            path: 'winnerMembershipId',
            populate: {
                path: 'userId',
                select: 'name email'
            }
        });
};
