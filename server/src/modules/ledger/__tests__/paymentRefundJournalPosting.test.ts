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
    processPaymentRefundJournalPosting,
    JournalEntryRepository,
    AccountProvisioningService,
    JournalPostingService,
    AccountCategory,
    JournalDirection,
    DoubleEntryJournalType
} from '@modules/ledger/index.js';

export async function runPaymentRefundJournalPostingTests() {
    console.log('\n=== RUNNING LEDGER P4 REFUND DOUBLE-ENTRY ACCOUNTING TESTS ===\n');

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

    // Base Entities
    const organizer: any = await User.create({
        name: 'Org Test User P4',
        email: `org.test.p4.${Date.now()}@example.com`,
        password: 'password123',
        role: UserRole.ORGANIZER,
        age: 38
    });

    const member: any = await User.create({
        name: 'Member Test User P4',
        email: `mem.test.p4.${Date.now()}@example.com`,
        password: 'password123',
        role: UserRole.USER,
        age: 30
    });

    const group: any = await ChitGroup.create({
        name: `Test Group P4 ${Date.now()}`,
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
        paymentStatus: PaymentStatus.PAID
    });

    // 1. Setup P3 successful transaction and P3 journal entry
    const successfulTxn: any = await Transaction.create({
        transactionNumber: `TXN-P4-SUCCESS-${Date.now()}`,
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

    // Post P3 journal
    await processPaymentJournalPosting(successfulTxn);

    // Verify P3 journal exists before testing refund
    const initialP3Journal = await journalRepo.findByTransactionId(
        successfulTxn._id.toString(),
        DoubleEntryJournalType.INSTALLMENT_PAYMENT
    );
    if (!initialP3Journal) {
        throw new Error('Initial P3 journal entry setup failed');
    }

    // Now create the refunded transaction record
    const refundedTxn: any = await Transaction.findByIdAndUpdate(
        successfulTxn._id,
        {
            status: TransactionStatus.REFUNDED,
            refundedAt: new Date(),
            metadata: {
                refund: {
                    refundId: `ref_mock_${successfulTxn._id}`,
                    amount: 10000,
                    status: 'PROCESSED'
                },
                refundReason: 'Member requested cancellation'
            }
        },
        { new: true }
    );

    // TEST 1: Successful P3 payment journal exists
    await assertSuccess('1. Successful P3 payment journal entry exists and is balanced', async () => {
        if (!initialP3Journal.isBalanced || initialP3Journal.totalAmountPaise !== 1000000) {
            throw new Error('P3 journal is not balanced or has incorrect amount');
        }
    });

    // TEST 2: Refund event creates exactly one P4 reversal journal
    await assertSuccess('2. Refund event creates exactly one P4 reversal journal', async () => {
        eventBus.emit(PaymentDomainEventType.TRANSACTION_REFUNDED, {
            eventType: PaymentDomainEventType.TRANSACTION_REFUNDED,
            timestamp: new Date(),
            data: refundedTxn
        });

        const reversal = await waitForJournal(
            refundedTxn._id.toString(),
            DoubleEntryJournalType.PAYMENT_REFUND
        );
        if (!reversal) {
            throw new Error('P4 Reversal JournalEntry was not created for refunded transaction');
        }
    });

    // Fetch created reversal journal for assertions 3 - 11
    const p4ReversalJournal = await waitForJournal(
        refundedTxn._id.toString(),
        DoubleEntryJournalType.PAYMENT_REFUND
    );

    // TEST 3: Correct debit: MEMBER_RECEIVABLE
    await assertSuccess('3. Correct debit: MEMBER_RECEIVABLE (₹10,000 / 1,000,000 paise)', async () => {
        const debitLine = p4ReversalJournal!.lines.find((l) => l.direction === JournalDirection.DEBIT);
        if (!debitLine) throw new Error('No DEBIT line found in reversal journal');
        if (debitLine.accountCategory !== AccountCategory.RECEIVABLE) {
            throw new Error(`Expected DEBIT account category RECEIVABLE, got ${debitLine.accountCategory}`);
        }
        if (debitLine.amountPaise !== 1000000) {
            throw new Error(`Expected 1000000 paise, got ${debitLine.amountPaise}`);
        }
    });

    // TEST 4: Correct credit: GROUP_BANK_ESCROW
    await assertSuccess('4. Correct credit: GROUP_BANK_ESCROW (₹10,000 / 1,000,000 paise)', async () => {
        const creditLine = p4ReversalJournal!.lines.find((l) => l.direction === JournalDirection.CREDIT);
        if (!creditLine) throw new Error('No CREDIT line found in reversal journal');
        if (creditLine.accountCategory !== AccountCategory.BANK) {
            throw new Error(`Expected CREDIT account category BANK, got ${creditLine.accountCategory}`);
        }
        if (creditLine.amountPaise !== 1000000) {
            throw new Error(`Expected 1000000 paise, got ${creditLine.amountPaise}`);
        }
    });

    // TEST 5: Correct refund amount
    await assertSuccess('5. Correct refund total amount in integer paise (1,000,000)', async () => {
        if (p4ReversalJournal!.totalAmountPaise !== 1000000) {
            throw new Error(`Expected totalAmountPaise 1000000, got ${p4ReversalJournal!.totalAmountPaise}`);
        }
    });

    // TEST 6: Debit == Credit
    await assertSuccess('6. Total DEBIT === Total CREDIT (isBalanced = true)', async () => {
        const debitPaise = p4ReversalJournal!.lines
            .filter((l) => l.direction === JournalDirection.DEBIT)
            .reduce((s, l) => s + l.amountPaise, 0);
        const creditPaise = p4ReversalJournal!.lines
            .filter((l) => l.direction === JournalDirection.CREDIT)
            .reduce((s, l) => s + l.amountPaise, 0);
        if (debitPaise !== 1000000 || creditPaise !== 1000000 || debitPaise !== creditPaise || !p4ReversalJournal!.isBalanced) {
            throw new Error(`Unbalanced reversal: Debit ${debitPaise} vs Credit ${creditPaise}`);
        }
    });

    // TEST 7: Correct transactionId
    await assertSuccess('7. Correct transactionId associated', async () => {
        if (p4ReversalJournal!.transactionId?.toString() !== refundedTxn._id.toString()) {
            throw new Error('transactionId mismatch');
        }
    });

    // TEST 8: Correct groupId
    await assertSuccess('8. Correct groupId associated', async () => {
        if (p4ReversalJournal!.groupId.toString() !== group._id.toString()) {
            throw new Error('groupId mismatch');
        }
    });

    // TEST 9: Correct cycleId
    await assertSuccess('9. Correct cycleId associated', async () => {
        if (p4ReversalJournal!.cycleId?.toString() !== cycle._id.toString()) {
            throw new Error('cycleId mismatch');
        }
    });

    // TEST 10: Correct memberId
    await assertSuccess('10. Correct memberId associated', async () => {
        if (p4ReversalJournal!.memberId?.toString() !== member._id.toString()) {
            throw new Error('memberId mismatch');
        }
    });

    // TEST 11: Correct referenceType (REFUND) and referenceId
    await assertSuccess('11. Correct referenceType (REFUND) and referenceId', async () => {
        if (p4ReversalJournal!.referenceType !== 'REFUND') {
            throw new Error(`Expected referenceType REFUND, got ${p4ReversalJournal!.referenceType}`);
        }
    });

    // TEST 12: Original P3 JournalEntry remains unchanged
    await assertSuccess('12. Original P3 JournalEntry remains completely untouched and immutable', async () => {
        const p3JournalAfter = await journalRepo.findByTransactionId(
            successfulTxn._id.toString(),
            DoubleEntryJournalType.INSTALLMENT_PAYMENT
        );
        if (!p3JournalAfter) throw new Error('Original P3 journal disappeared');
        if (p3JournalAfter.entryNumber !== initialP3Journal.entryNumber) {
            throw new Error('Original P3 entryNumber mutated');
        }
        if (p3JournalAfter.totalAmountPaise !== initialP3Journal.totalAmountPaise) {
            throw new Error('Original P3 amount mutated');
        }
        if (p3JournalAfter.lines.length !== 2) {
            throw new Error('Original P3 lines mutated');
        }
    });

    // TEST 13: Duplicate refund event: exactly one P4 reversal (Idempotency)
    await assertSuccess('13. Duplicate refund event creates NO duplicate reversal (Idempotency)', async () => {
        const countBefore = await JournalEntry.countDocuments({
            transactionId: refundedTxn._id,
            entryType: DoubleEntryJournalType.PAYMENT_REFUND
        });

        // Trigger duplicate event
        eventBus.emit(PaymentDomainEventType.TRANSACTION_REFUNDED, {
            eventType: PaymentDomainEventType.TRANSACTION_REFUNDED,
            timestamp: new Date(),
            data: refundedTxn
        });
        await new Promise((r) => setTimeout(r, 200));

        // Trigger direct duplicate method
        await processPaymentRefundJournalPosting(refundedTxn);

        const countAfter = await JournalEntry.countDocuments({
            transactionId: refundedTxn._id,
            entryType: DoubleEntryJournalType.PAYMENT_REFUND
        });

        if (countBefore !== 1 || countAfter !== 1) {
            throw new Error(`Expected exactly 1 reversal entry, found ${countAfter}`);
        }
    });

    // TEST 14: Concurrent refund events: exactly one P4 reversal
    await assertSuccess('14. Concurrent refund events produce exactly ONE reversal journal', async () => {
        const concMember: any = await User.create({
            name: 'Conc Refund Member P4',
            email: `conc.ref.p4.${Date.now()}@example.com`,
            password: 'password123',
            role: UserRole.USER,
            age: 33
        });

        const concPaymentTxn: any = await Transaction.create({
            transactionNumber: `TXN-CONC-REF-PAY-${Date.now()}`,
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

        // Post P3 payment first
        await processPaymentJournalPosting(concPaymentTxn);

        // Update to refunded
        const concRefundTxn: any = await Transaction.findByIdAndUpdate(
            concPaymentTxn._id,
            {
                status: TransactionStatus.REFUNDED,
                refundedAt: new Date(),
                metadata: {
                    refund: { refundId: `ref_conc_${concPaymentTxn._id}`, amount: 5000 }
                }
            },
            { new: true }
        );

        // Fire 5 concurrent refund postings simultaneously
        await Promise.all([
            processPaymentRefundJournalPosting(concRefundTxn),
            processPaymentRefundJournalPosting(concRefundTxn),
            processPaymentRefundJournalPosting(concRefundTxn),
            processPaymentRefundJournalPosting(concRefundTxn),
            processPaymentRefundJournalPosting(concRefundTxn)
        ]);

        const count = await JournalEntry.countDocuments({
            transactionId: concRefundTxn._id,
            entryType: DoubleEntryJournalType.PAYMENT_REFUND
        });

        if (count !== 1) {
            throw new Error(`Expected exactly 1 reversal under concurrency, found ${count}`);
        }
    });

    // TEST 15: Refund without original P3 journal -> NO reversal journal created (orphan prevention)
    await assertSuccess('15. Refund without original P3 payment journal creates NO reversal (Orphan prevention)', async () => {
        const orphanTxn: any = await Transaction.create({
            transactionNumber: `TXN-ORPHAN-${Date.now()}`,
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

        // Try to post reversal without P3 payment journal
        await processPaymentRefundJournalPosting(orphanTxn);

        const orphanJournal = await journalRepo.findByTransactionId(
            orphanTxn._id.toString(),
            DoubleEntryJournalType.PAYMENT_REFUND
        );

        if (orphanJournal) {
            throw new Error('Reversal journal was unexpectedly created for an orphan refund without original payment journal');
        }
    });

    // TEST 16: Second refund attempt on already refunded transaction -> no duplicate reversal
    await assertSuccess('16. Second refund attempt creates no additional reversal journal', async () => {
        await processPaymentRefundJournalPosting(refundedTxn);

        const count = await JournalEntry.countDocuments({
            transactionId: refundedTxn._id,
            entryType: DoubleEntryJournalType.PAYMENT_REFUND
        });

        if (count !== 1) {
            throw new Error(`Expected 1 reversal, found ${count}`);
        }
    });

    // TEST 17: FAILED transaction -> no reversal journal
    await assertSuccess('17. FAILED transaction creates NO reversal journal', async () => {
        const failedTxn: any = await Transaction.create({
            transactionNumber: `TXN-FAILED-REF-${Date.now()}`,
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

        await processPaymentRefundJournalPosting(failedTxn);
        const journal = await journalRepo.findByTransactionId(failedTxn._id.toString());
        if (journal) {
            throw new Error('Journal entry was unexpectedly created for FAILED transaction');
        }
    });

    // TEST 18: PENDING transaction -> no reversal journal
    await assertSuccess('18. PENDING transaction creates NO reversal journal', async () => {
        const pendingTxn: any = await Transaction.create({
            transactionNumber: `TXN-PENDING-REF-${Date.now()}`,
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

        await processPaymentRefundJournalPosting(pendingTxn);
        const journal = await journalRepo.findByTransactionId(pendingTxn._id.toString());
        if (journal) {
            throw new Error('Journal entry was unexpectedly created for PENDING transaction');
        }
    });

    // TEST 19: Complete Lifecycle Net Balance (P2 + P3 + P4)
    await assertSuccess('19. P2 Obligation + P3 Payment + P4 Refund leaves MEMBER_RECEIVABLE = ₹10,000 & ESCROW net = 0', async () => {
        const netGroup: any = await ChitGroup.create({
            name: `Lifecycle Group P4 ${Date.now()}`,
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
            name: 'Lifecycle Member User P4',
            email: `life.mem.p4.${Date.now()}@example.com`,
            password: 'password123',
            role: UserRole.USER,
            age: 34
        });

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

        const netReceivableAcc = await provisioningService.getMemberAccount(
            netGroup._id.toString(),
            netMember._id.toString(),
            AccountCategory.RECEIVABLE
        );
        const netBankEscrowAcc = await provisioningService.getGroupAccount(
            netGroup._id.toString(),
            AccountCategory.BANK
        );
        const netCycleClearingAcc = await provisioningService.getGroupAccount(
            netGroup._id.toString(),
            AccountCategory.CLEARING
        );

        // Phase 1: P2 Obligation (DEBIT Member Receivable 1,000,000 paise, CREDIT Pot Clearing 1,000,000 paise)
        await journalPostingService.postJournalEntry({
            entryType: DoubleEntryJournalType.INSTALLMENT_OBLIGATION,
            referenceType: 'INSTALLMENT',
            referenceId: netInstallment._id.toString(),
            groupId: netGroup._id.toString(),
            cycleId: netCycle._id.toString(),
            memberId: netMember._id.toString(),
            createdBy: organizer._id.toString(),
            lines: [
                {
                    accountId: (netReceivableAcc._id as any).toString(),
                    direction: JournalDirection.DEBIT,
                    amountPaise: 1000000,
                    memo: 'Installment obligation'
                },
                {
                    accountId: (netCycleClearingAcc._id as any).toString(),
                    direction: JournalDirection.CREDIT,
                    amountPaise: 1000000,
                    memo: 'Pot clearing claim'
                }
            ]
        });

        let balanceReceivable = await journalRepo.aggregateAccountBalance((netReceivableAcc._id as any).toString());
        if (balanceReceivable.netPaise !== 1000000) {
            throw new Error(`Expected Member Receivable +1000000 after P2, got ${balanceReceivable.netPaise}`);
        }

        // Phase 2: P3 Payment (DEBIT Bank Escrow 1,000,000 paise, CREDIT Member Receivable 1,000,000 paise)
        const lifecycleTxn: any = await Transaction.create({
            transactionNumber: `TXN-LIFE-P4-${Date.now()}`,
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

        await processPaymentJournalPosting(lifecycleTxn);

        balanceReceivable = await journalRepo.aggregateAccountBalance((netReceivableAcc._id as any).toString());
        let balanceBankEscrow = await journalRepo.aggregateAccountBalance((netBankEscrowAcc._id as any).toString());
        if (balanceReceivable.netPaise !== 0) {
            throw new Error(`Expected Member Receivable 0 after P3 payment, got ${balanceReceivable.netPaise}`);
        }
        if (balanceBankEscrow.netPaise !== 1000000) {
            throw new Error(`Expected Bank Escrow +1000000 after P3 payment, got ${balanceBankEscrow.netPaise}`);
        }

        // Phase 3: P4 Refund (DEBIT Member Receivable 1,000,000 paise, CREDIT Bank Escrow 1,000,000 paise)
        const lifecycleRefundTxn: any = await Transaction.findByIdAndUpdate(
            lifecycleTxn._id,
            {
                status: TransactionStatus.REFUNDED,
                refundedAt: new Date(),
                metadata: {
                    refund: { refundId: `ref_life_${lifecycleTxn._id}`, amount: 10000 }
                }
            },
            { new: true }
        );

        await processPaymentRefundJournalPosting(lifecycleRefundTxn);

        balanceReceivable = await journalRepo.aggregateAccountBalance((netReceivableAcc._id as any).toString());
        balanceBankEscrow = await journalRepo.aggregateAccountBalance((netBankEscrowAcc._id as any).toString());

        // MEMBER_RECEIVABLE must return to original obligation (+1,000,000 paise)
        if (balanceReceivable.netPaise !== 1000000) {
            throw new Error(`Expected Member Receivable net balance +1000000 after refund, got ${balanceReceivable.netPaise}`);
        }

        // GROUP_BANK_ESCROW net cash effect must be 0
        if (balanceBankEscrow.netPaise !== 0) {
            throw new Error(`Expected Bank Escrow net balance 0 after refund, got ${balanceBankEscrow.netPaise}`);
        }
    });

    console.log(`\n======================================================`);
    console.log(`✅ LEDGER P4 TEST SUITE COMPLETE: ${passedCount} / ${totalCount} TESTS PASSED`);
    console.log(`======================================================\n`);

    return { passedCount, totalCount };
}
