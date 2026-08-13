import mongoose from 'mongoose';
import ChitCycle, { IChitCycle, ChitCycleStatus } from '../models/ChitCycle.js';
import ChitGroup, { IChitGroup } from '@modules/chit-group/models/ChitGroup.js';
import Membership, { IMembership } from '@modules/membership/models/Membership.js';
import Auction from '@modules/auction/models/Auction.js';
import Bid from '@modules/bid/models/Bid.js';

export class ChitCycleRepository {
    public async findGroupById(groupId: string): Promise<IChitGroup | null> {
        if (!mongoose.Types.ObjectId.isValid(groupId)) return null;
        return await ChitGroup.findById(groupId);
    }

    public async findLatestByGroupId(groupId: string): Promise<IChitCycle | null> {
        if (!mongoose.Types.ObjectId.isValid(groupId)) return null;
        return await ChitCycle.findOne({ groupId: new mongoose.Types.ObjectId(groupId) }).sort({ cycleNumber: -1 });
    }

    public async findById(cycleId: string): Promise<IChitCycle | null> {
        if (!mongoose.Types.ObjectId.isValid(cycleId)) return null;
        return await ChitCycle.findById(cycleId);
    }

    public async findActiveByGroupId(groupId: string): Promise<IChitCycle | null> {
        if (!mongoose.Types.ObjectId.isValid(groupId)) return null;
        return await ChitCycle.findOne({ groupId: new mongoose.Types.ObjectId(groupId), status: ChitCycleStatus.ACTIVE });
    }

    public async findByGroupIdAndCycleNumber(groupId: any, cycleNumber: number): Promise<IChitCycle | null> {
        return await ChitCycle.findOne({ groupId, cycleNumber });
    }

    public async findMembershipById(membershipId: string): Promise<IMembership | null> {
        if (!mongoose.Types.ObjectId.isValid(membershipId)) return null;
        return await Membership.findById(membershipId);
    }

    public async save(cycleDoc: IChitCycle): Promise<IChitCycle> {
        return await cycleDoc.save();
    }

    public async create(data: Partial<IChitCycle>): Promise<IChitCycle> {
        return await ChitCycle.create(data);
    }

    private async computeWinningBidAmount(cycle: IChitCycle, bid?: any, auction?: any): Promise<number | null> {
        if (bid?.bidAmount) return bid.bidAmount;
        if (cycle.winningBidAmount) return cycle.winningBidAmount;

        const pct = bid?.bidPercentage || cycle.winningBidPercentage || auction?.minimumBidPercentage;
        if (!pct) return null;

        const group = await ChitGroup.findById(cycle.groupId);
        if (!group || !group.monthlyContribution || !group.totalMembers) return null;

        const totalChitValue = group.monthlyContribution * group.totalMembers;
        return (totalChitValue * pct) / 100;
    }

