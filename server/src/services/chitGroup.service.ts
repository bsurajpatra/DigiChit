import mongoose from 'mongoose';
import ChitGroup, { IChitGroup, ChitGroupStatus, CommissionType, LateFeeType, AuctionStrategy, IFinancialConfig } from '../models/ChitGroup.js';
import Membership, { IMembership, MembershipStatus } from '../models/Membership.js';
import Auction from '../models/Auction.js';
import Installment from '../models/Installment.js';
import ChitCycle, { ChitCycleStatus } from '../models/ChitCycle.js';
import { AppError } from '../utils/appError.js';
import { logAction } from '../utils/auditLogger.js';
import { UserRole } from '../models/User.js';
import { AuctionType } from '../models/ChitGroup.js';
import User from '../models/User.js';
import { sendChitGroupCreatedEmail } from '../utils/email.js';

interface ICreateChitGroupInput {
    name: string;
    totalMembers: number;
    monthlyContribution: number;
    commissionPercent?: number;
    startDate: Date;
    auctionType: AuctionType;
    description?: string;
    financialConfig?: Partial<IFinancialConfig>;
}

export const hasFinancialActivity = async (groupId: string): Promise<boolean> => {
    const hasCycle = await ChitCycle.exists({ groupId, status: { $in: [ChitCycleStatus.ACTIVE, ChitCycleStatus.COMPLETED] } });
    if (hasCycle) return true;

    const hasAuction = await Auction.exists({ groupId });
    if (hasAuction) return true;

    const hasInstallment = await Installment.exists({ groupId });
    if (hasInstallment) return true;

    return false;
};

export const createChitGroup = async (organizerId: string, data: ICreateChitGroupInput) => {
    if (data.monthlyContribution && data.monthlyContribution <= 0) {
        throw new AppError('Monthly contribution must be greater than 0.', 400);
    }
    
    if (data.totalMembers && (data.totalMembers < 2 || data.totalMembers > 50)) {
        throw new AppError('Total members must be between 2 and 50.', 400);
    }

    if (data.startDate && new Date(data.startDate) <= new Date()) {
        throw new AppError('Start date must be in the future.', 400);
    }

    const commissionVal = data.financialConfig?.commission?.value ?? data.commissionPercent ?? 2;
    const commissionType = data.financialConfig?.commission?.type ?? CommissionType.PERCENTAGE;

    const finalFinancialConfig: IFinancialConfig = {
        version: 1,
        commission: {
            value: commissionVal,
            type: commissionType
        },
        lateFee: {
            value: data.financialConfig?.lateFee?.value ?? 0,
            type: data.financialConfig?.lateFee?.type ?? LateFeeType.FIXED
        },
        gracePeriodDays: data.financialConfig?.gracePeriodDays ?? 3,
        auctionStrategy: data.financialConfig?.auctionStrategy ?? AuctionStrategy.LOWEST_BID,
        allowPartialInstallment: data.financialConfig?.allowPartialInstallment ?? false,
        allowPrepayment: data.financialConfig?.allowPrepayment ?? true,
        allowPenaltyWaiver: data.financialConfig?.allowPenaltyWaiver ?? true,
        currency: data.financialConfig?.currency ?? 'INR'
    };

    const group = new ChitGroup({
        name: data.name,
        totalMembers: data.totalMembers,
        monthlyContribution: data.monthlyContribution,
        commissionPercent: commissionVal,
        startDate: data.startDate,
        auctionType: data.auctionType,
        financialConfig: finalFinancialConfig,
        description: data.description,
        organizerId: new mongoose.Types.ObjectId(organizerId),
        durationMonths: data.totalMembers,
        status: ChitGroupStatus.FORMING,
        currentMemberCount: 0
    } as any);

    await group.save();

    await logAction(organizerId, UserRole.ORGANIZER, 'CHIT_GROUP_CREATED', {
        newValue: { name: group.name, id: (group._id as any).toString(), financialConfig: group.financialConfig }
    });

    // Send confirmation email to organizer
    User.findById(organizerId).then(user => {
        if (user) {
            sendChitGroupCreatedEmail(
                user.email,
                user.name,
                group.name,
                group.monthlyContribution,
                group.totalMembers,
                new Date(group.startDate).toDateString()
            );
        }
    });

    return group;
};

