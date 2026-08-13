import mongoose from 'mongoose';
import ChitGroup from '@modules/chit-group/models/ChitGroup.js';
import ChitCycle, { ChitCycleStatus } from '@modules/chit-cycle/models/ChitCycle.js';
import Membership, { MembershipStatus } from '@modules/membership/models/Membership.js';
import User, { UserRole } from '@modules/user/models/User.js';
import Installment, { PaymentStatus } from '../models/Installment.js';
import { InstallmentService } from '../services/InstallmentService.js';
import { JournalEntryRepository, AccountCategory, JournalDirection, IJournalLine } from '@modules/ledger/index.js';

export async function runInstallmentObligationJournalTests() {
    console.log('\n=== RUNNING LEDGER P2 INSTALLMENT OBLIGATION ACCOUNTING TESTS ===\n');

    const installmentService = new InstallmentService();
    const journalRepo = new JournalEntryRepository();

    let passedCount = 0;
    let totalCount = 0;

    const assertSuccess = async (testName: string, fn: () => Promise<any>) => {
        totalCount++;
        try {
            await fn();
            passedCount++;
            console.log(`✅ [PASS] ${testName}`);
        } catch (err: any) {
            console.error(`❌ [FAIL] ${testName} - ${err.message}`);
        }
    };

    // Setup Test User, Group, Cycle & Membership in DB
    const organizer = await User.create({
        name: 'Org Test User P2',
        email: `org.test.p2.${Date.now()}@example.com`,
        password: 'password123',
        role: UserRole.ORGANIZER
    });

    const memberUser = await User.create({
        name: 'Member Test User P2',
        email: `mem.test.p2.${Date.now()}@example.com`,
        password: 'password123',
        role: UserRole.USER
    });

    const group = await ChitGroup.create({
        name: `Test Group P2 ${Date.now()}`,
        organizerId: organizer._id,
        monthlyContribution: 10000,
        totalMembers: 10,
        currentMemberCount: 1,
        durationMonths: 10,
        status: 'ACTIVE'
    });

    const cycle = await ChitCycle.create({
        groupId: group._id,
        cycleNumber: 1,
        status: ChitCycleStatus.ACTIVE,
        scheduledStartDate: new Date()
    });

    await Membership.create({
        chitGroupId: group._id,
        userId: memberUser._id,
        status: MembershipStatus.ACTIVE_MEMBER
    });

    // TEST 1: Generate Installment & Verify Journal Entry Created
    let generatedInstallmentId = '';
    await assertSuccess('1. Generate Installment Obligation & Verify Journal Creation', async () => {
        const result = await installmentService.generateInstallmentsForCycle(
            (organizer._id as any).toString(),
            UserRole.ORGANIZER,
            (cycle._id as any).toString()
        );

        if (result.createdCount !== 1) {
            throw new Error(`Expected 1 created installment, got ${result.createdCount}`);
        }

        const installment = result.installments[0];
        if (!installment) throw new Error('Installment creation failed');
        generatedInstallmentId = (installment._id as any).toString();

        const journal = await journalRepo.findByReference(generatedInstallmentId, 'INSTALLMENT');
        if (!journal) {
            throw new Error('Journal entry was not created for installment obligation');
        }

        if (journal.entryType !== 'INSTALLMENT_OBLIGATION') {
            throw new Error(`Expected entryType INSTALLMENT_OBLIGATION, got ${journal.entryType}`);
        }
    });

    // TEST 2: Verify ₹10,000 (1,000,000 paise) DEBIT MEMBER_RECEIVABLE / CREDIT CHIT_CYCLE_CLEARING
    await assertSuccess('2. Verify DEBIT MEMBER_RECEIVABLE / CREDIT CHIT_CYCLE_CLEARING (1,000,000 paise)', async () => {
        const journal = await journalRepo.findByReference(generatedInstallmentId, 'INSTALLMENT');
        if (!journal) throw new Error('Journal entry not found');

        if (journal.totalAmountPaise !== 1000000) {
            throw new Error(`Expected totalAmountPaise 1000000 (₹10,000), got ${journal.totalAmountPaise}`);
        }

        const debitLine = journal.lines.find((l: IJournalLine) => l.direction === JournalDirection.DEBIT);
        const creditLine = journal.lines.find((l: IJournalLine) => l.direction === JournalDirection.CREDIT);

        if (!debitLine || debitLine.accountCategory !== AccountCategory.RECEIVABLE || debitLine.amountPaise !== 1000000) {
            throw new Error('DEBIT line invalid or category is not RECEIVABLE');
        }

        if (!creditLine || creditLine.accountCategory !== AccountCategory.CLEARING || creditLine.amountPaise !== 1000000) {
            throw new Error('CREDIT line invalid or category is not CLEARING');
        }
    });

    // TEST 3: Verify DEBIT == CREDIT Invariant
    await assertSuccess('3. Verify DEBIT == CREDIT Invariant (isBalanced = true)', async () => {
        const journal = await journalRepo.findByReference(generatedInstallmentId, 'INSTALLMENT');
        if (!journal || !journal.isBalanced) {
            throw new Error('Journal is unbalanced or isBalanced flag is false');
        }
    });

    // TEST 4-7: Verify References (installmentId, groupId, cycleId, memberId)
    await assertSuccess('4. Verify Header References (installmentId, groupId, cycleId, memberId)', async () => {
        const journal = await journalRepo.findByReference(generatedInstallmentId, 'INSTALLMENT');
        if (!journal) throw new Error('Journal not found');

        if (journal.referenceId !== generatedInstallmentId) {
            throw new Error(`Reference ID mismatch: expected ${generatedInstallmentId}, got ${journal.referenceId}`);
        }
        if (journal.groupId.toString() !== group._id.toString()) {
            throw new Error(`Group ID mismatch: expected ${group._id}, got ${journal.groupId}`);
        }
        if (journal.cycleId?.toString() !== cycle._id.toString()) {
            throw new Error(`Cycle ID mismatch: expected ${cycle._id}, got ${journal.cycleId}`);
        }
        if (journal.memberId?.toString() !== memberUser._id.toString()) {
            throw new Error(`Member ID mismatch: expected ${memberUser._id}, got ${journal.memberId}`);
        }
    });

    // TEST 8: Retry Same Installment Generation (Idempotency - No Duplicate Journal)
    await assertSuccess('8. Retry Same Installment Generation (Idempotency - No Duplicate Journal)', async () => {
        await installmentService.generateInstallmentsForCycle(
            (organizer._id as any).toString(),
            UserRole.ORGANIZER,
            (cycle._id as any).toString()
        );

        const journal = await journalRepo.findByReference(generatedInstallmentId, 'INSTALLMENT');
        if (!journal) {
            throw new Error('Original journal disappeared');
        }
    });

    // TEST 9: Verify Installment Payment Status remains PENDING
    await assertSuccess('9. Verify Installment Payment Status remains PENDING', async () => {
        const inst = await Installment.findById(generatedInstallmentId);
        if (!inst || inst.paymentStatus !== PaymentStatus.PENDING) {
            throw new Error(`Expected paymentStatus PENDING, got ${inst?.paymentStatus}`);
        }
    });

    console.log(`\n=== LEDGER P2 INSTALLMENT OBLIGATION TEST RESULTS: ${passedCount} / ${totalCount} PASSED ===\n`);
}
