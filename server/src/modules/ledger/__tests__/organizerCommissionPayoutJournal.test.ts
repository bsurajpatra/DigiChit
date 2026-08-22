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
    processOrganizerCommissionPayoutJournalPosting
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

export async function runOrganizerCommissionPayoutTests() {
    console.log('\n=== RUNNING LEDGER P7 ORGANIZER COMMISSION PAYOUT TESTS ===\n');

    const provisioningService = new AccountProvisioningService();
    const journalPostingService = new JournalPostingService();
    const journalRepo = new JournalEntryRepository();

    initLedgerEventListeners();

    // 1. Setup Test Users
    const organizerUser: any = await User.create({
        name: 'Organizer User P7',
        email: `organizer_p7_${Date.now()}_${Math.random().toString(36).slice(2, 7)}@test.com`,
        password: 'Password123!',
        role: UserRole.ORGANIZER,
        age: 42
    });

    const winnerUser: any = await User.create({
        name: 'Winner Member User P7',
        email: `winner_p7_${Date.now()}_${Math.random().toString(36).slice(2, 7)}@test.com`,
        password: 'Password123!',
        role: UserRole.USER,
        age: 31
    });

    // 2. Setup Test Chit Group (₹10,000/mo, 10 members -> Total Pot ₹100,000, 5% Commission = ₹5,000)
    const chitGroup: any = await ChitGroup.create({
        organizerId: organizerUser._id,
        name: `P7 Commission Chit Group ${Date.now()}`,
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

    // Auto-provision accounts for Group & Winner
    await provisioningService.provisionGroupAccounts(chitGroup._id.toString());
    await provisioningService.provisionMemberAccounts(chitGroup._id.toString(), winnerUser._id.toString());

    // 3. Setup Membership
    const winnerMembership: any = await Membership.create({
        userId: winnerUser._id,
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
        winningBidPercentage: 30, // 30% discount = ₹30,000 discount
        winningBidAmount: 30000,
        prizeAmount: 70000, // Net Prize: ₹70,000
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

    // 7. Post P5 Winner Pot Allocation Journal first (Recognizes Pot, Net Prize ₹70,000, Commission ₹5,000, Div ₹25,000)
    const p5Journal = await processWinnerPotAllocationJournalPosting({
        auctionId: auction._id.toString(),
        groupId: chitGroup._id.toString(),
        cycleId: chitCycle._id.toString(),
        winningMembershipId: winnerMembership._id.toString(),
        winnerUserId: winnerUser._id.toString(),
        winningBidPercentage: 30
    });

    // -------------------------------------------------------------------------
    // TEST SUITE: P7 ORGANIZER COMMISSION PAYOUT ACCOUNTING
    // -------------------------------------------------------------------------

    let postedCommJournal: any = null;

    // TEST 1: Valid Organizer Commission Payout Journal Entry Creation
    await assertSuccess('1. Valid organizer commission payout creates exactly one JournalEntry', async () => {
        postedCommJournal = await processOrganizerCommissionPayoutJournalPosting({
            auctionId: auction._id.toString(),
            groupId: chitGroup._id.toString(),
            cycleId: chitCycle._id.toString(),
            organizerId: organizerUser._id.toString()
        });

        if (!postedCommJournal || !postedCommJournal._id) {
            throw new Error('Expected JournalEntry to be created for commission payout');
        }
        if (postedCommJournal.entryType !== DoubleEntryJournalType.COMMISSION_PAYOUT) {
            throw new Error(`Expected entryType COMMISSION_PAYOUT, got ${postedCommJournal.entryType}`);
        }
    });

    // TEST 2: Correct DEBIT account: GRP-{groupId}-COMM_PAYABLE
    await assertSuccess('2. Correct DEBIT account: GRP-{groupId}-COMM_PAYABLE', async () => {
        const debitLine = postedCommJournal.lines.find(
            (l: any) => l.direction === JournalDirection.DEBIT && l.accountNumber.includes('COMM_PAYABLE')
        );
        if (!debitLine) {
            throw new Error('Expected DEBIT line for COMM_PAYABLE');
        }
        if (debitLine.accountCategory !== AccountCategory.PAYABLE) {
            throw new Error(`Expected accountCategory PAYABLE, got ${debitLine.accountCategory}`);
        }
    });

    // TEST 3: Correct CREDIT account: GRP-{groupId}-BANK
    await assertSuccess('3. Correct CREDIT account: GRP-{groupId}-BANK', async () => {
        const creditLine = postedCommJournal.lines.find(
            (l: any) => l.direction === JournalDirection.CREDIT && l.accountNumber.includes('BANK')
        );
        if (!creditLine) {
            throw new Error('Expected CREDIT line for BANK escrow');
        }
        if (creditLine.accountCategory !== AccountCategory.BANK) {
            throw new Error(`Expected accountCategory BANK, got ${creditLine.accountCategory}`);
        }
    });

    // TEST 4: Correct Commission Amount in Integer Paise (₹5,000 / 500,000 paise)
    await assertSuccess('4. Correct commission amount in paise (₹5,000 / 500,000 paise)', async () => {
        if (postedCommJournal.totalAmountPaise !== 500000) {
            throw new Error(`Expected totalAmountPaise 500000, got ${postedCommJournal.totalAmountPaise}`);
        }
    });

    // TEST 5: Total DEBIT === Total CREDIT (isBalanced = true)
    await assertSuccess('5. Total DEBIT === Total CREDIT (isBalanced = true)', async () => {
        if (!postedCommJournal.isBalanced) {
            throw new Error('Expected isBalanced to be true');
        }
    });

    // TEST 6: Correct Group ID associated
    await assertSuccess('6. Correct groupId associated', async () => {
        if (postedCommJournal.groupId.toString() !== chitGroup._id.toString()) {
            throw new Error('groupId mismatch');
        }
    });

    // TEST 7: Correct Organizer Member ID associated
    await assertSuccess('7. Correct organizer memberId associated', async () => {
        if (postedCommJournal.memberId.toString() !== organizerUser._id.toString()) {
            throw new Error('organizer memberId mismatch');
        }
    });

    // TEST 8: Correct Cycle ID associated
    await assertSuccess('8. Correct cycleId associated', async () => {
        if (postedCommJournal.cycleId.toString() !== chitCycle._id.toString()) {
            throw new Error('cycleId mismatch');
        }
    });

    // TEST 9: Correct Reference Type (AUCTION) and Reference ID
    await assertSuccess('9. Correct referenceType (AUCTION) and referenceId', async () => {
        if (postedCommJournal.referenceType !== 'AUCTION') {
            throw new Error(`Expected referenceType AUCTION, got ${postedCommJournal.referenceType}`);
        }
        if (postedCommJournal.referenceId.toString() !== auction._id.toString()) {
            throw new Error('referenceId mismatch');
        }
    });

    // TEST 10: P5 Commission allocation exists before payout
    await assertSuccess('10. P5 Commission allocation exists before payout', async () => {
        const p5Check = await JournalEntry.findById(p5Journal._id);
        if (!p5Check) {
            throw new Error('P5 pot allocation journal missing');
        }
        const commLine = p5Check.lines.find((l: any) => l.accountNumber.includes('COMM'));
        if (!commLine || commLine.amountPaise !== 500000) {
            throw new Error('P5 commission recognition missing or incorrect');
        }
    });

    // TEST 11: Duplicate payout event creates NO duplicate journal (Idempotency)
    await assertSuccess('11. Duplicate payout event creates NO duplicate journal (Idempotency)', async () => {
        const dup = await processOrganizerCommissionPayoutJournalPosting({
            auctionId: auction._id.toString(),
            groupId: chitGroup._id.toString(),
            cycleId: chitCycle._id.toString(),
            organizerId: organizerUser._id.toString()
        });

        if (dup.entryNumber !== postedCommJournal.entryNumber) {
            throw new Error('Expected duplicate call to return original JournalEntry');
        }

        const totalEntries = await JournalEntry.countDocuments({
            referenceId: auction._id.toString(),
            entryType: DoubleEntryJournalType.COMMISSION_PAYOUT
        });
        if (totalEntries !== 1) {
            throw new Error(`Expected exactly 1 COMMISSION_PAYOUT journal, found ${totalEntries}`);
        }
    });

    // TEST 12: Concurrent duplicate payout events create exactly ONE journal
    await assertSuccess('12. Concurrent payout events create exactly ONE journal', async () => {
        const group2: any = await ChitGroup.create({
            organizerId: organizerUser._id,
            name: `Concurrent P7 Group ${Date.now()}`,
            totalMembers: 10,
            monthlyContribution: 10000,
            durationMonths: 10,
            startDate: new Date(),
            commissionPercent: 5,
            auctionType: AuctionType.AUCTION,
            status: ChitGroupStatus.ACTIVE
        });

        const mem2: any = await Membership.create({
            userId: winnerUser._id,
            chitGroupId: group2._id,
            status: MembershipStatus.ACTIVE_MEMBER,
            joinedAt: new Date()
        });

        const cycle2: any = await ChitCycle.create({
            groupId: group2._id,
            cycleNumber: 1,
            status: ChitCycleStatus.ACTIVE,
            scheduledStartDate: new Date(),
            winningBidPercentage: 25,
            winningBidAmount: 25000,
            prizeAmount: 75000,
            winnerMembershipId: mem2._id
        });

        const auction2: any = await Auction.create({
            groupId: group2._id,
            cycleId: cycle2._id,
            organizerId: organizerUser._id,
            auctionNumber: 1,
            scheduledStartTime: new Date(),
            status: AuctionStatus.WINNER_DECLARED,
            minimumBidPercentage: 5,
            winningMembershipId: mem2._id,
            createdBy: organizerUser._id
        });

        // Run P5 first
        await processWinnerPotAllocationJournalPosting({
            auctionId: auction2._id.toString(),
            groupId: group2._id.toString(),
            cycleId: cycle2._id.toString(),
            winningMembershipId: mem2._id.toString(),
            winnerUserId: winnerUser._id.toString(),
            winningBidPercentage: 25
        });

        const promises = Array(5).fill(null).map(() =>
            processOrganizerCommissionPayoutJournalPosting({
                auctionId: auction2._id.toString(),
                groupId: group2._id.toString(),
                cycleId: cycle2._id.toString(),
                organizerId: organizerUser._id.toString()
            })
        );

        const results = await Promise.all(promises);
        const uniqueEntryNumbers = new Set(results.map(r => r.entryNumber));
        if (uniqueEntryNumbers.size !== 1) {
            throw new Error(`Expected 1 unique entry number from concurrent executions, got ${uniqueEntryNumbers.size}`);
        }

        const count = await JournalEntry.countDocuments({
            referenceId: auction2._id.toString(),
            entryType: DoubleEntryJournalType.COMMISSION_PAYOUT
        });
        if (count !== 1) {
            throw new Error(`Expected exactly 1 JournalEntry in DB, found ${count}`);
        }
    });

    // TEST 13: Payout before P5 allocation is rejected (PREMATURE_PAYOUT)
    await assertThrows('13. Payout before P5 allocation is rejected with PREMATURE_PAYOUT', async () => {
        const group3: any = await ChitGroup.create({
            organizerId: organizerUser._id,
            name: `Premature P7 Group ${Date.now()}`,
            totalMembers: 10,
            monthlyContribution: 10000,
            durationMonths: 10,
            startDate: new Date(),
            commissionPercent: 5,
            auctionType: AuctionType.AUCTION,
            status: ChitGroupStatus.ACTIVE
        });

        const cycle3: any = await ChitCycle.create({
            groupId: group3._id,
            cycleNumber: 1,
            status: ChitCycleStatus.ACTIVE,
            scheduledStartDate: new Date()
        });

        const auction3: any = await Auction.create({
            groupId: group3._id,
            cycleId: cycle3._id,
            organizerId: organizerUser._id,
            auctionNumber: 1,
            scheduledStartTime: new Date(),
            status: AuctionStatus.WINNER_DECLARED,
            createdBy: organizerUser._id
        });

        // Try P7 before P5
        await processOrganizerCommissionPayoutJournalPosting({
            auctionId: auction3._id.toString(),
            groupId: group3._id.toString(),
            cycleId: cycle3._id.toString(),
            organizerId: organizerUser._id.toString()
        });
    }, 'before winner pot allocation');

    // TEST 14: Zero commission payout rejected
    await assertThrows('14. Zero commission payout rejected', async () => {
        const groupZero: any = await ChitGroup.create({
            organizerId: organizerUser._id,
            name: `Group Zero P7 ${Date.now()}`,
            totalMembers: 10,
            monthlyContribution: 10000,
            durationMonths: 10,
            startDate: new Date(),
            commissionPercent: 0,
            auctionType: AuctionType.AUCTION,
            status: ChitGroupStatus.ACTIVE
        });

        const memZero: any = await Membership.create({
            userId: winnerUser._id,
            chitGroupId: groupZero._id,
            status: MembershipStatus.ACTIVE_MEMBER,
            joinedAt: new Date()
        });

        const cycleZero: any = await ChitCycle.create({
            groupId: groupZero._id,
            cycleNumber: 1,
            status: ChitCycleStatus.ACTIVE,
            scheduledStartDate: new Date(),
            winnerMembershipId: memZero._id
        });

        const auctionZero: any = await Auction.create({
            groupId: groupZero._id,
            cycleId: cycleZero._id,
            organizerId: organizerUser._id,
            auctionNumber: 1,
            scheduledStartTime: new Date(),
            status: AuctionStatus.WINNER_DECLARED,
            winningMembershipId: memZero._id,
            createdBy: organizerUser._id
        });

        await processWinnerPotAllocationJournalPosting({
            auctionId: auctionZero._id.toString(),
            groupId: groupZero._id.toString(),
            cycleId: cycleZero._id.toString(),
            winningMembershipId: memZero._id.toString(),
            winnerUserId: winnerUser._id.toString(),
            winningBidPercentage: 20
        });

        await processOrganizerCommissionPayoutJournalPosting({
            auctionId: auctionZero._id.toString(),
            groupId: groupZero._id.toString(),
            cycleId: cycleZero._id.toString(),
            organizerId: organizerUser._id.toString(),
            payoutAmountPaise: 0
        });
    }, 'positive integer');

    // TEST 15: Negative commission payout rejected
    await assertThrows('15. Negative commission payout rejected', async () => {
        const groupNeg: any = await ChitGroup.create({
            organizerId: organizerUser._id,
            name: `Group Neg P7 ${Date.now()}`,
            totalMembers: 10,
            monthlyContribution: 10000,
            durationMonths: 10,
            startDate: new Date(),
            commissionPercent: 5,
            auctionType: AuctionType.AUCTION,
            status: ChitGroupStatus.ACTIVE
        });

        const memNeg: any = await Membership.create({
            userId: winnerUser._id,
            chitGroupId: groupNeg._id,
            status: MembershipStatus.ACTIVE_MEMBER,
            joinedAt: new Date()
        });

        const cycleNeg: any = await ChitCycle.create({
            groupId: groupNeg._id,
            cycleNumber: 1,
            status: ChitCycleStatus.ACTIVE,
            scheduledStartDate: new Date(),
            winnerMembershipId: memNeg._id
        });

        const auctionNeg: any = await Auction.create({
            groupId: groupNeg._id,
            cycleId: cycleNeg._id,
            organizerId: organizerUser._id,
            auctionNumber: 1,
            scheduledStartTime: new Date(),
            status: AuctionStatus.WINNER_DECLARED,
            winningMembershipId: memNeg._id,
            createdBy: organizerUser._id
        });

        await processWinnerPotAllocationJournalPosting({
            auctionId: auctionNeg._id.toString(),
            groupId: groupNeg._id.toString(),
            cycleId: cycleNeg._id.toString(),
            winningMembershipId: memNeg._id.toString(),
            winnerUserId: winnerUser._id.toString(),
            winningBidPercentage: 20
        });

        await processOrganizerCommissionPayoutJournalPosting({
            auctionId: auctionNeg._id.toString(),
            groupId: groupNeg._id.toString(),
            cycleId: cycleNeg._id.toString(),
            organizerId: organizerUser._id.toString(),
            payoutAmountPaise: -5000
        });
    }, 'positive integer');

    // TEST 16: Payout exceeding recognized commission is rejected
    await assertThrows('16. Payout exceeding recognized commission is rejected', async () => {
        const groupExceed: any = await ChitGroup.create({
            organizerId: organizerUser._id,
            name: `Group Exceed P7 ${Date.now()}`,
            totalMembers: 10,
            monthlyContribution: 10000,
            durationMonths: 10,
            startDate: new Date(),
            commissionPercent: 5, // ₹5,000 commission
            auctionType: AuctionType.AUCTION,
            status: ChitGroupStatus.ACTIVE
        });

        const memExceed: any = await Membership.create({
            userId: winnerUser._id,
            chitGroupId: groupExceed._id,
            status: MembershipStatus.ACTIVE_MEMBER,
            joinedAt: new Date()
        });

        const cycleExceed: any = await ChitCycle.create({
            groupId: groupExceed._id,
            cycleNumber: 1,
            status: ChitCycleStatus.ACTIVE,
            scheduledStartDate: new Date(),
            winnerMembershipId: memExceed._id
        });

        const auctionExceed: any = await Auction.create({
            groupId: groupExceed._id,
            cycleId: cycleExceed._id,
            organizerId: organizerUser._id,
            auctionNumber: 1,
            scheduledStartTime: new Date(),
            status: AuctionStatus.WINNER_DECLARED,
            winningMembershipId: memExceed._id,
            createdBy: organizerUser._id
        });

        await processWinnerPotAllocationJournalPosting({
            auctionId: auctionExceed._id.toString(),
            groupId: groupExceed._id.toString(),
            cycleId: cycleExceed._id.toString(),
            winningMembershipId: memExceed._id.toString(),
            winnerUserId: winnerUser._id.toString(),
            winningBidPercentage: 20
        });

        // Try paying ₹10,000 (exceeds ₹5,000 recognized commission)
        await processOrganizerCommissionPayoutJournalPosting({
            auctionId: auctionExceed._id.toString(),
            groupId: groupExceed._id.toString(),
            cycleId: cycleExceed._id.toString(),
            organizerId: organizerUser._id.toString(),
            payoutAmountPaise: 1000000
        });
    }, 'exceeds recognized commission');

    // TEST 17: Organizer mismatch for group rejected
    await assertThrows('17. Organizer mismatch for group rejected with ORGANIZER_GROUP_MISMATCH', async () => {
        const rogueUser: any = await User.create({
            name: 'Rogue Organizer',
            email: `rogue_${Date.now()}_${Math.random().toString(36).slice(2, 7)}@test.com`,
            password: 'Password123!',
            role: UserRole.ORGANIZER,
            age: 35
        });

        await processOrganizerCommissionPayoutJournalPosting({
            auctionId: auction._id.toString(),
            cycleId: chitCycle._id.toString(),
            groupId: chitGroup._id.toString(),
            organizerId: rogueUser._id.toString()
        });
    }, 'does not match group organizer');

    // TEST 18: Non-existent auction fails cleanly
    await assertThrows('18. Non-existent auction fails cleanly with AUCTION_NOT_FOUND', async () => {
        const fakeId = new mongoose.Types.ObjectId().toString();
        await processOrganizerCommissionPayoutJournalPosting({
            auctionId: fakeId,
            organizerId: organizerUser._id.toString()
        });
    }, 'not found');

    // TEST 19: Missing organizer ID fails cleanly
    await assertThrows('19. Missing organizer ID fails cleanly', async () => {
        const tempGroup: any = await ChitGroup.create({
            organizerId: organizerUser._id,
            name: `Temp Group ${Date.now()}`,
            totalMembers: 5,
            monthlyContribution: 5000,
            durationMonths: 5,
            startDate: new Date(),
            commissionPercent: 5,
            auctionType: AuctionType.AUCTION,
            status: ChitGroupStatus.ACTIVE
        });
        const tempMem: any = await Membership.create({
            userId: winnerUser._id,
            chitGroupId: tempGroup._id,
            status: MembershipStatus.ACTIVE_MEMBER,
            joinedAt: new Date()
        });
        const tempCycle: any = await ChitCycle.create({
            groupId: tempGroup._id,
            cycleNumber: 1,
            status: ChitCycleStatus.ACTIVE,
            scheduledStartDate: new Date(),
            winnerMembershipId: tempMem._id
        });
        const tempAuction: any = await Auction.create({
            groupId: tempGroup._id,
            cycleId: tempCycle._id,
            organizerId: organizerUser._id,
            auctionNumber: 1,
            scheduledStartTime: new Date(),
            status: AuctionStatus.WINNER_DECLARED,
            winningMembershipId: tempMem._id,
            createdBy: organizerUser._id
        });

        // Clear organizer from DB document
        await ChitGroup.updateOne({ _id: tempGroup._id }, { $unset: { organizerId: 1 } });

        await processOrganizerCommissionPayoutJournalPosting({
            auctionId: tempAuction._id.toString(),
            groupId: tempGroup._id.toString(),
            cycleId: tempCycle._id.toString()
        });
    }, 'Organizer ID is required');

    // TEST 20: Auto-provisioning of missing COMM_PAYABLE account
    await assertSuccess('20. Missing group commission payable account is auto-provisioned on demand', async () => {
        const groupAuto: any = await ChitGroup.create({
            organizerId: organizerUser._id,
            name: `Group Auto Comm ${Date.now()}`,
            totalMembers: 5,
            monthlyContribution: 5000,
            durationMonths: 5,
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

        const memAuto: any = await Membership.create({
            userId: winnerUser._id,
            chitGroupId: groupAuto._id,
            status: MembershipStatus.ACTIVE_MEMBER,
            joinedAt: new Date()
        });

        const cycleAuto: any = await ChitCycle.create({
            groupId: groupAuto._id,
            cycleNumber: 1,
            status: ChitCycleStatus.ACTIVE,
            scheduledStartDate: new Date(),
            winnerMembershipId: memAuto._id
        });

        const auctionAuto: any = await Auction.create({
            groupId: groupAuto._id,
            cycleId: cycleAuto._id,
            organizerId: organizerUser._id,
            auctionNumber: 1,
            scheduledStartTime: new Date(),
            status: AuctionStatus.WINNER_DECLARED,
            winningMembershipId: memAuto._id,
            createdBy: organizerUser._id
        });

        await processWinnerPotAllocationJournalPosting({
            auctionId: auctionAuto._id.toString(),
            groupId: groupAuto._id.toString(),
            cycleId: cycleAuto._id.toString(),
            winningMembershipId: memAuto._id.toString(),
            winnerUserId: winnerUser._id.toString(),
            winningBidPercentage: 10
        });

        const j = await processOrganizerCommissionPayoutJournalPosting({
            auctionId: auctionAuto._id.toString(),
            groupId: groupAuto._id.toString(),
            cycleId: cycleAuto._id.toString(),
            organizerId: organizerUser._id.toString()
        });

        if (!j || j.totalAmountPaise !== 125000) {
            throw new Error('Failed to auto-provision comm payable account and post journal');
        }
    });

    // TEST 21: Original P2 obligation journal remains unchanged
    await assertSuccess('21. Original P2 obligation journal remains unchanged', async () => {
        const sampleInst: any = await Installment.create({
            membershipId: winnerMembership._id,
            userId: winnerUser._id,
            groupId: chitGroup._id,
            cycleId: chitCycle._id,
            installmentNumber: 1,
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

    // TEST 22: Existing P3 payment journal remains unchanged
    await assertSuccess('22. Existing P3 payment journal remains unchanged', async () => {
        const p3Txn: any = await Transaction.create({
            transactionNumber: `TXN-P7-P3-${Date.now()}`,
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

    // TEST 23: Existing P4 refund journal remains unchanged
    await assertSuccess('23. Existing P4 refund journal remains unchanged', async () => {
        const p4Txn: any = await Transaction.create({
            transactionNumber: `TXN-P7-P4-${Date.now()}`,
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

    // TEST 24: Existing P5 winner pot allocation journal remains unchanged
    await assertSuccess('24. Existing P5 winner pot allocation journal remains unchanged', async () => {
        const checkP5 = await JournalEntry.findById(p5Journal._id);
        if (!checkP5 || checkP5.totalAmountPaise !== 10000000) {
            throw new Error('P5 Journal was corrupted');
        }
    });

    // TEST 25: Existing P6 prize payout journal remains unchanged
    await assertSuccess('25. Existing P6 prize payout journal remains unchanged', async () => {
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

    // TEST 26: Existing old LedgerEntry collection remains intact and unmodified
    await assertSuccess('26. Existing old LedgerEntry collection remains intact and unmodified', async () => {
        const initialCount = await LedgerEntry.countDocuments();

        const group6: any = await ChitGroup.create({
            organizerId: organizerUser._id,
            name: `Group 6 P7 ${Date.now()}`,
            totalMembers: 10,
            monthlyContribution: 10000,
            durationMonths: 10,
            startDate: new Date(),
            commissionPercent: 5,
            auctionType: AuctionType.AUCTION,
            status: ChitGroupStatus.ACTIVE
        });

        const mem6: any = await Membership.create({
            userId: winnerUser._id,
            chitGroupId: group6._id,
            status: MembershipStatus.ACTIVE_MEMBER,
            joinedAt: new Date()
        });

        const testCycle: any = await ChitCycle.create({
            groupId: group6._id,
            cycleNumber: 1,
            status: ChitCycleStatus.ACTIVE,
            scheduledStartDate: new Date(),
            winnerMembershipId: mem6._id
        });
        const testAuction: any = await Auction.create({
            groupId: group6._id,
            cycleId: testCycle._id,
            organizerId: organizerUser._id,
            auctionNumber: 1,
            scheduledStartTime: new Date(),
            status: AuctionStatus.WINNER_DECLARED,
            winningMembershipId: mem6._id,
            createdBy: organizerUser._id
        });

        await processWinnerPotAllocationJournalPosting({
            auctionId: testAuction._id.toString(),
            groupId: group6._id.toString(),
            cycleId: testCycle._id.toString(),
            winningMembershipId: mem6._id.toString(),
            winnerUserId: winnerUser._id.toString(),
            winningBidPercentage: 20
        });

        await processOrganizerCommissionPayoutJournalPosting({
            auctionId: testAuction._id.toString(),
            groupId: group6._id.toString(),
            cycleId: testCycle._id.toString(),
            organizerId: organizerUser._id.toString()
        });

        const afterCount = await LedgerEntry.countDocuments();
        if (afterCount !== initialCount) {
            throw new Error('P7 commission payout should not create legacy single-entry LedgerEntry documents');
        }
    });

    // TEST 27: No Transaction record is created by P7 commission payout
    await assertSuccess('27. No Transaction record is created by P7 commission payout', async () => {
        const initialTxnCount = await Transaction.countDocuments();

        const group7: any = await ChitGroup.create({
            organizerId: organizerUser._id,
            name: `Group 7 P7 ${Date.now()}`,
            totalMembers: 10,
            monthlyContribution: 10000,
            durationMonths: 10,
            startDate: new Date(),
            commissionPercent: 5,
            auctionType: AuctionType.AUCTION,
            status: ChitGroupStatus.ACTIVE
        });

        const mem7: any = await Membership.create({
            userId: winnerUser._id,
            chitGroupId: group7._id,
            status: MembershipStatus.ACTIVE_MEMBER,
            joinedAt: new Date()
        });

        const testCycle7: any = await ChitCycle.create({
            groupId: group7._id,
            cycleNumber: 1,
            status: ChitCycleStatus.ACTIVE,
            scheduledStartDate: new Date(),
            winnerMembershipId: mem7._id
        });
        const testAuction7: any = await Auction.create({
            groupId: group7._id,
            cycleId: testCycle7._id,
            organizerId: organizerUser._id,
            auctionNumber: 1,
            scheduledStartTime: new Date(),
            status: AuctionStatus.WINNER_DECLARED,
            winningMembershipId: mem7._id,
            createdBy: organizerUser._id
        });

        await processWinnerPotAllocationJournalPosting({
            auctionId: testAuction7._id.toString(),
            groupId: group7._id.toString(),
            cycleId: testCycle7._id.toString(),
            winningMembershipId: mem7._id.toString(),
            winnerUserId: winnerUser._id.toString(),
            winningBidPercentage: 15
        });

        await processOrganizerCommissionPayoutJournalPosting({
            auctionId: testAuction7._id.toString(),
            groupId: group7._id.toString(),
            cycleId: testCycle7._id.toString(),
            organizerId: organizerUser._id.toString()
        });

        const afterTxnCount = await Transaction.countDocuments();
        if (afterTxnCount !== initialTxnCount) {
            throw new Error('Commission payout journal must not create inbound Transaction records');
        }
    });

    // TEST 28: JournalEntry remains strictly immutable (Updates and deletions rejected)
    await assertSuccess('28. JournalEntry remains strictly immutable (Updates and deletions rejected)', async () => {
        let updateBlocked = false;
        try {
            await JournalEntry.updateOne(
                { _id: postedCommJournal._id },
                { $set: { totalAmountPaise: 9999999 } }
            );
        } catch (err: any) {
            updateBlocked = true;
        }

        let deleteBlocked = false;
        try {
            await JournalEntry.deleteOne({ _id: postedCommJournal._id });
        } catch (err: any) {
            deleteBlocked = true;
        }

        if (!updateBlocked || !deleteBlocked) {
            throw new Error(`Immutability failed! updateBlocked: ${updateBlocked}, deleteBlocked: ${deleteBlocked}`);
        }
    });

    // TEST 29: Complete Lifecycle Simulation (P2 Obligation + P3 Collection + P5 Allocation + P6 Prize Payout + P7 Commission Payout)
    await assertSuccess('29. Complete Cycle Simulation (P2 + P3 + P5 + P6 + P7) settles obligations, prize payables, and commission', async () => {
        // Setup new isolated group
        const simGroup: any = await ChitGroup.create({
            organizerId: organizerUser._id,
            name: `Full Sim Group P7 ${Date.now()}`,
            totalMembers: 2,
            monthlyContribution: 50000, // ₹50,000/member -> Pot = ₹100,000
            durationMonths: 2,
            startDate: new Date(),
            commissionPercent: 5, // 5% = ₹5,000 (500,000 paise)
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

        const member1 = winnerUser;
        const member2: any = await User.create({
            name: 'Member 2 P7 Sim',
            email: `sim_mem2_p7_${Date.now()}_${Math.random().toString(36).slice(2, 7)}@test.com`,
            password: 'Password123!',
            role: UserRole.USER,
            age: 34
        });

        const simMembership1: any = await Membership.create({
            userId: member1._id,
            chitGroupId: simGroup._id,
            status: MembershipStatus.ACTIVE_MEMBER,
            joinedAt: new Date()
        });

        const simMembership2: any = await Membership.create({
            userId: member2._id,
            chitGroupId: simGroup._id,
            status: MembershipStatus.ACTIVE_MEMBER,
            joinedAt: new Date()
        });

        await provisioningService.provisionGroupAccounts(simGroup._id.toString());
        await provisioningService.provisionMemberAccounts(simGroup._id.toString(), member1._id.toString());
        await provisioningService.provisionMemberAccounts(simGroup._id.toString(), member2._id.toString());

        const simCycle: any = await ChitCycle.create({
            groupId: simGroup._id,
            cycleNumber: 1,
            status: ChitCycleStatus.ACTIVE,
            scheduledStartDate: new Date(),
            winningBidPercentage: 30, // 30% discount = ₹30,000 discount
            prizeAmount: 70000, // Net Prize = ₹70,000
            winnerMembershipId: simMembership1._id
        });

        // 1. P2: Generate Obligations for Member 1 and Member 2 (DEBIT RECEIVABLE, CREDIT CLEARING)
        const inst1: any = await Installment.create({
            membershipId: simMembership1._id,
            userId: member1._id,
            groupId: simGroup._id,
            cycleId: simCycle._id,
            installmentNumber: 1,
            amount: 50000,
            dueDate: new Date(),
            paymentStatus: PaymentStatus.PENDING
        });
        const inst2: any = await Installment.create({
            membershipId: simMembership2._id,
            userId: member2._id,
            groupId: simGroup._id,
            cycleId: simCycle._id,
            installmentNumber: 1,
            amount: 50000,
            dueDate: new Date(),
            paymentStatus: PaymentStatus.PENDING
        });

        const recAcc1 = await provisioningService.getMemberAccount(simGroup._id.toString(), member1._id.toString(), AccountCategory.RECEIVABLE);
        const recAcc2 = await provisioningService.getMemberAccount(simGroup._id.toString(), member2._id.toString(), AccountCategory.RECEIVABLE);
        const potClearingAcc = await provisioningService.getGroupAccount(simGroup._id.toString(), AccountCategory.CLEARING);

        await journalPostingService.postJournalEntry({
            entryType: 'INSTALLMENT_OBLIGATION',
            referenceType: 'INSTALLMENT',
            referenceId: inst1._id.toString(),
            groupId: simGroup._id.toString(),
            cycleId: simCycle._id.toString(),
            memberId: member1._id.toString(),
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
            memberId: member2._id.toString(),
            createdBy: 'SYSTEM',
            lines: [
                { accountId: recAcc2._id.toString(), direction: JournalDirection.DEBIT, amountPaise: 5000000, memo: 'Inst 2' },
                { accountId: potClearingAcc._id.toString(), direction: JournalDirection.CREDIT, amountPaise: 5000000, memo: 'Clearing 2' }
            ]
        });

        // 2. P3: Both members pay their installments (DEBIT BANK, CREDIT RECEIVABLE)
        const txn1: any = await Transaction.create({
            transactionNumber: `TXN-SIM-P7-1-${Date.now()}`,
            memberId: member1._id,
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
            transactionNumber: `TXN-SIM-P7-2-${Date.now()}`,
            memberId: member2._id,
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
            winnerUserId: member1._id.toString(),
            winningBidPercentage: 30
        });

        // 4. P6: Prize Payout Disbursed to Member 1 (DEBIT PRIZE_PAYABLE, CREDIT BANK) -> ₹70,000
        await processPrizePayoutJournalPosting({
            auctionId: simAuction._id.toString(),
            groupId: simGroup._id.toString(),
            cycleId: simCycle._id.toString(),
            winnerUserId: member1._id.toString()
        });

        // 5. P7: Commission Payout Disbursed to Organizer (DEBIT COMM_PAYABLE, CREDIT BANK) -> ₹5,000
        await processOrganizerCommissionPayoutJournalPosting({
            auctionId: simAuction._id.toString(),
            groupId: simGroup._id.toString(),
            cycleId: simCycle._id.toString(),
            organizerId: organizerUser._id.toString()
        });

        // Verify Balances:
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
        const prizeAcc1 = await Account.findOne({ accountNumber: `GRP-${simGroup._id}-MEM-${member1._id}-PRIZE_PAYABLE` });
        const prizeJournals = await JournalEntry.find({ 'lines.accountId': prizeAcc1!._id });
        let prizeDebits = 0, prizeCredits = 0;
        prizeJournals.forEach(j => j.lines.filter(l => l.accountId.toString() === prizeAcc1!._id.toString()).forEach(l => {
            if (l.direction === JournalDirection.DEBIT) prizeDebits += l.amountPaise;
            if (l.direction === JournalDirection.CREDIT) prizeCredits += l.amountPaise;
        }));
        if (prizeDebits !== prizeCredits || prizeDebits !== 7000000) {
            throw new Error(`Prize Payable balance mismatch: Debits ${prizeDebits}, Credits ${prizeCredits}`);
        }

        // Organizer Commission: Debited 500,000 paise (₹5,000) in P7
        const commPayableAcc = await Account.findOne({ accountNumber: `GRP-${simGroup._id}-COMM_PAYABLE` });
        const commJournals = await JournalEntry.find({ 'lines.accountId': commPayableAcc!._id });
        let commDebits = 0;
        commJournals.forEach(j => j.lines.filter(l => l.accountId.toString() === commPayableAcc!._id.toString()).forEach(l => {
            if (l.direction === JournalDirection.DEBIT) commDebits += l.amountPaise;
        }));
        if (commDebits !== 500000) {
            throw new Error(`Commission Payable expected 500000 paise debited, got ${commDebits}`);
        }

        // Group Escrow Bank:
        // DEBIT 100,000 (from P3), CREDIT 70,000 (from P6 prize), CREDIT 5,000 (from P7 commission)
        // Net Escrow Cash Remaining = ₹100,000 - ₹70,000 - ₹5,000 = ₹25,000 (2,500,000 paise = Dividend Pool)
        const bankAcc = await provisioningService.getGroupAccount(simGroup._id.toString(), AccountCategory.BANK);
        const bankJournals = await JournalEntry.find({ 'lines.accountId': bankAcc._id });
        let bankDebits = 0, bankCredits = 0;
        bankJournals.forEach(j => j.lines.filter(l => l.accountId.toString() === bankAcc._id.toString()).forEach(l => {
            if (l.direction === JournalDirection.DEBIT) bankDebits += l.amountPaise;
            if (l.direction === JournalDirection.CREDIT) bankCredits += l.amountPaise;
        }));
        const netBankPaise = bankDebits - bankCredits;
        if (netBankPaise !== 2500000) {
            throw new Error(`Bank Escrow Net Balance expected 2500000 paise (₹25,000 Dividend Pool), got ${netBankPaise} paise (Debits: ${bankDebits}, Credits: ${bankCredits})`);
        }
    });

    console.log(`\n======================================================`);
    console.log(`✅ LEDGER P7 TEST SUITE COMPLETE: ${passed} / ${passed + failed} TESTS PASSED`);
    console.log(`======================================================\n`);

    if (failed > 0) {
        throw new Error(`Ledger P7 Test Suite failed with ${failed} failures.`);
    }
}
