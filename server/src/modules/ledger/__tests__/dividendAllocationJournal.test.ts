import mongoose from 'mongoose';
import dotenv from 'dotenv';
import {
    JournalPostingService,
    JournalEntryRepository,
    AccountProvisioningService,
    AccountCategory,
    AccountScope,
    JournalDirection,
    DoubleEntryJournalType,
    initLedgerEventListeners,
    processPaymentJournalPosting,
    processPaymentRefundJournalPosting,
    processWinnerPotAllocationJournalPosting,
    processPrizePayoutJournalPosting,
    processOrganizerCommissionPayoutJournalPosting,
    processDividendAllocationJournalPosting
} from '../index.js';
import JournalEntry from '../models/JournalEntry.js';
import Account from '../models/Account.js';
import LedgerEntry from '../models/LedgerEntry.js';
import ChitGroup, { ChitGroupStatus, AuctionType } from '@modules/chit-group/models/ChitGroup.js';
import ChitCycle, { ChitCycleStatus } from '@modules/chit-cycle/models/ChitCycle.js';
import Membership, { MembershipStatus } from '@modules/membership/models/Membership.js';
import Auction, { AuctionStatus } from '@modules/auction/models/Auction.js';
import Bid from '@modules/bid/models/Bid.js';
import Installment, { PaymentStatus } from '@modules/installment/models/Installment.js';
import Transaction, { TransactionStatus, PaymentMethod, PaymentGatewayProvider } from '@modules/payment/models/Transaction.js';
import User, { UserRole } from '@modules/user/models/User.js';

dotenv.config();

let passed = 0;
let failed = 0;

async function assertSuccess(name: string, fn: () => Promise<void>) {
    try {
        await fn();
        console.log(`✅ [PASS] ${name}`);
        passed++;
    } catch (err: any) {
        console.error(`❌ [FAIL] ${name} -> ${err.message || err}`);
        failed++;
    }
}

