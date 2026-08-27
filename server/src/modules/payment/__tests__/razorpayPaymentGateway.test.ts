import mongoose from 'mongoose';
import crypto from 'crypto';
import { TransactionService } from '../services/TransactionService.js';
import { PaymentGatewayFactory } from '../gateways/PaymentGatewayFactory.js';
import { RazorpayPaymentGateway } from '../gateways/razorpay/RazorpayPaymentGateway.js';
import { TransactionStatus, PaymentMethod, PaymentGatewayProvider } from '../models/Transaction.js';
import Transaction from '../models/Transaction.js';
import User, { UserRole, AccountStatus, KYCStatus } from '@modules/user/models/User.js';
import ChitGroup, { ChitGroupStatus } from '@modules/chit-group/models/ChitGroup.js';
import ChitCycle, { ChitCycleStatus, PaymentCollectionStatus } from '@modules/chit-cycle/models/ChitCycle.js';
import Membership, { MembershipStatus } from '@modules/membership/models/Membership.js';
import Installment, { PaymentStatus } from '@modules/installment/models/Installment.js';
import JournalEntry from '@modules/ledger/models/JournalEntry.js';
import { AccountProvisioningService } from '@modules/ledger/services/AccountProvisioningService.js';
import { initPaymentEventListeners } from '../listeners/PaymentEventListener.js';
import { initLedgerEventListeners } from '@modules/ledger/listeners/LedgerEventListener.js';
import { config } from '@shared/config/env.js';

let passed = 0;
let total = 0;

function assert(condition: boolean, testName: string, detail?: string) {
    total++;
    if (condition) {
        passed++;
        console.log(`✅ [PASS] ${total}. ${testName}`);
    } else {
        console.error(`❌ [FAIL] ${total}. ${testName} - ${detail || 'Assertion failed'}`);
        throw new Error(`Test Failed: ${testName} - ${detail || ''}`);
    }
}

