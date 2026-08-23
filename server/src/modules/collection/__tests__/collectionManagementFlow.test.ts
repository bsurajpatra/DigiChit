import mongoose from 'mongoose';
import { CollectionService } from '../services/CollectionService.js';
import { ChitCycleService } from '@modules/chit-cycle/services/ChitCycleService.js';
import { TransactionService } from '@modules/payment/services/TransactionService.js';
import { TransactionStatus, PaymentGatewayProvider, PaymentMethod } from '@modules/payment/models/Transaction.js';
import User, { UserRole, AccountStatus, KYCStatus } from '@modules/user/models/User.js';
import ChitGroup from '@modules/chit-group/models/ChitGroup.js';
import ChitCycle, { ChitCycleStatus, PaymentCollectionStatus } from '@modules/chit-cycle/models/ChitCycle.js';
import Membership, { MembershipStatus } from '@modules/membership/models/Membership.js';
import Installment, { PaymentStatus } from '@modules/installment/models/Installment.js';
import { AccountProvisioningService } from '@modules/ledger/services/AccountProvisioningService.js';
import { initPaymentEventListeners } from '@modules/payment/listeners/PaymentEventListener.js';
import { initLedgerEventListeners } from '@modules/ledger/listeners/LedgerEventListener.js';

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

export async function runCollectionManagementTests() {
    console.log('\n=== RUNNING COLLECTION MANAGEMENT FLOW TESTS ===\n');

    initPaymentEventListeners();
    initLedgerEventListeners();

    const collectionService = new CollectionService();
    const chitCycleService = new ChitCycleService();
    const txnService = new TransactionService();
    const provisioningService = new AccountProvisioningService();

    const randomSuffix = () => `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    // 1. Setup Organizer & Members
    const organizerA: any = await User.create({
        name: 'Organizer A Collec',
        email: `orgA_${randomSuffix()}@test.com`,
        password: 'Password123!',
        role: UserRole.ORGANIZER,
        age: 38,
        accountStatus: AccountStatus.ACTIVE,
        kycStatus: KYCStatus.APPROVED
    });

    const organizerB: any = await User.create({
        name: 'Organizer B Collec',
        email: `orgB_${randomSuffix()}@test.com`,
        password: 'Password123!',
        role: UserRole.ORGANIZER,
        age: 42,
        accountStatus: AccountStatus.ACTIVE,
        kycStatus: KYCStatus.APPROVED
    });

    const memberA: any = await User.create({
        name: 'Member A Collec',
        email: `memA_${randomSuffix()}@test.com`,
        password: 'Password123!',
        role: UserRole.USER,
        age: 29,
        accountStatus: AccountStatus.ACTIVE,
        kycStatus: KYCStatus.APPROVED
    });

    const memberB: any = await User.create({
        name: 'Member B Collec',
        email: `memB_${randomSuffix()}@test.com`,
        password: 'Password123!',
        role: UserRole.USER,
        age: 31,
        accountStatus: AccountStatus.ACTIVE,
        kycStatus: KYCStatus.APPROVED
    });

    // 2. Setup Chit Group (Owned by Organizer A)
    const chitGroup: any = await ChitGroup.create({
        organizerId: organizerA._id,
        name: 'Collection Flow Group',
        monthlyContribution: 10000,
        totalMembers: 10,
        durationMonths: 10,
        commissionPercent: 5,
        startDate: new Date(),
        financialConfig: { currency: 'INR' }
    });

    await provisioningService.provisionGroupAccounts(chitGroup._id.toString());
    await provisioningService.provisionMemberAccounts(chitGroup._id.toString(), memberA._id.toString());
    await provisioningService.provisionMemberAccounts(chitGroup._id.toString(), memberB._id.toString());

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

    // 3. Setup Cycle 1 (ACTIVE, Winner NOT yet declared, Collections NOT_STARTED)
    const cycle1: any = await ChitCycle.create({
        groupId: chitGroup._id,
        cycleNumber: 1,
        status: ChitCycleStatus.ACTIVE,
        scheduledStartDate: new Date(),
        paymentCollection: {
            status: PaymentCollectionStatus.NOT_STARTED
        }
    });

    // Installment for Member A in Cycle 1
    const installment1: any = await Installment.create({
        groupId: chitGroup._id,
        cycleId: cycle1._id,
        membershipId: membershipA._id,
        userId: memberA._id,
        installmentNumber: 1,
        amount: 10000,
        paidAmount: 0,
        lateFee: 0,
        paymentStatus: PaymentStatus.PENDING,
        dueDate: new Date(Date.now() + 86400000 * 5)
    });

    // Installment for Member B in Cycle 1 (Unpaid)
    const installmentB1: any = await Installment.create({
        groupId: chitGroup._id,
        cycleId: cycle1._id,
        membershipId: membershipB._id,
        userId: memberB._id,
        installmentNumber: 1,
        amount: 10000,
        paidAmount: 0,
        lateFee: 0,
        paymentStatus: PaymentStatus.PENDING,
        dueDate: new Date(Date.now() + 86400000 * 5)
    });

    // Test 1: Non-organizer / Member cannot open collections (403)
    await assertRejection('1. Regular member cannot open payment collections', async () => {
        await collectionService.openCollections(memberA._id.toString(), UserRole.USER, cycle1._id.toString());
    }, 'Unauthorized to manage payment collections for this Chit Group');

    // Test 2: Unauthorized Organizer (from another group) cannot open collections (403)
    await assertRejection('2. Unauthorized Organizer cannot open payment collections for group they do not own', async () => {
        await collectionService.openCollections(organizerB._id.toString(), UserRole.ORGANIZER, cycle1._id.toString());
    }, 'Unauthorized to manage payment collections for this Chit Group');

    // Test 3: Cannot open collections before winner is declared (400)
    await assertRejection('3. Cannot open collections before auction winner is declared', async () => {
        await collectionService.openCollections(organizerA._id.toString(), UserRole.ORGANIZER, cycle1._id.toString());
    }, 'Cannot open payment collections. Winner must be declared for this cycle first');

    // Test 4: Cannot close collections before opening them (400)
    await assertRejection('4. Cannot close collections when status is NOT_STARTED', async () => {
        await collectionService.closeCollections(organizerA._id.toString(), UserRole.ORGANIZER, cycle1._id.toString());
    }, 'Cannot close payment collections before opening them');

    // Test 5: Member cannot pay when collection is NOT_STARTED
    await assertRejection('5. Member cannot pay installment when collection is NOT_STARTED', async () => {
        await txnService.initiatePayment(memberA._id.toString(), {
            installmentId: installment1._id.toString(),
            paymentMethod: PaymentMethod.UPI,
            paymentGateway: PaymentGatewayProvider.MOCK
        });
    }, 'Collections have not been opened by the organizer yet');

    // 4. Record Winner for Cycle 1
    await assertSuccess('6. Organizer records winner for Cycle 1', async () => {
        await chitCycleService.recordWinner(organizerA._id.toString(), UserRole.ORGANIZER, cycle1._id.toString(), {
            winnerMembershipId: membershipA._id.toString(),
            winningBidAmount: 30000,
            winningBidPercentage: 30,
            prizeAmount: 70000,
            dividendAmount: 3000
        });
    });

    // Test 7: Authorized Organizer opens collections successfully
    let openedCycle: any = null;
    await assertSuccess('7. Authorized Organizer opens payment collections successfully', async () => {
        openedCycle = await collectionService.openCollections(organizerA._id.toString(), UserRole.ORGANIZER, cycle1._id.toString(), 'Cycle 1 collection open');
        if (openedCycle.paymentCollection.status !== PaymentCollectionStatus.OPEN) {
            throw new Error(`Expected status OPEN, got: ${openedCycle.paymentCollection.status}`);
        }
        if (!openedCycle.paymentCollection.openedAt) {
            throw new Error('openedAt timestamp was not set');
        }
        if (openedCycle.paymentCollection.openedBy.toString() !== organizerA._id.toString()) {
            throw new Error('openedBy did not match organizer ID');
        }
    });

    // Test 8: Opening collections when already OPEN is rejected
    await assertRejection('8. Opening collections when already OPEN is rejected', async () => {
        await collectionService.openCollections(organizerA._id.toString(), UserRole.ORGANIZER, cycle1._id.toString());
    }, 'Payment collections are already OPEN for this cycle');

    // Test 9: Member can now initiate and verify payment while collections are OPEN
    let memberTxn: any = null;
    await assertSuccess('9. Member initiates and verifies installment payment during OPEN collections', async () => {
        const initiated = await txnService.initiatePayment(memberA._id.toString(), {
            installmentId: installment1._id.toString(),
            paymentMethod: PaymentMethod.UPI,
            paymentGateway: PaymentGatewayProvider.MOCK
        });
        if (initiated.status !== TransactionStatus.PENDING) {
            throw new Error(`Expected PENDING, got: ${initiated.status}`);
        }

        memberTxn = await txnService.verifyPayment(memberA._id.toString(), {
            transactionId: initiated._id.toString(),
            gatewayPaymentId: `pay_mock_${Date.now()}`
        });
        if (memberTxn.status !== TransactionStatus.SUCCESS) {
            throw new Error(`Expected SUCCESS, got: ${memberTxn.status}`);
        }
    });

    // Test 10: Non-organizer / Member cannot close collections (403)
    await assertRejection('10. Regular member cannot close collections', async () => {
        await collectionService.closeCollections(memberA._id.toString(), UserRole.USER, cycle1._id.toString());
    }, 'Unauthorized to manage payment collections for this Chit Group');

    // Test 11: Unauthorized Organizer cannot close collections (403)
    await assertRejection('11. Unauthorized Organizer cannot close collections for group they do not own', async () => {
        await collectionService.closeCollections(organizerB._id.toString(), UserRole.ORGANIZER, cycle1._id.toString());
    }, 'Unauthorized to manage payment collections for this Chit Group');

    // Test 12: Authorized Organizer closes collections successfully
    let closedCycle: any = null;
    await assertSuccess('12. Authorized Organizer closes payment collections successfully', async () => {
        closedCycle = await collectionService.closeCollections(organizerA._id.toString(), UserRole.ORGANIZER, cycle1._id.toString(), 'Cycle 1 collection closed');
        if (closedCycle.paymentCollection.status !== PaymentCollectionStatus.CLOSED) {
            throw new Error(`Expected status CLOSED, got: ${closedCycle.paymentCollection.status}`);
        }
        if (!closedCycle.paymentCollection.closedAt) {
            throw new Error('closedAt timestamp was not set');
        }
        if (closedCycle.paymentCollection.closedBy.toString() !== organizerA._id.toString()) {
            throw new Error('closedBy did not match organizer ID');
        }
    });

    // Test 13: Closing collections when already CLOSED is rejected
    await assertRejection('13. Closing collections when already CLOSED is rejected', async () => {
        await collectionService.closeCollections(organizerA._id.toString(), UserRole.ORGANIZER, cycle1._id.toString());
    }, 'Payment collections are already CLOSED for this cycle');

    // Test 14: Reopening collections when CLOSED is rejected
    await assertRejection('14. Reopening collections when CLOSED is rejected', async () => {
        await collectionService.openCollections(organizerA._id.toString(), UserRole.ORGANIZER, cycle1._id.toString());
    }, 'Payment collections are CLOSED for this cycle and cannot be reopened');

    // Test 15: Member cannot pay installment for a closed cycle
    await assertRejection('15. Member cannot initiate payment when collections are CLOSED', async () => {
        await txnService.initiatePayment(memberB._id.toString(), {
            installmentId: installmentB1._id.toString(),
            paymentMethod: PaymentMethod.UPI,
            paymentGateway: PaymentGatewayProvider.MOCK
        });
    }, 'Collections for this cycle have been closed');

    // Test 16: Collection Summary analytics endpoint verification
    await assertSuccess('16. Collection summary analytics returns expected financial metrics', async () => {
        const summary = await collectionService.getCollectionSummary(cycle1._id.toString());
        if (!summary) throw new Error('Summary returned null');
        if (summary.paymentCollection.status !== PaymentCollectionStatus.CLOSED) {
            throw new Error(`Expected summary status CLOSED, got: ${summary.paymentCollection.status}`);
        }
        if (summary.winner?.userName !== memberA.name) {
            throw new Error(`Expected winner name ${memberA.name}, got: ${summary.winner?.userName}`);
        }
    });

    console.log(`\n======================================================`);
    console.log(`✅ COLLECTION MANAGEMENT SUITE COMPLETE: ${passed} / ${passed + failed} TESTS PASSED`);
    console.log(`======================================================\n`);

    if (failed > 0) {
        throw new Error(`${failed} test(s) failed in Collection Management Suite`);
    }
}
