import mongoose from 'mongoose';
import ChitGroup, { IChitGroup, ChitGroupStatus } from '../models/ChitGroup.js';
import Membership, { IMembership, MembershipStatus } from '@modules/membership/models/Membership.js';
import Auction from '@modules/auction/models/Auction.js';
import Installment from '@modules/installment/models/Installment.js';
import ChitCycle, { ChitCycleStatus } from '@modules/chit-cycle/models/ChitCycle.js';

export class ChitGroupRepository {
    /**
     * Checks if financial activity exists for a group.
     */
    public async hasFinancialActivity(groupId: string): Promise<boolean> {
        const hasCycle = await ChitCycle.exists({ groupId, status: { $in: [ChitCycleStatus.ACTIVE, ChitCycleStatus.COMPLETED] } });
        if (hasCycle) return true;

        const hasAuction = await Auction.exists({ groupId });
        if (hasAuction) return true;

        const hasInstallment = await Installment.exists({ groupId });
        if (hasInstallment) return true;

        return false;
    }

    /**
     * Creates a new ChitGroup document.
     */
    public async create(data: Partial<IChitGroup>): Promise<IChitGroup> {
        return await ChitGroup.create(data);
    }

    /**
     * Finds a single ChitGroup by ID.
     */
    public async findById(groupId: string): Promise<IChitGroup | null> {
        if (!mongoose.Types.ObjectId.isValid(groupId)) return null;
        return await ChitGroup.findById(groupId);
    }

    /**
     * Finds a single ChitGroup by ID populated with organizer info.
     */
    public async findByIdWithOrganizer(groupId: string): Promise<IChitGroup | null> {
        if (!mongoose.Types.ObjectId.isValid(groupId)) return null;
        return await ChitGroup.findById(groupId).populate('organizerId', 'name email');
    }

    /**
     * Finds FORMING groups excluding groups organized by the current user.
     */
    public async findFormingGroupsExcludingOrganizer(userId: string): Promise<any[]> {
        const filters: any = {
            status: ChitGroupStatus.FORMING,
            organizerId: { $ne: new mongoose.Types.ObjectId(userId) }
        };
        return await ChitGroup.find(filters).populate('organizerId', 'name email').lean();
    }

    /**
     * Finds groups organized by a specific organizer.
     */
    public async findByOrganizerId(organizerId: string): Promise<IChitGroup[]> {
        if (!mongoose.Types.ObjectId.isValid(organizerId)) return [];
        return await ChitGroup.find({ organizerId: new mongoose.Types.ObjectId(organizerId) });
    }

    /**
     * Saves changes on an existing Mongoose ChitGroup document.
     */
    public async saveGroup(groupDoc: IChitGroup): Promise<IChitGroup> {
        return await groupDoc.save();
    }

    /**
     * Finds membership records for a user across multiple group IDs.
     */
    public async findUserMembershipsForGroupIds(userId: string, groupIds: any[]): Promise<IMembership[]> {
        return await Membership.find({
            userId: new mongoose.Types.ObjectId(userId),
            chitGroupId: { $in: groupIds }
        }).lean();
    }

    /**
     * Finds all membership records for a user populated with chitGroupId.
     */
    public async findUserMembershipsWithGroup(userId: string): Promise<IMembership[]> {
        if (!mongoose.Types.ObjectId.isValid(userId)) return [];
        return await Membership.find({ userId: new mongoose.Types.ObjectId(userId) }).populate('chitGroupId');
    }

    /**
     * Finds members of a specific chit group populated with user info.
     */
    public async findMembersByGroupId(groupId: any): Promise<IMembership[]> {
        return await Membership.find({ chitGroupId: groupId }).populate('userId', 'name email');
    }

    /**
     * Finds membership by user and group ID.
     */
    public async findMembershipByUserAndGroup(userId: string, chitGroupId: string): Promise<IMembership | null> {
        return await Membership.findOne({ chitGroupId, userId });
    }

    /**
     * Finds membership by ID populated with chitGroupId.
     */
    public async findMembershipByIdWithGroup(membershipId: string): Promise<IMembership | null> {
        if (!mongoose.Types.ObjectId.isValid(membershipId)) return null;
        return await Membership.findById(membershipId).populate('chitGroupId');
    }

    /**
     * Counts approved/active members for a group.
     */
    public async countApprovedMembers(chitGroupId: any): Promise<number> {
        return await Membership.countDocuments({
            chitGroupId,
            status: { $in: [MembershipStatus.APPROVED, MembershipStatus.ACTIVE_MEMBER] }
        });
    }

    /**
     * Creates a new Membership record.
     */
    public async createMembership(data: Partial<IMembership>): Promise<IMembership> {
        return await Membership.create(data);
    }

    /**
     * Saves changes on an existing Mongoose Membership document.
     */
    public async saveMembership(membershipDoc: IMembership): Promise<IMembership> {
        return await membershipDoc.save();
    }

    /**
     * Updates memberships status to ACTIVE_MEMBER upon group activation.
     */
    public async activateGroupMemberships(chitGroupId: string): Promise<void> {
        await Membership.updateMany(
            { chitGroupId, status: MembershipStatus.APPROVED },
            { status: MembershipStatus.ACTIVE_MEMBER, joinedAt: new Date() }
        );
    }
}
