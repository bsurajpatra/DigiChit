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
    processPrizePayoutJournalPosting
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

export async function runPrizePayoutTests() {
    console.log('\n=== RUNNING LEDGER P6 PRIZE PAYOUT ACCOUNTING TESTS ===\n');

    const provisioningService = new AccountProvisioningService();
    const journalPostingService = new JournalPostingService();
    const journalRepo = new JournalEntryRepository();

    initLedgerEventListeners();

    // 1. Setup Test Users
    const organizerUser: any = await User.create({
        name: 'Organizer User P6',
        email: `organizer_p6_${Date.now()}_${Math.random().toString(36).slice(2, 7)}@test.com`,
        password: 'Password123!',
        role: UserRole.ORGANIZER,
        age: 40
    });

    const winnerUser: any = await User.create({
        name: 'Winner Member User P6',
        email: `winner_p6_${Date.now()}_${Math.random().toString(36).slice(2, 7)}@test.com`,
        password: 'Password123!',
        role: UserRole.USER,
        age: 29
    });

    // 2. Setup Test Chit Group (₹10,000/mo, 10 members -> Total Pot ₹100,000, 5% Commission)
    const chitGroup: any = await ChitGroup.create({
        organizerId: organizerUser._id,
        name: `P6 Payout Chit Group ${Date.now()}`,
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
        joinedAt: new Date(),
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

    // 7. Post P5 Winner Pot Allocation Journal first (Recognizes PRIZE_PAYABLE ₹70,000 credit)
    const p5Journal = await processWinnerPotAllocationJournalPosting({
        auctionId: auction._id.toString(),
        groupId: chitGroup._id.toString(),
        cycleId: chitCycle._id.toString(),
        winningMembershipId: winnerMembership._id.toString(),
        winnerUserId: winnerUser._id.toString(),
        winningBidPercentage: 30
    });

    // -------------------------------------------------------------------------
    // TEST SUITE: P6 PRIZE PAYOUT DOUBLE-ENTRY ACCOUNTING
    // -------------------------------------------------------------------------

    let postedPayoutJournal: any = null;

    // TEST 1: Valid Prize Payout Journal Entry Creation
    await assertSuccess('1. Valid prize payout creates exactly one JournalEntry', async () => {
        postedPayoutJournal = await processPrizePayoutJournalPosting({
            auctionId: auction._id.toString(),
            groupId: chitGroup._id.toString(),
            cycleId: chitCycle._id.toString(),
            winningMembershipId: winnerMembership._id.toString(),
            winnerUserId: winnerUser._id.toString()
        });

        if (!postedPayoutJournal || !postedPayoutJournal._id) {
            throw new Error('Expected JournalEntry to be created for prize payout');
        }
        if (postedPayoutJournal.entryType !== DoubleEntryJournalType.PRIZE_PAYOUT) {
            throw new Error(`Expected entryType PRIZE_PAYOUT, got ${postedPayoutJournal.entryType}`);
        }
    });

    // TEST 2: Correct Prize Amount in Integer Paise (₹70,000 / 7,000,000 paise)
    await assertSuccess('2. Correct net prize amount in paise (₹70,000 / 7,000,000 paise)', async () => {
        if (postedPayoutJournal.totalAmountPaise !== 7000000) {
            throw new Error(`Expected totalAmountPaise 7000000, got ${postedPayoutJournal.totalAmountPaise}`);
        }
    });

    // TEST 3: Correct Debit: MEMBER_PRIZE_PAYABLE (7,000,000 paise)
    await assertSuccess('3. Correct debit: MEMBER_PRIZE_PAYABLE (7,000,000 paise)', async () => {
        const debitPrize = postedPayoutJournal.lines.find(
            (l: any) => l.direction === JournalDirection.DEBIT && l.accountNumber.includes('PRIZE_PAYABLE')
        );
        if (!debitPrize || debitPrize.amountPaise !== 7000000) {
            throw new Error(`Expected DEBIT PRIZE_PAYABLE 7000000 paise, got ${debitPrize?.amountPaise}`);
        }
        if (debitPrize.accountCategory !== AccountCategory.PAYABLE) {
            throw new Error('DEBIT line account category mismatch');
        }
    });

    // TEST 4: Correct Credit: GROUP_BANK_ESCROW (7,000,000 paise)
    await assertSuccess('4. Correct credit: GROUP_BANK_ESCROW (7,000,000 paise)', async () => {
        const creditBank = postedPayoutJournal.lines.find(
            (l: any) => l.direction === JournalDirection.CREDIT && l.accountNumber.includes('BANK')
        );
        if (!creditBank || creditBank.amountPaise !== 7000000) {
            throw new Error(`Expected CREDIT GROUP_BANK_ESCROW 7000000 paise, got ${creditBank?.amountPaise}`);
        }
        if (creditBank.accountCategory !== AccountCategory.BANK) {
            throw new Error('CREDIT line account category mismatch');
        }
    });

    // TEST 5: Total DEBIT === Total CREDIT (isBalanced = true)
    await assertSuccess('5. Total DEBIT === Total CREDIT (isBalanced = true)', async () => {
        if (!postedPayoutJournal.isBalanced) {
            throw new Error('Expected isBalanced to be true');
        }
    });

    // TEST 6: Correct Group ID associated
    await assertSuccess('6. Correct groupId associated', async () => {
        if (postedPayoutJournal.groupId.toString() !== chitGroup._id.toString()) {
            throw new Error('groupId mismatch');
        }
    });

    // TEST 7: Correct Cycle ID associated
    await assertSuccess('7. Correct cycleId associated', async () => {
        if (postedPayoutJournal.cycleId.toString() !== chitCycle._id.toString()) {
            throw new Error('cycleId mismatch');
        }
    });

    // TEST 8: Correct Winner Member ID associated
    await assertSuccess('8. Correct winner memberId associated', async () => {
        if (postedPayoutJournal.memberId.toString() !== winnerUser._id.toString()) {
            throw new Error('memberId mismatch');
        }
    });

    // TEST 9: Correct Reference Type (AUCTION) and Reference ID
    await assertSuccess('9. Correct referenceType (AUCTION) and referenceId', async () => {
        if (postedPayoutJournal.referenceType !== 'AUCTION') {
            throw new Error(`Expected referenceType AUCTION, got ${postedPayoutJournal.referenceType}`);
        }
        if (postedPayoutJournal.referenceId.toString() !== auction._id.toString()) {
            throw new Error('referenceId mismatch');
        }
    });

    // TEST 10: Net balance of MEMBER_PRIZE_PAYABLE after P5 Credit + P6 Debit is exactly 0
    await assertSuccess('10. P5 Allocation + P6 Payout nets MEMBER_PRIZE_PAYABLE to 0', async () => {
        const prizeAccount = await Account.findOne({ accountNumber: `GRP-${chitGroup._id}-MEM-${winnerUser._id}-PRIZE_PAYABLE` });
        if (!prizeAccount) throw new Error('Prize account not found');

        const journals = await JournalEntry.find({
            'lines.accountId': prizeAccount._id
        });

        let totalDebits = 0;
        let totalCredits = 0;

        for (const j of journals) {
            for (const line of j.lines) {
                if (line.accountId.toString() === prizeAccount._id.toString()) {
                    if (line.direction === JournalDirection.DEBIT) totalDebits += line.amountPaise;
                    if (line.direction === JournalDirection.CREDIT) totalCredits += line.amountPaise;
                }
            }
        }

        const netPayablePaise = totalCredits - totalDebits;
        if (netPayablePaise !== 0) {
            throw new Error(`Expected Net PRIZE_PAYABLE 0, got ${netPayablePaise} paise (Credits: ${totalCredits}, Debits: ${totalDebits})`);
        }
    });

    // TEST 11: Duplicate Prize Payout event returns existing journal (Idempotency)
    await assertSuccess('11. Duplicate prize payout event creates NO duplicate journal (Idempotency)', async () => {
        const dup = await processPrizePayoutJournalPosting({
            auctionId: auction._id.toString(),
            groupId: chitGroup._id.toString(),
            cycleId: chitCycle._id.toString(),
            winningMembershipId: winnerMembership._id.toString(),
            winnerUserId: winnerUser._id.toString()
        });

        if (dup.entryNumber !== postedPayoutJournal.entryNumber) {
            throw new Error('Expected duplicate call to return original JournalEntry');
        }

        const totalEntries = await JournalEntry.countDocuments({
            referenceId: auction._id.toString(),
            entryType: DoubleEntryJournalType.PRIZE_PAYOUT
        });
        if (totalEntries !== 1) {
            throw new Error(`Expected exactly 1 PRIZE_PAYOUT journal, found ${totalEntries}`);
        }
    });

    // TEST 12: Concurrent duplicate prize payout events create exactly ONE journal
    await assertSuccess('12. Concurrent prize payout events create exactly ONE journal', async () => {
        const group2: any = await ChitGroup.create({
            organizerId: organizerUser._id,
            name: `Concurrent P6 Group ${Date.now()}`,
            totalMembers: 10,
            monthlyContribution: 10000,
            durationMonths: 10,
            startDate: new Date(),
            commissionPercent: 5,
            auctionType: AuctionType.AUCTION,
            status: ChitGroupStatus.ACTIVE
        });

        const cycle2: any = await ChitCycle.create({
            groupId: group2._id,
            cycleNumber: 1,
            status: ChitCycleStatus.ACTIVE,
            scheduledStartDate: new Date(),
            winningBidPercentage: 25,
            winningBidAmount: 25000,
            prizeAmount: 75000,
            winnerMembershipId: winnerMembership._id
        });

        const auction2: any = await Auction.create({
            groupId: group2._id,
            cycleId: cycle2._id,
            organizerId: organizerUser._id,
            auctionNumber: 1,
            scheduledStartTime: new Date(),
            
            status: AuctionStatus.WINNER_DECLARED,
            minimumBidPercentage: 5,
            maximumBidPercentage: 40,
            winningMembershipId: winnerMembership._id,
            createdBy: organizerUser._id
        });

        const promises = Array(5).fill(null).map(() =>
            processPrizePayoutJournalPosting({
                auctionId: auction2._id.toString(),
                groupId: group2._id.toString(),
                cycleId: cycle2._id.toString(),
                winningMembershipId: winnerMembership._id.toString(),
                winnerUserId: winnerUser._id.toString()
            })
        );

        const results = await Promise.all(promises);
        const uniqueEntryNumbers = new Set(results.map(r => r.entryNumber));
        if (uniqueEntryNumbers.size !== 1) {
            throw new Error(`Expected 1 unique entry number from concurrent executions, got ${uniqueEntryNumbers.size}`);
        }

        const count = await JournalEntry.countDocuments({
            referenceId: auction2._id.toString(),
            entryType: DoubleEntryJournalType.PRIZE_PAYOUT
        });
        if (count !== 1) {
            throw new Error(`Expected exactly 1 JournalEntry in DB, found ${count}`);
        }
    });

    // TEST 13: Auto-provisioning of missing MEM-PRIZE_PAYABLE account
    await assertSuccess('13. Missing member prize payable account is auto-provisioned on demand', async () => {
        const newWinner: any = await User.create({
            name: 'New Winner User P6',
            email: `new_winner_${Date.now()}_${Math.random().toString(36).slice(2, 7)}@test.com`,
            password: 'Password123!',
            role: UserRole.USER,
            age: 28
        });

        const group3: any = await ChitGroup.create({
            organizerId: organizerUser._id,
            name: `Group 3 P6 ${Date.now()}`,
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
            scheduledStartDate: new Date(),
            winningBidPercentage: 20,
            winningBidAmount: 20000,
            prizeAmount: 80000
        });

        const auction3: any = await Auction.create({
            groupId: group3._id,
            cycleId: cycle3._id,
            organizerId: organizerUser._id,
            auctionNumber: 1,
            scheduledStartTime: new Date(),
            status: AuctionStatus.WINNER_DECLARED,
            minimumBidPercentage: 5,
            createdBy: organizerUser._id
        });

        const j = await processPrizePayoutJournalPosting({
            auctionId: auction3._id.toString(),
            groupId: group3._id.toString(),
            cycleId: cycle3._id.toString(),
            winnerUserId: newWinner._id.toString(),
            payoutAmountPaise: 8000000
        });

        if (!j || j.totalAmountPaise !== 8000000) {
            throw new Error('Failed to auto-provision and post prize payout journal');
        }
    });

    // TEST 14: Auto-provisioning of missing GROUP_BANK_ESCROW account
    await assertSuccess('14. Missing group bank escrow account is auto-provisioned on demand', async () => {
        const newGroup: any = await ChitGroup.create({
            organizerId: organizerUser._id,
            name: `New Group P6 ${Date.now()}`,
            totalMembers: 5,
            monthlyContribution: 5000,
            durationMonths: 5,
            startDate: new Date(),
            commissionPercent: 5,
            auctionType: AuctionType.AUCTION,
            status: ChitGroupStatus.ACTIVE
        });

        const cycle4: any = await ChitCycle.create({
            groupId: newGroup._id,
            cycleNumber: 1,
            status: ChitCycleStatus.ACTIVE,
            scheduledStartDate: new Date(),
            winningBidPercentage: 10
        });

        const auction4: any = await Auction.create({
            groupId: newGroup._id,
            cycleId: cycle4._id,
            organizerId: organizerUser._id,
            auctionNumber: 1,
            scheduledStartTime: new Date(),
            status: AuctionStatus.WINNER_DECLARED,
            createdBy: organizerUser._id
        });

        const j = await processPrizePayoutJournalPosting({
            auctionId: auction4._id.toString(),
            groupId: newGroup._id.toString(),
            cycleId: cycle4._id.toString(),
            winnerUserId: winnerUser._id.toString(),
            payoutAmountPaise: 2250000
        });

        if (!j || j.totalAmountPaise !== 2250000) {
            throw new Error('Failed to auto-provision group bank account and post journal');
        }
    });

    // TEST 15: Non-existent auction / cycle fails cleanly
    await assertThrows('15. Non-existent auction fails cleanly with AUCTION_NOT_FOUND', async () => {
        const fakeId = new mongoose.Types.ObjectId().toString();
        await processPrizePayoutJournalPosting({
            auctionId: fakeId,
            winnerUserId: winnerUser._id.toString()
        });
    }, 'not found');

    // TEST 16: Missing winner user ID fails cleanly
    await assertThrows('16. Missing winner user ID fails with WINNER_MEMBER_REQUIRED', async () => {
        const group5: any = await ChitGroup.create({
            organizerId: organizerUser._id,
            name: `Group 5 P6 ${Date.now()}`,
            totalMembers: 10,
            monthlyContribution: 10000,
            durationMonths: 10,
            startDate: new Date(),
            commissionPercent: 5,
            auctionType: AuctionType.AUCTION,
            status: ChitGroupStatus.ACTIVE
        });

        const cycle5: any = await ChitCycle.create({
            groupId: group5._id,
            cycleNumber: 1,
            status: ChitCycleStatus.ACTIVE,
            scheduledStartDate: new Date()
        });
        const auction5: any = await Auction.create({
            groupId: group5._id,
            cycleId: cycle5._id,
            organizerId: organizerUser._id,
            auctionNumber: 1,
            scheduledStartTime: new Date(),
            status: AuctionStatus.WINNER_DECLARED,
            createdBy: organizerUser._id
        });

        await processPrizePayoutJournalPosting({
            auctionId: auction5._id.toString(),
            groupId: group5._id.toString(),
            cycleId: cycle5._id.toString()
        });
    }, 'Winner member user ID is required');

    // TEST 17: Zero or negative prize amount rejected
    await assertThrows('17. Zero or negative prize amount rejected', async () => {
        const groupNeg: any = await ChitGroup.create({
            organizerId: organizerUser._id,
            name: `Group Neg P6 ${Date.now()}`,
            totalMembers: 10,
            monthlyContribution: 10000,
            durationMonths: 10,
            startDate: new Date(),
            commissionPercent: 5,
            auctionType: AuctionType.AUCTION,
            status: ChitGroupStatus.ACTIVE
        });
        const cycleNeg: any = await ChitCycle.create({
            groupId: groupNeg._id,
            cycleNumber: 1,
            status: ChitCycleStatus.ACTIVE,
            scheduledStartDate: new Date()
        });
        const auctionNeg: any = await Auction.create({
            groupId: groupNeg._id,
            cycleId: cycleNeg._id,
            organizerId: organizerUser._id,
            auctionNumber: 1,
            scheduledStartTime: new Date(),
            status: AuctionStatus.WINNER_DECLARED,
            createdBy: organizerUser._id
        });
        await processPrizePayoutJournalPosting({
            auctionId: auctionNeg._id.toString(),
            groupId: groupNeg._id.toString(),
            cycleId: cycleNeg._id.toString(),
            winnerUserId: winnerUser._id.toString(),
            payoutAmountPaise: -5000
        });
    }, 'positive integer');

    // TEST 18: Original P2 obligation journal remains unchanged
    await assertSuccess('18. Original P2 obligation journal remains unchanged', async () => {
        const sampleInst = await Installment.create({
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

    // TEST 19: Existing P3 payment journal remains unchanged
    await assertSuccess('19. Existing P3 payment journal remains unchanged', async () => {
        const p3Txn = await Transaction.create({
            transactionNumber: `TXN-P6-P3-${Date.now()}`,
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

    // TEST 20: Existing P4 refund journal remains unchanged
    await assertSuccess('20. Existing P4 refund journal remains unchanged', async () => {
        const p4Txn = await Transaction.create({
            transactionNumber: `TXN-P6-P4-${Date.now()}`,
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

    // TEST 21: Existing P5 winner pot allocation journal remains unchanged
    await assertSuccess('21. Existing P5 winner pot allocation journal remains unchanged', async () => {
        const checkP5 = await JournalEntry.findById(p5Journal._id);
        if (!checkP5 || checkP5.totalAmountPaise !== 10000000) {
            throw new Error('P5 Journal was corrupted');
        }
    });

    // TEST 22: Existing old LedgerEntry collection remains intact and unmodified
    await assertSuccess('22. Existing old LedgerEntry collection remains intact and unmodified', async () => {
        const initialCount = await LedgerEntry.countDocuments();

        const group6: any = await ChitGroup.create({
            organizerId: organizerUser._id,
            name: `Group 6 P6 ${Date.now()}`,
            totalMembers: 10,
            monthlyContribution: 10000,
            durationMonths: 10,
            startDate: new Date(),
            commissionPercent: 5,
            auctionType: AuctionType.AUCTION,
            status: ChitGroupStatus.ACTIVE
        });

        const testCycle: any = await ChitCycle.create({
            groupId: group6._id,
            cycleNumber: 1,
            status: ChitCycleStatus.ACTIVE,
            scheduledStartDate: new Date(),
            winningBidPercentage: 20
        });
        const testAuction: any = await Auction.create({
            groupId: group6._id,
            cycleId: testCycle._id,
            organizerId: organizerUser._id,
            auctionNumber: 1,
            scheduledStartTime: new Date(),
            status: AuctionStatus.WINNER_DECLARED,
            createdBy: organizerUser._id
        });

        await processPrizePayoutJournalPosting({
            auctionId: testAuction._id.toString(),
            groupId: group6._id.toString(),
            cycleId: testCycle._id.toString(),
            winnerUserId: winnerUser._id.toString(),
            payoutAmountPaise: 8000000
        });

        const afterCount = await LedgerEntry.countDocuments();
        if (afterCount !== initialCount) {
            throw new Error('P6 payout should not create legacy single-entry LedgerEntry documents');
        }
    });

    // TEST 23: No Transaction record is created by P6 prize payout
    await assertSuccess('23. No Transaction record is created by P6 prize payout', async () => {
        const initialTxnCount = await Transaction.countDocuments();

        const group7: any = await ChitGroup.create({
            organizerId: organizerUser._id,
            name: `Group 7 P6 ${Date.now()}`,
            totalMembers: 10,
            monthlyContribution: 10000,
            durationMonths: 10,
            startDate: new Date(),
            commissionPercent: 5,
            auctionType: AuctionType.AUCTION,
            status: ChitGroupStatus.ACTIVE
        });

        const testCycle7: any = await ChitCycle.create({
            groupId: group7._id,
            cycleNumber: 1,
            status: ChitCycleStatus.ACTIVE,
            scheduledStartDate: new Date(),
            winningBidPercentage: 15
        });
        const testAuction7: any = await Auction.create({
            groupId: group7._id,
            cycleId: testCycle7._id,
            organizerId: organizerUser._id,
            auctionNumber: 1,
            scheduledStartTime: new Date(),
            status: AuctionStatus.WINNER_DECLARED,
            createdBy: organizerUser._id
        });

        await processPrizePayoutJournalPosting({
            auctionId: testAuction7._id.toString(),
            groupId: group7._id.toString(),
            cycleId: testCycle7._id.toString(),
            winnerUserId: winnerUser._id.toString(),
            payoutAmountPaise: 8500000
        });

        const afterTxnCount = await Transaction.countDocuments();
        if (afterTxnCount !== initialTxnCount) {
            throw new Error('Prize payout journal must not create inbound Transaction records');
        }
    });

    // TEST 24: Statements remain unaffected
    await assertSuccess('24. Statements remain unaffected (Derives from Installments & LedgerEntry)', async () => {
        const ledgerEntries = await LedgerEntry.find({ memberId: winnerUser._id });
        if (ledgerEntries.some(l => l.entryType.includes('PRIZE'))) {
            throw new Error('Legacy statements contaminated with prize entry');
        }
    });

    // TEST 25: JournalEntry remains strictly immutable (Updates and deletions rejected)
    await assertSuccess('25. JournalEntry remains strictly immutable (Updates and deletions rejected)', async () => {
        let updateBlocked = false;
        try {
            await JournalEntry.updateOne(
                { _id: postedPayoutJournal._id },
                { $set: { totalAmountPaise: 9999999 } }
            );
        } catch (err: any) {
            updateBlocked = true;
        }

        let deleteBlocked = false;
        try {
            await JournalEntry.deleteOne({ _id: postedPayoutJournal._id });
        } catch (err: any) {
            deleteBlocked = true;
        }

        if (!updateBlocked || !deleteBlocked) {
            throw new Error(`Immutability failed! updateBlocked: ${updateBlocked}, deleteBlocked: ${deleteBlocked}`);
        }
    });

    // TEST 26: Complete Cycle Simulation (P2 Obligation + P3 Collection + P5 Allocation + P6 Payout)
    await assertSuccess('26. Complete Cycle Simulation (P2 + P3 + P5 + P6) settles member receivables and prize payables to 0', async () => {
        // Setup new isolated group
        const simGroup: any = await ChitGroup.create({
            organizerId: organizerUser._id,
            name: `Full Simulation Group ${Date.now()}`,
            totalMembers: 2,
            monthlyContribution: 50000, // ₹50,000/member -> Pot = ₹100,000
            durationMonths: 2,
            startDate: new Date(),
            commissionPercent: 5,
            auctionType: AuctionType.AUCTION,
            status: ChitGroupStatus.ACTIVE
        });

        const member1 = winnerUser;
        const member2: any = await User.create({
            name: 'Member 2 Sim',
            email: `sim_mem2_${Date.now()}_${Math.random().toString(36).slice(2, 7)}@test.com`,
            password: 'Password123!',
            role: UserRole.USER,
            age: 32
        });

        const simMembership1: any = await Membership.create({
            userId: member1._id,
            chitGroupId: simGroup._id,
            status: MembershipStatus.ACTIVE_MEMBER,
            joinedAt: new Date(),
                    });

        const simMembership2: any = await Membership.create({
            userId: member2._id,
            chitGroupId: simGroup._id,
            status: MembershipStatus.ACTIVE_MEMBER,
            joinedAt: new Date(),
                    });

        await provisioningService.provisionGroupAccounts(simGroup._id.toString());
        await provisioningService.provisionMemberAccounts(simGroup._id.toString(), member1._id.toString());
        await provisioningService.provisionMemberAccounts(simGroup._id.toString(), member2._id.toString());

        const simCycle: any = await ChitCycle.create({
            groupId: simGroup._id,
            cycleNumber: 1,
            status: ChitCycleStatus.ACTIVE,
            scheduledStartDate: new Date(),
            winningBidPercentage: 30, // 30% discount = ₹30,000
            prizeAmount: 70000, // Net Prize = ₹70,000
            winnerMembershipId: simMembership1._id
        });

        // 1. P2: Generate Obligations for Member 1 and Member 2 (DEBIT RECEIVABLE, CREDIT CLEARING)
        const inst1 = await Installment.create({
            membershipId: simMembership1._id,
            userId: member1._id,
            groupId: simGroup._id,
            cycleId: simCycle._id,
            installmentNumber: 1,
            amount: 50000,
            dueDate: new Date(),
            paymentStatus: PaymentStatus.PENDING
        });
        const inst2 = await Installment.create({
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
        const txn1 = await Transaction.create({
            transactionNumber: `TXN-SIM-1-${Date.now()}`,
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
        const txn2 = await Transaction.create({
            transactionNumber: `TXN-SIM-2-${Date.now()}`,
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

        // 4. P6: Prize Payout Disbursed to Member 1 (DEBIT PRIZE_PAYABLE, CREDIT BANK)
        await processPrizePayoutJournalPosting({
            auctionId: simAuction._id.toString(),
            groupId: simGroup._id.toString(),
            cycleId: simCycle._id.toString(),
            winnerUserId: member1._id.toString()
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

        // Group Escrow Bank: DEBIT 100,000 (from P3), CREDIT 70,000 (from P6) -> Net Balance ₹30,000 (Retained for Commission & Dividend)
        const bankAcc = await provisioningService.getGroupAccount(simGroup._id.toString(), AccountCategory.BANK);
        const bankJournals = await JournalEntry.find({ 'lines.accountId': bankAcc._id });
        let bankDebits = 0, bankCredits = 0;
        bankJournals.forEach(j => j.lines.filter(l => l.accountId.toString() === bankAcc._id.toString()).forEach(l => {
            if (l.direction === JournalDirection.DEBIT) bankDebits += l.amountPaise;
            if (l.direction === JournalDirection.CREDIT) bankCredits += l.amountPaise;
        }));
        const netBankPaise = bankDebits - bankCredits;
        if (netBankPaise !== 3000000) {
            throw new Error(`Bank Escrow Net Balance expected 3000000 paise (₹30,000), got ${netBankPaise} paise (Debits: ${bankDebits}, Credits: ${bankCredits})`);
        }
    });

    console.log(`\n======================================================`);
    console.log(`✅ LEDGER P6 TEST SUITE COMPLETE: ${passed} / ${passed + failed} TESTS PASSED`);
    console.log(`======================================================\n`);

    if (failed > 0) {
        throw new Error(`Ledger P6 Test Suite failed with ${failed} failures.`);
    }
}
