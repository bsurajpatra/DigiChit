import mongoose from 'mongoose';
import { InstallmentRepository } from '../repositories/InstallmentRepository.js';
import Installment, { IInstallment, PaymentStatus } from '../models/Installment.js';
import { UserRole } from '../../user/models/User.js';
import { AppError } from '../../../shared/errors/AppError.js';
import { logAction } from '../../../utils/auditLogger.js';
import {
    IUpdateInstallmentInput,
    IUpdateInstallmentStatusInput
} from '../interfaces/IInstallment.js';

export class InstallmentService {
    private repo: InstallmentRepository;

    constructor() {
        this.repo = new InstallmentRepository();
    }

    /**
     * Bulk generates Installment obligation records for all active members in a ChitCycle.
     */
    public async generateInstallmentsForCycle(
        actorId: string,
        actorRole: UserRole,
        cycleId: string,
        overrideDueDate?: Date | string
    ): Promise<{ createdCount: number; existingCount: number; installments: IInstallment[] }> {
        // 1. Verify ChitCycle
        const cycle = await this.repo.findCycleById(cycleId);
        if (!cycle) {
            throw new AppError('Chit Cycle not found.', 404, 'CYCLE_NOT_FOUND');
        }

        // 2. Verify ChitGroup & Authorization
        const group = await this.repo.findGroupById(cycle.groupId);
        if (!group) {
            throw new AppError('Associated Chit Group not found.', 404, 'GROUP_NOT_FOUND');
        }

        if (actorRole !== UserRole.ADMIN && group.organizerId.toString() !== actorId) {
            throw new AppError('Unauthorized to generate installments for this Chit Group.', 403, 'UNAUTHORIZED');
        }

        // 3. Retrieve all active and approved members for this group
        const activeMemberships = await this.repo.findActiveMembershipsByGroupId(group._id);
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
            const existingInstallment = await this.repo.findOneByCycleAndMembership(cycle._id, membership._id);

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
                amount: group.monthlyContribution,
                paidAmount: 0,
                dueDate: computedDueDate,
                paidDate: null,
                paymentStatus: PaymentStatus.PENDING,
                paymentMethod: null,
                transactionId: null,
                lateFee: 0,
                remarks: null
            });

            await this.repo.save(installment);
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
    }

    /**
     * Updates payment status and details of an installment obligation.
     */
    public async updateInstallmentStatus(
        actorId: string,
        actorRole: UserRole,
        installmentId: string,
        data: IUpdateInstallmentStatusInput
    ): Promise<IInstallment> {
        const installment = await this.repo.findById(installmentId);
        if (!installment) {
            throw new AppError('Installment record not found.', 404, 'INSTALLMENT_NOT_FOUND');
        }

        const group = await this.repo.findGroupById(installment.groupId);
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
            installment.paidAmount = 0;
            installment.paidDate = null;
        } else if (targetStatus === PaymentStatus.PENDING || targetStatus === PaymentStatus.FAILED || targetStatus === PaymentStatus.OVERDUE) {
            installment.paidDate = null;
        }

        if (data.paymentMethod) installment.paymentMethod = data.paymentMethod;
        if (data.transactionId) installment.transactionId = new mongoose.Types.ObjectId(data.transactionId);
        if (data.remarks) installment.remarks = data.remarks;

        await this.repo.save(installment);

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
    }

    /**
     * Updates general installment properties (amount, due date, late fee, remarks).
     */
    public async updateInstallment(
        actorId: string,
        actorRole: UserRole,
        installmentId: string,
        data: IUpdateInstallmentInput
    ): Promise<IInstallment> {
        const installment = await this.repo.findById(installmentId);
        if (!installment) {
            throw new AppError('Installment record not found.', 404, 'INSTALLMENT_NOT_FOUND');
        }

        const group = await this.repo.findGroupById(installment.groupId);
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

        await this.repo.save(installment);

        await logAction(actorId, actorRole, 'INSTALLMENT_UPDATED', {
            newValue: {
                installmentId,
                amount: installment.amount,
                dueDate: installment.dueDate,
                lateFee: installment.lateFee
            }
        });

        return installment;
    }

    /**
     * Fetches single installment details by ID.
     */
    public async getInstallmentById(
        actorId: string,
        actorRole: UserRole,
        installmentId: string
    ): Promise<IInstallment> {
        const installment = await this.repo.findPopulatedById(installmentId);
        if (!installment) {
            throw new AppError('Installment not found.', 404, 'INSTALLMENT_NOT_FOUND');
        }

        const group = await this.repo.findGroupById(installment.groupId);
        const isOrganizer = group && group.organizerId.toString() === actorId;

        if (actorRole !== UserRole.ADMIN && !isOrganizer && installment.userId.toString() !== actorId) {
            throw new AppError('Unauthorized to view this installment.', 403, 'UNAUTHORIZED');
        }

        return installment;
    }

    /**
     * Retrieves all installments for a specific ChitCycle.
     */
    public async getInstallmentsByCycle(
        actorId: string,
        actorRole: UserRole,
        cycleId: string,
        status?: PaymentStatus
    ): Promise<IInstallment[]> {
        const cycle = await this.repo.findCycleById(cycleId);
        if (!cycle) {
            throw new AppError('Chit Cycle not found.', 404, 'CYCLE_NOT_FOUND');
        }

        const group = await this.repo.findGroupById(cycle.groupId);
        const isOrganizer = group && group.organizerId.toString() === actorId;

        const memberUserId = (actorRole !== UserRole.ADMIN && !isOrganizer) ? actorId : undefined;
        return await this.repo.findByCycle(cycleId, status, memberUserId);
    }

    /**
     * Retrieves all installment records for a specific member across cycles.
     */
    public async getInstallmentsByMember(
        actorId: string,
        actorRole: UserRole,
        membershipId: string
    ): Promise<IInstallment[]> {
        const membership = await this.repo.findMembershipById(membershipId);
        if (!membership) {
            throw new AppError('Membership not found.', 404, 'MEMBERSHIP_NOT_FOUND');
        }

        const group = await this.repo.findGroupById(membership.chitGroupId);
        const isOrganizer = group && group.organizerId.toString() === actorId;

        if (actorRole !== UserRole.ADMIN && !isOrganizer && membership.userId.toString() !== actorId) {
            throw new AppError('Unauthorized to view member installments.', 403, 'UNAUTHORIZED');
        }

        return await this.repo.findByMember(membershipId);
    }

    /**
     * Retrieves all installments for a ChitGroup.
     */
    public async getInstallmentsByGroup(
        actorId: string,
        actorRole: UserRole,
        groupId: string,
        status?: PaymentStatus
    ): Promise<IInstallment[]> {
        const group = await this.repo.findGroupById(groupId);
        if (!group) {
            throw new AppError('Chit Group not found.', 404, 'GROUP_NOT_FOUND');
        }

        const isOrganizer = group.organizerId.toString() === actorId;
        const memberUserId = (actorRole !== UserRole.ADMIN && !isOrganizer) ? actorId : undefined;

        return await this.repo.findByGroup(groupId, status, memberUserId);
    }
}
