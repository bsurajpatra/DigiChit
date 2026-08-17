import mongoose from 'mongoose';
import JournalEntry, { IJournalEntry } from '../models/JournalEntry.js';
import { JournalDirection } from '../enums/account.enum.js';

export interface JournalPaginationOptions {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export interface JournalPaginatedResult<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export class JournalEntryRepository {
    public async create(data: Partial<IJournalEntry>): Promise<IJournalEntry> {
        return await JournalEntry.create(data);
    }

    public async findByEntryNumber(entryNumber: string): Promise<IJournalEntry | null> {
        return await JournalEntry.findOne({ entryNumber }).populate('lines.accountId');
    }

    public async findByReference(referenceId: string, referenceType?: string): Promise<IJournalEntry | null> {
        const query: any = { referenceId };
        if (referenceType) query.referenceType = referenceType;
        return await JournalEntry.findOne(query).populate('lines.accountId');
    }

    public async findByTransactionId(transactionId: string, entryType?: string): Promise<IJournalEntry | null> {
        if (!mongoose.Types.ObjectId.isValid(transactionId)) return null;
        const query: any = { transactionId: new mongoose.Types.ObjectId(transactionId) };
        if (entryType) query.entryType = entryType;
        return await JournalEntry.findOne(query).populate('lines.accountId');
    }

    public async findPaginated(
        filter: Record<string, any>,
        options: JournalPaginationOptions = {}
    ): Promise<JournalPaginatedResult<IJournalEntry>> {
        const page = Math.max(1, options.page || 1);
        const limit = Math.max(1, Math.min(100, options.limit || 20));
        const skip = (page - 1) * limit;

        const sortField = options.sortBy || 'postedAt';
        const sortOrder = options.sortOrder === 'asc' ? 1 : -1;
        const sortOptions: Record<string, 1 | -1> = { [sortField]: sortOrder };

        const [data, total] = await Promise.all([
            JournalEntry.find(filter)
                .populate('lines.accountId')
                .sort(sortOptions)
                .skip(skip)
                .limit(limit)
                .exec(),
            JournalEntry.countDocuments(filter)
        ]);

        return {
            data,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit) || 1
        };
    }

    /**
     * Dynamically aggregates total DEBITs and CREDITs for a specific account.
     */
    public async aggregateAccountBalance(accountId: string): Promise<{ totalDebitPaise: number; totalCreditPaise: number; netPaise: number }> {
        if (!mongoose.Types.ObjectId.isValid(accountId)) {
            return { totalDebitPaise: 0, totalCreditPaise: 0, netPaise: 0 };
        }

        const accId = new mongoose.Types.ObjectId(accountId);

        const result = await JournalEntry.aggregate([
            { $unwind: '$lines' },
            { $match: { 'lines.accountId': accId } },
            {
                $group: {
                    _id: '$lines.direction',
                    totalAmount: { $sum: '$lines.amountPaise' }
                }
            }
        ]);

        let totalDebitPaise = 0;
        let totalCreditPaise = 0;

        for (const row of result) {
            if (row._id === JournalDirection.DEBIT) {
                totalDebitPaise = row.totalAmount;
            } else if (row._id === JournalDirection.CREDIT) {
                totalCreditPaise = row.totalAmount;
            }
        }

        return {
            totalDebitPaise,
            totalCreditPaise,
            netPaise: totalDebitPaise - totalCreditPaise
        };
    }
}
