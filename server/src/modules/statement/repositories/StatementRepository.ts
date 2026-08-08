import mongoose from 'mongoose';
import LedgerEntry from '@modules/ledger/models/LedgerEntry.js';
import Installment, { PaymentStatus } from '@modules/installment/models/Installment.js';
import ChitGroup from '@modules/chit-group/models/ChitGroup.js';
import User from '@modules/user/models/User.js';
import { StatementQueryDTO } from '../dto/StatementQueryDTO.js';

export class StatementRepository {
    /**
     * Builds MongoDB match filter for LedgerEntry based on query parameters.
     */
    public buildLedgerFilter(baseFilter: Record<string, any>, query: StatementQueryDTO): Record<string, any> {
        const filter: Record<string, any> = { ...baseFilter };

        if (query.cycleId && mongoose.Types.ObjectId.isValid(query.cycleId)) {
            filter.cycleId = new mongoose.Types.ObjectId(query.cycleId);
        }
        if (query.groupId && mongoose.Types.ObjectId.isValid(query.groupId)) {
            filter.groupId = new mongoose.Types.ObjectId(query.groupId);
        }
        if (query.entryType) {
            filter.entryType = query.entryType;
        }
        if (query.direction) {
            filter.direction = query.direction;
        }

        if (query.startDate || query.endDate) {
            filter.createdAt = {};
            if (query.startDate) filter.createdAt.$gte = new Date(query.startDate);
            if (query.endDate) filter.createdAt.$lte = new Date(query.endDate);
        }

        if (query.minAmount !== undefined || query.maxAmount !== undefined) {
            filter.amount = {};
            if (query.minAmount !== undefined) filter.amount.$gte = Number(query.minAmount);
            if (query.maxAmount !== undefined) filter.amount.$lte = Number(query.maxAmount);
        }

        if (query.search) {
            filter.$or = [
                { entryNumber: new RegExp(query.search, 'i') },
                { description: new RegExp(query.search, 'i') },
                { remarks: new RegExp(query.search, 'i') }
            ];
        }

        return filter;
    }

    /**
     * Fetches populated ledger entries for CSV export.
     */
    public async getStatementCSVEntries(filter: Record<string, any>) {
        return await LedgerEntry.find(filter)
            .populate('memberId', 'name email')
            .populate('groupId', 'name')
            .populate('cycleId', 'cycleNumber')
            .populate('installmentId', 'installmentNumber')
            .sort({ createdAt: -1 })
            .limit(1000)
            .exec();
    }

