import mongoose from 'mongoose';
import { TransactionService } from '../services/TransactionService.js';
import { TransactionStatus, PaymentGatewayProvider, PaymentMethod } from '../models/Transaction.js';
import User, { UserRole, AccountStatus, KYCStatus } from '@modules/user/models/User.js';
import ChitGroup from '@modules/chit-group/models/ChitGroup.js';
import ChitCycle, { ChitCycleStatus, PaymentCollectionStatus } from '@modules/chit-cycle/models/ChitCycle.js';
import Membership, { MembershipStatus } from '@modules/membership/models/Membership.js';
import Installment, { PaymentStatus } from '@modules/installment/models/Installment.js';
import JournalEntry from '@modules/ledger/models/JournalEntry.js';
import { DoubleEntryJournalType, JournalDirection } from '@modules/ledger/enums/account.enum.js';
import { initPaymentEventListeners } from '../listeners/PaymentEventListener.js';
import { initLedgerEventListeners } from '@modules/ledger/listeners/LedgerEventListener.js';
import { AccountProvisioningService } from '@modules/ledger/services/AccountProvisioningService.js';
import { JournalPostingService } from '@modules/ledger/services/JournalPostingService.js';
import { AccountRepository } from '@modules/ledger/repositories/AccountRepository.js';
import { config } from '@shared/config/env.js';

let passed = 0;
let failed = 0;

async function assertSuccess(name: string, fn: () => Promise<void>) {
    try {
        await fn();
        console.log(`✅ [PASS] ${name}`);
        passed++;
    } catch (err: any) {
        console.error(`❌ [FAIL] ${name} -> ${err.message}`);
        failed++;
    }
}

async function assertRejection(name: string, fn: () => Promise<void>, expectedSubstring?: string) {
    try {
        await fn();
        console.error(`❌ [FAIL] ${name} -> Expected rejection but operation succeeded`);
        failed++;
    } catch (err: any) {
        if (expectedSubstring && !err.message.includes(expectedSubstring)) {
            console.error(`❌ [FAIL] ${name} -> Error message "${err.message}" did not contain "${expectedSubstring}"`);
            failed++;
        } else {
            console.log(`✅ [PASS] ${name} - Rejected cleanly (${err.message})`);
            passed++;
        }
    }
}

