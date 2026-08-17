import mongoose from 'mongoose';
import { AccountRepository } from '../repositories/AccountRepository.js';
import { IAccount } from '../models/Account.js';
import { AccountType, AccountCategory, AccountScope } from '../enums/account.enum.js';
import { AppError } from '@shared/errors/AppError.js';

export class AccountProvisioningService {
    private repo: AccountRepository;

    constructor() {
        this.repo = new AccountRepository();
    }

    /**
     * Safely gets an existing account by accountNumber or creates a new one idempotently.
     * Handles race conditions gracefully via database unique index error catching.
     */
    public async getOrCreateAccount(accountData: Partial<IAccount>): Promise<IAccount> {
        if (!accountData.accountNumber) {
            throw new AppError('Account number is required for provisioning', 400, 'INVALID_ACCOUNT_NUMBER');
        }

        // 1. Check if account already exists
        const existing = await this.repo.findByAccountNumber(accountData.accountNumber);
        if (existing) {
            return existing;
        }

        // 2. Attempt creation safely
        try {
            return await this.repo.create({
                ...accountData,
                currency: accountData.currency || 'INR',
                isActive: accountData.isActive ?? true
            });
        } catch (error: any) {
            // Handle race condition: MongoDB duplicate key error (E11000)
            if (error.code === 11000 || (error.message && error.message.includes('E11000'))) {
                const retryFind = await this.repo.findByAccountNumber(accountData.accountNumber);
                if (retryFind) {
                    return retryFind;
                }
            }
            throw error;
        }
    }

    /**
     * Idempotently provisions all required GROUP-scoped accounts for a Chit Group.
     */
    public async provisionGroupAccounts(groupId: string): Promise<IAccount[]> {
        if (!groupId || !mongoose.Types.ObjectId.isValid(groupId)) {
            throw new AppError('Invalid or missing Chit Group ID for account provisioning', 400, 'INVALID_GROUP_ID');
        }

        const gId = new mongoose.Types.ObjectId(groupId);

        const groupAccountTemplates: Partial<IAccount>[] = [
            {
                accountNumber: `GRP-${groupId}-BANK`,
                name: `Chit Group Bank Escrow (${groupId})`,
                type: AccountType.ASSET,
                category: AccountCategory.BANK,
                scope: AccountScope.GROUP,
                groupId: gId,
                memberId: null
            },
            {
                accountNumber: `GRP-${groupId}-CLEARING`,
                name: `Chit Cycle Pot Clearing (${groupId})`,
                type: AccountType.LIABILITY,
                category: AccountCategory.CLEARING,
                scope: AccountScope.GROUP,
                groupId: gId,
                memberId: null
            },
            {
                accountNumber: `GRP-${groupId}-COMM_PAYABLE`,
                name: `Organizer Commission Payable (${groupId})`,
                type: AccountType.LIABILITY,
                category: AccountCategory.PAYABLE,
                scope: AccountScope.GROUP,
                groupId: gId,
                memberId: null
            },
            {
                accountNumber: `GRP-${groupId}-COMM_INCOME`,
                name: `Organizer Commission Income (${groupId})`,
                type: AccountType.REVENUE,
                category: AccountCategory.INCOME,
                scope: AccountScope.GROUP,
                groupId: gId,
                memberId: null
            },
            {
                accountNumber: `GRP-${groupId}-LATEFEE_INCOME`,
                name: `Late Fee Revenue (${groupId})`,
                type: AccountType.REVENUE,
                category: AccountCategory.INCOME,
                scope: AccountScope.GROUP,
                groupId: gId,
                memberId: null
            },
            {
                accountNumber: `GRP-${groupId}-DIV_PAYABLE`,
                name: `Member Dividend Pool Payable (${groupId})`,
                type: AccountType.LIABILITY,
                category: AccountCategory.PAYABLE,
                scope: AccountScope.GROUP,
                groupId: gId,
                memberId: null
            }
        ];

        const createdAccounts: IAccount[] = [];
        for (const tmpl of groupAccountTemplates) {
            const acc = await this.getOrCreateAccount(tmpl);
            createdAccounts.push(acc);
        }

        return createdAccounts;
    }

