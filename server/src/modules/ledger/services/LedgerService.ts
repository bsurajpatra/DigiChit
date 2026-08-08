import mongoose from 'mongoose';
import { LedgerRepository, LedgerPaginatedResult } from '../repositories/LedgerRepository.js';
import { ILedgerEntry } from '../interfaces/ILedgerEntry.js';
import { CreateLedgerEntryDTO } from '../dto/CreateLedgerEntryDTO.js';
import { LedgerQueryDTO } from '../dto/LedgerQueryDTO.js';
import { AppError } from '@shared/errors/AppError.js';

export class LedgerService {
    private repo: LedgerRepository;

    constructor() {
        this.repo = new LedgerRepository();
    }

    /**
     * Generates a unique sequential/timestamp-based entry number (e.g. LEDGER-2026-000001).
     */
    private generateEntryNumber(): string {
        const year = new Date().getFullYear();
        const randomDigits = Math.floor(100000 + Math.random() * 900000);
        return `LEDGER-${year}-${randomDigits}`;
    }

    /**
     * INTERNAL SERVICE METHOD
     * Creates an immutable LedgerEntry for internal domain operations.
     * MUST NOT be exposed via public HTTP endpoints.
     */
    public async createEntry(dto: CreateLedgerEntryDTO): Promise<ILedgerEntry> {
        if (!dto.amount || dto.amount <= 0) {
            throw new AppError('Ledger entry amount must be greater than zero.', 400, 'INVALID_AMOUNT');
        }

        const entryNumber = this.generateEntryNumber();

        const entryData: Partial<ILedgerEntry> = {
            entryNumber,
            entryType: dto.entryType,
            referenceType: dto.referenceType,
            referenceId: new mongoose.Types.ObjectId(dto.referenceId),
            transactionId: dto.transactionId ? new mongoose.Types.ObjectId(dto.transactionId) : null,
            memberId: new mongoose.Types.ObjectId(dto.memberId),
            organizerId: new mongoose.Types.ObjectId(dto.organizerId),
            groupId: new mongoose.Types.ObjectId(dto.groupId),
            cycleId: new mongoose.Types.ObjectId(dto.cycleId),
            installmentId: new mongoose.Types.ObjectId(dto.installmentId),
            amount: dto.amount,
            direction: dto.direction,
            account: {
                type: dto.account.type,
                name: dto.account.name
            },
            description: dto.description,
            remarks: dto.remarks || null,
            metadata: dto.metadata || {},
            createdBy: dto.createdBy ? (mongoose.Types.ObjectId.isValid(dto.createdBy) ? new mongoose.Types.ObjectId(dto.createdBy) : dto.createdBy) : 'SYSTEM'
        };

        return await this.repo.create(entryData);
    }

    /**
     * Reads a single ledger entry by ID.
     */
    public async findById(id: string): Promise<ILedgerEntry> {
        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new AppError('Invalid Ledger Entry ID.', 400, 'INVALID_ID');
        }
        const entry = await this.repo.findById(id);
        if (!entry) {
            throw new AppError('Ledger entry not found.', 404, 'NOT_FOUND');
        }
        return entry;
    }

    /**
     * Reads ledger entries for a specific member.
     */
    public async findByMember(memberId: string, query: LedgerQueryDTO): Promise<LedgerPaginatedResult<ILedgerEntry>> {
        if (!mongoose.Types.ObjectId.isValid(memberId)) {
            throw new AppError('Invalid Member ID.', 400, 'INVALID_MEMBER_ID');
        }
        const filter: Record<string, any> = { memberId: new mongoose.Types.ObjectId(memberId) };
        if (query.entryType) filter.entryType = query.entryType;
        if (query.direction) filter.direction = query.direction;

        this.applyDateFilter(filter, query.startDate, query.endDate);

        return await this.repo.findPaginated(filter, this.buildPaginationOptions(query));
    }

    /**
     * Reads ledger entries for a specific Chit Group.
     */
    public async findByGroup(groupId: string, query: LedgerQueryDTO): Promise<LedgerPaginatedResult<ILedgerEntry>> {
        if (!mongoose.Types.ObjectId.isValid(groupId)) {
            throw new AppError('Invalid Group ID.', 400, 'INVALID_GROUP_ID');
        }
        const filter: Record<string, any> = { groupId: new mongoose.Types.ObjectId(groupId) };
        if (query.cycleId && mongoose.Types.ObjectId.isValid(query.cycleId)) {
            filter.cycleId = new mongoose.Types.ObjectId(query.cycleId);
        }
        if (query.entryType) filter.entryType = query.entryType;
        if (query.direction) filter.direction = query.direction;

        this.applyDateFilter(filter, query.startDate, query.endDate);

        return await this.repo.findPaginated(filter, this.buildPaginationOptions(query));
    }

    /**
     * Search and filter ledger entries across the system.
     */
    public async search(query: LedgerQueryDTO): Promise<LedgerPaginatedResult<ILedgerEntry>> {
        const filter: Record<string, any> = {};

        if (query.memberId && mongoose.Types.ObjectId.isValid(query.memberId)) {
            filter.memberId = new mongoose.Types.ObjectId(query.memberId);
        }
        if (query.groupId && mongoose.Types.ObjectId.isValid(query.groupId)) {
            filter.groupId = new mongoose.Types.ObjectId(query.groupId);
        }
        if (query.cycleId && mongoose.Types.ObjectId.isValid(query.cycleId)) {
            filter.cycleId = new mongoose.Types.ObjectId(query.cycleId);
        }
        if (query.installmentId && mongoose.Types.ObjectId.isValid(query.installmentId)) {
            filter.installmentId = new mongoose.Types.ObjectId(query.installmentId);
        }
        if (query.transactionId && mongoose.Types.ObjectId.isValid(query.transactionId)) {
            filter.transactionId = new mongoose.Types.ObjectId(query.transactionId);
        }
        if (query.entryType) filter.entryType = query.entryType;
        if (query.direction) filter.direction = query.direction;

        if (query.search) {
            filter.$or = [
                { entryNumber: new RegExp(query.search, 'i') },
                { description: new RegExp(query.search, 'i') },
                { remarks: new RegExp(query.search, 'i') }
            ];
        }

        this.applyDateFilter(filter, query.startDate, query.endDate);

        return await this.repo.findPaginated(filter, this.buildPaginationOptions(query));
    }

    private applyDateFilter(filter: Record<string, any>, startDate?: string, endDate?: string) {
        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) filter.createdAt.$gte = new Date(startDate);
            if (endDate) filter.createdAt.$lte = new Date(endDate);
        }
    }

    private buildPaginationOptions(query: LedgerQueryDTO) {
        return {
            page: query.page ? Number(query.page) : 1,
            limit: query.limit ? Number(query.limit) : 20,
            sortBy: query.sortBy || 'createdAt',
            sortOrder: query.sortOrder || 'desc'
        };
    }
}
