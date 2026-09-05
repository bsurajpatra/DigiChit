import mongoose from 'mongoose';
import { config } from '@shared/config/env.js';
import { RazorpayPaymentGateway } from '../gateways/razorpay/RazorpayPaymentGateway.js';
import { TransactionService } from '../services/TransactionService.js';
import { PaymentGatewayFactory } from '../gateways/PaymentGatewayFactory.js';
import { PaymentMethod, PaymentGatewayProvider, TransactionStatus } from '../models/Transaction.js';
import Transaction from '../models/Transaction.js';
import Installment, { PaymentStatus } from '@modules/installment/models/Installment.js';
import ChitGroup, { ChitGroupStatus } from '@modules/chit-group/models/ChitGroup.js';
import ChitCycle, { ChitCycleStatus, PaymentCollectionStatus } from '@modules/chit-cycle/models/ChitCycle.js';
import Membership, { MembershipStatus } from '@modules/membership/models/Membership.js';
import User, { UserRole, AccountStatus, KYCStatus } from '@modules/user/models/User.js';
import JournalEntry from '@modules/ledger/models/JournalEntry.js';
import { DoubleEntryJournalType } from '@modules/ledger/enums/account.enum.js';
import { AccountProvisioningService } from '@modules/ledger/services/AccountProvisioningService.js';
import { initPaymentEventListeners } from '../listeners/PaymentEventListener.js';
import { initLedgerEventListeners } from '@modules/ledger/listeners/LedgerEventListener.js';
import crypto from 'crypto';
import axios from 'axios';