    /**
     * Idempotently provisions all required MEMBER-scoped accounts for a specific member in a Chit Group.
     */
    public async provisionMemberAccounts(groupId: string, memberId: string): Promise<IAccount[]> {
        if (!groupId || !mongoose.Types.ObjectId.isValid(groupId)) {
            throw new AppError('Invalid or missing Chit Group ID for member account provisioning', 400, 'INVALID_GROUP_ID');
        }
        if (!memberId || !mongoose.Types.ObjectId.isValid(memberId)) {
            throw new AppError('Invalid or missing Member User ID for member account provisioning', 400, 'INVALID_MEMBER_ID');
        }

        const gId = new mongoose.Types.ObjectId(groupId);
        const mId = new mongoose.Types.ObjectId(memberId);

        const memberAccountTemplates: Partial<IAccount>[] = [
            {
                accountNumber: `GRP-${groupId}-MEM-${memberId}-RECEIVABLE`,
                name: `Member Installment Receivable (${memberId})`,
                type: AccountType.ASSET,
                category: AccountCategory.RECEIVABLE,
                scope: AccountScope.MEMBER,
                groupId: gId,
                memberId: mId
            },
            {
                accountNumber: `GRP-${groupId}-MEM-${memberId}-PRIZE_PAYABLE`,
                name: `Member Net Prize Payable (${memberId})`,
                type: AccountType.LIABILITY,
                category: AccountCategory.PAYABLE,
                scope: AccountScope.MEMBER,
                groupId: gId,
                memberId: mId
            }
        ];

        const createdAccounts: IAccount[] = [];
        for (const tmpl of memberAccountTemplates) {
            const acc = await this.getOrCreateAccount(tmpl);
            createdAccounts.push(acc);
        }

        return createdAccounts;
    }

    /**
     * Idempotently provisions global SYSTEM-scoped accounts.
     */
    public async provisionSystemAccounts(): Promise<IAccount[]> {
        const systemAccountTemplates: Partial<IAccount>[] = [
            {
                accountNumber: `SYS-GATEWAY_FEE_EXPENSE`,
                name: `System Payment Gateway Expense`,
                type: AccountType.EXPENSE,
                category: AccountCategory.EXPENSE,
                scope: AccountScope.SYSTEM,
                groupId: null,
                memberId: null
            }
        ];

        const createdAccounts: IAccount[] = [];
        for (const tmpl of systemAccountTemplates) {
            const acc = await this.getOrCreateAccount(tmpl);
            createdAccounts.push(acc);
        }

        return createdAccounts;
    }

    /**
     * Retrieves a specific group account by Category, auto-provisioning if missing.
     */
    public async getGroupAccount(groupId: string, category: AccountCategory): Promise<IAccount> {
        const acc = await this.repo.findGroupAccount(groupId, category);
        if (acc) return acc;

        await this.provisionGroupAccounts(groupId);
        const provisionedAcc = await this.repo.findGroupAccount(groupId, category);
        if (!provisionedAcc) {
            throw new AppError(`Failed to locate or provision Group Account (${category}) for group ${groupId}`, 500, 'ACCOUNT_PROVISIONING_FAILED');
        }
        return provisionedAcc;
    }

    /**
     * Retrieves a specific member account by Category, auto-provisioning if missing.
     */
    public async getMemberAccount(groupId: string, memberId: string, category: AccountCategory): Promise<IAccount> {
        const acc = await this.repo.findMemberAccount(groupId, memberId, category);
        if (acc) return acc;

        await this.provisionMemberAccounts(groupId, memberId);
        const provisionedAcc = await this.repo.findMemberAccount(groupId, memberId, category);
        if (!provisionedAcc) {
            throw new AppError(`Failed to locate or provision Member Account (${category}) for group ${groupId} member ${memberId}`, 500, 'ACCOUNT_PROVISIONING_FAILED');
        }
        return provisionedAcc;
    }

    /**
     * Retrieves a specific system account by Category, auto-provisioning if missing.
     */
    public async getSystemAccount(category: AccountCategory): Promise<IAccount> {
        const acc = await this.repo.findSystemAccount(category);
        if (acc) return acc;

        await this.provisionSystemAccounts();
        const provisionedAcc = await this.repo.findSystemAccount(category);
        if (!provisionedAcc) {
            throw new AppError(`Failed to locate or provision System Account (${category})`, 500, 'ACCOUNT_PROVISIONING_FAILED');
        }
        return provisionedAcc;
    }

    /**
     * Retrieves an account by its deterministic account number, auto-provisioning if missing.
     */
    public async getAccountByNumber(accountNumber: string, groupId?: string, memberId?: string): Promise<IAccount> {
        let acc = await this.repo.findByAccountNumber(accountNumber);
        if (acc) return acc;

        if (groupId && memberId) {
            await this.provisionMemberAccounts(groupId, memberId);
        } else if (groupId) {
            await this.provisionGroupAccounts(groupId);
        } else {
            await this.provisionSystemAccounts();
        }

        acc = await this.repo.findByAccountNumber(accountNumber);
        if (!acc) {
            throw new AppError(`Failed to locate or provision Account ${accountNumber}`, 500, 'ACCOUNT_PROVISIONING_FAILED');
        }
        return acc;
    }

}