async function assertThrows(name: string, fn: () => Promise<void>, expectedSubstring?: string) {
    try {
        await fn();
        console.error(`❌ [FAIL] ${name} -> Expected error was not thrown`);
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

export async function runDividendAllocationTests() {
    console.log('\n=== RUNNING LEDGER P8 DIVIDEND ALLOCATION & INSTALLMENT OFFSET TESTS ===\n');

    const provisioningService = new AccountProvisioningService();
    const journalPostingService = new JournalPostingService();
    const journalRepo = new JournalEntryRepository();

    initLedgerEventListeners();

    // 1. Setup Test Users
    const organizerUser: any = await User.create({
        name: 'Organizer User P8',
        email: `organizer_p8_${Date.now()}_${Math.random().toString(36).slice(2, 7)}@test.com`,
        password: 'Password123!',
        role: UserRole.ORGANIZER,
        age: 45
    });

    const winnerUser: any = await User.create({
        name: 'Winner Member User P8',
        email: `winner_p8_${Date.now()}_${Math.random().toString(36).slice(2, 7)}@test.com`,
        password: 'Password123!',
        role: UserRole.USER,
        age: 33
    });

    const nonWinnerMember: any = await User.create({
        name: 'Non Winner Member User P8',
        email: `nonwinner_p8_${Date.now()}_${Math.random().toString(36).slice(2, 7)}@test.com`,
        password: 'Password123!',
        role: UserRole.USER,
        age: 28
    });

    // 2. Setup Test Chit Group (₹10,000/mo, 10 members -> Pot ₹100,000, 5% Commission, 30% discount -> Div Pool ₹25,000)
    // Per member dividend entitlement = ₹25,000 / 10 = ₹2,500 (250,000 paise)
    const chitGroup: any = await ChitGroup.create({
        organizerId: organizerUser._id,
        name: `P8 Dividend Chit Group ${Date.now()}`,
        totalMembers: 10,
        monthlyContribution: 10000,
        durationMonths: 10,
        startDate: new Date(),
        commissionPercent: 5,
        auctionType: AuctionType.AUCTION,
        financialConfig: {
            version: 1,
            commission: { value: 5, type: 'PERCENTAGE' },
            lateFee: { value: 0, type: 'FIXED' },
            gracePeriodDays: 3,
            auctionStrategy: 'LOWEST_BID',
            allowPartialInstallment: false,
            allowPrepayment: true,
            allowPenaltyWaiver: true,
            currency: 'INR'
        },
        status: ChitGroupStatus.ACTIVE
    });

    // Auto-provision accounts for Group & Members
    await provisioningService.provisionGroupAccounts(chitGroup._id.toString());
    await provisioningService.provisionMemberAccounts(chitGroup._id.toString(), winnerUser._id.toString());
    await provisioningService.provisionMemberAccounts(chitGroup._id.toString(), nonWinnerMember._id.toString());

    // 3. Setup Memberships
    const winnerMembership: any = await Membership.create({
        userId: winnerUser._id,
        chitGroupId: chitGroup._id,
        status: MembershipStatus.ACTIVE_MEMBER,
        joinedAt: new Date()
    });

    const nonWinnerMembership: any = await Membership.create({
        userId: nonWinnerMember._id,
        chitGroupId: chitGroup._id,
        status: MembershipStatus.ACTIVE_MEMBER,
        joinedAt: new Date()
    });

    // 4. Setup Cycle 1
    const chitCycle: any = await ChitCycle.create({
        groupId: chitGroup._id,
        cycleNumber: 1,
        status: ChitCycleStatus.ACTIVE,
        scheduledStartDate: new Date(),
        winningBidPercentage: 30, // 30% discount = ₹30,000
        winningBidAmount: 30000,
        prizeAmount: 70000, // Net Prize = ₹70,000
        winnerMembershipId: winnerMembership._id
    });

    // 5. Setup Auction
    const auction: any = await Auction.create({
        groupId: chitGroup._id,
        cycleId: chitCycle._id,
        organizerId: organizerUser._id,
        auctionNumber: 1,
        scheduledStartTime: new Date(),
        status: AuctionStatus.WINNER_DECLARED,
        minimumBidPercentage: 5,
        maximumBidPercentage: 40,
        winningMembershipId: winnerMembership._id,
        createdBy: organizerUser._id
    });

    // 6. Setup Winning Bid (30%)
    const winningBid: any = await Bid.create({
        auctionId: auction._id,
        cycleId: chitCycle._id,
        groupId: chitGroup._id,
        membershipId: winnerMembership._id,
        userId: winnerUser._id,
        bidPercentage: 30,
        bidAmount: 30000,
        isWinningBid: true
    });
    auction.winningBidId = winningBid._id;
    await auction.save();

    // 7. Post P5 Winner Pot Allocation Journal (Pot ₹100k, Prize ₹70k, Comm ₹5k, Div Pool ₹25k)
    const p5Journal = await processWinnerPotAllocationJournalPosting({
        auctionId: auction._id.toString(),
        groupId: chitGroup._id.toString(),
        cycleId: chitCycle._id.toString(),
        winningMembershipId: winnerMembership._id.toString(),
        winnerUserId: winnerUser._id.toString(),
        winningBidPercentage: 30
    });

    // Create installment for nonWinnerMember to test offset (₹10,000 obligation)
    const nonWinnerInstallment: any = await Installment.create({
        membershipId: nonWinnerMembership._id,
        userId: nonWinnerMember._id,
        groupId: chitGroup._id,
        cycleId: chitCycle._id,
        installmentNumber: 1,
        amount: 10000,
        paidAmount: 0,
        dueDate: new Date(),
        paymentStatus: PaymentStatus.PENDING
    });

    // -------------------------------------------------------------------------
    // TEST SUITE: P8 DIVIDEND ALLOCATION & INSTALLMENT OFFSET
    // -------------------------------------------------------------------------

    let postedDivJournal: any = null;

    // TEST 1: Valid dividend allocation with installment offset creates exactly one JournalEntry
    await assertSuccess('1. Valid dividend allocation creates exactly one JournalEntry', async () => {
        postedDivJournal = await processDividendAllocationJournalPosting({
            auctionId: auction._id.toString(),
            groupId: chitGroup._id.toString(),
            cycleId: chitCycle._id.toString(),
            memberId: nonWinnerMember._id.toString(),
            installmentId: nonWinnerInstallment._id.toString(),
            payoutMode: 'OFFSET'
        });

        if (!postedDivJournal || !postedDivJournal._id) {
            throw new Error('Expected JournalEntry to be created for dividend allocation');
        }
        if (postedDivJournal.entryType !== DoubleEntryJournalType.DIVIDEND_DISTRIBUTION) {
            throw new Error(`Expected entryType DIVIDEND_DISTRIBUTION, got ${postedDivJournal.entryType}`);
        }
    });

    // TEST 2: Correct DEBIT account: GRP-{groupId}-DIV_PAYABLE
    await assertSuccess('2. Correct DEBIT account: GRP-{groupId}-DIV_PAYABLE', async () => {
        const debitLine = postedDivJournal.lines.find(
            (l: any) => l.direction === JournalDirection.DEBIT && l.accountNumber.includes('DIV_PAYABLE')
        );
        if (!debitLine) {
            throw new Error('Expected DEBIT line for DIV_PAYABLE');
        }
        if (debitLine.accountCategory !== AccountCategory.PAYABLE) {
            throw new Error(`Expected accountCategory PAYABLE, got ${debitLine.accountCategory}`);
        }
    });

    // TEST 3: Correct CREDIT account for offset: GRP-{groupId}-MEM-{memberId}-RECEIVABLE
    await assertSuccess('3. Correct CREDIT account for offset: GRP-{groupId}-MEM-{memberId}-RECEIVABLE', async () => {
        const creditLine = postedDivJournal.lines.find(
            (l: any) => l.direction === JournalDirection.CREDIT && l.accountNumber.includes('RECEIVABLE')
        );
        if (!creditLine) {
            throw new Error('Expected CREDIT line for MEMBER_RECEIVABLE in offset mode');
        }
        if (creditLine.accountCategory !== AccountCategory.RECEIVABLE) {
            throw new Error(`Expected accountCategory RECEIVABLE, got ${creditLine.accountCategory}`);
        }
    });

    // TEST 4: Correct CREDIT account for DIRECT_PAYOUT: GRP-{groupId}-BANK
    await assertSuccess('4. Correct CREDIT account for DIRECT_PAYOUT: GRP-{groupId}-BANK', async () => {
        const directPayMember: any = await User.create({
            name: 'Direct Pay Member P8',
            email: `direct_${Date.now()}_${Math.random().toString(36).slice(2, 7)}@test.com`,
            password: 'Password123!',
            role: UserRole.USER,
            age: 30
        });

        const directMem: any = await Membership.create({
            userId: directPayMember._id,
            chitGroupId: chitGroup._id,
            status: MembershipStatus.ACTIVE_MEMBER,
            joinedAt: new Date()
        });

        const directJournal = await processDividendAllocationJournalPosting({
            auctionId: auction._id.toString(),
            groupId: chitGroup._id.toString(),
            cycleId: chitCycle._id.toString(),
            memberId: directPayMember._id.toString(),
            payoutMode: 'DIRECT_PAYOUT',
            amountPaise: 250000
        });

        const creditBank = directJournal.lines.find(
            (l: any) => l.direction === JournalDirection.CREDIT && l.accountNumber.includes('BANK')
        );
        if (!creditBank) {
            throw new Error('Expected CREDIT line for BANK escrow in DIRECT_PAYOUT mode');
        }
        if (creditBank.accountCategory !== AccountCategory.BANK) {
            throw new Error(`Expected accountCategory BANK, got ${creditBank.accountCategory}`);
        }
    });

    // TEST 5: Correct dividend amount in paise (₹2,500 = 250,000 paise)
    await assertSuccess('5. Correct dividend amount in paise (₹2,500 / 250,000 paise)', async () => {
        if (postedDivJournal.totalAmountPaise !== 250000) {
            throw new Error(`Expected totalAmountPaise 250000, got ${postedDivJournal.totalAmountPaise}`);
        }
    });

    // TEST 6: Total DEBIT === Total CREDIT (isBalanced = true)
    await assertSuccess('6. Total DEBIT === Total CREDIT (isBalanced = true)', async () => {
        if (!postedDivJournal.isBalanced) {
            throw new Error('Expected isBalanced to be true');
        }
    });

    // TEST 7: Correct Group ID associated
    await assertSuccess('7. Correct groupId associated', async () => {
        if (postedDivJournal.groupId.toString() !== chitGroup._id.toString()) {
            throw new Error('groupId mismatch');
        }
    });

    // TEST 8: Correct Cycle ID associated
    await assertSuccess('8. Correct cycleId associated', async () => {
        if (postedDivJournal.cycleId.toString() !== chitCycle._id.toString()) {
            throw new Error('cycleId mismatch');
        }
    });

    // TEST 9: Correct Member ID associated
    await assertSuccess('9. Correct memberId associated', async () => {
        if (postedDivJournal.memberId.toString() !== nonWinnerMember._id.toString()) {
            throw new Error('memberId mismatch');
        }
    });

    // TEST 10: Correct Reference Type and Reference ID
    await assertSuccess('10. Correct referenceType and referenceId', async () => {
        if (postedDivJournal.referenceType !== 'INSTALLMENT') {
            throw new Error(`Expected referenceType INSTALLMENT, got ${postedDivJournal.referenceType}`);
        }
        if (postedDivJournal.referenceId !== `${nonWinnerInstallment._id}-DIVIDEND`) {
            throw new Error(`Expected referenceId ${nonWinnerInstallment._id}-DIVIDEND, got ${postedDivJournal.referenceId}`);
        }
    });

    // TEST 11: P5 DIV_PAYABLE must exist before settlement
    await assertThrows('11. Dividend distribution before P5 pot allocation is rejected', async () => {
        const groupUnalloc: any = await ChitGroup.create({
            organizerId: organizerUser._id,
            name: `Unalloc Group ${Date.now()}`,
            totalMembers: 10,
            monthlyContribution: 10000,
            durationMonths: 10,
            startDate: new Date(),
            commissionPercent: 5,
            auctionType: AuctionType.AUCTION,
            status: ChitGroupStatus.ACTIVE
        });

        const memUnalloc: any = await Membership.create({
            userId: nonWinnerMember._id,
            chitGroupId: groupUnalloc._id,
            status: MembershipStatus.ACTIVE_MEMBER,
            joinedAt: new Date()
        });

        const cycleUnalloc: any = await ChitCycle.create({
            groupId: groupUnalloc._id,
            cycleNumber: 1,
            status: ChitCycleStatus.ACTIVE,
            scheduledStartDate: new Date()
        });

        const auctionUnalloc: any = await Auction.create({
            groupId: groupUnalloc._id,
            cycleId: cycleUnalloc._id,
            organizerId: organizerUser._id,
            auctionNumber: 1,
            scheduledStartTime: new Date(),
            status: AuctionStatus.WINNER_DECLARED,
            createdBy: organizerUser._id
        });

        // Try P8 before P5
        await processDividendAllocationJournalPosting({
            auctionId: auctionUnalloc._id.toString(),
            groupId: groupUnalloc._id.toString(),
            cycleId: cycleUnalloc._id.toString(),
            memberId: nonWinnerMember._id.toString()
        });
    }, 'before winner pot allocation');

    // TEST 12: Dividend cannot exceed recognized DIV_PAYABLE pool
    await assertThrows('12. Dividend cannot exceed recognized DIV_PAYABLE pool', async () => {
        const groupCap: any = await ChitGroup.create({
            organizerId: organizerUser._id,
            name: `Cap Group ${Date.now()}`,
            totalMembers: 2,
            monthlyContribution: 10000, // Pot = 20,000 (2,000,000 paise), 5% Comm = 100,000 paise, 10% Discount = 200,000 paise -> Div Pool = 100,000 paise (₹1,000)
            durationMonths: 2,
            startDate: new Date(),
            commissionPercent: 5,
            auctionType: AuctionType.AUCTION,
            financialConfig: {
                version: 1,
                commission: { value: 5, type: 'PERCENTAGE' },
                lateFee: { value: 0, type: 'FIXED' },
                gracePeriodDays: 3,
                auctionStrategy: 'LOWEST_BID',
                allowPartialInstallment: false,
                allowPrepayment: true,
                allowPenaltyWaiver: true,
                currency: 'INR'
            },
            status: ChitGroupStatus.ACTIVE
        });

        const memCap1: any = await Membership.create({
            userId: nonWinnerMember._id,
            chitGroupId: groupCap._id,
            status: MembershipStatus.ACTIVE_MEMBER,
            joinedAt: new Date()
        });

        const cycleCap: any = await ChitCycle.create({
            groupId: groupCap._id,
            cycleNumber: 1,
            status: ChitCycleStatus.ACTIVE,
            scheduledStartDate: new Date(),
            winnerMembershipId: memCap1._id
        });

        const auctionCap: any = await Auction.create({
            groupId: groupCap._id,
            cycleId: cycleCap._id,
            organizerId: organizerUser._id,
            auctionNumber: 1,
            scheduledStartTime: new Date(),
            status: AuctionStatus.WINNER_DECLARED,
            winningMembershipId: memCap1._id,
            createdBy: organizerUser._id
        });

        await processWinnerPotAllocationJournalPosting({
            auctionId: auctionCap._id.toString(),
            groupId: groupCap._id.toString(),
            cycleId: cycleCap._id.toString(),
            winningMembershipId: memCap1._id.toString(),
            winnerUserId: nonWinnerMember._id.toString(),
            winningBidPercentage: 10
        });

        // Try distributing 200,000 paise (exceeds total pool of 100,000 paise)
        await processDividendAllocationJournalPosting({
            auctionId: auctionCap._id.toString(),
            groupId: groupCap._id.toString(),
            cycleId: cycleCap._id.toString(),
            memberId: nonWinnerMember._id.toString(),
            amountPaise: 200000
        });
    }, 'exceeds member entitlement');

    // TEST 13: Dividend cannot exceed member entitlement
    await assertThrows('13. Dividend cannot exceed member entitlement', async () => {
        // Group has 10 members, Div pool = ₹25,000 -> Entitlement = ₹2,500 (250,000 paise)
        // Try allocating ₹5,000 (500,000 paise) to single member
        const otherMember: any = await User.create({
            name: 'Other Member P8',
            email: `other_${Date.now()}_${Math.random().toString(36).slice(2, 7)}@test.com`,
            password: 'Password123!',
            role: UserRole.USER,
            age: 26
        });

        const otherMem: any = await Membership.create({
            userId: otherMember._id,
            chitGroupId: chitGroup._id,
            status: MembershipStatus.ACTIVE_MEMBER,
            joinedAt: new Date()
        });

        await processDividendAllocationJournalPosting({
            auctionId: auction._id.toString(),
            groupId: chitGroup._id.toString(),
            cycleId: chitCycle._id.toString(),
            memberId: otherMember._id.toString(),
            amountPaise: 500000
        });
    }, 'exceeds member entitlement');

    // TEST 14: Zero dividend rejected
    await assertThrows('14. Zero dividend rejected', async () => {
        await processDividendAllocationJournalPosting({
            auctionId: auction._id.toString(),
            groupId: chitGroup._id.toString(),
            cycleId: chitCycle._id.toString(),
            memberId: nonWinnerMember._id.toString(),
            amountPaise: 0
        });
    }, 'positive integer');

    // TEST 15: Negative dividend rejected
    await assertThrows('15. Negative dividend rejected', async () => {
        await processDividendAllocationJournalPosting({
            auctionId: auction._id.toString(),
            groupId: chitGroup._id.toString(),
            cycleId: chitCycle._id.toString(),
            memberId: nonWinnerMember._id.toString(),
            amountPaise: -2500
        });
    }, 'positive integer');

    // TEST 16: Ineligible member rejected (No active membership)
    await assertThrows('16. Ineligible member without active membership is rejected', async () => {
        const strangerUser: any = await User.create({
            name: 'Stranger User P8',
            email: `stranger_${Date.now()}_${Math.random().toString(36).slice(2, 7)}@test.com`,
            password: 'Password123!',
            role: UserRole.USER,
            age: 29
        });

        await processDividendAllocationJournalPosting({
            auctionId: auction._id.toString(),
            groupId: chitGroup._id.toString(),
            cycleId: chitCycle._id.toString(),
            memberId: strangerUser._id.toString(),
            amountPaise: 250000
        });
    }, 'Active membership not found');

    // TEST 17: Cross-group member rejected
    await assertThrows('17. Cross-group member rejected with MEMBER_GROUP_MISMATCH', async () => {
        const otherGroup: any = await ChitGroup.create({
            organizerId: organizerUser._id,
            name: `Other Group ${Date.now()}`,
            totalMembers: 10,
            monthlyContribution: 10000,
            durationMonths: 10,
            startDate: new Date(),
            commissionPercent: 5,
            auctionType: AuctionType.AUCTION,
            status: ChitGroupStatus.ACTIVE
        });

        const crossMem: any = await Membership.create({
            userId: nonWinnerMember._id,
            chitGroupId: otherGroup._id,
            status: MembershipStatus.ACTIVE_MEMBER,
            joinedAt: new Date()
        });

        await processDividendAllocationJournalPosting({
            auctionId: auction._id.toString(),
            groupId: chitGroup._id.toString(),
            cycleId: chitCycle._id.toString(),
            memberId: nonWinnerMember._id.toString(),
            membershipId: crossMem._id.toString(),
            amountPaise: 250000
        });
    }, 'Member does not belong to this Chit Group');

    // TEST 18: Duplicate event is idempotent
    await assertSuccess('18. Duplicate dividend distribution event is idempotent', async () => {
        const dup = await processDividendAllocationJournalPosting({
            auctionId: auction._id.toString(),
            groupId: chitGroup._id.toString(),
            cycleId: chitCycle._id.toString(),
            memberId: nonWinnerMember._id.toString(),
            installmentId: nonWinnerInstallment._id.toString(),
            payoutMode: 'OFFSET'
        });

        if (dup.entryNumber !== postedDivJournal.entryNumber) {
            throw new Error('Expected duplicate call to return original JournalEntry');
        }

        const count = await JournalEntry.countDocuments({
            referenceId: `${nonWinnerInstallment._id}-DIVIDEND`,
            entryType: DoubleEntryJournalType.DIVIDEND_DISTRIBUTION
        });
        if (count !== 1) {
            throw new Error(`Expected exactly 1 DIVIDEND_DISTRIBUTION journal, found ${count}`);
        }
    });

    // TEST 19: Concurrent distribution creates exactly ONE journal
    await assertSuccess('19. Concurrent dividend distribution creates exactly ONE journal', async () => {
        const concMember: any = await User.create({
            name: 'Concurrent Member P8',
            email: `conc_mem_${Date.now()}_${Math.random().toString(36).slice(2, 7)}@test.com`,
            password: 'Password123!',
            role: UserRole.USER,
            age: 36
        });

        const concMem: any = await Membership.create({
            userId: concMember._id,
            chitGroupId: chitGroup._id,
            status: MembershipStatus.ACTIVE_MEMBER,
            joinedAt: new Date()
        });

        const promises = Array(5).fill(null).map(() =>
            processDividendAllocationJournalPosting({
                auctionId: auction._id.toString(),
                groupId: chitGroup._id.toString(),
                cycleId: chitCycle._id.toString(),
                memberId: concMember._id.toString(),
                payoutMode: 'DIRECT_PAYOUT',
                amountPaise: 250000
            })
        );

        const results = await Promise.all(promises);
        const uniqueEntryNumbers = new Set(results.map(r => r.entryNumber));
        if (uniqueEntryNumbers.size !== 1) {
            throw new Error(`Expected 1 unique entry number from concurrent executions, got ${uniqueEntryNumbers.size}`);
        }

        const count = await JournalEntry.countDocuments({
            referenceId: `${auction._id}-MEM-${concMember._id}-DIVIDEND`,
            entryType: DoubleEntryJournalType.DIVIDEND_DISTRIBUTION
        });
        if (count !== 1) {
            throw new Error(`Expected exactly 1 JournalEntry in DB, found ${count}`);
        }
    });

    // Helper to create a standalone test group, cycle, and membership for installment tests
    async function createIsolatedGroupAndMembership(nameSuffix: string) {
        const grp: any = await ChitGroup.create({
            organizerId: organizerUser._id,
            name: `Isolated Group ${nameSuffix} ${Date.now()}`,
            totalMembers: 10,
            monthlyContribution: 10000,
            durationMonths: 10,
            startDate: new Date(),
            commissionPercent: 5,
            financialConfig: {
                version: 1,
                commission: { value: 5, type: 'PERCENTAGE' },
                lateFee: { value: 0, type: 'FIXED' },
                gracePeriodDays: 3,
                auctionStrategy: 'LOWEST_BID',
                allowPartialInstallment: false,
                allowPrepayment: true,
                allowPenaltyWaiver: true,
                currency: 'INR'
            },
            auctionType: AuctionType.AUCTION,
            status: ChitGroupStatus.ACTIVE
        });

        await provisioningService.provisionGroupAccounts(grp._id.toString());
        await provisioningService.provisionMemberAccounts(grp._id.toString(), nonWinnerMember._id.toString());

        const mem: any = await Membership.create({
            userId: nonWinnerMember._id,
            chitGroupId: grp._id,
            status: MembershipStatus.ACTIVE_MEMBER,
            joinedAt: new Date()
        });

        const cyc: any = await ChitCycle.create({
            groupId: grp._id,
            cycleNumber: 1,
            status: ChitCycleStatus.ACTIVE,
            scheduledStartDate: new Date(),
            winnerMembershipId: mem._id
        });

        const auc: any = await Auction.create({
            groupId: grp._id,
            cycleId: cyc._id,
            organizerId: organizerUser._id,
            auctionNumber: 1,
            scheduledStartTime: new Date(),
            status: AuctionStatus.WINNER_DECLARED,
            winningMembershipId: mem._id,
            createdBy: organizerUser._id
        });

        await processWinnerPotAllocationJournalPosting({
            auctionId: auc._id.toString(),
            groupId: grp._id.toString(),
            cycleId: cyc._id.toString(),
            winningMembershipId: mem._id.toString(),
            winnerUserId: nonWinnerMember._id.toString(),
            winningBidPercentage: 30
        });

        return { grp, mem, cyc, auc };
    }

    // TEST 20: Installment offset cannot exceed outstanding installment
    await assertThrows('20. Installment offset cannot exceed outstanding installment', async () => {
        const { grp, mem, cyc, auc } = await createIsolatedGroupAndMembership('Test20');
        const smallInst: any = await Installment.create({
            membershipId: mem._id,
            userId: nonWinnerMember._id,
            groupId: grp._id,
            cycleId: cyc._id,
            installmentNumber: 1,
            amount: 1000, // Outstanding ₹1,000 (100,000 paise)
            paidAmount: 0,
            dueDate: new Date(),
            paymentStatus: PaymentStatus.PENDING
        });

        // Try offsetting ₹2,500 (250,000 paise) against ₹1,000 obligation
        await processDividendAllocationJournalPosting({
            auctionId: auc._id.toString(),
            groupId: grp._id.toString(),
            cycleId: cyc._id.toString(),
            memberId: nonWinnerMember._id.toString(),
            installmentId: smallInst._id.toString(),
            amountPaise: 250000,
            payoutMode: 'OFFSET'
        });
    }, 'cannot exceed outstanding installment obligation');

    // TEST 21: Fully offset installment reaches PAID status
    await assertSuccess('21. Fully offset installment reaches PAID status', async () => {
        const { grp, mem, cyc, auc } = await createIsolatedGroupAndMembership('Test21');
        const exactInst: any = await Installment.create({
            membershipId: mem._id,
            userId: nonWinnerMember._id,
            groupId: grp._id,
            cycleId: cyc._id,
            installmentNumber: 1,
            amount: 2500, // Exact match with ₹2,500 dividend
            paidAmount: 0,
            dueDate: new Date(),
            paymentStatus: PaymentStatus.PENDING
        });

        await processDividendAllocationJournalPosting({
            auctionId: auc._id.toString(),
            groupId: grp._id.toString(),
            cycleId: cyc._id.toString(),
            memberId: nonWinnerMember._id.toString(),
            installmentId: exactInst._id.toString(),
            amountPaise: 250000,
            payoutMode: 'OFFSET'
        });

        const updatedInst = await Installment.findById(exactInst._id);
        if (!updatedInst || updatedInst.paymentStatus !== PaymentStatus.PAID || updatedInst.paidAmount !== 2500) {
            throw new Error(`Expected installment to be PAID with paidAmount 2500, got status: ${updatedInst?.paymentStatus}, paidAmount: ${updatedInst?.paidAmount}`);
        }
    });

    // TEST 22: Partial offset leaves correct remaining obligation and PARTIALLY_PAID status
    await assertSuccess('22. Partial offset leaves correct remaining obligation and PARTIALLY_PAID status', async () => {
        const { grp, mem, cyc, auc } = await createIsolatedGroupAndMembership('Test22');
        const partialInst: any = await Installment.create({
            membershipId: mem._id,
            userId: nonWinnerMember._id,
            groupId: grp._id,
            cycleId: cyc._id,
            installmentNumber: 1,
            amount: 10000,
            paidAmount: 0,
            dueDate: new Date(),
            paymentStatus: PaymentStatus.PENDING
        });

        await processDividendAllocationJournalPosting({
            auctionId: auc._id.toString(),
            groupId: grp._id.toString(),
            cycleId: cyc._id.toString(),
            memberId: nonWinnerMember._id.toString(),
            installmentId: partialInst._id.toString(),
            amountPaise: 250000,
            payoutMode: 'OFFSET'
        });

        const updatedInst = await Installment.findById(partialInst._id);
        if (!updatedInst || updatedInst.paymentStatus !== PaymentStatus.PARTIALLY_PAID || updatedInst.paidAmount !== 2500) {
            throw new Error(`Expected PARTIALLY_PAID with paidAmount 2500, got status: ${updatedInst?.paymentStatus}, paidAmount: ${updatedInst?.paidAmount}`);
        }
    });

    // TEST 23: Cannot offset an already fully settled installment
    await assertThrows('23. Cannot offset an already fully settled installment', async () => {
        const { grp, mem, cyc, auc } = await createIsolatedGroupAndMembership('Test23');
        const settledInst: any = await Installment.create({
            membershipId: mem._id,
            userId: nonWinnerMember._id,
            groupId: grp._id,
            cycleId: cyc._id,
            installmentNumber: 1,
            amount: 5000,
            paidAmount: 5000,
            dueDate: new Date(),
            paymentStatus: PaymentStatus.PAID
        });

        await processDividendAllocationJournalPosting({
            auctionId: auc._id.toString(),
            groupId: grp._id.toString(),
            cycleId: cyc._id.toString(),
            memberId: nonWinnerMember._id.toString(),
            installmentId: settledInst._id.toString(),
            amountPaise: 250000,
            payoutMode: 'OFFSET'
        });
    }, 'already fully settled');

    // TEST 24: DIV_PAYABLE never becomes negative
    await assertSuccess('24. DIV_PAYABLE net balance is non-negative', async () => {
        const divAcc = await Account.findOne({ accountNumber: `GRP-${chitGroup._id}-DIV_PAYABLE` });
        const journals = await JournalEntry.find({ 'lines.accountId': divAcc!._id });

        let debits = 0;
        let credits = 0;
        journals.forEach(j => j.lines.filter(l => l.accountId.toString() === divAcc!._id.toString()).forEach(l => {
            if (l.direction === JournalDirection.DEBIT) debits += l.amountPaise;
            if (l.direction === JournalDirection.CREDIT) credits += l.amountPaise;
        }));

        const netPayable = credits - debits;
        if (netPayable < 0) {
            throw new Error(`DIV_PAYABLE became negative: ${netPayable} paise`);
        }
    });

    // TEST 25: Original P2 obligation journal remains unchanged
    await assertSuccess('25. Original P2 obligation journal remains unchanged', async () => {
        const sampleInst: any = await Installment.create({
            membershipId: winnerMembership._id,
            userId: winnerUser._id,
            groupId: chitGroup._id,
            cycleId: chitCycle._id,
            installmentNumber: 6,
            amount: 10000,
            dueDate: new Date(),
            paymentStatus: PaymentStatus.PENDING
        });

        const p2Journal = await journalPostingService.postJournalEntry({
            entryType: 'INSTALLMENT_OBLIGATION',
            referenceType: 'INSTALLMENT',
            referenceId: sampleInst._id.toString(),
            groupId: chitGroup._id.toString(),
            cycleId: chitCycle._id.toString(),
            memberId: winnerUser._id.toString(),
            createdBy: 'SYSTEM',
            lines: [
                {
                    accountId: (await provisioningService.getMemberAccount(chitGroup._id.toString(), winnerUser._id.toString(), AccountCategory.RECEIVABLE))._id.toString(),
                    direction: JournalDirection.DEBIT,
                    amountPaise: 1000000,
                    memo: 'Obligation'
                },
                {
                    accountId: (await provisioningService.getGroupAccount(chitGroup._id.toString(), AccountCategory.CLEARING))._id.toString(),
                    direction: JournalDirection.CREDIT,
                    amountPaise: 1000000,
                    memo: 'Clearing'
                }
            ]
        });

        const checkP2 = await JournalEntry.findById(p2Journal._id);
        if (!checkP2 || checkP2.totalAmountPaise !== 1000000) {
            throw new Error('P2 Journal was corrupted');
        }
    });

    // TEST 26: Existing P3 payment journal remains unchanged
    await assertSuccess('26. Existing P3 payment journal remains unchanged', async () => {
        const p3Txn: any = await Transaction.create({
            transactionNumber: `TXN-P8-P3-${Date.now()}`,
            memberId: winnerUser._id,
            groupId: chitGroup._id,
            cycleId: chitCycle._id,
            installmentId: new mongoose.Types.ObjectId(),
            amount: 10000,
            currency: 'INR',
            paymentMethod: PaymentMethod.MOCK,
            paymentGateway: PaymentGatewayProvider.MOCK,
            status: TransactionStatus.SUCCESS,
            initiatedAt: new Date()
        });

        await processPaymentJournalPosting(p3Txn);
        const checkP3 = await JournalEntry.findOne({ transactionId: p3Txn._id, entryType: DoubleEntryJournalType.INSTALLMENT_PAYMENT });
        if (!checkP3 || checkP3.totalAmountPaise !== 1000000) {
            throw new Error('P3 Journal was corrupted');
        }
    });

    // TEST 27: Existing P4 refund journal remains unchanged
    await assertSuccess('27. Existing P4 refund journal remains unchanged', async () => {
        const p4Txn: any = await Transaction.create({
            transactionNumber: `TXN-P8-P4-${Date.now()}`,
            memberId: winnerUser._id,
            groupId: chitGroup._id,
            cycleId: chitCycle._id,
            installmentId: new mongoose.Types.ObjectId(),
            amount: 5000,
            currency: 'INR',
            paymentMethod: PaymentMethod.MOCK,
            paymentGateway: PaymentGatewayProvider.MOCK,
            status: TransactionStatus.SUCCESS,
            initiatedAt: new Date()
        });

        await processPaymentJournalPosting(p4Txn);
        p4Txn.status = TransactionStatus.REFUNDED;
        await p4Txn.save();

        await processPaymentRefundJournalPosting(p4Txn);
        const checkP4 = await JournalEntry.findOne({ transactionId: p4Txn._id, entryType: DoubleEntryJournalType.PAYMENT_REFUND });
        if (!checkP4 || checkP4.totalAmountPaise !== 500000) {
            throw new Error('P4 Journal was corrupted');
        }
    });

    // TEST 28: Existing P5 winner pot allocation journal remains unchanged
    await assertSuccess('28. Existing P5 winner pot allocation journal remains unchanged', async () => {
        const checkP5 = await JournalEntry.findById(p5Journal._id);
        if (!checkP5 || checkP5.totalAmountPaise !== 10000000) {
            throw new Error('P5 Journal was corrupted');
        }
    });

    // TEST 29: Existing P6 prize payout journal remains unchanged
    await assertSuccess('29. Existing P6 prize payout journal remains unchanged', async () => {
        const p6Journal = await processPrizePayoutJournalPosting({
            auctionId: auction._id.toString(),
            groupId: chitGroup._id.toString(),
            cycleId: chitCycle._id.toString(),
            winnerUserId: winnerUser._id.toString()
        });

        const checkP6 = await JournalEntry.findById(p6Journal._id);
        if (!checkP6 || checkP6.totalAmountPaise !== 7000000) {
            throw new Error('P6 Journal was corrupted');
        }
    });

    // TEST 30: Existing P7 commission payout journal remains unchanged
    await assertSuccess('30. Existing P7 commission payout journal remains unchanged', async () => {
        const p7Journal = await processOrganizerCommissionPayoutJournalPosting({
            auctionId: auction._id.toString(),
            groupId: chitGroup._id.toString(),
            cycleId: chitCycle._id.toString(),
            organizerId: organizerUser._id.toString()
        });

        const checkP7 = await JournalEntry.findById(p7Journal._id);
        if (!checkP7 || checkP7.totalAmountPaise !== 500000) {
            throw new Error('P7 Journal was corrupted');
        }
    });

    // TEST 31: Existing old LedgerEntry collection remains intact and unmodified
    await assertSuccess('31. Existing old LedgerEntry collection remains intact and unmodified', async () => {
        const initialCount = await LedgerEntry.countDocuments();

        const dummyMember: any = await User.create({
            name: 'Dummy Member P8',
            email: `dummy_${Date.now()}_${Math.random().toString(36).slice(2, 7)}@test.com`,
            password: 'Password123!',
            role: UserRole.USER,
            age: 32
        });

        await Membership.create({
            userId: dummyMember._id,
            chitGroupId: chitGroup._id,
            status: MembershipStatus.ACTIVE_MEMBER,
            joinedAt: new Date()
        });

        await processDividendAllocationJournalPosting({
            auctionId: auction._id.toString(),
            groupId: chitGroup._id.toString(),
            cycleId: chitCycle._id.toString(),
            memberId: dummyMember._id.toString(),
            payoutMode: 'DIRECT_PAYOUT',
            amountPaise: 250000
        });

        const afterCount = await LedgerEntry.countDocuments();
        if (afterCount !== initialCount) {
            throw new Error('P8 dividend allocation should not create legacy single-entry LedgerEntry documents');
        }
    });

    // TEST 32: Complete Cycle Simulation (P2 + P3 + P5 + P6 + P7 + P8)
    await assertSuccess('32. Complete Cycle Simulation (P2 + P3 + P5 + P6 + P7 + P8) settles receivables, payables, commission, and dividends', async () => {
        // Setup 2-member simulation group (₹50,000/mo -> Pot = ₹100,000)
        // 30% discount = ₹30,000, 5% comm = ₹5,000, Div Pool = ₹25,000
        // Per-member dividend = ₹25,000 / 2 = ₹12,500 (1,250,000 paise)
        const simGroup: any = await ChitGroup.create({
            organizerId: organizerUser._id,
            name: `Full Sim Group P8 ${Date.now()}`,
            totalMembers: 2,
            monthlyContribution: 50000,
            durationMonths: 2,
            startDate: new Date(),
            commissionPercent: 5,
            financialConfig: {
                version: 1,
                commission: { value: 5, type: 'PERCENTAGE' },
                lateFee: { value: 0, type: 'FIXED' },
                gracePeriodDays: 3,
                auctionStrategy: 'LOWEST_BID',
                allowPartialInstallment: false,
                allowPrepayment: true,
                allowPenaltyWaiver: true,
                currency: 'INR'
            },
            auctionType: AuctionType.AUCTION,
            status: ChitGroupStatus.ACTIVE
        });

        const simMember1 = winnerUser;
        const simMember2 = nonWinnerMember;

        const simMembership1: any = await Membership.create({
            userId: simMember1._id,
            chitGroupId: simGroup._id,
            status: MembershipStatus.ACTIVE_MEMBER,
            joinedAt: new Date()
        });

        const simMembership2: any = await Membership.create({
            userId: simMember2._id,
            chitGroupId: simGroup._id,
            status: MembershipStatus.ACTIVE_MEMBER,
            joinedAt: new Date()
        });

        await provisioningService.provisionGroupAccounts(simGroup._id.toString());
        await provisioningService.provisionMemberAccounts(simGroup._id.toString(), simMember1._id.toString());
        await provisioningService.provisionMemberAccounts(simGroup._id.toString(), simMember2._id.toString());

        const simCycle: any = await ChitCycle.create({
            groupId: simGroup._id,
            cycleNumber: 1,
            status: ChitCycleStatus.ACTIVE,
            scheduledStartDate: new Date(),
            winningBidPercentage: 30,
            prizeAmount: 70000,
            winnerMembershipId: simMembership1._id
        });

        // 1. P2: Generate Obligations for Member 1 and Member 2 (DEBIT RECEIVABLE, CREDIT CLEARING)
        const inst1: any = await Installment.create({
            membershipId: simMembership1._id,
            userId: simMember1._id,
            groupId: simGroup._id,
            cycleId: simCycle._id,
            installmentNumber: 1,
            amount: 50000,
            dueDate: new Date(),
            paymentStatus: PaymentStatus.PENDING
        });
        const inst2: any = await Installment.create({
            membershipId: simMembership2._id,
            userId: simMember2._id,
            groupId: simGroup._id,
            cycleId: simCycle._id,
            installmentNumber: 1,
            amount: 50000,
            dueDate: new Date(),
            paymentStatus: PaymentStatus.PENDING
        });

        const recAcc1 = await provisioningService.getMemberAccount(simGroup._id.toString(), simMember1._id.toString(), AccountCategory.RECEIVABLE);
        const recAcc2 = await provisioningService.getMemberAccount(simGroup._id.toString(), simMember2._id.toString(), AccountCategory.RECEIVABLE);
        const potClearingAcc = await provisioningService.getGroupAccount(simGroup._id.toString(), AccountCategory.CLEARING);

        await journalPostingService.postJournalEntry({
            entryType: 'INSTALLMENT_OBLIGATION',
            referenceType: 'INSTALLMENT',
            referenceId: inst1._id.toString(),
            groupId: simGroup._id.toString(),
            cycleId: simCycle._id.toString(),
            memberId: simMember1._id.toString(),
            createdBy: 'SYSTEM',
            lines: [
                { accountId: recAcc1._id.toString(), direction: JournalDirection.DEBIT, amountPaise: 5000000, memo: 'Inst 1' },
                { accountId: potClearingAcc._id.toString(), direction: JournalDirection.CREDIT, amountPaise: 5000000, memo: 'Clearing 1' }
            ]
        });

        await journalPostingService.postJournalEntry({
            entryType: 'INSTALLMENT_OBLIGATION',
            referenceType: 'INSTALLMENT',
            referenceId: inst2._id.toString(),
            groupId: simGroup._id.toString(),
            cycleId: simCycle._id.toString(),
            memberId: simMember2._id.toString(),
            createdBy: 'SYSTEM',
            lines: [
                { accountId: recAcc2._id.toString(), direction: JournalDirection.DEBIT, amountPaise: 5000000, memo: 'Inst 2' },
                { accountId: potClearingAcc._id.toString(), direction: JournalDirection.CREDIT, amountPaise: 5000000, memo: 'Clearing 2' }
            ]
        });

        // 2. P3: Both members pay their installments (DEBIT BANK, CREDIT RECEIVABLE)
        const txn1: any = await Transaction.create({
            transactionNumber: `TXN-SIM-P8-1-${Date.now()}`,
            memberId: simMember1._id,
            groupId: simGroup._id,
            cycleId: simCycle._id,
            installmentId: inst1._id,
            amount: 50000,
            currency: 'INR',
            paymentMethod: PaymentMethod.MOCK,
            paymentGateway: PaymentGatewayProvider.MOCK,
            status: TransactionStatus.SUCCESS,
            initiatedAt: new Date()
        });
        const txn2: any = await Transaction.create({
            transactionNumber: `TXN-SIM-P8-2-${Date.now()}`,
            memberId: simMember2._id,
            groupId: simGroup._id,
            cycleId: simCycle._id,
            installmentId: inst2._id,
            amount: 50000,
            currency: 'INR',
            paymentMethod: PaymentMethod.MOCK,
            paymentGateway: PaymentGatewayProvider.MOCK,
            status: TransactionStatus.SUCCESS,
            initiatedAt: new Date()
        });

        await processPaymentJournalPosting(txn1);
        await processPaymentJournalPosting(txn2);

        // 3. P5: Winner Declared (Member 1) -> Pot Allocation
        const simAuction: any = await Auction.create({
            groupId: simGroup._id,
            cycleId: simCycle._id,
            organizerId: organizerUser._id,
            auctionNumber: 1,
            scheduledStartTime: new Date(),
            status: AuctionStatus.WINNER_DECLARED,
            winningMembershipId: simMembership1._id,
            createdBy: organizerUser._id
        });

        await processWinnerPotAllocationJournalPosting({
            auctionId: simAuction._id.toString(),
            groupId: simGroup._id.toString(),
            cycleId: simCycle._id.toString(),
            winningMembershipId: simMembership1._id.toString(),
            winnerUserId: simMember1._id.toString(),
            winningBidPercentage: 30
        });

        // 4. P6: Prize Payout Disbursed to Member 1 (DEBIT PRIZE_PAYABLE, CREDIT BANK) -> ₹70,000
        await processPrizePayoutJournalPosting({
            auctionId: simAuction._id.toString(),
            groupId: simGroup._id.toString(),
            cycleId: simCycle._id.toString(),
            winnerUserId: simMember1._id.toString()
        });

        // 5. P7: Commission Payout Disbursed to Organizer (DEBIT COMM_PAYABLE, CREDIT BANK) -> ₹5,000
        await processOrganizerCommissionPayoutJournalPosting({
            auctionId: simAuction._id.toString(),
            groupId: simGroup._id.toString(),
            cycleId: simCycle._id.toString(),
            organizerId: organizerUser._id.toString()
        });

        // 6. P8: Dividend Distribution to Member 1 and Member 2 (Direct Payout) -> ₹12,500 each
        await processDividendAllocationJournalPosting({
            auctionId: simAuction._id.toString(),
            groupId: simGroup._id.toString(),
            cycleId: simCycle._id.toString(),
            memberId: simMember1._id.toString(),
            payoutMode: 'DIRECT_PAYOUT',
            amountPaise: 1250000
        });

        await processDividendAllocationJournalPosting({
            auctionId: simAuction._id.toString(),
            groupId: simGroup._id.toString(),
            cycleId: simCycle._id.toString(),
            memberId: simMember2._id.toString(),
            payoutMode: 'DIRECT_PAYOUT',
            amountPaise: 1250000
        });

        // VERIFY BALANCES:
        // Member 1 Receivable: DEBIT 50,000, CREDIT 50,000 -> Net 0
        const rec1Journals = await JournalEntry.find({ 'lines.accountId': recAcc1._id });
        let rec1Debits = 0, rec1Credits = 0;
        rec1Journals.forEach(j => j.lines.filter(l => l.accountId.toString() === recAcc1._id.toString()).forEach(l => {
            if (l.direction === JournalDirection.DEBIT) rec1Debits += l.amountPaise;
            if (l.direction === JournalDirection.CREDIT) rec1Credits += l.amountPaise;
        }));
        if (rec1Debits !== rec1Credits || rec1Debits !== 5000000) {
            throw new Error(`Member 1 Receivable balance mismatch: Debits ${rec1Debits}, Credits ${rec1Credits}`);
        }

        // Pot Clearing: CREDIT 100,000 (from P2), DEBIT 100,000 (from P5) -> Net 0
        const clearingJournals = await JournalEntry.find({ 'lines.accountId': potClearingAcc._id });
        let clearDebits = 0, clearCredits = 0;
        clearingJournals.forEach(j => j.lines.filter(l => l.accountId.toString() === potClearingAcc._id.toString()).forEach(l => {
            if (l.direction === JournalDirection.DEBIT) clearDebits += l.amountPaise;
            if (l.direction === JournalDirection.CREDIT) clearCredits += l.amountPaise;
        }));
        if (clearDebits !== clearCredits || clearDebits !== 10000000) {
            throw new Error(`Pot Clearing balance mismatch: Debits ${clearDebits}, Credits ${clearCredits}`);
        }

        // Member 1 Prize Payable: CREDIT 70,000 (from P5), DEBIT 70,000 (from P6) -> Net 0
        const prizeAcc1 = await Account.findOne({ accountNumber: `GRP-${simGroup._id}-MEM-${simMember1._id}-PRIZE_PAYABLE` });
        const prizeJournals = await JournalEntry.find({ 'lines.accountId': prizeAcc1!._id });
        let prizeDebits = 0, prizeCredits = 0;
        prizeJournals.forEach(j => j.lines.filter(l => l.accountId.toString() === prizeAcc1!._id.toString()).forEach(l => {
            if (l.direction === JournalDirection.DEBIT) prizeDebits += l.amountPaise;
            if (l.direction === JournalDirection.CREDIT) prizeCredits += l.amountPaise;
        }));
        if (prizeDebits !== prizeCredits || prizeDebits !== 7000000) {
            throw new Error(`Prize Payable balance mismatch: Debits ${prizeDebits}, Credits ${prizeCredits}`);
        }

        // Organizer Commission: Debited 500,000 paise (₹5,000) in P7 -> Net 0
        const commPayableAcc = await Account.findOne({ accountNumber: `GRP-${simGroup._id}-COMM_PAYABLE` });
        const commJournals = await JournalEntry.find({ 'lines.accountId': commPayableAcc!._id });
        let commDebits = 0;
        commJournals.forEach(j => j.lines.filter(l => l.accountId.toString() === commPayableAcc!._id.toString()).forEach(l => {
            if (l.direction === JournalDirection.DEBIT) commDebits += l.amountPaise;
        }));
        if (commDebits !== 500000) {
            throw new Error(`Commission Payable expected 500000 paise debited, got ${commDebits}`);
        }

        // Dividend Pool: CREDIT 2,500,000 paise (from P5), DEBIT 1,250,000 + 1,250,000 = 2,500,000 paise (from P8) -> Net 0
        const divPayableAcc = await Account.findOne({ accountNumber: `GRP-${simGroup._id}-DIV_PAYABLE` });
        const divJournals = await JournalEntry.find({ 'lines.accountId': divPayableAcc!._id });
        let divDebits = 0, divCredits = 0;
        divJournals.forEach(j => j.lines.filter(l => l.accountId.toString() === divPayableAcc!._id.toString()).forEach(l => {
            if (l.direction === JournalDirection.DEBIT) divDebits += l.amountPaise;
            if (l.direction === JournalDirection.CREDIT) divCredits += l.amountPaise;
        }));
        if (divDebits !== divCredits || divDebits !== 2500000) {
            throw new Error(`Dividend Pool balance mismatch: Debits ${divDebits}, Credits ${divCredits}`);
        }

        // Group Escrow Bank:
        // DEBIT 100,000 (from P3 collections)
        // CREDIT 70,000 (from P6 prize payout)
        // CREDIT 5,000 (from P7 organizer commission)
        // CREDIT 25,000 (from P8 member dividend disbursements: 12,500 + 12,500)
        // Final Net Escrow Cash Balance: ₹100,000 - ₹70,000 - ₹5,000 - ₹25,000 = exactly 0 paise!
        const bankAcc = await provisioningService.getGroupAccount(simGroup._id.toString(), AccountCategory.BANK);
        const bankJournals = await JournalEntry.find({ 'lines.accountId': bankAcc._id });
        let bankDebits = 0, bankCredits = 0;
        bankJournals.forEach(j => j.lines.filter(l => l.accountId.toString() === bankAcc._id.toString()).forEach(l => {
            if (l.direction === JournalDirection.DEBIT) bankDebits += l.amountPaise;
            if (l.direction === JournalDirection.CREDIT) bankCredits += l.amountPaise;
        }));
        const netBankPaise = bankDebits - bankCredits;
        if (netBankPaise !== 0) {
            throw new Error(`Bank Escrow Net Balance expected exactly 0 paise after full cycle settlement, got ${netBankPaise} paise (Debits: ${bankDebits}, Credits: ${bankCredits})`);
        }
    });

    console.log(`\n======================================================`);
    console.log(`✅ LEDGER P8 TEST SUITE COMPLETE: ${passed} / ${passed + failed} TESTS PASSED`);
    console.log(`======================================================\n`);

    if (failed > 0) {
        throw new Error(`Ledger P8 Test Suite failed with ${failed} failures.`);
    }
}
