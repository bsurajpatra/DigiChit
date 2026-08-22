import mongoose from 'mongoose';
import Installment, { IInstallment, PaymentStatus } from '../models/Installment.js';
import ChitCycle, { IChitCycle } from '@modules/chit-cycle/models/ChitCycle.js';
import ChitGroup, { IChitGroup } from '@modules/chit-group/models/ChitGroup.js';
import Membership, { IMembership, MembershipStatus } from '@modules/membership/models/Membership.js';

export class InstallmentRepository {
    public async findCycleById(cycleId: string): Promise<IChitCycle | null> {
        if (!mongoose.Types.ObjectId.isValid(cycleId)) return null;
        return await ChitCycle.findById(cycleId);
    }

    public async findGroupById(groupId: any): Promise<IChitGroup | null> {
        return await ChitGroup.findById(groupId);
    }

    public async findActiveMembershipsByGroupId(groupId: any): Promise<IMembership[]> {
        return await Membership.find({
            chitGroupId: groupId,
            status: { $in: [MembershipStatus.ACTIVE_MEMBER, MembershipStatus.APPROVED] }
        });
    }

    public async findMembershipById(membershipId: string): Promise<IMembership | null> {
        if (!mongoose.Types.ObjectId.isValid(membershipId)) return null;
        return await Membership.findById(membershipId);
    }

    public async findOneByCycleAndMembership(cycleId: any, membershipId: any): Promise<IInstallment | null> {
        return await Installment.findOne({ cycleId, membershipId });
    }

    public async findById(installmentId: string): Promise<IInstallment | null> {
        if (!mongoose.Types.ObjectId.isValid(installmentId)) return null;
        return await Installment.findById(installmentId);
    }

    public async save(installmentDoc: IInstallment): Promise<IInstallment> {
        return await installmentDoc.save();
    }

    public async create(data: Partial<IInstallment>): Promise<IInstallment> {
        return await Installment.create(data);
    }

    public async updatePaymentDetails(
        installmentId: string,
        data: {
            paymentStatus: PaymentStatus;
            paidAmount: number;
            paidDate: Date;
            paymentMethod: string;
            transactionId: any;
        }
    ): Promise<IInstallment | null> {
        if (!mongoose.Types.ObjectId.isValid(installmentId)) return null;
        return await Installment.findByIdAndUpdate(installmentId, data, { new: true });
    }

    public async findPopulatedById(installmentId: string): Promise<IInstallment | null> {
        if (!mongoose.Types.ObjectId.isValid(installmentId)) return null;
        return await Installment.findById(installmentId)
            .populate('userId', 'name email')
            .populate('membershipId')
            .populate('cycleId', 'cycleNumber status scheduledStartDate')
            .populate('groupId', 'name monthlyContribution');
    }

    public async findByCycle(cycleId: string, status?: PaymentStatus, memberUserId?: string): Promise<IInstallment[]> {
        if (!mongoose.Types.ObjectId.isValid(cycleId)) return [];
        const query: any = { cycleId: new mongoose.Types.ObjectId(cycleId) };
        if (status) query.paymentStatus = status;
        if (memberUserId && mongoose.Types.ObjectId.isValid(memberUserId)) {
            query.userId = new mongoose.Types.ObjectId(memberUserId);
        }

        return await Installment.find(query)
            .sort({ installmentNumber: 1 })
            .populate('userId', 'name email')
            .populate('membershipId');
    }

    public async findByMember(membershipId: string): Promise<IInstallment[]> {
        if (!mongoose.Types.ObjectId.isValid(membershipId)) return [];
        return await Installment.find({ membershipId: new mongoose.Types.ObjectId(membershipId) })
            .sort({ installmentNumber: 1 })
            .populate('cycleId', 'cycleNumber status scheduledStartDate paymentCollection')
            .populate('groupId', 'name monthlyContribution financialConfig');
    }

    public async findByGroup(groupId: string, status?: PaymentStatus, memberUserId?: string): Promise<IInstallment[]> {
        if (!mongoose.Types.ObjectId.isValid(groupId)) return [];
        const query: any = { groupId: new mongoose.Types.ObjectId(groupId) };
        if (status) query.paymentStatus = status;
        if (memberUserId && mongoose.Types.ObjectId.isValid(memberUserId)) {
            query.userId = new mongoose.Types.ObjectId(memberUserId);
        }

        return await Installment.find(query)
            .sort({ installmentNumber: 1, dueDate: 1 })
            .populate('userId', 'name email')
            .populate('cycleId', 'cycleNumber status scheduledStartDate paymentCollection')
            .populate('groupId', 'name monthlyContribution financialConfig');
    }
}
