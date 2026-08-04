import mongoose from 'mongoose';
import Membership, { IMembership, MembershipStatus } from '../models/Membership.js';

export class MembershipRepository {
    /**
     * Creates a new Membership record.
     */
    public async create(data: Partial<IMembership>): Promise<IMembership> {
        return await Membership.create(data);
    }

    /**
     * Finds a single Membership by ID.
     */
    public async findById(membershipId: string): Promise<IMembership | null> {
        if (!mongoose.Types.ObjectId.isValid(membershipId)) return null;
        return await Membership.findById(membershipId);
    }

    /**
     * Finds a single Membership by ID populated with chitGroupId.
     */
    public async findByIdWithGroup(membershipId: string): Promise<IMembership | null> {
        if (!mongoose.Types.ObjectId.isValid(membershipId)) return null;
        return await Membership.findById(membershipId).populate('chitGroupId');
    }

    /**
     * Finds membership by user and group ID.
     */
    public async findByUserAndGroup(userId: string, chitGroupId: string): Promise<IMembership | null> {
        if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(chitGroupId)) return null;
        return await Membership.findOne({ chitGroupId, userId });
    }

    /**
     * Finds all memberships for a user populated with group details.
     */
    public async findByUserId(userId: string): Promise<IMembership[]> {
        if (!mongoose.Types.ObjectId.isValid(userId)) return [];
        return await Membership.find({ userId: new mongoose.Types.ObjectId(userId) }).populate('chitGroupId');
    }

    /**
     * Finds all memberships for a group populated with user details.
     */
    public async findByGroupId(groupId: string): Promise<IMembership[]> {
        if (!mongoose.Types.ObjectId.isValid(groupId)) return [];
        return await Membership.find({ chitGroupId: new mongoose.Types.ObjectId(groupId) }).populate('userId', 'name email');
    }

    /**
     * Counts approved or active members in a chit group.
     */
    public async countApprovedMembers(chitGroupId: any): Promise<number> {
        return await Membership.countDocuments({
            chitGroupId,
            status: { $in: [MembershipStatus.APPROVED, MembershipStatus.ACTIVE_MEMBER] }
        });
    }

    /**
     * Saves changes on an existing Mongoose Membership document.
     */
    public async save(membershipDoc: IMembership): Promise<IMembership> {
        return await membershipDoc.save();
    }

    /**
     * Updates all approved memberships in a group to active members when group is activated.
     */
    public async activateApprovedMemberships(chitGroupId: string): Promise<void> {
        await Membership.updateMany(
            { chitGroupId, status: MembershipStatus.APPROVED },
            { status: MembershipStatus.ACTIVE_MEMBER, joinedAt: new Date() }
        );
    }
}
