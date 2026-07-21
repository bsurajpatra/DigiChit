import mongoose from 'mongoose';
import ChitGroup, { IChitGroup, ChitGroupStatus } from '../models/ChitGroup.js';
import Membership, { IMembership, MembershipStatus } from '../models/Membership.js';
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
    commissionPercent: number;
    startDate: Date;
    auctionType: AuctionType;
    description?: string;
}

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

    const group = new ChitGroup({
        name: data.name,
        totalMembers: data.totalMembers,
        monthlyContribution: data.monthlyContribution,
        commissionPercent: data.commissionPercent,
        startDate: data.startDate,
        auctionType: data.auctionType,
        description: data.description,
        organizerId: new mongoose.Types.ObjectId(organizerId),
        durationMonths: data.totalMembers,
        status: ChitGroupStatus.FORMING,
        currentMemberCount: 0
    } as any);

    await group.save();

    await logAction(organizerId, UserRole.ORGANIZER, 'CHIT_GROUP_CREATED', {
        newValue: { name: group.name, id: (group._id as any).toString() }
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

export const requestJoin = async (userId: string, chitGroupId: string) => {
    const group = await ChitGroup.findById(chitGroupId);
    if (!group) throw new AppError('Group not found.', 404);
    if (group.status !== ChitGroupStatus.FORMING) {
        throw new AppError('Joining is only allowed during the FORMING phase.', 400);
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