    /**
     * Fetches paginated ledger entries with populate for timeline views.
     */
    public async getLedgerTimeline(filter: Record<string, any>, query: StatementQueryDTO) {
        const page = Math.max(1, Number(query.page) || 1);
        const limit = Math.max(1, Math.min(100, Number(query.limit) || 20));
        const skip = (page - 1) * limit;

        const sortField = query.sortBy || 'createdAt';
        const sortOrder = query.sortOrder === 'asc' ? 1 : -1;

        const [entries, total] = await Promise.all([
            LedgerEntry.find(filter)
                .populate('groupId', 'name')
                .populate('cycleId', 'cycleNumber status')
                .populate('installmentId', 'installmentNumber dueDate amount')
                .sort({ [sortField]: sortOrder })
                .skip(skip)
                .limit(limit)
                .exec(),
            LedgerEntry.countDocuments(filter)
        ]);

        return {
            entries,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit) || 1
        };
    }

    /**
     * Aggregates member financial stats from Installments and LedgerEntry.
     */
    public async getMemberFinancialSummary(memberId: string) {
        const mId = new mongoose.Types.ObjectId(memberId);

        const [member, installmentStats, ledgerStats] = await Promise.all([
            User.findById(mId).select('name email role'),
            Installment.aggregate([
                { $match: { userId: mId } },
                {
                    $group: {
                        _id: null,
                        totalInstallmentsCount: { $sum: 1 },
                        paidInstallmentsCount: {
                            $sum: { $cond: [{ $eq: ['$paymentStatus', PaymentStatus.PAID] }, 1, 0] }
                        },
                        pendingInstallmentsCount: {
                            $sum: { $cond: [{ $ne: ['$paymentStatus', PaymentStatus.PAID] }, 1, 0] }
                        },
                        totalPaid: {
                            $sum: { $cond: [{ $eq: ['$paymentStatus', PaymentStatus.PAID] }, '$amount', 0] }
                        },
                        totalOutstanding: {
                            $sum: { $cond: [{ $ne: ['$paymentStatus', PaymentStatus.PAID] }, { $add: ['$amount', { $ifNull: ['$lateFee', 0] }] }, 0] }
                        }
                    }
                }
            ]),
            LedgerEntry.aggregate([
                { $match: { memberId: mId } },
                {
                    $group: {
                        _id: '$entryType',
                        totalAmount: { $sum: '$amount' }
                    }
                }
            ])
        ]);

        const inst = installmentStats[0] || {
            totalInstallmentsCount: 0,
            paidInstallmentsCount: 0,
            pendingInstallmentsCount: 0,
            totalPaid: 0,
            totalOutstanding: 0
        };

        let totalLateFeesPaid = 0;
        let totalRefunds = 0;

        for (const item of ledgerStats) {
            if (item._id === 'LATE_FEE') totalLateFeesPaid += item.totalAmount;
            if (item._id === 'REFUND') totalRefunds += item.totalAmount;
        }

        return {
            member,
            summary: {
                totalPaid: inst.totalPaid,
                totalOutstanding: inst.totalOutstanding,
                totalInstallmentsCount: inst.totalInstallmentsCount,
                paidInstallmentsCount: inst.paidInstallmentsCount,
                pendingInstallmentsCount: inst.pendingInstallmentsCount,
                totalLateFeesPaid,
                totalRefunds
            }
        };
    }

    /**
     * Aggregates organizer financial summary across all managed ChitGroups.
     */
    public async getOrganizerFinancialSummary(organizerId: string) {
        const orgId = new mongoose.Types.ObjectId(organizerId);

        const [organizer, groups] = await Promise.all([
            User.findById(orgId).select('name email role'),
            ChitGroup.find({ organizerId: orgId }).select('_id name currentMemberCount totalMembers status')
        ]);

        const groupIds = groups.map((g) => g._id);
        let totalMembersCount = 0;
        groups.forEach((g) => {
            totalMembersCount += g.currentMemberCount || g.totalMembers || 0;
        });

        const [installmentAgg, ledgerAgg] = await Promise.all([
            Installment.aggregate([
                { $match: { groupId: { $in: groupIds } } },
                {
                    $group: {
                        _id: null,
                        totalExpected: { $sum: { $add: ['$amount', { $ifNull: ['$lateFee', 0] }] } },
                        totalCollected: {
                            $sum: { $cond: [{ $eq: ['$paymentStatus', PaymentStatus.PAID] }, '$amount', 0] }
                        },
                        totalPending: {
                            $sum: { $cond: [{ $ne: ['$paymentStatus', PaymentStatus.PAID] }, { $add: ['$amount', { $ifNull: ['$lateFee', 0] }] }, 0] }
                        }
                    }
                }
            ]),
            LedgerEntry.aggregate([
                { $match: { organizerId: orgId } },
                {
                    $group: {
                        _id: '$entryType',
                        totalAmount: { $sum: '$amount' },
                        count: { $sum: 1 }
                    }
                }
            ])
        ]);

        const stats = installmentAgg[0] || { totalExpected: 0, totalCollected: 0, totalPending: 0 };
        const overallPercentage = stats.totalExpected > 0 ? Math.round((stats.totalCollected / stats.totalExpected) * 100) : 0;

        return {
            organizer,
            summary: {
                totalGroupsCount: groups.length,
                totalMembersCount,
                totalCollectionsExpected: stats.totalExpected,
                totalAmountCollected: stats.totalCollected,
                totalPendingAmount: stats.totalPending,
                completedCyclesCount: groups.filter((g) => g.status === 'COMPLETED').length,
                activeCyclesCount: groups.filter((g) => g.status === 'ACTIVE').length,
                overallCollectionPercentage: overallPercentage
            },
            groupIds
        };
    }

    /**
     * Aggregates single ChitGroup financial summary.
     */
    public async getGroupFinancialSummary(groupId: string) {
        const gId = new mongoose.Types.ObjectId(groupId);

        const [group, installmentAgg] = await Promise.all([
            ChitGroup.findById(gId),
            Installment.aggregate([
                { $match: { groupId: gId } },
                {
                    $group: {
                        _id: null,
                        totalExpected: { $sum: { $add: ['$amount', { $ifNull: ['$lateFee', 0] }] } },
                        totalCollected: {
                            $sum: { $cond: [{ $eq: ['$paymentStatus', PaymentStatus.PAID] }, '$amount', 0] }
                        },
                        totalPending: {
                            $sum: { $cond: [{ $ne: ['$paymentStatus', PaymentStatus.PAID] }, { $add: ['$amount', { $ifNull: ['$lateFee', 0] }] }, 0] }
                        },
                        paidMembersCount: {
                            $sum: { $cond: [{ $eq: ['$paymentStatus', PaymentStatus.PAID] }, 1, 0] }
                        },
                        pendingMembersCount: {
                            $sum: { $cond: [{ $ne: ['$paymentStatus', PaymentStatus.PAID] }, 1, 0] }
                        }
                    }
                }
            ])
        ]);

        const stats = installmentAgg[0] || {
            totalExpected: 0,
            totalCollected: 0,
            totalPending: 0,
            paidMembersCount: 0,
            pendingMembersCount: 0
        };

        const pct = stats.totalExpected > 0 ? Math.round((stats.totalCollected / stats.totalExpected) * 100) : 0;

        return {
            group,
            summary: {
                totalCollectionsExpected: stats.totalExpected,
                totalAmountCollected: stats.totalCollected,
                pendingAmount: stats.totalPending,
                paidMembersCount: stats.paidMembersCount,
                pendingMembersCount: stats.pendingMembersCount,
                collectionPercentage: pct
            }
        };
    }
}