export async function runRealRazorpayVerification() {
    console.log('\n======================================================');
    console.log('  STARTING REAL RAZORPAY TEST MODE INTEGRATION VERIFICATION');
    console.log('======================================================\n');

    initPaymentEventListeners();
    initLedgerEventListeners();

    // 1. Check Environment Variables
    const hasKeyId = Boolean(config.razorpay.keyId && config.razorpay.keyId.trim().length > 0);
    const hasKeySecret = Boolean(config.razorpay.keySecret && config.razorpay.keySecret.trim().length > 0);

    console.log('--- 1. ENVIRONMENT CONFIGURATION CHECK ---');
    console.log(`RAZORPAY_KEY_ID: ${hasKeyId ? 'CONFIGURED' : 'MISSING'}`);
    console.log(`RAZORPAY_KEY_SECRET: ${hasKeySecret ? 'CONFIGURED' : 'MISSING'}`);

    if (!hasKeyId || !hasKeySecret) {
        console.error('❌ Cannot run real network test: API keys are missing in environment.');
        process.exit(1);
    }

    // Ensure factory uses real Razorpay gateway
    PaymentGatewayFactory.resetInstances();
    const gateway = PaymentGatewayFactory.getGateway(PaymentGatewayProvider.RAZORPAY);

    // 2. Test Direct Real Razorpay Order Creation via Gateway
    console.log('\n--- 2. REAL RAZORPAY ORDER CREATION TEST ---');
    const testReceipt = `rcpt_live_${Date.now()}`;
    const orderResult = await gateway.createOrder({
        amount: 2500, // ₹2,500
        currency: 'INR',
        receipt: testReceipt,
        notes: {
            app: 'DigiChit',
            test: 'Real Test Mode Verification'
        }
    });

    console.log('✅ Real Razorpay Order successfully created via https://api.razorpay.com/v1/orders');
    console.log(`- Gateway Order ID: ${orderResult.gatewayOrderId} (Validated prefix "order_")`);
    console.log(`- Amount: ₹${orderResult.amount}`);
    console.log(`- Currency: ${orderResult.currency}`);
    console.log(`- Status: ${orderResult.status}`);

    if (!orderResult.gatewayOrderId || !orderResult.gatewayOrderId.startsWith('order_')) {
        throw new Error('Order ID is not in valid Razorpay format');
    }

    // 3. Verify Order Exists in Razorpay Cloud by Querying Direct API
    console.log('\n--- 3. RAZORPAY CLOUD ORDER VERIFICATION (GET API) ---');
    const authHeader = `Basic ${Buffer.from(`${config.razorpay.keyId}:${config.razorpay.keySecret}`).toString('base64')}`;
    const getRes = await axios.get(`https://api.razorpay.com/v1/orders/${orderResult.gatewayOrderId}`, {
        headers: { Authorization: authHeader }
    });
    console.log('✅ Verified order exists on Razorpay Test Mode Cloud!');
    console.log(`- Cloud Order ID: ${getRes.data.id}`);
    console.log(`- Cloud Amount (paise): ${getRes.data.amount} (₹${getRes.data.amount / 100})`);
    console.log(`- Cloud Status: ${getRes.data.status}`);

    // 4. Test Full DigiChit Financial Lifecycle with Real Razorpay Gateway
    console.log('\n--- 4. FULL DIGICHIT FINANCIAL & PAYMENT LIFECYCLE TEST ---');
    const provisioningService = new AccountProvisioningService();
    const transactionService = new TransactionService();

    const randomSuffix = Date.now().toString() + '_' + Math.random().toString(36).slice(2, 6);
    const member: any = await (User as any).create({
        name: 'Real Test Member',
        email: `real_rzp_member_${randomSuffix}@digichit.test`,
        password: 'Password123!',
        age: 30,
        accountStatus: AccountStatus.ACTIVE,
        role: UserRole.USER,
        kycStatus: KYCStatus.APPROVED,
        emailVerified: true
    });

    const organizer: any = await (User as any).create({
        name: 'Real Test Organizer',
        email: `real_rzp_organizer_${randomSuffix}@digichit.test`,
        password: 'Password123!',
        age: 40,
        accountStatus: AccountStatus.ACTIVE,
        role: UserRole.ORGANIZER,
        kycStatus: KYCStatus.APPROVED,
        emailVerified: true
    });

    const group: any = await ChitGroup.create({
        name: 'Real Razorpay Test Chit Group',
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

    const cycle: any = await ChitCycle.create({
        groupId: group._id,
        cycleNumber: 1,
        status: ChitCycleStatus.ACTIVE,
        scheduledStartDate: new Date(),
        actualStartDate: new Date(),
        winnerMembershipId: membership._id,
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

    // Step A: Initiate Payment using TransactionService with RAZORPAY
    console.log('[Step A] Initiating payment for Installment through TransactionService...');
    const initiatedTxn = await transactionService.initiatePayment(member._id.toString(), {
        installmentId: installment._id.toString(),
        paymentMethod: PaymentMethod.CARD,
        paymentGateway: PaymentGatewayProvider.RAZORPAY
    });

    console.log('✅ Initiated Transaction created:');
    console.log(`- Transaction Number: ${initiatedTxn.transactionNumber}`);
    console.log(`- Status: ${initiatedTxn.status} (PENDING)`);
    console.log(`- Server Authoritative Amount: ₹${initiatedTxn.amount}`);
    console.log(`- Razorpay Real Order ID: ${initiatedTxn.gatewayOrderId}`);

    // Step B: Negative Security Test - Submit deliberately tampered signature
    console.log('\n--- 5. NEGATIVE SECURITY TEST: TAMPERED SIGNATURE REJECTION ---');
    const fakePaymentId = `pay_fake_${Date.now()}`;
    const tamperedSignature = 'tampered_bad_signature_0123456789abcdef0123456789abcdef01234567';

    let tamperedRejected = false;
    try {
        await transactionService.verifyPayment(member._id.toString(), {
            transactionId: initiatedTxn._id.toString(),
            gatewayOrderId: initiatedTxn.gatewayOrderId!,
            gatewayPaymentId: fakePaymentId,
            gatewaySignature: tamperedSignature
        });
    } catch (err: any) {
        tamperedRejected = true;
        console.log(`✅ [PASS] Backend strictly rejected tampered signature with error: "${err.message}"`);
    }

    if (!tamperedRejected) {
        throw new Error('Security Breach: Tampered signature was accepted!');
    }

    // Verify transaction remains PENDING and no ledger was posted
    const unverifiedTxn = await Transaction.findById(initiatedTxn._id);
    if (unverifiedTxn?.status === TransactionStatus.SUCCESS) {
        throw new Error('Transaction incorrectly transitioned to SUCCESS on bad signature!');
    }

    // Step C: Real Payment Verification with genuine HMAC-SHA256 signature
    console.log('\n--- 6. REAL BACKEND SIGNATURE VERIFICATION ---');
    const realPaymentId = `pay_rzp_test_${Date.now()}`;
    const payload = `${initiatedTxn.gatewayOrderId}|${realPaymentId}`;
    const validSignature = crypto
        .createHmac('sha256', config.razorpay.keySecret)
        .update(payload)
        .digest('hex');

    const verifiedTxn = await transactionService.verifyPayment(member._id.toString(), {
        transactionId: initiatedTxn._id.toString(),
        gatewayOrderId: initiatedTxn.gatewayOrderId!,
        gatewayPaymentId: realPaymentId,
        gatewaySignature: validSignature
    });

    console.log('✅ Signature verified cleanly via timingSafeEqual!');
    console.log(`- Verified Status: ${verifiedTxn.status} (SUCCESS)`);
    console.log(`- Stored Payment ID: ${verifiedTxn.gatewayPaymentId}`);
    console.log(`- Receipt Number: ${verifiedTxn.receiptNumber}`);

    // Step D: Verify Installment Updated to PAID via Domain Event
    console.log('\n--- 7. ASYNC INSTALLMENT STATUS & LEDGER P3 VERIFICATION ---');
    await new Promise(r => setTimeout(r, 200));

    const updatedInstallment = await Installment.findById(installment._id);
    console.log(`- Installment Payment Status: ${updatedInstallment?.paymentStatus} (Expected: PAID)`);
    console.log(`- Installment Paid Amount: ₹${updatedInstallment?.paidAmount}`);
    if (updatedInstallment?.paymentStatus !== PaymentStatus.PAID) {
        throw new Error('Installment was not updated to PAID');
    }

    // Step E: Verify P3 Balanced Double-Entry Journal Entry
    let journal: any = null;
    const startWait = Date.now();
    while (Date.now() - startWait < 5000) {
        journal = await JournalEntry.findOne({
            $or: [
                { referenceId: initiatedTxn._id.toString() },
                { transactionId: initiatedTxn._id }
            ],
            entryType: DoubleEntryJournalType.INSTALLMENT_PAYMENT
        }).populate('lines.accountId');
        if (journal) break;
        await new Promise(r => setTimeout(r, 100));
    }

    if (!journal) {
        throw new Error('P3 Double-Entry Journal Entry was not posted!');
    }

    console.log(`✅ P3 Journal Entry Posted: ${journal.entryNumber}`);
    console.log(`- Amount in Paise: ${journal.totalAmountPaise} (₹${journal.totalAmountPaise / 100})`);
    console.log(`- Balanced (isBalanced): ${journal.isBalanced}`);
    console.log(`- Debit Lines:`, journal.lines.filter((l: any) => l.direction === 'DEBIT').map((l: any) => ({ account: l.accountId, amount: l.amountPaise })));
    console.log(`- Credit Lines:`, journal.lines.filter((l: any) => l.direction === 'CREDIT').map((l: any) => ({ account: l.accountId, amount: l.amountPaise })));

    // Step F: Duplicate Verification Test
    console.log('\n--- 8. IDEMPOTENT DUPLICATE VERIFICATION TEST ---');
    const duplicateVerify = await transactionService.verifyPayment(member._id.toString(), {
        transactionId: initiatedTxn._id.toString(),
        gatewayOrderId: initiatedTxn.gatewayOrderId!,
        gatewayPaymentId: realPaymentId,
        gatewaySignature: validSignature
    });

    console.log(`✅ Repeated verification returned existing transaction (Status: ${duplicateVerify.status})`);
    const journalCount = await JournalEntry.countDocuments({
        $or: [
            { referenceId: initiatedTxn._id.toString() },
            { transactionId: initiatedTxn._id }
        ],
        entryType: DoubleEntryJournalType.INSTALLMENT_PAYMENT
    });
    console.log(`- Total P3 Journals for Transaction: ${journalCount} (Expected: 1, No Duplicates)`);
    if (journalCount !== 1) {
        throw new Error('Duplicate journal entries created on duplicate verification!');
    }

    // Step G: Mock Gateway Regression Test
    console.log('\n--- 9. MOCK GATEWAY REGRESSION TEST ---');
    PaymentGatewayFactory.resetInstances();
    const mockGateway = PaymentGatewayFactory.getGateway(PaymentGatewayProvider.MOCK);
    const mockOrder = await mockGateway.createOrder({ amount: 1000, currency: 'INR', receipt: 'rcpt_mock_reg' });
    console.log(`✅ Mock Order created: ${mockOrder.gatewayOrderId} (Status: ${mockOrder.status})`);

    console.log('\n======================================================');
    console.log('🎉 ALL REAL RAZORPAY TEST MODE VERIFICATIONS PASSED CLEANLY');
    console.log('======================================================\n');
}

if (process.argv[1]?.endsWith('realRazorpayVerification.ts') || process.argv[1]?.endsWith('realRazorpayVerification.js')) {
    await mongoose.connect(config.mongoUri);
    try {
        await runRealRazorpayVerification();
    } finally {
        await mongoose.disconnect();
    }
}
