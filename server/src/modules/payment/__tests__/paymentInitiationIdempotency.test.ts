import mongoose from 'mongoose';
import { config } from '@shared/config/env.js';
import { TransactionService } from '../services/TransactionService.js';
import { PaymentGatewayFactory } from '../gateways/PaymentGatewayFactory.js';
import { PaymentMethod, PaymentGatewayProvider, TransactionStatus } from '../models/Transaction.js';
import Transaction from '../models/Transaction.js';
import Installment, { PaymentStatus } from '@modules/installment/models/Installment.js';
import ChitGroup, { ChitGroupStatus } from '@modules/chit-group/models/ChitGroup.js';
import ChitCycle, { ChitCycleStatus, PaymentCollectionStatus } from '@modules/chit-cycle/models/ChitCycle.js';
import Membership, { MembershipStatus } from '@modules/membership/models/Membership.js';
import User, { UserRole, AccountStatus, KYCStatus } from '@modules/user/models/User.js';
import PaymentIdempotency, { PaymentIdempotencyStatus } from '../models/PaymentIdempotency.js';
import { PaymentIdempotencyRepository } from '../repositories/PaymentIdempotencyRepository.js';
import { generatePaymentFingerprint } from '../utils/idempotencyFingerprint.js';
import { validateInitiatePayment } from '../validators/transaction.validator.js';
import { initPaymentEventListeners } from '../listeners/PaymentEventListener.js';
import { initLedgerEventListeners } from '@modules/ledger/listeners/LedgerEventListener.js';
import JournalEntry from '@modules/ledger/models/JournalEntry.js';
import { DoubleEntryJournalType } from '@modules/ledger/enums/account.enum.js';
import { AppError } from '@shared/errors/AppError.js';

let passedTests = 0;
let totalTests = 0;

async function assertSuccess(testName: string, testFn: () => Promise<void>) {
    totalTests++;
    try {
        await testFn();
        console.log(`✅ [PASS] ${testName}`);
        passedTests++;
    } catch (err: any) {
        console.error(`❌ [FAIL] ${testName}: ${err.message || err}`);
        throw err;
    }
}

async function createFixture(userName: string = 'Member') {
    const org: any = await User.create({
        name: `Org ${Date.now()}_${Math.random().toString(36).substring(7)}`,
        email: `org.${Date.now()}.${Math.random().toString(36).substring(7)}@example.com`,
        password: 'password123',
        role: UserRole.ORGANIZER,
        accountStatus: AccountStatus.ACTIVE,
        kycStatus: KYCStatus.APPROVED,
        age: 35
    });

    const user: any = await User.create({
        name: `${userName} ${Date.now()}_${Math.random().toString(36).substring(7)}`,
        email: `user.${Date.now()}.${Math.random().toString(36).substring(7)}@example.com`,
        password: 'password123',
        role: UserRole.USER,
        accountStatus: AccountStatus.ACTIVE,
        kycStatus: KYCStatus.APPROVED,
        age: 28
    });

    const grp: any = await ChitGroup.create({
        name: `Group ${Date.now()}_${Math.random().toString(36).substring(7)}`,
        organizerId: org._id,
        monthlyContribution: 5000,
        totalMembers: 10,
        currentMemberCount: 1,
        durationMonths: 10,
        startDate: new Date(),
        commissionPercent: 5,
        status: ChitGroupStatus.ACTIVE
    });

    const cyc: any = await ChitCycle.create({
        groupId: grp._id,
        cycleNumber: 1,
        status: ChitCycleStatus.ACTIVE,
        scheduledStartDate: new Date(),
        paymentCollection: {
            status: PaymentCollectionStatus.OPEN,
            openedAt: new Date()
        }
    });

    const mem: any = await Membership.create({
        chitGroupId: grp._id,
        userId: user._id,
        status: MembershipStatus.APPROVED,
        joinedAt: new Date()
    });

    const inst: any = await Installment.create({
        groupId: grp._id,
        cycleId: cyc._id,
        userId: user._id,
        membershipId: mem._id,
        installmentNumber: 1,
        amount: 5000,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        paymentStatus: PaymentStatus.PENDING
    });

    return { org, user, grp, cyc, mem, inst };
}

