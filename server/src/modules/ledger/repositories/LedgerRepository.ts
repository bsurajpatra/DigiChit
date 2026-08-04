import mongoose from 'mongoose';
import LedgerEntry from '../models/LedgerEntry.js';
import { ILedgerEntry } from '../interfaces/ILedgerEntry.js';

export interface LedgerPaginationOptions {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export interface LedgerPaginatedResult<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export class LedgerRepository {
    /**
     * Persists a new immutable LedgerEntry in MongoDB.
     */
    public async create(data: Partial<ILedgerEntry>): Promise<ILedgerEntry> {
        return await LedgerEntry.create(data);
    }

    /**
     * Finds a single LedgerEntry by ID.
     */
    public async findById(id: string): Promise<ILedgerEntry | null> {
        if (!mongoose.Types.ObjectId.isValid(id)) return null;
        return await LedgerEntry.findById(id)
            .populate('memberId', 'name email')
            .populate('organizerId', 'name email')
            .populate('groupId', 'name')
            .populate('cycleId', 'cycleNumber status')
            .populate('installmentId', 'installmentNumber dueDate amount')
            .populate('transactionId', 'transactionNumber status paymentMethod');
    }

    /**
     * Finds a single LedgerEntry by unique entry number.
     */
    public async findByEntryNumber(entryNumber: string): Promise<ILedgerEntry | null> {
        return await LedgerEntry.findOne({ entryNumber })
            .populate('memberId', 'name email')
            .populate('organizerId', 'name email')
            .populate('groupId', 'name')
            .populate('cycleId', 'cycleNumber status')
            .populate('installmentId', 'installmentNumber dueDate amount')
            .populate('transactionId', 'transactionNumber status paymentMethod');
    }

    /**
     * Finds a single LedgerEntry by transaction ID for duplicate checking.
     */
    public async findByTransactionId(transactionId: string): Promise<ILedgerEntry | null> {
        if (!mongoose.Types.ObjectId.isValid(transactionId)) return null;
        return await LedgerEntry.findOne({ transactionId: new mongoose.Types.ObjectId(transactionId) });
    }

    /**
     * Generic paginated filter query for ledger entries.
     */
    public async findPaginated(
        filter: Record<string, any>,
        options: LedgerPaginationOptions = {}
    ): Promise<LedgerPaginatedResult<ILedgerEntry>> {
        const page = Math.max(1, options.page || 1);
        const limit = Math.max(1, Math.min(100, options.limit || 20));
        const skip = (page - 1) * limit;

        const sortField = options.sortBy || 'createdAt';
        const sortOrder = options.sortOrder === 'asc' ? 1 : -1;
        const sortOptions: Record<string, 1 | -1> = { [sortField]: sortOrder };

        const [data, total] = await Promise.all([
            LedgerEntry.find(filter)
                .populate('memberId', 'name email')
                .populate('organizerId', 'name email')
                .populate('groupId', 'name')
                .populate('cycleId', 'cycleNumber status')
                .populate('installmentId', 'installmentNumber dueDate amount')
                .populate('transactionId', 'transactionNumber status paymentMethod')
                .sort(sortOptions)
                .skip(skip)
                .limit(limit)
                .exec(),
            LedgerEntry.countDocuments(filter)
        ]);

        return {
            data,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit) || 1
        };
    }
}
