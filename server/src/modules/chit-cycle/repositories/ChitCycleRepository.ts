import mongoose from 'mongoose';
import ChitCycle, { IChitCycle, ChitCycleStatus } from '../models/ChitCycle.js';
import ChitGroup, { IChitGroup } from '@modules/chit-group/models/ChitGroup.js';
import Membership, { IMembership } from '@modules/membership/models/Membership.js';

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

    public async findByGroup(groupId: string, status?: ChitCycleStatus): Promise<IChitCycle[]> {
        if (!mongoose.Types.ObjectId.isValid(groupId)) return [];
        const query: any = { groupId: new mongoose.Types.ObjectId(groupId) };
        if (status) {
            query.status = status;
        }

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

    public async findPopulatedById(cycleId: string): Promise<IChitCycle | null> {
        if (!mongoose.Types.ObjectId.isValid(cycleId)) return null;
        return await ChitCycle.findById(cycleId)
            .populate('groupId', 'name totalMembers monthlyContribution organizerId status')
            .populate({
                path: 'winnerMembershipId',
                populate: {
                    path: 'userId',
                    select: 'name email'
                }
            });
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
