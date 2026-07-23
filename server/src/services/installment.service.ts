import mongoose from 'mongoose';
import Installment, { IInstallment, PaymentStatus } from '../models/Installment.js';
import ChitCycle from '../models/ChitCycle.js';
import ChitGroup from '../models/ChitGroup.js';
import Membership, { MembershipStatus } from '../models/Membership.js';
import { AppError } from '../utils/appError.js';
import { logAction } from '../utils/auditLogger.js';
import { UserRole } from '../models/User.js';

export interface IGenerateInstallmentsInput {
    cycleId: string;
    dueDate?: Date | string;
}

export interface IUpdateInstallmentInput {
    amount?: number;
    dueDate?: Date | string;
    lateFee?: number;
    remarks?: string;
}

export interface IUpdateInstallmentStatusInput {
    paymentStatus: PaymentStatus;
    paidAmount?: number;
    paymentMethod?: string;
    transactionId?: string;
    remarks?: string;
}

/**
 * Bulk generates Installment obligation records for all active members in a ChitCycle.
 * 
 * Business Rules Enforced:
 * - Rule 1: Every ACTIVE Membership should have one Installment per ChitCycle.
 * - Rule 2: Installments are generated automatically/bulk created for a ChitCycle.
 * - Rule 3: Membership and Cycle combination must be unique (idempotent generation).
 * - Rule 4: Amount is initialized from ChitGroup monthlyContribution.
 * - Rule 7 & 8: paidDate and transactionId remain null initially.
 */
export const generateInstallmentsForCycle = async (
    actorId: string,
    actorRole: UserRole,
    cycleId: string,
    overrideDueDate?: Date | string
): Promise<{ createdCount: number; existingCount: number; installments: IInstallment[] }> => {
    // 1. Verify ChitCycle
    const cycle = await ChitCycle.findById(cycleId);
    if (!cycle) {
        throw new AppError('Chit Cycle not found.', 404, 'CYCLE_NOT_FOUND');
    }

    // 2. Verify ChitGroup & Authorization
    const group = await ChitGroup.findById(cycle.groupId);
    if (!group) {
        throw new AppError('Associated Chit Group not found.', 404, 'GROUP_NOT_FOUND');
    }

    if (actorRole !== UserRole.ADMIN && group.organizerId.toString() !== actorId) {
        throw new AppError('Unauthorized to generate installments for this Chit Group.', 403, 'UNAUTHORIZED');
    }

    // 3. Rule 1: Retrieve all active and approved members for this group
    const activeMemberships = await Membership.find({
        chitGroupId: group._id,
        status: { $in: [MembershipStatus.ACTIVE_MEMBER, MembershipStatus.APPROVED] }
    });

    if (activeMemberships.length === 0) {
        throw new AppError('No active members found for this Chit Group.', 400, 'NO_ACTIVE_MEMBERS');
    }

    // Determine due date (default: 7 days after cycle scheduled/actual start date)
    let computedDueDate: Date;
    if (overrideDueDate) {
        computedDueDate = new Date(overrideDueDate);
    } else {
        const baseDate = cycle.actualStartDate || cycle.scheduledStartDate;
        computedDueDate = new Date(baseDate);
        computedDueDate.setDate(computedDueDate.getDate() + 7);
    }

    let createdCount = 0;
    let existingCount = 0;
    const installments: IInstallment[] = [];

    // 4. Iterate over members and create installment records idempotently
    for (const membership of activeMemberships) {
        const existingInstallment = await Installment.findOne({
            cycleId: cycle._id,
            membershipId: membership._id
        });

        if (existingInstallment) {
            existingCount++;
            installments.push(existingInstallment);
            continue;
        }

        const installment = new Installment({
            membershipId: membership._id,
            userId: membership.userId,
            groupId: group._id,
            cycleId: cycle._id,
            installmentNumber: cycle.cycleNumber,
            amount: group.monthlyContribution, // Rule 4
            paidAmount: 0,                       // Rule 10 (partial payment support)
            dueDate: computedDueDate,
            paidDate: null,                      // Rule 7
            paymentStatus: PaymentStatus.PENDING,
            paymentMethod: null,
            transactionId: null,                 // Rule 8
            lateFee: 0,
            remarks: null
        });

        await installment.save();
        createdCount++;
        installments.push(installment);
    }

    // 5. Audit Log
    await logAction(actorId, actorRole, 'INSTALLMENTS_GENERATED', {
        newValue: {
            cycleId: cycle._id.toString(),
            groupId: group._id.toString(),
            createdCount,
            existingCount,
            totalMembers: activeMemberships.length
        }
    });

    return { createdCount, existingCount, installments };
};