export async function runPaymentInitiationIdempotencyTests() {
    console.log('\n======================================================');
    console.log('=== RUNNING PAYMENT INITIATION IDEMPOTENCY (P2) TESTS ===');
    console.log('======================================================\n');

    initPaymentEventListeners();
    initLedgerEventListeners();

    const transactionService = new TransactionService();
    const idempotencyRepo = new PaymentIdempotencyRepository();

    const f1 = await createFixture('UserA');
    const f2 = await createFixture('UserB');

    // -------------------------------------------------------------
    // TEST 1: Missing Idempotency-Key rejected
    // -------------------------------------------------------------
    await assertSuccess('1. Missing Idempotency-Key header is rejected with 400', async () => {
        let statusCode: number = 200;
        let responseJson: any = null;
        const req: any = {
            header: (name: string) => undefined,
            headers: {},
            body: { installmentId: f1.inst._id.toString() }
        };
        const res: any = {
            status: (code: number) => {
                statusCode = code;
                return {
                    json: (data: any) => {
                        responseJson = data;
                    }
                };
            }
        };
        let nextCalled = false;
        validateInitiatePayment(req, res, () => {
            nextCalled = true;
        });

        if (statusCode !== 400 || responseJson?.code !== 'MISSING_IDEMPOTENCY_KEY' || nextCalled) {
            throw new Error(`Expected 400 MISSING_IDEMPOTENCY_KEY, got status ${statusCode}`);
        }
    });

    // -------------------------------------------------------------
    // TEST 2: Blank / Whitespace Idempotency-Key rejected
    // -------------------------------------------------------------
    await assertSuccess('2. Blank / whitespace-only Idempotency-Key is rejected with 400', async () => {
        let statusCode: number = 200;
        let responseJson: any = null;
        const req: any = {
            header: (name: string) => '   ',
            headers: { 'idempotency-key': '   ' },
            body: { installmentId: f1.inst._id.toString() }
        };
        const res: any = {
            status: (code: number) => {
                statusCode = code;
                return {
                    json: (data: any) => {
                        responseJson = data;
                    }
                };
            }
        };
        validateInitiatePayment(req, res, () => {});
        if (statusCode !== 400 || responseJson?.code !== 'MISSING_IDEMPOTENCY_KEY') {
            throw new Error('Whitespace idempotency key was not rejected');
        }
    });

    // -------------------------------------------------------------
    // TEST 3: Overly long Idempotency-Key rejected (> 255 chars)
    // -------------------------------------------------------------
    await assertSuccess('3. Overly long Idempotency-Key (> 255 chars) is rejected with 400', async () => {
        let statusCode: number = 200;
        let responseJson: any = null;
        const longKey = 'a'.repeat(256);
        const req: any = {
            header: (name: string) => longKey,
            headers: { 'idempotency-key': longKey },
            body: { installmentId: f1.inst._id.toString() }
        };
        const res: any = {
            status: (code: number) => {
                statusCode = code;
                return {
                    json: (data: any) => {
                        responseJson = data;
                    }
                };
            }
        };
        validateInitiatePayment(req, res, () => {});
        if (statusCode !== 400 || responseJson?.code !== 'INVALID_IDEMPOTENCY_KEY') {
            throw new Error('Overly long idempotency key was not rejected');
        }
    });

    // -------------------------------------------------------------
    // TEST 4: Valid new key works and creates transaction + gateway order
    // -------------------------------------------------------------
    const testKey1 = `idemp_test_${Date.now()}_1`;
    let txn1: any = null;
    await assertSuccess('4. Valid new key initiates payment successfully', async () => {
        txn1 = await transactionService.initiatePayment(
            f1.user._id.toString(),
            {
                installmentId: f1.inst._id.toString(),
                paymentMethod: PaymentMethod.UPI,
                paymentGateway: PaymentGatewayProvider.MOCK
            },
            testKey1
        );

        if (!txn1 || txn1.status !== TransactionStatus.PENDING || !txn1.gatewayOrderId) {
            throw new Error('Transaction was not initiated properly');
        }

        const idempRec = await PaymentIdempotency.findOne({
            userId: f1.user._id,
            key: testKey1
        });
        if (!idempRec || idempRec.status !== PaymentIdempotencyStatus.SUCCESS) {
            throw new Error('Idempotency record was not marked as SUCCESS');
        }
    });

    // -------------------------------------------------------------
    // TEST 5: Same key + same request returns same result
    // -------------------------------------------------------------
    await assertSuccess('5. Same key + same request returns cached transaction without duplicate', async () => {
        const retryTxn = await transactionService.initiatePayment(
            f1.user._id.toString(),
            {
                installmentId: f1.inst._id.toString(),
                paymentMethod: PaymentMethod.UPI,
                paymentGateway: PaymentGatewayProvider.MOCK
            },
            testKey1
        );

        if (retryTxn._id.toString() !== txn1._id.toString()) {
            throw new Error(`Expected reused transaction ${txn1._id}, got ${retryTxn._id}`);
        }
        if (retryTxn.gatewayOrderId !== txn1.gatewayOrderId) {
            throw new Error('Gateway order ID changed on retry');
        }
    });

    // -------------------------------------------------------------
    // TEST 6: Same key does not create duplicate DigiChit transaction
    // -------------------------------------------------------------
    await assertSuccess('6. Database contains exactly 1 transaction for the installment', async () => {
        const count = await Transaction.countDocuments({
            installmentId: f1.inst._id
        });
        if (count !== 1) {
            throw new Error(`Expected exactly 1 transaction in DB, found ${count}`);
        }
    });

    // -------------------------------------------------------------
    // TEST 7: Same key + different installment rejected (409 Conflict)
    // -------------------------------------------------------------
    await assertSuccess('7. Same key + different installment is rejected with 409 Conflict', async () => {
        const otherFixture = await createFixture('OtherInst');
        try {
            await transactionService.initiatePayment(
                f1.user._id.toString(),
                {
                    installmentId: otherFixture.inst._id.toString(), // Different installment!
                    paymentMethod: PaymentMethod.UPI,
                    paymentGateway: PaymentGatewayProvider.MOCK
                },
                testKey1
            );
            throw new Error('Should have thrown 409 Conflict');
        } catch (err: any) {
            if (err.statusCode !== 409 || err.errorCode !== 'IDEMPOTENCY_CONFLICT') {
                throw new Error(`Expected 409 IDEMPOTENCY_CONFLICT, got ${err.statusCode} (${err.errorCode})`);
            }
        }
    });

    // -------------------------------------------------------------
    // TEST 8: Same key + different payment method rejected (409 Conflict)
    // -------------------------------------------------------------
    await assertSuccess('8. Same key + different payment method is rejected with 409 Conflict', async () => {
        try {
            await transactionService.initiatePayment(
                f1.user._id.toString(),
                {
                    installmentId: f1.inst._id.toString(),
                    paymentMethod: PaymentMethod.CARD, // Different method!
                    paymentGateway: PaymentGatewayProvider.MOCK
                },
                testKey1
            );
            throw new Error('Should have thrown 409 Conflict');
        } catch (err: any) {
            if (err.statusCode !== 409 || err.errorCode !== 'IDEMPOTENCY_CONFLICT') {
                throw new Error(`Expected 409 IDEMPOTENCY_CONFLICT, got ${err.statusCode}`);
            }
        }
    });

    // -------------------------------------------------------------
    // TEST 9: Same key + different gateway rejected (409 Conflict)
    // -------------------------------------------------------------
    await assertSuccess('9. Same key + different payment gateway is rejected with 409 Conflict', async () => {
        try {
            await transactionService.initiatePayment(
                f1.user._id.toString(),
                {
                    installmentId: f1.inst._id.toString(),
                    paymentMethod: PaymentMethod.UPI,
                    paymentGateway: PaymentGatewayProvider.RAZORPAY // Different gateway!
                },
                testKey1
            );
            throw new Error('Should have thrown 409 Conflict');
        } catch (err: any) {
            if (err.statusCode !== 409 || err.errorCode !== 'IDEMPOTENCY_CONFLICT') {
                throw new Error(`Expected 409 IDEMPOTENCY_CONFLICT, got ${err.statusCode}`);
            }
        }
    });

    // -------------------------------------------------------------
    // TEST 10: User-scoped isolation: Same key used by User A and User B works independently
    // -------------------------------------------------------------
    await assertSuccess('10. User A and User B can use identical key string independently without collision', async () => {
        const sharedKeyString = `shared_key_${Date.now()}`;

        const fxA = await createFixture('UserA_Shared');
        const fxB = await createFixture('UserB_Shared');

        // User A initiates
        const txnUserA = await transactionService.initiatePayment(
            fxA.user._id.toString(),
            {
                installmentId: fxA.inst._id.toString(),
                paymentMethod: PaymentMethod.UPI,
                paymentGateway: PaymentGatewayProvider.MOCK
            },
            sharedKeyString
        );

        // User B initiates with SAME key string for User B's installment
        const txnUserB = await transactionService.initiatePayment(
            fxB.user._id.toString(),
            {
                installmentId: fxB.inst._id.toString(),
                paymentMethod: PaymentMethod.UPI,
                paymentGateway: PaymentGatewayProvider.MOCK
            },
            sharedKeyString
        );

        if (txnUserA._id.toString() === txnUserB._id.toString()) {
            throw new Error('User B received User A transaction! User scoping failed.');
        }

        const idempCount = await PaymentIdempotency.countDocuments({ key: sharedKeyString });
        if (idempCount !== 2) {
            throw new Error(`Expected 2 distinct idempotency records in DB, found ${idempCount}`);
        }
    });

    // -------------------------------------------------------------
    // TEST 11: User cannot access another user's result using their key
    // -------------------------------------------------------------
    await assertSuccess('11. User B cannot access User A transaction using User A key', async () => {
        try {
            await transactionService.initiatePayment(
                f2.user._id.toString(),
                {
                    installmentId: f1.inst._id.toString(),
                    paymentMethod: PaymentMethod.UPI,
                    paymentGateway: PaymentGatewayProvider.MOCK
                },
                testKey1
            );
            throw new Error('User B should have been blocked by installment ownership check');
        } catch (err: any) {
            if (err.errorCode !== 'UNAUTHORIZED_INSTALLMENT_PAYMENT') {
                throw new Error(`Expected UNAUTHORIZED_INSTALLMENT_PAYMENT, got ${err.errorCode}`);
            }
        }
    });

    // -------------------------------------------------------------
    // TEST 12: Concurrent requests with same user + same key resolve cleanly
    // -------------------------------------------------------------
    await assertSuccess('12. Concurrent requests with same user + same key create exactly ONE transaction', async () => {
        const concurrentKey = `idemp_concurrent_${Date.now()}`;
        const fxConc = await createFixture('UserConc');

        const promises = [
            transactionService.initiatePayment(
                fxConc.user._id.toString(),
                {
                    installmentId: fxConc.inst._id.toString(),
                    paymentMethod: PaymentMethod.UPI,
                    paymentGateway: PaymentGatewayProvider.MOCK
                },
                concurrentKey
            ),
            transactionService.initiatePayment(
                fxConc.user._id.toString(),
                {
                    installmentId: fxConc.inst._id.toString(),
                    paymentMethod: PaymentMethod.UPI,
                    paymentGateway: PaymentGatewayProvider.MOCK
                },
                concurrentKey
            ),
            transactionService.initiatePayment(
                fxConc.user._id.toString(),
                {
                    installmentId: fxConc.inst._id.toString(),
                    paymentMethod: PaymentMethod.UPI,
                    paymentGateway: PaymentGatewayProvider.MOCK
                },
                concurrentKey
            )
        ];

        const results = await Promise.all(promises);

        const firstId = results[0]!._id.toString();
        for (const res of results) {
            if (!res) continue;
            if (res._id.toString() !== firstId) {
                throw new Error(`Concurrent calls returned divergent transactions: ${firstId} vs ${res._id}`);
            }
        }

        const count = await Transaction.countDocuments({ installmentId: fxConc.inst._id });
        if (count !== 1) {
            throw new Error(`Expected exactly 1 transaction created for concurrent calls, found ${count}`);
        }
    });

    // -------------------------------------------------------------
    // TEST 13: Failed initiation updates idempotency status to FAILED and allows safe retry
    // -------------------------------------------------------------
    await assertSuccess('13. Failed initiation marks record FAILED and allows retry', async () => {
        const failKey = `idemp_fail_${Date.now()}`;
        const fxFail = await createFixture('UserFail');

        // Set collection status to NOT_STARTED to trigger transient business failure
        fxFail.cyc.paymentCollection.status = PaymentCollectionStatus.NOT_STARTED;
        await fxFail.cyc.save();

        try {
            await transactionService.initiatePayment(
                fxFail.user._id.toString(),
                {
                    installmentId: fxFail.inst._id.toString(),
                    paymentMethod: PaymentMethod.UPI,
                    paymentGateway: PaymentGatewayProvider.MOCK
                },
                failKey
            );
            throw new Error('Should have failed because collections were NOT_STARTED');
        } catch (e: any) {
            if (e.errorCode !== 'COLLECTIONS_NOT_STARTED') {
                throw e;
            }
        }

        const failedRec = await PaymentIdempotency.findOne({
            userId: fxFail.user._id,
            key: failKey
        });
        if (!failedRec || failedRec.status !== PaymentIdempotencyStatus.FAILED) {
            throw new Error('Failed initiation was not recorded as FAILED');
        }

        // Organizer opens collections
        fxFail.cyc.paymentCollection.status = PaymentCollectionStatus.OPEN;
        await fxFail.cyc.save();

        // Retry with same key and same installment
        const retryTxn = await transactionService.initiatePayment(
            fxFail.user._id.toString(),
            {
                installmentId: fxFail.inst._id.toString(),
                paymentMethod: PaymentMethod.UPI,
                paymentGateway: PaymentGatewayProvider.MOCK
            },
            failKey
        );

        if (!retryTxn || retryTxn.status !== TransactionStatus.PENDING) {
            throw new Error('Retry after failure did not succeed');
        }

        const successRec = await PaymentIdempotency.findOne({
            userId: fxFail.user._id,
            key: failKey
        });
        if (!successRec || successRec.status !== PaymentIdempotencyStatus.SUCCESS) {
            throw new Error('Idempotency record was not updated to SUCCESS on retry');
        }
    });

    // -------------------------------------------------------------
    // TEST 14: Crash / Partial failure recovery behavior
    // -------------------------------------------------------------
    await assertSuccess('14. Crash / Partial Failure recovery recovers existing transaction without re-creating', async () => {
        const crashKey = `idemp_crash_${Date.now()}`;
        const fxCrash = await createFixture('UserCrash');

        // Simulate crash: insert an IN_PROGRESS idempotency record, and a Transaction already exists in DB
        const fingerprint = generatePaymentFingerprint({
            installmentId: fxCrash.inst._id.toString(),
            paymentMethod: PaymentMethod.UPI,
            paymentGateway: PaymentGatewayProvider.MOCK
        });

        const idempCrashRec = await PaymentIdempotency.create({
            userId: fxCrash.user._id,
            key: crashKey,
            requestFingerprint: fingerprint,
            status: PaymentIdempotencyStatus.IN_PROGRESS,
            expiresAt: new Date(Date.now() + 86400000)
        });

        const orphanTxn = await Transaction.create({
            transactionNumber: `TXN-CRASH-${Date.now()}`,
            memberId: fxCrash.user._id,
            groupId: fxCrash.grp._id,
            cycleId: fxCrash.cyc._id,
            installmentId: fxCrash.inst._id,
            amount: 5000,
            currency: 'INR',
            paymentMethod: PaymentMethod.UPI,
            paymentGateway: PaymentGatewayProvider.MOCK,
            gatewayOrderId: 'order_crash_recovery_123',
            status: TransactionStatus.PENDING,
            initiatedAt: new Date(),
            createdBy: fxCrash.user._id
        });

        // Retrying with the same key should recover orphanTxn and transition idempotency record to SUCCESS
        const recoveredTxn = await transactionService.initiatePayment(
            fxCrash.user._id.toString(),
            {
                installmentId: fxCrash.inst._id.toString(),
                paymentMethod: PaymentMethod.UPI,
                paymentGateway: PaymentGatewayProvider.MOCK
            },
            crashKey
        );

        if (recoveredTxn._id.toString() !== orphanTxn._id.toString()) {
            throw new Error(`Expected recovered transaction ${orphanTxn._id}, got ${recoveredTxn._id}`);
        }

        const updatedIdemp = await PaymentIdempotency.findById(idempCrashRec._id);
        if (updatedIdemp?.status !== PaymentIdempotencyStatus.SUCCESS) {
            throw new Error('Crash recovery did not transition idempotency record to SUCCESS');
        }
    });

    // -------------------------------------------------------------
    // TEST 15: MongoDB Unique Index Verified
    // -------------------------------------------------------------
    await assertSuccess('15. MongoDB Unique Compound Index { userId: 1, key: 1 } exists', async () => {
        const indexes = await PaymentIdempotency.collection.indexes();
        const hasCompound = indexes.some(
            (idx) => idx.key?.userId === 1 && idx.key?.key === 1 && idx.unique === true
        );
        if (!hasCompound) {
            throw new Error('Unique compound index { userId: 1, key: 1 } was not found on paymentidempotencies');
        }
    });

    // -------------------------------------------------------------
    // TEST 16: MongoDB TTL Index Verified
    // -------------------------------------------------------------
    await assertSuccess('16. MongoDB TTL Index on expiresAt exists', async () => {
        const indexes = await PaymentIdempotency.collection.indexes();
        const hasTTL = indexes.some(
            (idx) => idx.key?.expiresAt === 1 && idx.expireAfterSeconds === 0
        );
        if (!hasTTL) {
            throw new Error('TTL index on expiresAt was not found on paymentidempotencies');
        }
    });

    // -------------------------------------------------------------
    // TEST 17: Mock Gateway Full End-to-End with Idempotency
    // -------------------------------------------------------------
    await assertSuccess('17. Mock Gateway works end-to-end with idempotency', async () => {
        const mockKey = `idemp_mock_e2e_${Date.now()}`;
        const fxMock = await createFixture('UserMock');

        const mockTxn = await transactionService.initiatePayment(
            fxMock.user._id.toString(),
            {
                installmentId: fxMock.inst._id.toString(),
                paymentMethod: PaymentMethod.MOCK,
                paymentGateway: PaymentGatewayProvider.MOCK
            },
            mockKey
        );

        const verified = await transactionService.verifyPayment(fxMock.user._id.toString(), {
            transactionId: mockTxn._id.toString(),
            gatewayOrderId: mockTxn.gatewayOrderId!,
            gatewayPaymentId: 'pay_mock_' + Date.now()
        });

        if (verified.status !== TransactionStatus.SUCCESS) {
            throw new Error('Mock payment verification failed');
        }
    });

    // -------------------------------------------------------------
    // TEST 18: Razorpay Gateway Compatibility with Idempotency
    // -------------------------------------------------------------
    await assertSuccess('18. Razorpay Gateway works seamlessly with idempotency wrapper', async () => {
        const rzpKey = `idemp_rzp_${Date.now()}`;
        const fxRzp = await createFixture('UserRzp');

        const rzpTxn = await transactionService.initiatePayment(
            fxRzp.user._id.toString(),
            {
                installmentId: fxRzp.inst._id.toString(),
                paymentMethod: PaymentMethod.UPI,
                paymentGateway: PaymentGatewayProvider.RAZORPAY
            },
            rzpKey
        );

        if (!rzpTxn.gatewayOrderId || rzpTxn.paymentGateway !== PaymentGatewayProvider.RAZORPAY) {
            throw new Error('Razorpay transaction was not initiated properly');
        }

        // Retry same key
        const rzpRetry = await transactionService.initiatePayment(
            fxRzp.user._id.toString(),
            {
                installmentId: fxRzp.inst._id.toString(),
                paymentMethod: PaymentMethod.UPI,
                paymentGateway: PaymentGatewayProvider.RAZORPAY
            },
            rzpKey
        );

        if (rzpRetry._id.toString() !== rzpTxn._id.toString()) {
            throw new Error('Razorpay idempotency retry failed to return same transaction');
        }
    });

    // -------------------------------------------------------------
    // TEST 19: Existing duplicate verification protection still intact
    // -------------------------------------------------------------
    await assertSuccess('19. Existing duplicate verification protection remains intact', async () => {
        const dupVerifyKey = `idemp_dup_ver_${Date.now()}`;
        const fxDup = await createFixture('UserDup');

        const initiated = await transactionService.initiatePayment(
            fxDup.user._id.toString(),
            {
                installmentId: fxDup.inst._id.toString(),
                paymentMethod: PaymentMethod.MOCK,
                paymentGateway: PaymentGatewayProvider.MOCK
            },
            dupVerifyKey
        );

        const v1 = await transactionService.verifyPayment(fxDup.user._id.toString(), {
            transactionId: initiated._id.toString(),
            gatewayOrderId: initiated.gatewayOrderId!,
            gatewayPaymentId: 'pay_mock_' + Date.now()
        });

        const v2 = await transactionService.verifyPayment(fxDup.user._id.toString(), {
            transactionId: initiated._id.toString(),
            gatewayOrderId: initiated.gatewayOrderId!,
            gatewayPaymentId: 'pay_mock_' + Date.now()
        });

        if (v1.status !== TransactionStatus.SUCCESS || v2.status !== TransactionStatus.SUCCESS) {
            throw new Error('Duplicate verification did not return SUCCESS');
        }
    });

    // -------------------------------------------------------------
    // TEST 20: Existing P3 Ledger Idempotency still intact
    // -------------------------------------------------------------
    await assertSuccess('20. Existing P3 Double-Entry Ledger Idempotency remains intact', async () => {
        const ledgerKey = `idemp_ledger_${Date.now()}`;
        const fxLedger = await createFixture('UserLedger');

        const initiated = await transactionService.initiatePayment(
            fxLedger.user._id.toString(),
            {
                installmentId: fxLedger.inst._id.toString(),
                paymentMethod: PaymentMethod.MOCK,
                paymentGateway: PaymentGatewayProvider.MOCK
            },
            ledgerKey
        );

        await transactionService.verifyPayment(fxLedger.user._id.toString(), {
            transactionId: initiated._id.toString(),
            gatewayOrderId: initiated.gatewayOrderId!,
            gatewayPaymentId: 'pay_mock_' + Date.now()
        });

        // Wait for async domain event with polling
        let journalCount = 0;
        const startWait = Date.now();
        while (Date.now() - startWait < 5000) {
            journalCount = await JournalEntry.countDocuments({
                transactionId: initiated._id,
                entryType: DoubleEntryJournalType.INSTALLMENT_PAYMENT
            });
            if (journalCount === 1) break;
            await new Promise((r) => setTimeout(r, 100));
        }

        if (journalCount !== 1) {
            throw new Error(`Expected exactly 1 P3 journal entry, found ${journalCount}`);
        }
    });

    // -------------------------------------------------------------
    // TEST 21: Already paid installment strictly blocks payment initiation
    // -------------------------------------------------------------
    await assertSuccess('21. Already paid installment strictly blocks payment initiation', async () => {
        const fxPaid = await createFixture('UserPaid');
        fxPaid.inst.paymentStatus = PaymentStatus.PAID;
        fxPaid.inst.paidAmount = 5000;
        fxPaid.inst.paidDate = new Date();
        await fxPaid.inst.save();

        try {
            await transactionService.initiatePayment(
                fxPaid.user._id.toString(),
                {
                    installmentId: fxPaid.inst._id.toString(),
                    paymentMethod: PaymentMethod.UPI,
                    paymentGateway: PaymentGatewayProvider.MOCK
                },
                `idemp_already_paid_${Date.now()}`
            );
            throw new Error('Should have thrown ALREADY_PAID');
        } catch (err: any) {
            if (err.errorCode !== 'ALREADY_PAID') {
                throw new Error(`Expected ALREADY_PAID, got ${err.errorCode}`);
            }
        }
    });

    console.log('\n======================================================');
    console.log(`✅ PAYMENT INITIATION IDEMPOTENCY RESULTS: ${passedTests} / ${totalTests} PASSED`);
    console.log('======================================================\n');
}

if (process.argv[1]?.endsWith('paymentInitiationIdempotency.test.ts') || process.argv[1]?.endsWith('paymentInitiationIdempotency.test.js')) {
    await mongoose.connect(config.mongoUri);
    try {
        await runPaymentInitiationIdempotencyTests();
    } finally {
        await mongoose.disconnect();
    }
}