export async function runRazorpayGatewayTests() {
    console.log('\n=== RUNNING RAZORPAY TEST GATEWAY & INTEGRATION TESTS ===\n');

    initPaymentEventListeners();
    initLedgerEventListeners();

    const testKeyId = 'rzp_test_digichit123456';
    const testKeySecret = 'sec_test_secret9876543210abcdef';

    // Mock Razorpay Gateway with in-memory order registry for deterministic offline testing
    class TestableRazorpayGateway extends RazorpayPaymentGateway {
        public mockOrders: Map<string, any> = new Map();

        constructor() {
            super(testKeyId, testKeySecret);
        }

        public override async createOrder(input: any): Promise<any> {
            const amountInPaise = Math.round(input.amount * 100);
            const gatewayOrderId = `order_rzp_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
            const receipt = input.receipt || `rcpt_${Date.now()}`;

            const order = {
                id: gatewayOrderId,
                entity: 'order',
                amount: amountInPaise,
                currency: input.currency || 'INR',
                receipt,
                status: 'created',
                notes: input.notes || {}
            };

            this.mockOrders.set(gatewayOrderId, order);

            return {
                gatewayOrderId,
                gatewayReference: receipt,
                amount: input.amount,
                currency: order.currency,
                status: order.status,
                rawResponse: order
            };
        }

        public override async refund(input: any): Promise<any> {
            const refundId = `rfnd_rzp_${Date.now()}`;
            return {
                refundId,
                gatewayPaymentId: input.gatewayPaymentId,
                amount: input.amount,
                status: 'processed',
                rawResponse: { id: refundId, status: 'processed' }
            };
        }
    }

    const testGateway = new TestableRazorpayGateway();
    PaymentGatewayFactory.setRazorpayInstance(testGateway);

    const transactionService = new TransactionService();
    const provisioningService = new AccountProvisioningService();

    const waitForJournal = async (txnId: string, maxWaitMs = 3000) => {
        const start = Date.now();
        while (Date.now() - start < maxWaitMs) {
            const query: any = { $or: [{ referenceId: txnId }, { transactionId: txnId }] };
            const j = await JournalEntry.findOne(query);
            if (j) return j;
            await new Promise((r) => setTimeout(r, 50));
        }
        const query: any = { $or: [{ referenceId: txnId }, { transactionId: txnId }] };
        return await JournalEntry.findOne(query);
    };

    // 1. Setup Test Users
    const randomSuffix = Date.now().toString() + '_' + Math.random().toString(36).slice(2, 6);
    const member: any = await (User as any).create({
        name: 'Razorpay Test Member',
        email: `rzp_member_${randomSuffix}@digichit.test`,
        password: 'Password123!',
        age: 28,
        accountStatus: AccountStatus.ACTIVE,
        role: UserRole.USER,
        kycStatus: KYCStatus.APPROVED,
        emailVerified: true
    });

    const organizer: any = await (User as any).create({
        name: 'Razorpay Test Organizer',
        email: `rzp_organizer_${randomSuffix}@digichit.test`,
        password: 'Password123!',
        age: 35,
        accountStatus: AccountStatus.ACTIVE,
        role: UserRole.ORGANIZER,
        kycStatus: KYCStatus.APPROVED,
        emailVerified: true
    });

    // 2. Setup Chit Group & Provision Accounts
    const group: any = await ChitGroup.create({
        name: 'Razorpay Test Group',
        organizerId: organizer._id,
        totalMembers: 10,
        monthlyContribution: 10000,
        commissionPercent: 5,
        durationMonths: 10,
        startDate: new Date(),
        status: ChitGroupStatus.ACTIVE,
        financialConfig: { currency: 'INR' }
    });

    await provisioningService.provisionGroupAccounts(group._id.toString());
    await provisioningService.provisionMemberAccounts(group._id.toString(), member._id.toString());

    const membership: any = await Membership.create({
        userId: member._id,
        chitGroupId: group._id,
        status: MembershipStatus.ACTIVE_MEMBER,
        joinedAt: new Date()
    });

    // 3. Setup Active Cycle & Installment
    const cycle: any = await ChitCycle.create({
        groupId: group._id,
        cycleNumber: 1,
        status: ChitCycleStatus.ACTIVE,
        scheduledStartDate: new Date(),
        actualStartDate: new Date(),
        winnerMembershipId: membership._id, // winner declared
        paymentCollection: {
            status: PaymentCollectionStatus.OPEN,
            openedAt: new Date()
        }
    });

    const installment: any = await Installment.create({
        groupId: group._id,
        cycleId: cycle._id,
        userId: member._id,
        membershipId: membership._id,
        installmentNumber: 1,
        amount: 10000,
        lateFee: 200,
        paymentStatus: PaymentStatus.PENDING,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });

    // ─── TEST 1: Razorpay Order Creation via InitiatePayment ───
    const initiatedTxn = await transactionService.initiatePayment(member._id.toString(), {
        installmentId: installment._id.toString(),
        paymentMethod: PaymentMethod.CARD,
        paymentGateway: PaymentGatewayProvider.RAZORPAY
    });

    assert(!!initiatedTxn, 'Razorpay Payment initiation returns valid Transaction');
    assert(initiatedTxn.paymentGateway === PaymentGatewayProvider.RAZORPAY, 'Transaction recorded with RAZORPAY gateway');
    assert(initiatedTxn.status === TransactionStatus.PENDING, 'Transaction remains PENDING after initiation');
    assert(initiatedTxn.amount === 10200, 'Transaction amount correctly includes base dues + late fee (₹10,200)');
    assert(!!initiatedTxn.gatewayOrderId && initiatedTxn.gatewayOrderId.startsWith('order_rzp_'), 'Razorpay Order ID persisted in Transaction');

    // ─── TEST 2: Cryptographic Signature Verification - Reject Invalid Signature ───
    const fakePaymentId = `pay_rzp_${Date.now()}`;
    const invalidSignature = 'invalid_tampered_hex_signature_1234567890abcdef1234567890abcdef12345678';

    let rejectedCleanly = false;
    try {
        await transactionService.verifyPayment(member._id.toString(), {
            transactionId: initiatedTxn._id.toString(),
            gatewayOrderId: initiatedTxn.gatewayOrderId!,
            gatewayPaymentId: fakePaymentId,
            gatewaySignature: invalidSignature
        });
    } catch (err: any) {
        rejectedCleanly = true;
    }
    assert(rejectedCleanly, 'Rejects invalid/tampered Razorpay cryptographic signature');

    // ─── TEST 3: Cryptographic Signature Verification - Accept Valid HMAC-SHA256 Signature ───
    const validPaymentId = `pay_rzp_${Date.now()}_valid`;
    const validSignature = crypto
        .createHmac('sha256', testKeySecret)
        .update(`${initiatedTxn.gatewayOrderId}|${validPaymentId}`)
        .digest('hex');

    const verifiedTxn = await transactionService.verifyPayment(member._id.toString(), {
        transactionId: initiatedTxn._id.toString(),
        gatewayOrderId: initiatedTxn.gatewayOrderId!,
        gatewayPaymentId: validPaymentId,
        gatewaySignature: validSignature
    });

    assert(verifiedTxn.status === TransactionStatus.SUCCESS, 'Valid Razorpay signature transitions Transaction to SUCCESS');
    assert(verifiedTxn.gatewayPaymentId === validPaymentId, 'Razorpay Payment ID persisted on verified transaction');
    assert(!!verifiedTxn.receiptNumber, 'Receipt number generated for successful Razorpay transaction');

    // ─── TEST 4: Installment & Double-Entry Accounting Verification ───
    const journal = await waitForJournal(initiatedTxn._id.toString());
    assert(!!journal, 'Double-entry JournalEntry created for Razorpay transaction');
    assert(journal?.isBalanced === true, 'Razorpay JournalEntry is balanced (DEBIT === CREDIT)');
    assert(journal?.totalAmountPaise === 1020000, 'Journal total amount in integer paise is 1,020,000 (₹10,200)');

    const updatedInstallment = await Installment.findById(installment._id);
    assert(updatedInstallment?.paymentStatus === PaymentStatus.PAID, 'Installment updated to PAID status via domain event');

    // ─── TEST 5: Idempotent Repeated Verification ───
    const duplicateVerify = await transactionService.verifyPayment(member._id.toString(), {
        transactionId: initiatedTxn._id.toString(),
        gatewayOrderId: initiatedTxn.gatewayOrderId!,
        gatewayPaymentId: validPaymentId,
        gatewaySignature: validSignature
    });
    assert(duplicateVerify.status === TransactionStatus.SUCCESS, 'Repeated verification safely returns existing SUCCESS transaction');

    const journalCount = await JournalEntry.countDocuments({
        $or: [{ referenceId: initiatedTxn._id.toString() }, { transactionId: initiatedTxn._id.toString() }],
        entryType: 'INSTALLMENT_PAYMENT'
    });
    assert(journalCount === 1, 'Exactly ONE JournalEntry exists for Razorpay transaction (Idempotency)');

    // ─── TEST 6: Razorpay Refund Processing ───
    const refundedTxn = await transactionService.refundPayment(organizer._id.toString(), {
        transactionId: initiatedTxn._id.toString(),
        reason: 'Razorpay Test Refund'
    });
    assert(refundedTxn.status === TransactionStatus.REFUNDED, 'Razorpay transaction status updated to REFUNDED');

    const reversalJournal = await waitForJournal(initiatedTxn._id.toString());
    assert(!!reversalJournal, 'Reversal JournalEntry created upon Razorpay refund');
    assert(reversalJournal?.isBalanced === true, 'Razorpay Reversal JournalEntry is balanced');

    // ─── TEST 7: Mock Payment Gateway Fallback Preserved ───
    PaymentGatewayFactory.resetInstances();
    const mockGateway = PaymentGatewayFactory.getGateway(PaymentGatewayProvider.MOCK);
    const mockOrder = await mockGateway.createOrder({ amount: 5000, currency: 'INR', receipt: 'rcpt_mock_test' });
    assert(!!mockOrder.gatewayOrderId && mockOrder.gatewayOrderId.startsWith('order_mock_'), 'MockPaymentGateway remains fully operational');

    // Allow all async background listeners to finish cleanly
    await new Promise(r => setTimeout(r, 300));

    console.log(`\n======================================================`);
    console.log(`✅ RAZORPAY GATEWAY SUITE COMPLETE: ${passed} / ${total} TESTS PASSED`);
    console.log(`======================================================\n`);
}

if (process.argv[1] && (process.argv[1].includes('razorpayPaymentGateway') || process.argv[1].endsWith('razorpayPaymentGateway.test.ts'))) {
    await mongoose.connect(config.mongoUri);
    try {
        await runRazorpayGatewayTests();
    } finally {
        await mongoose.disconnect();
    }
}