/**
 * Updates payment status and details of an installment obligation.
 * 
 * Business Rules Enforced:
 * - Rule 7: paidDate set when status is PAID or PARTIALLY_PAID.
 * - Rule 10: Supports partial payments.
 * - Rule 12: Allows organizer/admin to WAIVE installments.
 */
export const updateInstallmentStatus = async (
    actorId: string,
    actorRole: UserRole,
    installmentId: string,
    data: IUpdateInstallmentStatusInput
): Promise<IInstallment> => {
    const installment = await Installment.findById(installmentId);
    if (!installment) {
        throw new AppError('Installment record not found.', 404, 'INSTALLMENT_NOT_FOUND');
    }

    const group = await ChitGroup.findById(installment.groupId);
    if (!group) {
        throw new AppError('Associated Chit Group not found.', 404, 'GROUP_NOT_FOUND');
    }

    if (actorRole !== UserRole.ADMIN && group.organizerId.toString() !== actorId) {
        throw new AppError('Unauthorized to update installment status.', 403, 'UNAUTHORIZED');
    }

    const previousStatus = installment.paymentStatus;
    const targetStatus = data.paymentStatus;

    installment.paymentStatus = targetStatus;

    if (targetStatus === PaymentStatus.PAID) {
        installment.paidAmount = data.paidAmount !== undefined ? data.paidAmount : installment.amount;
        installment.paidDate = new Date();
    } else if (targetStatus === PaymentStatus.PARTIALLY_PAID) {
        if (data.paidAmount === undefined || data.paidAmount <= 0) {
            throw new AppError('Paid amount must be provided for partial payments.', 400, 'INVALID_PAID_AMOUNT');
        }
        installment.paidAmount = data.paidAmount;
        installment.paidDate = new Date();
    } else if (targetStatus === PaymentStatus.WAIVED) {
        // Rule 12: Waived by organizer/admin
        installment.paidAmount = 0;
        installment.paidDate = null;
    } else if (targetStatus === PaymentStatus.PENDING || targetStatus === PaymentStatus.FAILED || targetStatus === PaymentStatus.OVERDUE) {
        installment.paidDate = null;
    }

    if (data.paymentMethod) installment.paymentMethod = data.paymentMethod;
    if (data.transactionId) installment.transactionId = new mongoose.Types.ObjectId(data.transactionId);
    if (data.remarks) installment.remarks = data.remarks;

    await installment.save();

    await logAction(actorId, actorRole, 'INSTALLMENT_STATUS_UPDATED', {
        previousValue: { status: previousStatus },
        newValue: {
            installmentId,
            paymentStatus: targetStatus,
            paidAmount: installment.paidAmount,
            remarks: installment.remarks
        }
    });

    return installment;
};

/**
 * Updates general installment properties (amount, due date, late fee, remarks).
 */
export const updateInstallment = async (
    actorId: string,
    actorRole: UserRole,
    installmentId: string,
    data: IUpdateInstallmentInput
): Promise<IInstallment> => {
    const installment = await Installment.findById(installmentId);
    if (!installment) {
        throw new AppError('Installment record not found.', 404, 'INSTALLMENT_NOT_FOUND');
    }

    const group = await ChitGroup.findById(installment.groupId);
    if (!group) {
        throw new AppError('Associated Chit Group not found.', 404, 'GROUP_NOT_FOUND');
    }

    if (actorRole !== UserRole.ADMIN && group.organizerId.toString() !== actorId) {
        throw new AppError('Unauthorized to update this installment.', 403, 'UNAUTHORIZED');
    }

    if (data.amount !== undefined) installment.amount = data.amount;
    if (data.dueDate) installment.dueDate = new Date(data.dueDate);
    if (data.lateFee !== undefined) installment.lateFee = data.lateFee;
    if (data.remarks !== undefined) installment.remarks = data.remarks;

    await installment.save();

    await logAction(actorId, actorRole, 'INSTALLMENT_UPDATED', {
        newValue: {
            installmentId,
            amount: installment.amount,
            dueDate: installment.dueDate,
            lateFee: installment.lateFee
        }
    });

    return installment;
};