export const updateChitGroup = async (
    actorId: string,
    actorRole: UserRole,
    groupId: string,
    updateData: any,
    ipAddress?: string
) => {
    const group = await ChitGroup.findById(groupId);
    if (!group) throw new AppError('Group not found.', 404);

    if (actorRole !== UserRole.ADMIN && group.organizerId.toString() !== actorId) {
        throw new AppError('Unauthorized to update this group.', 403);
    }

    const previousValue = group.toObject();

    if (updateData.financialConfig) {
        const activityExists = await hasFinancialActivity(groupId);
        if (activityExists) {
            const currentFC = group.financialConfig;
            const newFC = updateData.financialConfig;

            const isCriticalChanged =
                (newFC.commission && (newFC.commission.value !== currentFC.commission.value || newFC.commission.type !== currentFC.commission.type)) ||
                (newFC.auctionStrategy && newFC.auctionStrategy !== currentFC.auctionStrategy) ||
                (newFC.currency && newFC.currency !== currentFC.currency);

            if (isCriticalChanged && actorRole !== UserRole.ADMIN) {
                throw new AppError(
                    'Critical financial settings (commission, strategy, currency) are locked because financial activity has started for this group. Only Admins can modify them.',
                    403,
                    'FINANCIAL_CONFIG_LOCKED'
                );
            }
        }

        group.financialConfig = {
            ...group.financialConfig,
            ...updateData.financialConfig,
            commission: {
                ...group.financialConfig.commission,
                ...(updateData.financialConfig.commission || {})
            },
            lateFee: {
                ...group.financialConfig.lateFee,
                ...(updateData.financialConfig.lateFee || {})
            }
        };
        group.commissionPercent = group.financialConfig.commission.value;
    }

    if (updateData.name) group.name = updateData.name;
    if (updateData.description !== undefined) group.description = updateData.description;

    await group.save();

    const actionName = actorRole === UserRole.ADMIN && (await hasFinancialActivity(groupId)) 
        ? 'FINANCIAL_CONFIG_ADMIN_OVERRIDE' 
        : 'FINANCIAL_CONFIG_UPDATED';

    await logAction(actorId, actorRole, actionName, {
        previousValue,
        newValue: group.toObject(),
        ipAddress
    });

    return group;
};

export const requestJoin = async (userId: string, chitGroupId: string) => {
    const group = await ChitGroup.findById(chitGroupId);
    if (!group) throw new AppError('Group not found.', 404);
    if (group.status !== ChitGroupStatus.FORMING) {
        throw new AppError('Joining is only allowed during the FORMING phase.', 400);
    }

    const existingMembership = await Membership.findOne({ chitGroupId, userId });
    if (existingMembership) {
        throw new AppError('You have already requested or joined this group.', 400);
    }

    const approvedCount = await Membership.countDocuments({ 
        chitGroupId, 
        status: { $in: [MembershipStatus.APPROVED, MembershipStatus.ACTIVE_MEMBER] } 
    });
    
    if (approvedCount >= group.totalMembers) {
        throw new AppError('Chit Group is full.', 400);
    }

    const membership = await Membership.create({
        chitGroupId,
        userId,
        status: MembershipStatus.REQUESTED
    });

    await logAction(userId, UserRole.USER, 'CHIT_JOIN_REQUESTED', {
        newValue: { chitGroupId, membershipId: (membership._id as any).toString() }
    });

    return membership;
};

