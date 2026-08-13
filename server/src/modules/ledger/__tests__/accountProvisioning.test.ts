import mongoose from 'mongoose';
import Account from '../models/Account.js';
import { AccountProvisioningService } from '../services/AccountProvisioningService.js';
import { JournalPostingService } from '../services/JournalPostingService.js';
import { AccountType, AccountCategory, AccountScope, JournalDirection, DoubleEntryJournalType } from '../enums/account.enum.js';

export async function runAccountProvisioningTests() {
    console.log('\n=== RUNNING LEDGER P1 ACCOUNT PROVISIONING TESTS ===\n');

    const service = new AccountProvisioningService();
    const journalService = new JournalPostingService();

    const groupAId = new mongoose.Types.ObjectId().toString();
    const groupBId = new mongoose.Types.ObjectId().toString();
    const memberXId = new mongoose.Types.ObjectId().toString();

    let passedCount = 0;
    let totalCount = 0;

    const assertSuccess = async (testName: string, fn: () => Promise<any>) => {
        totalCount++;
        try {
            const res = await fn();
            passedCount++;
            console.log(`✅ [PASS] ${testName}`);
            return res;
        } catch (err: any) {
            console.error(`❌ [FAIL] ${testName} - ${err.message}`);
        }
    };

    const assertReject = async (testName: string, fn: () => Promise<any>) => {
        totalCount++;
        try {
            await fn();
            console.error(`❌ [FAIL] ${testName} - Expected error but succeeded`);
        } catch (err: any) {
            passedCount++;
            console.log(`✅ [PASS] ${testName} - Rejected cleanly (${err.message})`);
        }
    };

    // TEST 1: Provision Group Accounts
    await assertSuccess('1. Provision Group Accounts (Creates 6 required GROUP accounts)', async () => {
        const accounts = await service.provisionGroupAccounts(groupAId);
        if (accounts.length !== 6) {
            throw new Error(`Expected 6 accounts, got ${accounts.length}`);
        }
        const bankAcc = accounts.find((a) => a.category === AccountCategory.BANK);
        if (!bankAcc || bankAcc.accountNumber !== `GRP-${groupAId}-BANK` || bankAcc.scope !== AccountScope.GROUP) {
            throw new Error('Group Bank Escrow account mismatch');
        }
    });

    // TEST 2: Provision Same Group Twice (Idempotency)
    await assertSuccess('2. Provision Same Group Twice (Idempotency - No Duplicate Accounts Created)', async () => {
        const firstPass = await service.provisionGroupAccounts(groupAId);
        const secondPass = await service.provisionGroupAccounts(groupAId);
        if (firstPass.length !== 6 || secondPass.length !== 6) {
            throw new Error('Mismatch in provisioned account array length');
        }
        const countInDb = await Account.countDocuments({ groupId: new mongoose.Types.ObjectId(groupAId), scope: AccountScope.GROUP });
        if (countInDb !== 6) {
            throw new Error(`Expected 6 total accounts in DB for group, found ${countInDb}`);
        }
    });

    // TEST 3: Provision Member Account (Correct MEMBER Scope)
    await assertSuccess('3. Provision Member Accounts (Creates 2 MEMBER-scoped accounts)', async () => {
        const accounts = await service.provisionMemberAccounts(groupAId, memberXId);
        if (accounts.length !== 2) {
            throw new Error(`Expected 2 member accounts, got ${accounts.length}`);
        }
        const recAcc = accounts.find((a) => a.category === AccountCategory.RECEIVABLE);
        if (!recAcc || recAcc.scope !== AccountScope.MEMBER || recAcc.accountNumber !== `GRP-${groupAId}-MEM-${memberXId}-RECEIVABLE`) {
            throw new Error('Member Receivable account format mismatch');
        }
    });

    // TEST 4: Same Member in Different Groups (Separate Accounts per Group)
    await assertSuccess('4. Same Member in Different Groups (Separate Accounts per Group)', async () => {
        const accGroupA = await service.provisionMemberAccounts(groupAId, memberXId);
        const accGroupB = await service.provisionMemberAccounts(groupBId, memberXId);

        const recA = accGroupA.find((a) => a.category === AccountCategory.RECEIVABLE);
        const recB = accGroupB.find((a) => a.category === AccountCategory.RECEIVABLE);

        if (recA?.accountNumber === recB?.accountNumber) {
            throw new Error('Accounts across different groups must have unique numbers');
        }
        if (recA?.groupId?.toString() === recB?.groupId?.toString()) {
            throw new Error('Group IDs must not match for different group memberships');
        }
    });

    // TEST 5: Provision Same Member Twice (Idempotency)
    await assertSuccess('5. Provision Same Member Twice (No Duplicates Created)', async () => {
        await service.provisionMemberAccounts(groupAId, memberXId);
        await service.provisionMemberAccounts(groupAId, memberXId);

        const countInDb = await Account.countDocuments({
            groupId: new mongoose.Types.ObjectId(groupAId),
            memberId: new mongoose.Types.ObjectId(memberXId),
            scope: AccountScope.MEMBER
        });

        if (countInDb !== 2) {
            throw new Error(`Expected 2 total accounts in DB for member in group, found ${countInDb}`);
        }
    });

    // TEST 6: Concurrent Provisioning (Race Condition Safety)
    await assertSuccess('6. Concurrent Member Provisioning (Parallel Calls Produce Exactly 1 Account Set)', async () => {
        const concMemberId = new mongoose.Types.ObjectId().toString();
        await Promise.all([
            service.provisionMemberAccounts(groupAId, concMemberId),
            service.provisionMemberAccounts(groupAId, concMemberId),
            service.provisionMemberAccounts(groupAId, concMemberId)
        ]);

        const countInDb = await Account.countDocuments({
            groupId: new mongoose.Types.ObjectId(groupAId),
            memberId: new mongoose.Types.ObjectId(concMemberId),
            scope: AccountScope.MEMBER
        });

        if (countInDb !== 2) {
            throw new Error(`Concurrent provisioning created duplicate accounts! Total found: ${countInDb}`);
        }
    });

    // TEST 7: Account Numbers are Deterministic
    await assertSuccess('7. Deterministic Account Number Verification', async () => {
        const bankAcc = await service.getGroupAccount(groupAId, AccountCategory.BANK);
        if (bankAcc.accountNumber !== `GRP-${groupAId}-BANK`) {
            throw new Error(`Deterministic format invalid. Expected GRP-${groupAId}-BANK, got ${bankAcc.accountNumber}`);
        }
    });

    // TEST 8: Invalid Group/Member References Rejected
    await assertReject('8. Invalid Group ID Reference Rejected', async () => {
        return await service.provisionGroupAccounts('invalid-id');
    });

    // TEST 9: Existing P0 Journal Posting Integration with Provisioned Accounts
    await assertSuccess('9. Integration: Post Double-Entry Journal using Provisioned Accounts', async () => {
        const bankAcc = await service.getGroupAccount(groupAId, AccountCategory.BANK);
        const recAcc = await service.getMemberAccount(groupAId, memberXId, AccountCategory.RECEIVABLE);

        const journal = await journalService.postJournalEntry({
            entryType: DoubleEntryJournalType.INSTALLMENT_PAYMENT,
            referenceType: 'TRANSACTION',
            referenceId: `REF-PROV-${Date.now()}`,
            groupId: groupAId,
            memberId: memberXId,
            lines: [
                { accountId: (bankAcc._id as any).toString(), direction: JournalDirection.DEBIT, amountPaise: 500000 },
                { accountId: (recAcc._id as any).toString(), direction: JournalDirection.CREDIT, amountPaise: 500000 }
            ]
        });

        if (!journal.isBalanced || journal.totalAmountPaise !== 500000) {
            throw new Error('Posted journal entry validation failed');
        }
    });

    console.log(`\n=== LEDGER P1 ACCOUNT PROVISIONING TEST RESULTS: ${passedCount} / ${totalCount} PASSED ===\n`);
}