    public async findByGroup(groupId: string, status?: ChitCycleStatus): Promise<IChitCycle[]> {
        if (!mongoose.Types.ObjectId.isValid(groupId)) return [];
        const query: any = { groupId: new mongoose.Types.ObjectId(groupId) };
        if (status) {
            query.status = status;
        }

        const cycles = await ChitCycle.find(query)
            .sort({ cycleNumber: 1 })
            .populate({
                path: 'winnerMembershipId',
                populate: {
                    path: 'userId',
                    select: 'name email'
                }
            });

        // Auto-sync missing winner details and calculate winning bid amount from Auction module
        let updatedAny = false;
        for (const cycle of cycles) {
            const auction = await Auction.findOne({ cycleId: cycle._id, winningMembershipId: { $ne: null } });

            if (!cycle.winnerMembershipId && auction && auction.winningMembershipId) {
                cycle.winnerMembershipId = auction.winningMembershipId;
                let bid: any = null;
                if (auction.winningBidId) {
                    bid = await Bid.findById(auction.winningBidId);
                    if (bid) {
                        cycle.winningBidPercentage = bid.bidPercentage;
                    }
                }
                const calculatedAmount = await this.computeWinningBidAmount(cycle, bid, auction);
                if (calculatedAmount !== null) {
                    cycle.winningBidAmount = calculatedAmount;
                }
                if (auction.remarks) {
                    cycle.remarks = auction.remarks;
                }
                await cycle.save();
                updatedAny = true;
            } else if (cycle.winnerMembershipId && !cycle.winningBidAmount) {
                let bid: any = null;
                if (auction && auction.winningBidId) {
                    bid = await Bid.findById(auction.winningBidId);
                }
                const calculatedAmount = await this.computeWinningBidAmount(cycle, bid, auction);
                if (calculatedAmount !== null) {
                    cycle.winningBidAmount = calculatedAmount;
                    await cycle.save();
                    updatedAny = true;
                }
            }
        }

        if (updatedAny) {
            return await ChitCycle.find(query)
                .sort({ cycleNumber: 1 })
                .populate({
                    path: 'winnerMembershipId',
                    populate: {
                        path: 'userId',
                        select: 'name email'
                    }
                });
        }

        return cycles;
    }

    public async findPopulatedById(cycleId: string): Promise<IChitCycle | null> {
        if (!mongoose.Types.ObjectId.isValid(cycleId)) return null;
        let cycle = await ChitCycle.findById(cycleId)
            .populate('groupId', 'name totalMembers monthlyContribution organizerId status')
            .populate({
                path: 'winnerMembershipId',
                populate: {
                    path: 'userId',
                    select: 'name email'
                }
            });

        if (cycle) {
            const auction = await Auction.findOne({ cycleId: cycle._id, winningMembershipId: { $ne: null } });

            if (!cycle.winnerMembershipId && auction && auction.winningMembershipId) {
                cycle.winnerMembershipId = auction.winningMembershipId;
                let bid: any = null;
                if (auction.winningBidId) {
                    bid = await Bid.findById(auction.winningBidId);
                    if (bid) {
                        cycle.winningBidPercentage = bid.bidPercentage;
                    }
                }
                const calculatedAmount = await this.computeWinningBidAmount(cycle, bid, auction);
                if (calculatedAmount !== null) {
                    cycle.winningBidAmount = calculatedAmount;
                }
                if (auction.remarks) {
                    cycle.remarks = auction.remarks;
                }
                await cycle.save();
                cycle = await ChitCycle.findById(cycleId)
                    .populate('groupId', 'name totalMembers monthlyContribution organizerId status')
                    .populate({
                        path: 'winnerMembershipId',
                        populate: {
                            path: 'userId',
                            select: 'name email'
                        }
                    });
            } else if (cycle.winnerMembershipId && !cycle.winningBidAmount) {
                let bid: any = null;
                if (auction && auction.winningBidId) {
                    bid = await Bid.findById(auction.winningBidId);
                }
                const calculatedAmount = await this.computeWinningBidAmount(cycle, bid, auction);
                if (calculatedAmount !== null) {
                    cycle.winningBidAmount = calculatedAmount;
                    await cycle.save();
                    cycle = await ChitCycle.findById(cycleId)
                        .populate('groupId', 'name totalMembers monthlyContribution organizerId status')
                        .populate({
                            path: 'winnerMembershipId',
                            populate: {
                                path: 'userId',
                                select: 'name email'
                            }
                        });
                }
            }
        }

        return cycle;
    }

    public async findPopulatedActiveByGroupId(groupId: string): Promise<IChitCycle | null> {
        if (!mongoose.Types.ObjectId.isValid(groupId)) return null;
        return await ChitCycle.findOne({ groupId: new mongoose.Types.ObjectId(groupId), status: ChitCycleStatus.ACTIVE })
            .populate({
                path: 'winnerMembershipId',
                populate: {
                    path: 'userId',
                    select: 'name email'
                }
            });
    }
}