export const approveMember = async (organizerId: string, membershipId: string) => {
    const membership = await Membership.findById(membershipId).populate('chitGroupId');
    if (!membership) throw new AppError('Membership record not found.', 404);

    const group = membership.chitGroupId as unknown as IChitGroup;
    if (group.organizerId.toString() !== organizerId) {
        throw new AppError('Unauthorized.', 403);
    }

    if (group.status !== ChitGroupStatus.FORMING) {
        throw new AppError('Cannot approve outside FORMING phase.', 400);
    }

    const approvedCount = await Membership.countDocuments({ 
        chitGroupId: group._id, 
        status: { $in: [MembershipStatus.APPROVED, MembershipStatus.ACTIVE_MEMBER] } 
    });

    if (approvedCount >= group.totalMembers) {
        throw new AppError('Full capacity reached.', 400);
    }

    membership.status = MembershipStatus.APPROVED;
    await membership.save();

    await logAction(organizerId, UserRole.ORGANIZER, 'CHIT_MEMBER_APPROVED', {
        targetUserId: membership.userId.toString(),
        newValue: { membershipId, chitGroupId: (group._id as any).toString() }
    });

    const newApprovedCount = approvedCount + 1;
    group.currentMemberCount = newApprovedCount;
    await group.save();

    if (newApprovedCount === group.totalMembers) {
        await activateGroup(group._id.toString(), organizerId);
    }

    return membership;
};

export const activateGroup = async (chitGroupId: string, organizerId: string) => {
    const group = await ChitGroup.findById(chitGroupId);
    if (!group) return;

    group.status = ChitGroupStatus.ACTIVE;
    await group.save();

    await logAction(organizerId, UserRole.ORGANIZER, 'CHIT_GROUP_ACTIVATED', {
        newValue: { chitGroupId }
    });

    await Membership.updateMany(
        { chitGroupId, status: MembershipStatus.APPROVED },
        { status: MembershipStatus.ACTIVE_MEMBER, joinedAt: new Date() }
    );
};

export const rejectMember = async (organizerId: string, membershipId: string) => {
    const membership = await Membership.findById(membershipId).populate('chitGroupId');
    if (!membership) throw new AppError('Membership record not found.', 404);

    const group = membership.chitGroupId as unknown as IChitGroup;
    if (group.organizerId.toString() !== organizerId) {
        throw new AppError('Unauthorized.', 403);
    }

    membership.status = MembershipStatus.REJECTED;
    await membership.save();

    await logAction(organizerId, UserRole.ORGANIZER, 'CHIT_MEMBER_REJECTED', {
        targetUserId: membership.userId.toString(),
        newValue: { membershipId, chitGroupId: (group._id as any).toString() }
    });

    return membership;
};

export const manualAddMember = async (organizerId: string, chitGroupId: string, userEmail: string) => {
    const group = await ChitGroup.findById(chitGroupId);
    if (!group) throw new AppError('Group not found.', 404);
    
    if (group.organizerId.toString() !== organizerId) {
        throw new AppError('Unauthorized.', 403);
    }

    if (group.status !== ChitGroupStatus.FORMING) {
        throw new AppError('Manual adding is only allowed during the FORMING phase.', 400);
    }

    const user = await User.findOne({ email: userEmail.toLowerCase(), kycStatus: 'APPROVED' });
    if (!user) {
        throw new AppError('User not found or not KYC approved.', 404);
    }

    const existingMembership = await Membership.findOne({ chitGroupId, userId: user._id });
    if (existingMembership) {
        throw new AppError('User is already a member or has a pending request.', 400);
    }

    const approvedCount = await Membership.countDocuments({ 
        chitGroupId, 
        status: { $in: [MembershipStatus.APPROVED, MembershipStatus.ACTIVE_MEMBER] } 
    });

    if (approvedCount >= group.totalMembers) {
        throw new AppError('Chit Group is full.', 400);
    }

    const membership = await Membership.create({
        chitGroupId,
        userId: user._id,
        status: MembershipStatus.APPROVED
    });

    await logAction(organizerId, UserRole.ORGANIZER, 'CHIT_MEMBER_MANUALLY_ADDED', {
        targetUserId: user._id.toString(),
        newValue: { membershipId: (membership._id as any).toString(), chitGroupId }
    });

    group.currentMemberCount = approvedCount + 1;
    await group.save();

    if (group.currentMemberCount === group.totalMembers) {
        await activateGroup(chitGroupId, organizerId);
    }

    return membership;
};
