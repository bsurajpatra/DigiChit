import mongoose from 'mongoose';
import ChitCycle, { IChitCycle } from '@modules/chit-cycle/models/ChitCycle.js';
import Installment, { PaymentStatus } from '@modules/installment/models/Installment.js';
import ChitGroup, { IChitGroup } from '@modules/chit-group/models/ChitGroup.js';

export interface CollectionSummaryResult {
    cycleId: string;
    groupId: string;
    groupName: string;
    currency: string;
    cycleNumber: number;
    winner: {
        membershipId?: string;
        userName?: string;
        userEmail?: string;
        winningBidAmount?: number;
        winningBidPercentage?: number;
        prizeAmount?: number;
        dividendAmount?: number;
    } | null;
    paymentCollection: {
        status: string;
        openedAt?: Date | null;
        openedBy?: string | null;
        closedAt?: Date | null;
        closedBy?: string | null;
        remarks?: string | null;
    };
    totalMembers: number;
    paidMembers: number;
    pendingMembers: number;
    lateMembers: number;
    totalAmountExpected: number;
    totalAmountCollected: number;
    collectionPercentage: number;
}

export class CollectionRepository {
    public async findCycleById(cycleId: string): Promise<IChitCycle | null> {
        if (!mongoose.Types.ObjectId.isValid(cycleId)) return null;
        return await ChitCycle.findById(cycleId);
    }

    public async findGroupById(groupId: any): Promise<IChitGroup | null> {
        return await ChitGroup.findById(groupId);
    }

    public async saveCycle(cycleDoc: IChitCycle): Promise<IChitCycle> {
        return await cycleDoc.save();
    }

    public async getCollectionSummary(cycleId: string): Promise<CollectionSummaryResult | null> {
        const cycle = await ChitCycle.findById(cycleId)
            .populate('groupId', 'name monthlyContribution totalMembers financialConfig')
            .populate({
                path: 'winnerMembershipId',
                populate: {
                    path: 'userId',
                    select: 'name email'
                }
            });

        if (!cycle) return null;

        const group: any = cycle.groupId;
        const currency = group?.financialConfig?.currency || 'INR';

        // Aggregation on Installments for this cycle
        const installments = await Installment.find({ cycleId: new mongoose.Types.ObjectId(cycleId) });

        const totalMembers = installments.length || (group?.totalMembers || 0);
        let paidMembers = 0;
        let pendingMembers = 0;
        let lateMembers = 0;
        let totalAmountExpected = 0;
        let totalAmountCollected = 0;

        for (const inst of installments) {
            const isPaid = inst.paymentStatus === PaymentStatus.PAID;
            const isOverdue = inst.paymentStatus === PaymentStatus.OVERDUE || inst.lateFee > 0;

            if (isPaid) {
                paidMembers++;
            } else if (isOverdue) {
                lateMembers++;
            } else {
                pendingMembers++;
            }

            const expectedForInst = inst.amount + (inst.lateFee || 0);
            totalAmountExpected += expectedForInst;
            totalAmountCollected += inst.paidAmount || (isPaid ? expectedForInst : 0);
        }

        const collectionPercentage = totalAmountExpected > 0
            ? Math.round((totalAmountCollected / totalAmountExpected) * 10000) / 100
            : 0;

        const winMem: any = cycle.winnerMembershipId;
        const winner = winMem ? {
            membershipId: winMem._id?.toString(),
            userName: winMem.userId?.name || 'Winner',
            userEmail: winMem.userId?.email || '',
            winningBidAmount: cycle.winningBidAmount || 0,
            winningBidPercentage: cycle.winningBidPercentage || 0,
            prizeAmount: cycle.prizeAmount || 0,
            dividendAmount: cycle.dividendAmount || 0
        } : null;

        const pc = cycle.paymentCollection || { status: 'NOT_STARTED' };

        return {
            cycleId: cycle._id.toString(),
            groupId: group?._id?.toString() || cycle.groupId.toString(),
            groupName: group?.name || 'Chit Group',
            currency,
            cycleNumber: cycle.cycleNumber,
            winner,
            paymentCollection: {
                status: pc.status || 'NOT_STARTED',
                openedAt: pc.openedAt || null,
                openedBy: pc.openedBy ? pc.openedBy.toString() : null,
                closedAt: pc.closedAt || null,
                closedBy: pc.closedBy ? pc.closedBy.toString() : null,
                remarks: pc.remarks || null
            },
            totalMembers,
            paidMembers,
            pendingMembers,
            lateMembers,
            totalAmountExpected,
            totalAmountCollected,
            collectionPercentage
        };
    }

    public async getPendingMembers(
        cycleId: string,
        statusFilter?: string,
        searchTerm?: string
    ) {
        const query: any = { cycleId: new mongoose.Types.ObjectId(cycleId) };

        if (statusFilter && statusFilter !== 'ALL') {
            query.paymentStatus = statusFilter;
        }

        const installments = await Installment.find(query)
            .populate('userId', 'name email avatarUrl phone')
            .populate('membershipId', 'joinedAt status')
            .populate('transactionId', 'transactionNumber paymentMethod status completedAt')
            .sort({ installmentNumber: 1, dueDate: 1 });

        if (!searchTerm) {
            return installments;
        }

        const term = searchTerm.toLowerCase();
        return installments.filter((inst: any) => {
            const name = inst.userId?.name || '';
            const email = inst.userId?.email || '';
            return name.toLowerCase().includes(term) || email.toLowerCase().includes(term);
        });
    }
}
