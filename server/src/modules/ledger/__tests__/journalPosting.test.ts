import mongoose from 'mongoose';
import Account from '../models/Account.js';
import JournalEntry from '../models/JournalEntry.js';
import { JournalPostingService } from '../services/JournalPostingService.js';
import { AccountType, AccountCategory, AccountScope, JournalDirection, DoubleEntryJournalType } from '../enums/account.enum.js';

export async function runJournalPostingTests() {
    console.log('\n=== RUNNING LEDGER P0 DOUBLE-ENTRY CORE FOUNDATION TESTS ===\n');

    const service = new JournalPostingService();
    const groupId = new mongoose.Types.ObjectId().toString();
    const memberId = new mongoose.Types.ObjectId().toString();

    // Setup Test Accounts in DB
    const bankAcc = await Account.create({
        accountNumber: `ACC-TEST-BANK-${Date.now()}`,
        name: 'Test Group Escrow Bank',
        type: AccountType.ASSET,
        category: AccountCategory.BANK,
        scope: AccountScope.GROUP,
        groupId: new mongoose.Types.ObjectId(groupId),
        currency: 'INR',
        isActive: true
    });

    const receivableAcc = await Account.create({
        accountNumber: `ACC-TEST-REC-${Date.now()}`,
        name: 'Test Member Receivable',
        type: AccountType.ASSET,
        category: AccountCategory.RECEIVABLE,
        scope: AccountScope.MEMBER,
        groupId: new mongoose.Types.ObjectId(groupId),
        memberId: new mongoose.Types.ObjectId(memberId),
        currency: 'INR',
        isActive: true
    });

    const inactiveAcc = await Account.create({
        accountNumber: `ACC-TEST-INACTIVE-${Date.now()}`,
        name: 'Test Inactive Account',
        type: AccountType.ASSET,
        category: AccountCategory.BANK,
        scope: AccountScope.GROUP,
        groupId: new mongoose.Types.ObjectId(groupId),
        currency: 'INR',
        isActive: false
    });

    let passedCount = 0;
    let totalCount = 0;

    const assertReject = async (testName: string, fn: () => Promise<any>, expectedCode?: string) => {
        totalCount++;
        try {
            await fn();
            console.error(`❌ [FAIL] ${testName} - Expected error but succeeded`);
        } catch (err: any) {
            passedCount++;
            console.log(`✅ [PASS] ${testName} - Rejected cleanly (${err.message})`);
        }
    };

    const assertSuccess = async (testName: string, fn: () => Promise<any>) => {
        totalCount++;
        try {
            const res = await fn();
            passedCount++;
            console.log(`✅ [PASS] ${testName} - Succeeded as expected (Entry: ${res.entryNumber}, Amount: ${res.totalAmountPaise} paise)`);
            return res;
        } catch (err: any) {
            console.error(`❌ [FAIL] ${testName} - ${err.message}`);
        }
    };

    // TEST 1: Valid Balanced Entry (Debit 10,000 INR / Credit 10,000 INR = 1000000 paise)
    await assertSuccess('1. Valid Balanced Journal Entry (DEBIT == CREDIT > 0)', async () => {
        return await service.postJournalEntry({
            entryType: DoubleEntryJournalType.INSTALLMENT_PAYMENT,
            referenceType: 'TRANSACTION',
            referenceId: `REF-TEST-${Date.now()}`,
            groupId,
            memberId,
            lines: [
                { accountId: (bankAcc._id as any).toString(), direction: JournalDirection.DEBIT, amountPaise: 1000000 },
                { accountId: (receivableAcc._id as any).toString(), direction: JournalDirection.CREDIT, amountPaise: 1000000 }
            ]
        });
    });

    // TEST 2: Unbalanced Entry (Debit 10,000 / Credit 9,000)
    await assertReject('2. Unbalanced Journal Entry (DEBIT 10,000 != CREDIT 9,000)', async () => {
        return await service.postJournalEntry({
            entryType: DoubleEntryJournalType.INSTALLMENT_PAYMENT,
            referenceType: 'TRANSACTION',
            referenceId: `REF-UNBAL-${Date.now()}`,
            groupId,
            lines: [
                { accountId: (bankAcc._id as any).toString(), direction: JournalDirection.DEBIT, amountPaise: 1000000 },
                { accountId: (receivableAcc._id as any).toString(), direction: JournalDirection.CREDIT, amountPaise: 900000 }
            ]
        });
    });

    // TEST 3: Debit-only Entry
    await assertReject('3. Debit-Only Entry', async () => {
        return await service.postJournalEntry({
            entryType: DoubleEntryJournalType.INSTALLMENT_PAYMENT,
            referenceType: 'TRANSACTION',
            referenceId: `REF-DEBITONLY-${Date.now()}`,
            groupId,
            lines: [
                { accountId: (bankAcc._id as any).toString(), direction: JournalDirection.DEBIT, amountPaise: 1000000 },
                { accountId: (bankAcc._id as any).toString(), direction: JournalDirection.DEBIT, amountPaise: 1000000 }
            ]
        });
    });

    // TEST 4: Credit-only Entry
    await assertReject('4. Credit-Only Entry', async () => {
        return await service.postJournalEntry({
            entryType: DoubleEntryJournalType.INSTALLMENT_PAYMENT,
            referenceType: 'TRANSACTION',
            referenceId: `REF-CREDITONLY-${Date.now()}`,
            groupId,
            lines: [
                { accountId: (receivableAcc._id as any).toString(), direction: JournalDirection.CREDIT, amountPaise: 1000000 },
                { accountId: (receivableAcc._id as any).toString(), direction: JournalDirection.CREDIT, amountPaise: 1000000 }
            ]
        });
    });

    // TEST 5: Zero Amount
    await assertReject('5. Zero Amount Line', async () => {
        return await service.postJournalEntry({
            entryType: DoubleEntryJournalType.INSTALLMENT_PAYMENT,
            referenceType: 'TRANSACTION',
            referenceId: `REF-ZERO-${Date.now()}`,
            groupId,
            lines: [
                { accountId: (bankAcc._id as any).toString(), direction: JournalDirection.DEBIT, amountPaise: 0 },
                { accountId: (receivableAcc._id as any).toString(), direction: JournalDirection.CREDIT, amountPaise: 0 }
            ]
        });
    });

    // TEST 6: Negative Amount
    await assertReject('6. Negative Amount Line', async () => {
        return await service.postJournalEntry({
            entryType: DoubleEntryJournalType.INSTALLMENT_PAYMENT,
            referenceType: 'TRANSACTION',
            referenceId: `REF-NEG-${Date.now()}`,
            groupId,
            lines: [
                { accountId: (bankAcc._id as any).toString(), direction: JournalDirection.DEBIT, amountPaise: -500 },
                { accountId: (receivableAcc._id as any).toString(), direction: JournalDirection.CREDIT, amountPaise: -500 }
            ]
        });
    });

    // TEST 7: Decimal Amount
    await assertReject('7. Decimal Amount Line (Floating Point Rejected)', async () => {
        return await service.postJournalEntry({
            entryType: DoubleEntryJournalType.INSTALLMENT_PAYMENT,
            referenceType: 'TRANSACTION',
            referenceId: `REF-DECIMAL-${Date.now()}`,
            groupId,
            lines: [
                { accountId: (bankAcc._id as any).toString(), direction: JournalDirection.DEBIT, amountPaise: 1000.55 },
                { accountId: (receivableAcc._id as any).toString(), direction: JournalDirection.CREDIT, amountPaise: 1000.55 }
            ]
        });
    });

    // TEST 8: Non-Existent Account
    await assertReject('8. Non-Existent Account ID', async () => {
        const fakeId = new mongoose.Types.ObjectId().toString();
        return await service.postJournalEntry({
            entryType: DoubleEntryJournalType.INSTALLMENT_PAYMENT,
            referenceType: 'TRANSACTION',
            referenceId: `REF-FAKEACC-${Date.now()}`,
            groupId,
            lines: [
                { accountId: fakeId, direction: JournalDirection.DEBIT, amountPaise: 100000 },
                { accountId: (receivableAcc._id as any).toString(), direction: JournalDirection.CREDIT, amountPaise: 100000 }
            ]
        });
    });

    // TEST 9: Inactive Account
    await assertReject('9. Inactive Account ID', async () => {
        return await service.postJournalEntry({
            entryType: DoubleEntryJournalType.INSTALLMENT_PAYMENT,
            referenceType: 'TRANSACTION',
            referenceId: `REF-INACTIVE-${Date.now()}`,
            groupId,
            lines: [
                { accountId: (inactiveAcc._id as any).toString(), direction: JournalDirection.DEBIT, amountPaise: 100000 },
                { accountId: (receivableAcc._id as any).toString(), direction: JournalDirection.CREDIT, amountPaise: 100000 }
            ]
        });
    });

    // TEST 10: Immutability Verification (Update & Delete Rejected)
    const validEntry = await service.postJournalEntry({
        entryType: DoubleEntryJournalType.INSTALLMENT_PAYMENT,
        referenceType: 'TRANSACTION',
        referenceId: `REF-IMMUTABLE-${Date.now()}`,
        groupId,
        memberId,
        lines: [
            { accountId: (bankAcc._id as any).toString(), direction: JournalDirection.DEBIT, amountPaise: 500000 },
            { accountId: (receivableAcc._id as any).toString(), direction: JournalDirection.CREDIT, amountPaise: 500000 }
        ]
    });

    await assertReject('10a. Update Posted Journal Entry (Immutability Check)', async () => {
        return await JournalEntry.updateOne({ _id: validEntry._id }, { $set: { totalAmountPaise: 999 } });
    });

    await assertReject('10b. Delete Posted Journal Entry (Immutability Check)', async () => {
        return await JournalEntry.deleteOne({ _id: validEntry._id });
    });

    // TEST 11: Scope Misconfiguration Check
    await assertReject('11. Invalid Account Scope Assignment (System account with group ID)', async () => {
        return await Account.create({
            accountNumber: `ACC-INVALID-SCOPE-${Date.now()}`,
            name: 'Invalid Scope System Acc',
            type: AccountType.ASSET,
            category: AccountCategory.BANK,
            scope: AccountScope.SYSTEM,
            groupId: new mongoose.Types.ObjectId(groupId)
        });
    });

    console.log(`\n=== LEDGER P0 TEST RESULTS: ${passedCount} / ${totalCount} PASSED ===\n`);
}
