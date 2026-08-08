import mongoose from 'mongoose';
import Auction, { IAuction, AuctionStatus } from '../models/Auction.js';
import ChitCycle, { IChitCycle } from '../../chit-cycle/models/ChitCycle.js';
import ChitGroup, { IChitGroup } from '../../chit-group/models/ChitGroup.js';
import Membership, { IMembership } from '../../membership/models/Membership.js';

export class AuctionRepository {
    /**
     * Finds ChitCycle by ID.
     */
    public async findCycleById(cycleId: string): Promise<IChitCycle | null> {
        if (!mongoose.Types.ObjectId.isValid(cycleId)) return null;
        return await ChitCycle.findById(cycleId);
    }

    /**
     * Finds ChitGroup by ID.
     */
    public async findGroupById(groupId: any): Promise<IChitGroup | null> {
        if (!mongoose.Types.ObjectId.isValid(groupId.toString())) return null;
        return await ChitGroup.findById(groupId);
    }

    /**
     * Finds active or scheduled auction for a cycle.
     */
    public async findActiveByCycleId(cycleId: string): Promise<IAuction | null> {
        return await Auction.findOne({ cycleId, isDeleted: false });
    }

    /**
     * Finds active auction by auction ID.
     */
    public async findById(auctionId: string): Promise<IAuction | null> {
        if (!mongoose.Types.ObjectId.isValid(auctionId)) return null;
        return await Auction.findOne({ _id: auctionId, isDeleted: false });
    }

    /**
     * Finds membership by ID.
     */
    public async findMembershipById(membershipId: string): Promise<IMembership | null> {
        if (!mongoose.Types.ObjectId.isValid(membershipId)) return null;
        return await Membership.findById(membershipId);
    }

    /**
     * Saves changes on an existing Mongoose Auction document.
     */
    public async save(auctionDoc: IAuction): Promise<IAuction> {
        return await auctionDoc.save();
    }

    /**
     * Creates a new Auction.
     */
    public async create(data: Partial<IAuction>): Promise<IAuction> {
        return await Auction.create(data);
    }

    /**
     * Finds auction by ID populated with cycle, group, winner, and creator info.
     */
    public async findPopulatedById(auctionId: string): Promise<IAuction | null> {
        if (!mongoose.Types.ObjectId.isValid(auctionId)) return null;
        return await Auction.findOne({ _id: auctionId, isDeleted: false })
            .populate('cycleId', 'cycleNumber status scheduledStartDate')
            .populate('groupId', 'name totalMembers monthlyContribution')
            .populate({
                path: 'winningMembershipId',
                populate: { path: 'userId', select: 'name email' }
            })
            .populate('createdBy', 'name email');
    }

    /**
     * Finds auction by cycleId populated with details.
     */
    public async findPopulatedByCycleId(cycleId: string): Promise<IAuction | null> {
        return await Auction.findOne({ cycleId, isDeleted: false })
            .populate('cycleId', 'cycleNumber status scheduledStartDate')
            .populate('groupId', 'name totalMembers monthlyContribution')
            .populate({
                path: 'winningMembershipId',
                populate: { path: 'userId', select: 'name email' }
            });
    }

    /**
     * Finds all auctions for a group with optional status filtering.
     */
    public async findByGroup(groupId: string, status?: AuctionStatus): Promise<IAuction[]> {
        const query: any = { groupId, isDeleted: false };
        if (status) {
            query.status = status;
        }

        return await Auction.find(query)
            .sort({ auctionNumber: 1 })
            .populate('cycleId', 'cycleNumber status')
            .populate({
                path: 'winningMembershipId',
                populate: { path: 'userId', select: 'name email' }
            });
    }
}
