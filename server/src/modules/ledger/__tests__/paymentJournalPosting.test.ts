import mongoose from 'mongoose';
import ChitGroup from '@modules/chit-group/models/ChitGroup.js';
import ChitCycle, { ChitCycleStatus } from '@modules/chit-cycle/models/ChitCycle.js';
import Membership, { MembershipStatus } from '@modules/membership/models/Membership.js';
import Installment, { PaymentStatus } from '@modules/installment/models/Installment.js';
import Transaction, { TransactionStatus, PaymentMethod, PaymentGatewayProvider } from '@modules/payment/models/Transaction.js';
import User, { UserRole } from '@modules/user/models/User.js';
import LedgerEntry from '@modules/ledger/models/LedgerEntry.js';
import JournalEntry from '@modules/ledger/models/JournalEntry.js';
import { eventBus } from '@shared/event-bus/EventBus.js';
import { PaymentDomainEventType } from '@modules/payment/index.js';
import {
    initLedgerEventListeners,
    processPaymentJournalPosting,
    JournalEntryRepository,
    AccountProvisioningService,
    JournalPostingService,
    AccountCategory,
    JournalDirection,
    DoubleEntryJournalType
} from '@modules/ledger/index.js';

export async function runPaymentJournalPostingTests() {
    console.log('\n=== RUNNING LEDGER P3 PAYMENT DOUBLE-ENTRY ACCOUNTING TESTS ===\n');

    initLedgerEventListeners();

    const journalRepo = new JournalEntryRepository();
    const provisioningService = new AccountProvisioningService();
    const journalPostingService = new JournalPostingService();

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
            throw err;
        }
    };

    const waitForJournal = async (txnId: string, entryType?: string, maxWaitMs = 3000) => {
        const start = Date.now();
        while (Date.now() - start < maxWaitMs) {
            const j = await journalRepo.findByTransactionId(txnId, entryType);
            if (j) return j;
            await new Promise((r) => setTimeout(r, 100));
        }
        return await journalRepo.findByTransactionId(txnId, entryType);
    };

    // Base Test Entities (For Tests 1 - 9 & 13)
    const organizer: any = await User.create({
        name: 'Org Test User P3',
        email: `org.test.p3.${Date.now()}@example.com`,
        password: 'password123',
        role: UserRole.ORGANIZER,
        age: 35
    });

    const member: any = await User.create({
        name: 'Member Test User P3',
        email: `mem.test.p3.${Date.now()}@example.com`,
        password: 'password123',
        role: UserRole.USER,
        age: 28
    });

    const group: any = await ChitGroup.create({
        name: `Test Group P3 ${Date.now()}`,
        organizerId: organizer._id,
        monthlyContribution: 10000,
        totalMembers: 10,
        currentMemberCount: 1,
        durationMonths: 10,
        startDate: new Date(),
        commissionPercent: 5,
        status: 'ACTIVE'
    });

    const cycle: any = await ChitCycle.create({
        groupId: group._id,
        cycleNumber: 1,
        status: ChitCycleStatus.ACTIVE,
        scheduledStartDate: new Date()
    });

    const membership: any = await Membership.create({
        chitGroupId: group._id,
        userId: member._id,
        status: MembershipStatus.APPROVED,
        joinedAt: new Date()
    });

    const installment: any = await Installment.create({
        groupId: group._id,
        cycleId: cycle._id,
        userId: member._id,
        membershipId: membership._id,
        installmentNumber: 1,
        amount: 10000,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        paymentStatus: PaymentStatus.PENDING
    });

    // Create a ₹10,000 successful transaction
    const successfulTxn: any = await Transaction.create({
        transactionNumber: `TXN-P3-TEST-${Date.now()}`,
        memberId: member._id,
        groupId: group._id,
        cycleId: cycle._id,
        installmentId: installment._id,
        amount: 10000,
        currency: 'INR',
        paymentMethod: PaymentMethod.UPI,
        paymentGateway: PaymentGatewayProvider.MOCK,
        status: TransactionStatus.SUCCESS,
        initiatedAt: new Date(),
        completedAt: new Date()
    });

    // TEST 1: Process successful payment via eventBus -> JournalEntry created
    await assertSuccess('1. Successful ₹10,000 transaction creates JournalEntry', async () => {
        eventBus.emit(PaymentDomainEventType.TRANSACTION_SUCCESS, {
            eventType: PaymentDomainEventType.TRANSACTION_SUCCESS,
            timestamp: new Date(),
            data: successfulTxn
        });

        const journal = await waitForJournal(
            successfulTxn._id.toString(),
            DoubleEntryJournalType.INSTALLMENT_PAYMENT
        );
        if (!journal) {
            throw new Error('JournalEntry was not created for successful transaction');
        }
    });

    // Fetch created journal for assertions 2 - 9
    const paymentJournal = await waitForJournal(
        successfulTxn._id.toString(),
        DoubleEntryJournalType.INSTALLMENT_PAYMENT
    );

    // TEST 2: Correct debit: GROUP_BANK_ESCROW ₹10,000
    await assertSuccess('2. Correct debit: GROUP_BANK_ESCROW (₹10,000 / 1,000,000 paise)', async () => {
        const debitLine = paymentJournal!.lines.find((l) => l.direction === JournalDirection.DEBIT);
        if (!debitLine) throw new Error('No DEBIT line found');
        if (debitLine.accountCategory !== AccountCategory.BANK) {
            throw new Error(`Expected DEBIT account category BANK, got ${debitLine.accountCategory}`);
        }
        if (debitLine.amountPaise !== 1000000) {
            throw new Error(`Expected 1000000 paise, got ${debitLine.amountPaise}`);
        }
    });

    // TEST 3: Correct credit: MEMBER_RECEIVABLE ₹10,000
    await assertSuccess('3. Correct credit: MEMBER_RECEIVABLE (₹10,000 / 1,000,000 paise)', async () => {
        const creditLine = paymentJournal!.lines.find((l) => l.direction === JournalDirection.CREDIT);
        if (!creditLine) throw new Error('No CREDIT line found');
        if (creditLine.accountCategory !== AccountCategory.RECEIVABLE) {
            throw new Error(`Expected CREDIT account category RECEIVABLE, got ${creditLine.accountCategory}`);
        }
        if (creditLine.amountPaise !== 1000000) {
            throw new Error(`Expected 1000000 paise, got ${creditLine.amountPaise}`);
        }
    });

    // TEST 4: Debit = Credit
    await assertSuccess('4. Total DEBIT === Total CREDIT > 0', async () => {
        const debitPaise = paymentJournal!.lines
            .filter((l) => l.direction === JournalDirection.DEBIT)
            .reduce((s, l) => s + l.amountPaise, 0);
        const creditPaise = paymentJournal!.lines
            .filter((l) => l.direction === JournalDirection.CREDIT)
            .reduce((s, l) => s + l.amountPaise, 0);
        if (debitPaise !== 1000000 || creditPaise !== 1000000 || debitPaise !== creditPaise) {
            throw new Error(`Unbalanced: Debit ${debitPaise} vs Credit ${creditPaise}`);
        }
    });

    // TEST 5: Correct transactionId
    await assertSuccess('5. Correct transactionId associated', async () => {
        if (paymentJournal!.transactionId?.toString() !== successfulTxn._id.toString()) {
            throw new Error('transactionId mismatch');
        }
    });

    // TEST 6: Correct groupId
    await assertSuccess('6. Correct groupId associated', async () => {
        if (paymentJournal!.groupId.toString() !== group._id.toString()) {
            throw new Error('groupId mismatch');
        }
    });

    // TEST 7: Correct cycleId
    await assertSuccess('7. Correct cycleId associated', async () => {
        if (paymentJournal!.cycleId?.toString() !== cycle._id.toString()) {
            throw new Error('cycleId mismatch');
        }
    });

    // TEST 8: Correct memberId
    await assertSuccess('8. Correct memberId associated', async () => {
        if (paymentJournal!.memberId?.toString() !== member._id.toString()) {
            throw new Error('memberId mismatch');
        }
    });

    // TEST 9: Correct referenceType and referenceId
    await assertSuccess('9. Correct referenceType (TRANSACTION) and referenceId', async () => {
        if (paymentJournal!.referenceType !== 'TRANSACTION' || paymentJournal!.referenceId !== successfulTxn._id.toString()) {
            throw new Error('referenceType or referenceId mismatch');
        }
    });

    // TEST 10: FAILED transaction -> no payment JournalEntry
    await assertSuccess('10. FAILED transaction creates NO payment JournalEntry', async () => {
        const failedTxn: any = await Transaction.create({
            transactionNumber: `TXN-FAILED-${Date.now()}`,
            memberId: member._id,
            groupId: group._id,
            cycleId: cycle._id,
            installmentId: installment._id,
            amount: 10000,
            currency: 'INR',
            paymentMethod: PaymentMethod.CARD,
            paymentGateway: PaymentGatewayProvider.MOCK,
            status: TransactionStatus.FAILED,
            initiatedAt: new Date()
        });

        eventBus.emit(PaymentDomainEventType.TRANSACTION_SUCCESS, {
            eventType: PaymentDomainEventType.TRANSACTION_SUCCESS,
            timestamp: new Date(),
            data: failedTxn
        });
        await new Promise((r) => setTimeout(r, 200));

        const failedJournal = await journalRepo.findByTransactionId(failedTxn._id.toString());
        if (failedJournal) {
            throw new Error('JournalEntry was unexpectedly created for FAILED transaction');
        }
    });

    // TEST 11: PENDING transaction -> no payment JournalEntry
    await assertSuccess('11. PENDING transaction creates NO payment JournalEntry', async () => {
        const pendingTxn: any = await Transaction.create({
            transactionNumber: `TXN-PENDING-${Date.now()}`,
            memberId: member._id,
            groupId: group._id,
            cycleId: cycle._id,
            installmentId: installment._id,
            amount: 10000,
            currency: 'INR',
            paymentMethod: PaymentMethod.UPI,
            paymentGateway: PaymentGatewayProvider.MOCK,
            status: TransactionStatus.PENDING,
            initiatedAt: new Date()
        });

        await processPaymentJournalPosting(pendingTxn);
        const pendingJournal = await journalRepo.findByTransactionId(pendingTxn._id.toString());
        if (pendingJournal) {
            throw new Error('JournalEntry was unexpectedly created for PENDING transaction');
        }
    });

    // TEST 12: REFUNDED transaction -> no new payment JournalEntry
    await assertSuccess('12. REFUNDED transaction creates NO new payment JournalEntry', async () => {
        const refundedTxn: any = await Transaction.create({
            transactionNumber: `TXN-REFUNDED-${Date.now()}`,
            memberId: member._id,
            groupId: group._id,
            cycleId: cycle._id,
            installmentId: installment._id,
            amount: 10000,
            currency: 'INR',
            paymentMethod: PaymentMethod.UPI,
            paymentGateway: PaymentGatewayProvider.MOCK,
            status: TransactionStatus.REFUNDED,
            initiatedAt: new Date(),
            refundedAt: new Date()
        });

        await processPaymentJournalPosting(refundedTxn);
        const refundedJournal = await journalRepo.findByTransactionId(refundedTxn._id.toString());
        if (refundedJournal) {
            throw new Error('JournalEntry was unexpectedly created for REFUNDED transaction');
        }
    });

    // TEST 13: Duplicate TRANSACTION_SUCCESS -> exactly one JournalEntry (Idempotency)
    await assertSuccess('13. Duplicate TRANSACTION_SUCCESS -> exactly one JournalEntry (Idempotency)', async () => {
        const countBefore = await JournalEntry.countDocuments({
            transactionId: successfulTxn._id,
            entryType: DoubleEntryJournalType.INSTALLMENT_PAYMENT
        });

        // Trigger duplicate event
        eventBus.emit(PaymentDomainEventType.TRANSACTION_SUCCESS, {
            eventType: PaymentDomainEventType.TRANSACTION_SUCCESS,
            timestamp: new Date(),
            data: successfulTxn
        });
        await new Promise((r) => setTimeout(r, 200));

        // Trigger direct duplicate posting
        await processPaymentJournalPosting(successfulTxn);

        const countAfter = await JournalEntry.countDocuments({
            transactionId: successfulTxn._id,
            entryType: DoubleEntryJournalType.INSTALLMENT_PAYMENT
        });

        if (countBefore !== 1 || countAfter !== 1) {
            throw new Error(`Expected exactly 1 journal entry, found ${countAfter}`);
        }
    });

    // TEST 14: Concurrent duplicate events -> exactly one JournalEntry
    await assertSuccess('14. Concurrent duplicate events -> exactly one JournalEntry', async () => {
        const concMember: any = await User.create({
            name: 'Conc Member User P3',
            email: `conc.mem.p3.${Date.now()}@example.com`,
            password: 'password123',
            role: UserRole.USER,
            age: 29
        });

        const concurrentTxn: any = await Transaction.create({
            transactionNumber: `TXN-CONCURRENT-${Date.now()}`,
            memberId: concMember._id,
            groupId: group._id,
            cycleId: cycle._id,
            installmentId: installment._id,
            amount: 5000,
            currency: 'INR',
            paymentMethod: PaymentMethod.UPI,
            paymentGateway: PaymentGatewayProvider.MOCK,
            status: TransactionStatus.SUCCESS,
            initiatedAt: new Date(),
            completedAt: new Date()
        });

        // Fire 5 concurrent postings simultaneously
        await Promise.all([
            processPaymentJournalPosting(concurrentTxn),
            processPaymentJournalPosting(concurrentTxn),
            processPaymentJournalPosting(concurrentTxn),
            processPaymentJournalPosting(concurrentTxn),
            processPaymentJournalPosting(concurrentTxn)
        ]);

        const count = await JournalEntry.countDocuments({
            transactionId: concurrentTxn._id,
            entryType: DoubleEntryJournalType.INSTALLMENT_PAYMENT
        });

        if (count !== 1) {
            throw new Error(`Expected exactly 1 journal entry under concurrency, found ${count}`);
        }
    });

    // TEST 15: Missing bank account -> auto-provisioned
    await assertSuccess('15. Missing bank account is auto-provisioned on demand', async () => {
        const freshGroup: any = await ChitGroup.create({
            name: `Fresh Group P3 ${Date.now()}`,
            organizerId: organizer._id,
            monthlyContribution: 5000,
            totalMembers: 5,
            currentMemberCount: 1,
            durationMonths: 5,
            startDate: new Date(),
            commissionPercent: 5,
            status: 'ACTIVE'
        });

        const freshTxn: any = await Transaction.create({
            transactionNumber: `TXN-AUTOPROV-${Date.now()}`,
            memberId: member._id,
            groupId: freshGroup._id,
            cycleId: cycle._id,
            installmentId: installment._id,
            amount: 5000,
            currency: 'INR',
            paymentMethod: PaymentMethod.UPI,
            paymentGateway: PaymentGatewayProvider.MOCK,
            status: TransactionStatus.SUCCESS,
            initiatedAt: new Date(),
            completedAt: new Date()
        });

        await processPaymentJournalPosting(freshTxn);
        const journal = await journalRepo.findByTransactionId(freshTxn._id.toString());
        if (!journal) throw new Error('Journal was not created with auto-provisioned accounts');
    });

    // TEST 16: Missing member account -> auto-provisioned
    await assertSuccess('16. Missing member account is auto-provisioned on demand', async () => {
        const freshMember: any = await User.create({
            name: 'Fresh Member User P3',
            email: `fresh.mem.p3.${Date.now()}@example.com`,
            password: 'password123',
            role: UserRole.USER,
            age: 26
        });

        const freshMemberTxn: any = await Transaction.create({
            transactionNumber: `TXN-FRESH-MEM-${Date.now()}`,
            memberId: freshMember._id,
            groupId: group._id,
            cycleId: cycle._id,
            installmentId: installment._id,
            amount: 10000,
            currency: 'INR',
            paymentMethod: PaymentMethod.UPI,
            paymentGateway: PaymentGatewayProvider.MOCK,
            status: TransactionStatus.SUCCESS,
            initiatedAt: new Date(),
            completedAt: new Date()
        });

        await processPaymentJournalPosting(freshMemberTxn);
        const journal = await journalRepo.findByTransactionId(freshMemberTxn._id.toString());
        if (!journal) throw new Error('Journal was not created with auto-provisioned member account');
    });

    // TEST 17: Journal posting failure -> error is observable and retry-safe
    await assertSuccess('17. Corrupted transaction amount handled gracefully without throwing unhandled rejection', async () => {
        const corruptTxn = {
            _id: new mongoose.Types.ObjectId(),
            status: TransactionStatus.SUCCESS,
            groupId: group._id,
            memberId: member._id,
            amount: -500 // Invalid negative amount
        } as any;

        // Should not throw unhandled exception
        await processPaymentJournalPosting(corruptTxn);
        const journal = await journalRepo.findByTransactionId(corruptTxn._id.toString());
        if (journal) throw new Error('Journal entry should NOT exist for corrupt transaction');
    });

    // TEST 18: P2 obligation journal remains intact and balances with P3 payment (MEMBER_RECEIVABLE nets to 0)
    await assertSuccess('18. P2 Obligation + P3 Payment nets MEMBER_RECEIVABLE to 0', async () => {
        // Dedicated isolated member & group for netting verification
        const netGroup: any = await ChitGroup.create({
            name: `Net Group P3 ${Date.now()}`,
            organizerId: organizer._id,
            monthlyContribution: 10000,
            totalMembers: 10,
            currentMemberCount: 1,
            durationMonths: 10,
            startDate: new Date(),
            commissionPercent: 5,
            status: 'ACTIVE'
        });

        const netMember: any = await User.create({
            name: 'Net Member User P3',
            email: `net.mem.p3.${Date.now()}@example.com`,
            password: 'password123',
            role: UserRole.USER,
            age: 32
        });

        const netReceivableAcc = await provisioningService.getMemberAccount(
            netGroup._id.toString(),
            netMember._id.toString(),
            AccountCategory.RECEIVABLE
        );
        const netCycleClearingAcc = await provisioningService.getGroupAccount(
            netGroup._id.toString(),
            AccountCategory.CLEARING
        );

        // Step A: P2 Obligation (DEBIT Member Receivable ₹10,000 / 1,000,000 paise)
        await journalPostingService.postJournalEntry({
            entryType: 'INSTALLMENT_OBLIGATION',
            referenceType: 'INSTALLMENT',
            referenceId: new mongoose.Types.ObjectId().toString(),
            groupId: netGroup._id.toString(),
            memberId: netMember._id.toString(),
            createdBy: organizer._id.toString(),
            lines: [
                {
                    accountId: (netReceivableAcc._id as any).toString(),
                    direction: JournalDirection.DEBIT,
                    amountPaise: 1000000,
                    memo: 'Installment obligation for member'
                },
                {
                    accountId: (netCycleClearingAcc._id as any).toString(),
                    direction: JournalDirection.CREDIT,
                    amountPaise: 1000000,
                    memo: 'Pot clearing claim for installment'
                }
            ]
        });

        const balanceAfterObligation = await journalRepo.aggregateAccountBalance((netReceivableAcc._id as any).toString());
        if (balanceAfterObligation.netPaise !== 1000000) {
            throw new Error(`Expected Member Receivable balance +1000000 after obligation, got ${balanceAfterObligation.netPaise}`);
        }

        const netCycle: any = await ChitCycle.create({
            groupId: netGroup._id,
            cycleNumber: 1,
            status: ChitCycleStatus.ACTIVE,
            scheduledStartDate: new Date()
        });

        const netMembership: any = await Membership.create({
            chitGroupId: netGroup._id,
            userId: netMember._id,
            status: MembershipStatus.APPROVED,
            joinedAt: new Date()
        });

        const netInstallment: any = await Installment.create({
            groupId: netGroup._id,
            cycleId: netCycle._id,
            userId: netMember._id,
            membershipId: netMembership._id,
            installmentNumber: 1,
            amount: 10000,
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            paymentStatus: PaymentStatus.PENDING
        });

        // Step B: P3 Payment (CREDIT Member Receivable ₹10,000 / 1,000,000 paise)
        const netTxn: any = await Transaction.create({
            transactionNumber: `TXN-NET-${Date.now()}`,
            memberId: netMember._id,
            groupId: netGroup._id,
            cycleId: netCycle._id,
            installmentId: netInstallment._id,
            amount: 10000,
            currency: 'INR',
            paymentMethod: PaymentMethod.UPI,
            paymentGateway: PaymentGatewayProvider.MOCK,
            status: TransactionStatus.SUCCESS,
            initiatedAt: new Date(),
            completedAt: new Date()
        });

        await processPaymentJournalPosting(netTxn);

        // Step C: Verify Net Balance is exactly 0
        const balanceAfterPayment = await journalRepo.aggregateAccountBalance((netReceivableAcc._id as any).toString());
        if (balanceAfterPayment.netPaise !== 0) {
            throw new Error(`Expected Member Receivable net balance 0 after payment, got ${balanceAfterPayment.netPaise} paise (Debit: ${balanceAfterPayment.totalDebitPaise}, Credit: ${balanceAfterPayment.totalCreditPaise})`);
        }
    });

    // TEST 19: Existing LedgerEntry remains intact (Dual Bookkeeping verified)
    await assertSuccess('19. Existing single-entry LedgerEntry exists alongside JournalEntry (Dual Bookkeeping)', async () => {
        const legacyEntry = await LedgerEntry.findOne({ transactionId: successfulTxn._id });
        if (!legacyEntry) {
            throw new Error('Single-entry LedgerEntry not found for successful transaction');
        }
        if (legacyEntry.direction !== 'CREDIT' || legacyEntry.amount !== 10000) {
            throw new Error('Legacy LedgerEntry data mismatch');
        }
    });

    console.log(`\n======================================================`);
    console.log(`✅ LEDGER P3 TEST SUITE COMPLETE: ${passedCount} / ${totalCount} TESTS PASSED`);
    console.log(`======================================================\n`);

    return { passedCount, totalCount };
}
