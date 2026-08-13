import mongoose from 'mongoose';
import Account, { IAccount } from '../models/Account.js';
import { AccountCategory, AccountScope } from '../enums/account.enum.js';

export class AccountRepository {
    public async create(data: Partial<IAccount>): Promise<IAccount> {
        return await Account.create(data);
    }

    public async findById(id: string): Promise<IAccount | null> {
        if (!mongoose.Types.ObjectId.isValid(id)) return null;
        return await Account.findById(id);
    }

    public async findByAccountNumber(accountNumber: string): Promise<IAccount | null> {
        return await Account.findOne({ accountNumber });
    }

    public async findGroupAccount(groupId: string, category: AccountCategory): Promise<IAccount | null> {
        if (!mongoose.Types.ObjectId.isValid(groupId)) return null;
        return await Account.findOne({
            groupId: new mongoose.Types.ObjectId(groupId),
            category,
            scope: AccountScope.GROUP,
            isActive: true
        });
    }

    public async findMemberAccount(groupId: string, memberId: string, category: AccountCategory): Promise<IAccount | null> {
        if (!mongoose.Types.ObjectId.isValid(groupId) || !mongoose.Types.ObjectId.isValid(memberId)) return null;
        return await Account.findOne({
            groupId: new mongoose.Types.ObjectId(groupId),
            memberId: new mongoose.Types.ObjectId(memberId),
            category,
            scope: AccountScope.MEMBER,
            isActive: true
        });
    }

    public async findSystemAccount(category: AccountCategory): Promise<IAccount | null> {
        return await Account.findOne({
            category,
            scope: AccountScope.SYSTEM,
            isActive: true
        });
    }

    public async listActiveAccounts(filter: Record<string, any> = {}): Promise<IAccount[]> {
        return await Account.find({ ...filter, isActive: true }).sort({ accountNumber: 1 });
    }
}
