import mongoose from 'mongoose';
import Bid, { IBid, BidStatus } from '../models/Bid.js';
import User, { IUser } from '../../user/models/User.js';
import Auction, { IAuction } from '../../auction/models/Auction.js';
import Membership, { IMembership } from '../../membership/models/Membership.js';
import ChitGroup, { IChitGroup } from '../../chit-group/models/ChitGroup.js';

export class BidRepository {
    public async findUserById(userId: string): Promise<IUser | null> {
        if (!mongoose.Types.ObjectId.isValid(userId)) return null;
        return await User.findById(userId);
    }

    public async findAuctionById(auctionId: string): Promise<IAuction | null> {
        if (!mongoose.Types.ObjectId.isValid(auctionId)) return null;
        return await Auction.findOne({ _id: auctionId, isDeleted: false });
    }

    public async findMembershipByUserAndGroup(groupId: any, userId: string): Promise<IMembership | null> {
        if (!mongoose.Types.ObjectId.isValid(userId)) return null;
        return await Membership.findOne({
            chitGroupId: groupId,
            userId: new mongoose.Types.ObjectId(userId)
        });
    }

    public async findMembershipById(membershipId: string): Promise<IMembership | null> {
        if (!mongoose.Types.ObjectId.isValid(membershipId)) return null;
        return await Membership.findById(membershipId);
    }

    public async findGroupById(groupId: any): Promise<IChitGroup | null> {
        return await ChitGroup.findById(groupId);
    }

    public async findOneActiveBid(auctionId: any, membershipId: any): Promise<IBid | null> {
        return await Bid.findOne({
            auctionId,
            membershipId,
            status: { $in: [BidStatus.SUBMITTED, BidStatus.VALID, BidStatus.WINNING] }
        });
    }

    public async findById(bidId: string): Promise<IBid | null> {
        if (!mongoose.Types.ObjectId.isValid(bidId)) return null;
        return await Bid.findById(bidId);
    }

    public async save(bidDoc: IBid): Promise<IBid> {
        return await bidDoc.save();
    }

    public async create(data: Partial<IBid>): Promise<IBid> {
        return await Bid.create(data);
    }

    public async findPopulatedById(bidId: string): Promise<IBid | null> {
        if (!mongoose.Types.ObjectId.isValid(bidId)) return null;
        return await Bid.findById(bidId)
            .populate('userId', 'name email')
            .populate('membershipId')
            .populate('auctionId', 'auctionNumber status scheduledStartTime')
            .populate('cycleId', 'cycleNumber status')
            .populate('groupId', 'name monthlyContribution totalMembers');
    }

    public async findBidsByAuction(auctionId: string, filterByValidOnly: boolean): Promise<IBid[]> {
        const query: any = { auctionId };
        if (filterByValidOnly) {
            query.status = { $in: [BidStatus.SUBMITTED, BidStatus.VALID, BidStatus.WINNING] };
        }

        return await Bid.find(query)
            .sort({ bidPercentage: -1, submittedAt: 1 })
            .populate('userId', 'name email')
            .populate('membershipId');
    }

    public async findBidsByMember(membershipId: string): Promise<IBid[]> {
        if (!mongoose.Types.ObjectId.isValid(membershipId)) return [];
        return await Bid.find({ membershipId })
            .sort({ createdAt: -1 })
            .populate('auctionId', 'auctionNumber status scheduledStartTime')
            .populate('cycleId', 'cycleNumber');
    }
}