/**
 * Fetches single installment details by ID.
 */
export const getInstallmentById = async (
    actorId: string,
    actorRole: UserRole,
    installmentId: string
): Promise<IInstallment> => {
    const installment = await Installment.findById(installmentId)
        .populate('userId', 'name email')
        .populate('membershipId')
        .populate('cycleId', 'cycleNumber status scheduledStartDate')
        .populate('groupId', 'name monthlyContribution');

    if (!installment) {
        throw new AppError('Installment not found.', 404, 'INSTALLMENT_NOT_FOUND');
    }

    const group = await ChitGroup.findById(installment.groupId);
    const isOrganizer = group && group.organizerId.toString() === actorId;

    if (actorRole !== UserRole.ADMIN && !isOrganizer && installment.userId.toString() !== actorId) {
        throw new AppError('Unauthorized to view this installment.', 403, 'UNAUTHORIZED');
    }

    return installment;
};

/**
 * Retrieves all installments for a specific ChitCycle.
 */
export const getInstallmentsByCycle = async (
    actorId: string,
    actorRole: UserRole,
    cycleId: string,
    status?: PaymentStatus
): Promise<IInstallment[]> => {
    const cycle = await ChitCycle.findById(cycleId);
    if (!cycle) {
        throw new AppError('Chit Cycle not found.', 404, 'CYCLE_NOT_FOUND');
    }

    const group = await ChitGroup.findById(cycle.groupId);
    const isOrganizer = group && group.organizerId.toString() === actorId;

    const query: any = { cycleId };
    if (status) query.paymentStatus = status;

    if (actorRole !== UserRole.ADMIN && !isOrganizer) {
        // Members see only their own installment for the cycle
        query.userId = new mongoose.Types.ObjectId(actorId);
    }

    return Installment.find(query)
        .sort({ installmentNumber: 1 })
        .populate('userId', 'name email')
        .populate('membershipId');
};

/**
 * Retrieves all installment records for a specific member across cycles.
 */
export const getInstallmentsByMember = async (
    actorId: string,
    actorRole: UserRole,
    membershipId: string
): Promise<IInstallment[]> => {
    const membership = await Membership.findById(membershipId);
    if (!membership) {
        throw new AppError('Membership not found.', 404, 'MEMBERSHIP_NOT_FOUND');
    }

    const group = await ChitGroup.findById(membership.chitGroupId);
    const isOrganizer = group && group.organizerId.toString() === actorId;

    if (actorRole !== UserRole.ADMIN && !isOrganizer && membership.userId.toString() !== actorId) {
        throw new AppError('Unauthorized to view member installments.', 403, 'UNAUTHORIZED');
    }

    return Installment.find({ membershipId })
        .sort({ installmentNumber: 1 })
        .populate('cycleId', 'cycleNumber status scheduledStartDate');
};

/**
 * Retrieves all installments for a ChitGroup.
 */
export const getInstallmentsByGroup = async (
    actorId: string,
    actorRole: UserRole,
    groupId: string,
    status?: PaymentStatus
): Promise<IInstallment[]> => {
    const group = await ChitGroup.findById(groupId);
    if (!group) {
        throw new AppError('Chit Group not found.', 404, 'GROUP_NOT_FOUND');
    }

    const isOrganizer = group.organizerId.toString() === actorId;

    const query: any = { groupId };
    if (status) query.paymentStatus = status;

    if (actorRole !== UserRole.ADMIN && !isOrganizer) {
        query.userId = new mongoose.Types.ObjectId(actorId);
    }

    return Installment.find(query)
        .sort({ installmentNumber: 1, dueDate: 1 })
        .populate('userId', 'name email')
        .populate('cycleId', 'cycleNumber status');
};
