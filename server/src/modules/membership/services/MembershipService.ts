import mongoose from 'mongoose';
import { MembershipRepository } from '../repositories/MembershipRepository.js';
import { IMembership, MembershipStatus } from '../models/Membership.js';
import {
    IRequestJoinInput,
    IApproveMemberInput,
    IRejectMemberInput,
    IMarkWinnerInput
} from '../interfaces/IMembership.js';
import { IChitGroup, ChitGroupStatus } from '../../chit-group/models/ChitGroup.js';
import { UserRole } from '../../user/models/User.js';
import { AppError } from '../../../shared/errors/AppError.js';
import { logAction } from '../../../shared/logger/auditLogger.js';

export class MembershipService {
    private repo: MembershipRepository;

    constructor() {
        this.repo = new MembershipRepository();
    }

    /**
     * User requests to join a forming chit group.
     */
    public async requestJoin(input: IRequestJoinInput): Promise<IMembership> {
        const { userId, chitGroupId } = input;

        const group = await this.repo.findGroupById(chitGroupId);
        if (!group) throw new AppError('Group not found.', 404);
        if (group.status !== ChitGroupStatus.FORMING) {
            throw new AppError('Joining is only allowed during the FORMING phase.', 400);
        }

        const existingMembership = await this.repo.findByUserAndGroup(userId, chitGroupId);
        if (existingMembership) {
            throw new AppError('You have already requested or joined this group.', 400);
        }

        const approvedCount = await this.repo.countApprovedMembers(chitGroupId);
        if (approvedCount >= group.totalMembers) {
            throw new AppError('Chit Group is full.', 400);
        }

        const membership = await this.repo.create({
            chitGroupId: new mongoose.Types.ObjectId(chitGroupId),
            userId: new mongoose.Types.ObjectId(userId),
            status: MembershipStatus.REQUESTED
        });

        await logAction(userId, UserRole.USER, 'CHIT_JOIN_REQUESTED', {
            newValue: { chitGroupId, membershipId: (membership._id as any).toString() }
        });

        return membership;
    }

    /**
     * Organizer approves a pending member request.
     */
    public async approveMember(input: IApproveMemberInput): Promise<IMembership> {
        const { organizerId, membershipId } = input;

        const membership = await this.repo.findByIdWithGroup(membershipId);
        if (!membership) throw new AppError('Membership record not found.', 404);

        const group = membership.chitGroupId as unknown as IChitGroup;
        if (group.organizerId.toString() !== organizerId) {
            throw new AppError('Unauthorized.', 403);
        }

        if (group.status !== ChitGroupStatus.FORMING) {
            throw new AppError('Cannot approve outside FORMING phase.', 400);
        }

        const approvedCount = await this.repo.countApprovedMembers(group._id);
        if (approvedCount >= group.totalMembers) {
            throw new AppError('Full capacity reached.', 400);
        }

        membership.status = MembershipStatus.APPROVED;
        await this.repo.save(membership);

        await logAction(organizerId, UserRole.ORGANIZER, 'CHIT_MEMBER_APPROVED', {
            targetUserId: membership.userId.toString(),
            newValue: { membershipId, chitGroupId: (group._id as any).toString() }
        });

        const newApprovedCount = approvedCount + 1;
        group.currentMemberCount = newApprovedCount;
        await this.repo.saveGroup(group);

        if (newApprovedCount === group.totalMembers) {
            group.status = ChitGroupStatus.ACTIVE;
            await this.repo.saveGroup(group);

            await logAction(organizerId, UserRole.ORGANIZER, 'CHIT_GROUP_ACTIVATED', {
                newValue: { chitGroupId: group._id.toString() }
            });

            await this.repo.activateApprovedMemberships(group._id.toString());
        }

        return membership;
    }

    /**
     * Organizer rejects a pending member request.
     */
    public async rejectMember(input: IRejectMemberInput): Promise<IMembership> {
        const { organizerId, membershipId } = input;

        const membership = await this.repo.findByIdWithGroup(membershipId);
        if (!membership) throw new AppError('Membership record not found.', 404);

        const group = membership.chitGroupId as unknown as IChitGroup;
        if (group.organizerId.toString() !== organizerId) {
            throw new AppError('Unauthorized.', 403);
        }

        membership.status = MembershipStatus.REJECTED;
        await this.repo.save(membership);

        await logAction(organizerId, UserRole.ORGANIZER, 'CHIT_MEMBER_REJECTED', {
            targetUserId: membership.userId.toString(),
            newValue: { membershipId, chitGroupId: (group._id as any).toString() }
        });

        return membership;
    }

    /**
     * Marks a member as the auction winner.
     */
    public async markWinner(input: IMarkWinnerInput): Promise<IMembership> {
        const { membershipId, payoutMonth } = input;

        const membership = await this.repo.findById(membershipId);
        if (!membership) throw new AppError('Membership not found.', 404);

        membership.isWinner = true;
        membership.payoutMonth = payoutMonth;
        await this.repo.save(membership);

        return membership;
    }

    /**
     * Gets all memberships for a user.
     */
    public async getMyMemberships(userId: string): Promise<IMembership[]> {
        return await this.repo.findByUserId(userId);
    }

    /**
     * Gets all members of a group.
     */
    public async getGroupMembers(groupId: string): Promise<IMembership[]> {
        return await this.repo.findByGroupId(groupId);
    }
}