export async function runE2EPaymentFlowTests() {
    console.log('\n=== RUNNING PHASE 9 E2E PAYMENT & FINANCIAL FLOW TESTS ===\n');

    initPaymentEventListeners();
    initLedgerEventListeners();

    const txnService = new TransactionService();
    const provisioningService = new AccountProvisioningService();

    const waitForJournal = async (txnId: string, entryType?: string, maxWaitMs = 3000) => {
        const start = Date.now();
        while (Date.now() - start < maxWaitMs) {
            const query: any = { $or: [{ referenceId: txnId }, { transactionId: txnId }] };
            if (entryType) query.entryType = entryType;
            const j = await JournalEntry.findOne(query);
            if (j) return j;
            await new Promise((r) => setTimeout(r, 50));
        }
        const query: any = { $or: [{ referenceId: txnId }, { transactionId: txnId }] };
        if (entryType) query.entryType = entryType;
        return await JournalEntry.findOne(query);
    };

    // 1. Setup Test Users
    const randomSuffix = () => `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    const organizerUser: any = await User.create({
        name: 'Organizer P9',
        email: `org_p9_${randomSuffix()}@test.com`,
        password: 'Password123!',
        role: UserRole.ORGANIZER,
        age: 40,
        accountStatus: AccountStatus.ACTIVE,
        kycStatus: KYCStatus.APPROVED
    });

    const memberA: any = await User.create({
        name: 'Member A P9',
        email: `memA_p9_${randomSuffix()}@test.com`,
        password: 'Password123!',
        role: UserRole.USER,
        age: 28,
        accountStatus: AccountStatus.ACTIVE,
        kycStatus: KYCStatus.APPROVED
    });

    const memberB: any = await User.create({
        name: 'Member B P9',
        email: `memB_p9_${randomSuffix()}@test.com`,
        password: 'Password123!',
        role: UserRole.USER,
        age: 32,
        accountStatus: AccountStatus.ACTIVE,
        kycStatus: KYCStatus.APPROVED
    });

    // 2. Setup Chit Group (₹10,000/mo, 10 members)
    const chitGroup: any = await ChitGroup.create({
        organizerId: organizerUser._id,
        name: 'P9 E2E Chit Group',
        monthlyContribution: 10000,
        totalMembers: 10,
        durationMonths: 10,
        commissionPercent: 5,
        startDate: new Date(),
        financialConfig: { currency: 'INR' }
    });

    // Provision Group and Member Accounts
    await provisioningService.provisionGroupAccounts(chitGroup._id.toString());
    await provisioningService.provisionMemberAccounts(chitGroup._id.toString(), memberA._id.toString());
    await provisioningService.provisionMemberAccounts(chitGroup._id.toString(), memberB._id.toString());

    // 3. Setup Memberships
    const membershipA: any = await Membership.create({
        userId: memberA._id,
        chitGroupId: chitGroup._id,
        status: MembershipStatus.ACTIVE_MEMBER,
        joinedAt: new Date()
    });

    const membershipB: any = await Membership.create({
        userId: memberB._id,
        chitGroupId: chitGroup._id,
        status: MembershipStatus.ACTIVE_MEMBER,
        joinedAt: new Date()
    });

    // 4. Setup Chit Cycle with OPEN collections
    const openCycle: any = await ChitCycle.create({
        groupId: chitGroup._id,
        cycleNumber: 1,
        status: ChitCycleStatus.ACTIVE,
        scheduledStartDate: new Date(),
        paymentCollection: {
            status: PaymentCollectionStatus.OPEN,
            openedAt: new Date(),
            openedBy: organizerUser._id
        }
    });

    // 5. Setup Chit Cycle with NOT_STARTED collections
    const notStartedCycle: any = await ChitCycle.create({
        groupId: chitGroup._id,
        cycleNumber: 2,
        status: ChitCycleStatus.UPCOMING,
        scheduledStartDate: new Date(),
        paymentCollection: {
            status: PaymentCollectionStatus.NOT_STARTED
        }
    });

    // 6. Setup Chit Cycle with CLOSED collections
    const closedCycle: any = await ChitCycle.create({
        groupId: chitGroup._id,
        cycleNumber: 3,
        status: ChitCycleStatus.COMPLETED,
        scheduledStartDate: new Date(),
        paymentCollection: {
            status: PaymentCollectionStatus.CLOSED,
            closedAt: new Date(),
            closedBy: organizerUser._id
        }
    });

    // 7. Setup Installments
    const instOpenA: any = await Installment.create({
        groupId: chitGroup._id,
        cycleId: openCycle._id,
        membershipId: membershipA._id,
        userId: memberA._id,
        installmentNumber: 1,
        amount: 10000,
        paidAmount: 0,
        lateFee: 0,
        paymentStatus: PaymentStatus.PENDING,
        dueDate: new Date(Date.now() + 86400000 * 5)
    });

    const instNotStarted: any = await Installment.create({
        groupId: chitGroup._id,
        cycleId: notStartedCycle._id,
        membershipId: membershipA._id,
        userId: memberA._id,
        installmentNumber: 2,
        amount: 10000,
        paidAmount: 0,
        lateFee: 0,
        paymentStatus: PaymentStatus.PENDING,
        dueDate: new Date(Date.now() + 86400000 * 35)
    });

    const instClosed: any = await Installment.create({
        groupId: chitGroup._id,
        cycleId: closedCycle._id,
        membershipId: membershipA._id,
        userId: memberA._id,
        installmentNumber: 3,
        amount: 10000,
        paidAmount: 0,
        lateFee: 0,
        paymentStatus: PaymentStatus.PENDING,
        dueDate: new Date()
    });

    // Post Initial P2 Obligation Journal for instOpenA
    const accountRepo = new AccountRepository();
    const journalPostingService = new JournalPostingService();
    const memberARecAcc = await accountRepo.findByAccountNumber(`GRP-${chitGroup._id}-MEM-${memberA._id}-RECEIVABLE`);
    const clearingAcc = await accountRepo.findByAccountNumber(`GRP-${chitGroup._id}-CLEARING`);

    await journalPostingService.postJournalEntry({
        groupId: chitGroup._id.toString(),
        cycleId: openCycle._id.toString(),
        memberId: memberA._id.toString(),
        entryType: DoubleEntryJournalType.INSTALLMENT_OBLIGATION,
        referenceType: 'INSTALLMENT',
        referenceId: instOpenA._id.toString(),
        lines: [
            { accountId: memberARecAcc!._id.toString(), direction: JournalDirection.DEBIT, amountPaise: 1000000 },
            { accountId: clearingAcc!._id.toString(), direction: JournalDirection.CREDIT, amountPaise: 1000000 }
        ]
    });

    let initiatedTxn: any = null;
    let verifiedTxn: any = null;

    // 1. Rejection on NOT_STARTED collection
    await assertRejection('1. Payment initiation blocked when collection is NOT_STARTED', async () => {
        await txnService.initiatePayment(memberA._id.toString(), {
            installmentId: instNotStarted._id.toString(),
            paymentMethod: PaymentMethod.UPI,
            paymentGateway: PaymentGatewayProvider.MOCK
        });
    }, 'Collections have not been opened');

    // 2. Rejection on CLOSED collection
    await assertRejection('2. Payment initiation blocked when collection is CLOSED', async () => {
        await txnService.initiatePayment(memberA._id.toString(), {
            installmentId: instClosed._id.toString(),
            paymentMethod: PaymentMethod.UPI,
            paymentGateway: PaymentGatewayProvider.MOCK
        });
    }, 'Collections for this cycle have been closed');

    // 3. Rejection when Member B tries to pay Member A\'s installment
    await assertRejection("3. Non-owner member cannot initiate payment on another user's installment", async () => {
        await txnService.initiatePayment(memberB._id.toString(), {
            installmentId: instOpenA._id.toString(),
            paymentMethod: PaymentMethod.UPI,
            paymentGateway: PaymentGatewayProvider.MOCK
        });
    }, 'Unauthorized: You can only pay for your own installments');

    // 4. Client cannot manipulate payable amount (Authoritative calculation used)
    await assertSuccess('4. Server enforces authoritative installment dues regardless of client payload', async () => {
        initiatedTxn = await txnService.initiatePayment(memberA._id.toString(), {
            installmentId: instOpenA._id.toString(),
            amount: 5, // Client attempts to pay ₹5 instead of ₹10,000
            paymentMethod: PaymentMethod.UPI,
            paymentGateway: PaymentGatewayProvider.MOCK
        });
        if (initiatedTxn.amount !== 10000) {
            throw new Error(`Expected server authoritative amount 10000, received: ${initiatedTxn.amount}`);
        }
        if (initiatedTxn.status !== TransactionStatus.PENDING) {
            throw new Error(`Expected PENDING status, got: ${initiatedTxn.status}`);
        }
    });

    // 5. Verification ownership security
    await assertRejection("5. Non-owner member cannot verify another member's transaction", async () => {
        await txnService.verifyPayment(memberB._id.toString(), {
            transactionId: initiatedTxn._id.toString(),
            gatewayPaymentId: 'pay_mock_unauthorized'
        });
    }, 'Unauthorized: You can only verify your own transactions');

    // 6. Payment Verification Success
    await assertSuccess('6. Owner verifies payment with MockPaymentGateway successfully', async () => {
        verifiedTxn = await txnService.verifyPayment(memberA._id.toString(), {
            transactionId: initiatedTxn._id.toString(),
            gatewayOrderId: initiatedTxn.gatewayOrderId,
            gatewayPaymentId: `pay_mock_${Date.now()}`
        });
        if (verifiedTxn.status !== TransactionStatus.SUCCESS) {
            throw new Error(`Expected SUCCESS status, received: ${verifiedTxn.status}`);
        }
        if (!verifiedTxn.completedAt) {
            throw new Error('completedAt timestamp was not set');
        }
    });

    // Wait 100ms for asynchronous domain event bus processing
    await new Promise((r) => setTimeout(r, 100));

    // 7. Installment state update via PaymentEventListener
    await assertSuccess('7. PaymentEventListener transitions Installment status to PAID with receipt info', async () => {
        const updatedInst = await Installment.findById(instOpenA._id);
        if (!updatedInst) throw new Error('Installment not found');
        if (updatedInst.paymentStatus !== PaymentStatus.PAID) {
            throw new Error(`Expected PAID status, got: ${updatedInst.paymentStatus}`);
        }
        if (updatedInst.paidAmount !== 10000) {
            throw new Error(`Expected paidAmount 10000, got: ${updatedInst.paidAmount}`);
        }
        if (!updatedInst.paidDate) {
            throw new Error('paidDate was not set');
        }
        if (updatedInst.transactionId?.toString() !== verifiedTxn._id.toString()) {
            throw new Error('transactionId on installment does not match verified transaction');
        }
    });

    // 8. Double-Entry Journal Posting via LedgerEventListener
    let paymentJournal: any = null;
    await assertSuccess('8. LedgerEventListener creates exactly one P3 Double-Entry JournalEntry', async () => {
        paymentJournal = await waitForJournal(verifiedTxn._id.toString(), DoubleEntryJournalType.INSTALLMENT_PAYMENT);
        if (!paymentJournal) throw new Error('P3 Payment Journal not found');
        if (!paymentJournal.isBalanced) throw new Error('Journal is not balanced');
        if (paymentJournal.totalAmountPaise !== 1000000) {
            throw new Error(`Expected 1,000,000 paise totalAmountPaise, received: ${paymentJournal.totalAmountPaise}`);
        }
    });

    // 9. Debit/Credit Account Line Verification
    await assertSuccess('9. Correct DEBIT (GROUP BANK) and CREDIT (MEMBER RECEIVABLE) accounts', async () => {
        const debitLine = paymentJournal.lines.find((l: any) => l.direction === JournalDirection.DEBIT);
        const creditLine = paymentJournal.lines.find((l: any) => l.direction === JournalDirection.CREDIT);

        const bankAcc = await accountRepo.findByAccountNumber(`GRP-${chitGroup._id}-BANK`);
        const recAcc = await accountRepo.findByAccountNumber(`GRP-${chitGroup._id}-MEM-${memberA._id}-RECEIVABLE`);

        if (debitLine.accountId.toString() !== bankAcc!._id.toString()) {
            throw new Error('Debit line does not point to Group Bank Escrow account');
        }
        if (creditLine.accountId.toString() !== recAcc!._id.toString()) {
            throw new Error('Credit line does not point to Member Receivable account');
        }
    });

    // 10. Idempotency: Re-verification does not re-process or duplicate records
    await assertSuccess('10. Repeated payment verification is idempotent', async () => {
        const reVerified = await txnService.verifyPayment(memberA._id.toString(), {
            transactionId: initiatedTxn._id.toString(),
            gatewayPaymentId: 'pay_mock_retry'
        });
        if (reVerified.status !== TransactionStatus.SUCCESS) {
            throw new Error('Re-verification failed');
        }
        const journals = await JournalEntry.find({
            referenceId: verifiedTxn._id.toString(),
            entryType: DoubleEntryJournalType.INSTALLMENT_PAYMENT
        });
        if (journals.length !== 1) {
            throw new Error(`Expected exactly 1 journal, found: ${journals.length}`);
        }
    });

    // 11. Cannot initiate another payment for an already PAID installment
    await assertRejection('11. Cannot initiate another payment for an already PAID installment', async () => {
        await txnService.initiatePayment(memberA._id.toString(), {
            installmentId: instOpenA._id.toString(),
            paymentMethod: PaymentMethod.UPI,
            paymentGateway: PaymentGatewayProvider.MOCK
        });
    }, 'This installment has already been paid in full');

    // 12. Non-organizer/non-admin cannot issue refunds
    await assertRejection('12. Regular member cannot initiate payment refund', async () => {
        await txnService.refundPayment(memberA._id.toString(), {
            transactionId: verifiedTxn._id.toString(),
            amount: 10000,
            reason: 'Unauthorized member refund request'
        });
    }, 'Unauthorized: Only Organizers or Admins can process payment refunds');

    // 13. Organizer processes payment refund
    let refundedTxn: any = null;
    await assertSuccess('13. Organizer successfully processes payment refund', async () => {
        refundedTxn = await txnService.refundPayment(organizerUser._id.toString(), {
            transactionId: verifiedTxn._id.toString(),
            amount: 10000,
            reason: 'Organizer approved refund'
        });
        if (refundedTxn.status !== TransactionStatus.REFUNDED) {
            throw new Error(`Expected REFUNDED status, got: ${refundedTxn.status}`);
        }
    });

    // Wait 100ms for refund event bus processing
    await new Promise((r) => setTimeout(r, 100));

    // 14. Original payment journal remains immutable after refund
    await assertSuccess('14. Original P3 payment journal remains strictly immutable', async () => {
        const origJournal = await JournalEntry.findById(paymentJournal._id);
        if (!origJournal) throw new Error('Original journal disappeared');
        if (origJournal.totalAmountPaise !== 1000000) {
            throw new Error('Original journal values were modified');
        }
    });

    // 15. Reversal journal created (P4)
    await assertSuccess('15. P4 Reversal Double-Entry Journal posted correctly', async () => {
        const reversalJournal: any = await waitForJournal(verifiedTxn._id.toString(), DoubleEntryJournalType.PAYMENT_REFUND);
        if (!reversalJournal) throw new Error('P4 Reversal Journal not found');
        if (!reversalJournal.isBalanced) throw new Error('Reversal journal is not balanced');

        const debitLine = reversalJournal.lines.find((l: any) => l.direction === JournalDirection.DEBIT);
        const creditLine = reversalJournal.lines.find((l: any) => l.direction === JournalDirection.CREDIT);

        const bankAcc = await accountRepo.findByAccountNumber(`GRP-${chitGroup._id}-BANK`);
        const recAcc = await accountRepo.findByAccountNumber(`GRP-${chitGroup._id}-MEM-${memberA._id}-RECEIVABLE`);

        if (debitLine.accountId.toString() !== recAcc!._id.toString()) {
            throw new Error('Reversal Debit line does not point to Member Receivable account');
        }
        if (creditLine.accountId.toString() !== bankAcc!._id.toString()) {
            throw new Error('Reversal Credit line does not point to Group Bank Escrow account');
        }
    });

    console.log(`\n======================================================`);
    console.log(`✅ PHASE 9 E2E PAYMENT SUITE COMPLETE: ${passed} / ${passed + failed} TESTS PASSED`);
    console.log(`======================================================\n`);

    if (failed > 0) {
        throw new Error(`${failed} test(s) failed in Phase 9 E2E Payment Suite`);
    }
}
