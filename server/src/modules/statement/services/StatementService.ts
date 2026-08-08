import mongoose from 'mongoose';
import { StatementRepository } from '../repositories/StatementRepository.js';
import { StatementQueryDTO } from '../dto/StatementQueryDTO.js';
import { AppError } from '../../../shared/errors/AppError.js';

export class StatementService {
    private repo: StatementRepository;

    constructor() {
        this.repo = new StatementRepository();
    }

    /**
     * Generates a comprehensive Financial Statement for a Member.
     */
    public async getMemberStatement(memberId: string, query: StatementQueryDTO) {
        if (!mongoose.Types.ObjectId.isValid(memberId)) {
            throw new AppError('Invalid Member ID.', 400, 'INVALID_MEMBER_ID');
        }

        const { member, summary } = await this.repo.getMemberFinancialSummary(memberId);
        if (!member) {
            throw new AppError('Member user record not found.', 404, 'MEMBER_NOT_FOUND');
        }

        const baseFilter = { memberId: new mongoose.Types.ObjectId(memberId) };
        const ledgerFilter = this.repo.buildLedgerFilter(baseFilter, query);
        const { entries, total, page, limit, totalPages } = await this.repo.getLedgerTimeline(ledgerFilter, query);

        return {
            member: {
                _id: member._id,
                name: member.name,
                email: member.email
            },
            summary,
            pagination: {
                total,
                page,
                limit,
                totalPages
            },
            timeline: entries.map((entry) => this.formatTimelineEntry(entry))
        };
    }

    /**
     * Generates a comprehensive Financial Statement for an Organizer across all managed groups.
     */
    public async getOrganizerStatement(organizerId: string, query: StatementQueryDTO) {
        if (!mongoose.Types.ObjectId.isValid(organizerId)) {
            throw new AppError('Invalid Organizer ID.', 400, 'INVALID_ORGANIZER_ID');
        }

        const { organizer, summary } = await this.repo.getOrganizerFinancialSummary(organizerId);
        if (!organizer) {
            throw new AppError('Organizer user record not found.', 404, 'ORGANIZER_NOT_FOUND');
        }

        const baseFilter = { organizerId: new mongoose.Types.ObjectId(organizerId) };
        const ledgerFilter = this.repo.buildLedgerFilter(baseFilter, query);
        const { entries, total, page, limit, totalPages } = await this.repo.getLedgerTimeline(ledgerFilter, query);

        return {
            organizer: {
                _id: organizer._id,
                name: organizer.name,
                email: organizer.email
            },
            summary,
            pagination: {
                total,
                page,
                limit,
                totalPages
            },
            timeline: entries.map((entry) => this.formatTimelineEntry(entry))
        };
    }

    /**
     * Generates a Financial Statement for a specific ChitGroup.
     */
    public async getGroupStatement(groupId: string, query: StatementQueryDTO) {
        if (!mongoose.Types.ObjectId.isValid(groupId)) {
            throw new AppError('Invalid Group ID.', 400, 'INVALID_GROUP_ID');
        }

        const { group, summary } = await this.repo.getGroupFinancialSummary(groupId);
        if (!group) {
            throw new AppError('Chit Group not found.', 404, 'GROUP_NOT_FOUND');
        }

        const baseFilter = { groupId: new mongoose.Types.ObjectId(groupId) };
        const ledgerFilter = this.repo.buildLedgerFilter(baseFilter, query);
        const { entries, total, page, limit, totalPages } = await this.repo.getLedgerTimeline(ledgerFilter, query);

        const totalChitVal = (group.monthlyContribution || 0) * (group.totalMembers || 0);

        return {
            group: {
                _id: group._id,
                name: group.name,
                totalChitValue: totalChitVal,
                monthlyContribution: group.monthlyContribution || 0,
                totalMembers: group.totalMembers || 0,
                totalDurationMonths: group.durationMonths || 0
            },
            summary,
            pagination: {
                total,
                page,
                limit,
                totalPages
            },
            timeline: entries.map((entry) => this.formatTimelineEntry(entry))
        };
    }

    /**
     * Generates CSV format stream content for financial statement export.
     */
    public async generateStatementCSV(query: StatementQueryDTO): Promise<string> {
        const baseFilter: Record<string, any> = {};
        if (query.memberId && mongoose.Types.ObjectId.isValid(query.memberId)) {
            baseFilter.memberId = new mongoose.Types.ObjectId(query.memberId);
        }
        if (query.groupId && mongoose.Types.ObjectId.isValid(query.groupId)) {
            baseFilter.groupId = new mongoose.Types.ObjectId(query.groupId);
        }

        const filter = this.repo.buildLedgerFilter(baseFilter, query);
        const entries = await this.repo.getStatementCSVEntries(filter);

        const headers = [
            'Entry Number',
            'Date',
            'Entry Type',
            'Direction',
            'Amount',
            'Member Name',
            'Group Name',
            'Cycle #',
            'Account Type',
            'Account Name',
            'Description',
            'Remarks'
        ];

        const rows = entries.map((e: any) => [
            e.entryNumber,
            new Date(e.createdAt).toISOString(),
            e.entryType,
            e.direction,
            e.amount,
            e.memberId?.name || '',
            e.groupId?.name || '',
            e.cycleId?.cycleNumber || '',
            e.account?.type || '',
            `"${e.account?.name || ''}"`,
            `"${e.description || ''}"`,
            `"${e.remarks || ''}"`
        ]);

        return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    }

    /**
     * Placeholder implementation for PDF Export.
     */
    public async generateStatementPDF(query: StatementQueryDTO) {
        return {
            success: true,
            message: 'PDF export is ready (Placeholder implementation)',
            format: 'PDF',
            downloadUrl: null,
            generatedAt: new Date()
        };
    }

    private formatTimelineEntry(entry: any) {
        return {
            _id: entry._id.toString(),
            entryNumber: entry.entryNumber,
            entryType: entry.entryType,
            referenceType: entry.referenceType,
            referenceId: entry.referenceId ? entry.referenceId.toString() : '',
            transactionId: entry.transactionId ? entry.transactionId.toString() : null,
            amount: entry.amount,
            direction: entry.direction,
            account: {
                type: entry.account?.type || '',
                name: entry.account?.name || ''
            },
            description: entry.description,
            remarks: entry.remarks || null,
            createdAt: entry.createdAt,
            groupName: entry.groupId?.name || '',
            cycleNumber: entry.cycleId?.cycleNumber || null,
            installmentNumber: entry.installmentId?.installmentNumber || null
        };
    }
}
