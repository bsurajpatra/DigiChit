import mongoose from 'mongoose';
import { config } from '@shared/config/env.js';

import User, { UserRole, AccountStatus } from '../../user/models/User.js';
import ChitGroup, { ChitGroupStatus } from '../../chit-group/models/ChitGroup.js';
import ChitCycle, { ChitCycleStatus, PaymentCollectionStatus } from '../../chit-cycle/models/ChitCycle.js';
import Membership, { MembershipStatus } from '../../membership/models/Membership.js';
import Auction, { AuctionStatus } from '../models/Auction.js';
import Bid, { BidStatus } from '../../bid/models/Bid.js';
import Installment, { PaymentStatus } from '../../installment/models/Installment.js';
import Transaction, { TransactionStatus, PaymentMethod, PaymentGatewayProvider } from '../../payment/models/Transaction.js';
import JournalEntry from '../../ledger/models/JournalEntry.js';
import { DoubleEntryJournalType, JournalDirection } from '../../ledger/enums/account.enum.js';

import { ChitCycleService } from '../../chit-cycle/services/ChitCycleService.js';
import { AuctionService } from '../services/AuctionService.js';
import { BidService } from '../../bid/services/BidService.js';
import { AuctionRepository } from '../repositories/AuctionRepository.js';
import { TransactionService } from '../../payment/services/TransactionService.js';
import { AccountProvisioningService } from '../../ledger/services/AccountProvisioningService.js';
import { JournalPostingService } from '../../ledger/services/JournalPostingService.js';
import { AccountRepository } from '../../ledger/repositories/AccountRepository.js';

import { initLedgerEventListeners } from '../../ledger/listeners/LedgerEventListener.js';
import { initPaymentEventListeners } from '../../payment/listeners/PaymentEventListener.js';

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, testName: string, failureDetails?: any) {
    totalTests++;
    if (condition) {
        passedTests++;
        console.log(`✅ [PASS] ${testName}`);
    } else {
        console.error(`❌ [FAIL] ${testName}`, failureDetails || '');
    }
}

async function assertSuccess(testName: string, fn: () => Promise<void>) {
    totalTests++;
    try {
        await fn();
        passedTests++;
        console.log(`✅ [PASS] ${testName}`);
    } catch (err: any) {
        console.error(`❌ [FAIL] ${testName} -> ${err.message || err}`);
    }
}

async function assertRejection(testName: string, fn: () => Promise<any>, expectedErrorSnippet?: string) {
    totalTests++;
    try {
        await fn();
        console.error(`❌ [FAIL] ${testName} -> Expected function to throw, but it succeeded.`);
    } catch (err: any) {
        if (expectedErrorSnippet && !err.message.toLowerCase().includes(expectedErrorSnippet.toLowerCase())) {
            console.error(`❌ [FAIL] ${testName} -> Expected error snippet '${expectedErrorSnippet}', but got '${err.message}'`);
        } else {
            passedTests++;
            console.log(`✅ [PASS] ${testName} - Rejected cleanly (${err.message})`);
        }
    }
}

export async function runCycleIsolationTests() {
    console.log('\n======================================================');
    console.log('=== RUNNING DIGICHIT PER-CYCLE ISOLATION TEST SUITE ===');
    console.log('======================================================\n');

    const uri = config.mongoUri || process.env.MONGODB_URI || 'mongodb://localhost:27017/digichit-test';
    if (mongoose.connection.readyState === 0) {
        await mongoose.connect(uri);
    }

    initLedgerEventListeners();
    initPaymentEventListeners();

    const uniqueTag = Date.now().toString(36) + Math.random().toString(36).substring(2, 6);

    // 1. Provision Test Users
    const organizer: any = await (User as any).create({
        name: 'Organizer Iso',
        email: `org_${uniqueTag}@test.com`,
        password: 'Password123!',
        age: 30,
        phone: `98${Math.floor(10000000 + Math.random() * 90000000)}`,
        role: UserRole.ORGANIZER,
        accountStatus: AccountStatus.ACTIVE,
        kycStatus: 'APPROVED'
    });

    const memberA: any = await (User as any).create({
        name: 'Member Alpha',
        email: `memA_${uniqueTag}@test.com`,
        password: 'Password123!',
        age: 30,
        phone: `98${Math.floor(10000000 + Math.random() * 90000000)}`,
        role: UserRole.USER,
        accountStatus: AccountStatus.ACTIVE,
        kycStatus: 'APPROVED'
    });

    const memberB: any = await (User as any).create({
        name: 'Member Beta',
        email: `memB_${uniqueTag}@test.com`,
        password: 'Password123!',
        age: 30,
        phone: `98${Math.floor(10000000 + Math.random() * 90000000)}`,
        role: UserRole.USER,
        accountStatus: AccountStatus.ACTIVE,
        kycStatus: 'APPROVED'
    });

    const outsideUser: any = await (User as any).create({
        name: 'Outside User',
        email: `out_${uniqueTag}@test.com`,
        password: 'Password123!',
        age: 30,
        phone: `98${Math.floor(10000000 + Math.random() * 90000000)}`,
        role: UserRole.USER,
        accountStatus: AccountStatus.ACTIVE,
        kycStatus: 'APPROVED'
    });

    // 2. Provision Chit Group (2 Members, ₹10,000 monthly, total pot ₹20,000)
    const chitGroup: any = await ChitGroup.create({
        name: `Iso Group ${uniqueTag}`,
        organizerId: organizer._id,
        monthlyContribution: 10000,
        totalMembers: 2,
        durationMonths: 2,
        commissionPercent: 5,
        startDate: new Date(),
        status: ChitGroupStatus.ACTIVE,
        financialConfig: {
            version: 1,
            commission: { value: 5, type: 'PERCENTAGE' },
            lateFee: { value: 200, type: 'FIXED' },
            gracePeriodDays: 3,
            auctionStrategy: 'LOWEST_BID',
            currency: 'INR'
        }
    });

    // 3. Provision Memberships
    const memA_doc: any = await Membership.create({
        chitGroupId: chitGroup._id,
        userId: memberA._id,
        status: MembershipStatus.ACTIVE_MEMBER,
        isWinner: false
    });

    const memB_doc: any = await Membership.create({
        chitGroupId: chitGroup._id,
        userId: memberB._id,
        status: MembershipStatus.ACTIVE_MEMBER,
        isWinner: false
    });

    // 4. Provision Ledger Accounts for Group and Members
    const accProvService = new AccountProvisioningService();
    await accProvService.provisionGroupAccounts(chitGroup._id.toString());
    await accProvService.provisionMemberAccounts(chitGroup._id.toString(), memberA._id.toString());
    await accProvService.provisionMemberAccounts(chitGroup._id.toString(), memberB._id.toString());

    // Services
    const cycleService = new ChitCycleService();
    const auctionService = new AuctionService();
    const bidService = new BidService();
    const auctionRepo = new AuctionRepository();
    const txnService = new TransactionService();

    let cycle1: any = null;
    let cycle2: any = null;
    let auction1: any = null;
    let auction2: any = null;
    let bid1_A: any = null;
    let bid1_B: any = null;
    let bid2_B: any = null;

    // -------------------------------------------------------------------------
    // TEST 1: Create Cycle 1 & Cycle 2 in the same Chit Group
    // -------------------------------------------------------------------------
    await assertSuccess('1. Multi-cycle creation in a single Chit Group (Cycle 1 & Cycle 2)', async () => {
        cycle1 = await cycleService.createCycle(organizer._id.toString(), UserRole.ORGANIZER, {
            groupId: chitGroup._id.toString(),
            scheduledStartDate: new Date()
        });

        if (cycle1.cycleNumber !== 1) throw new Error(`Expected cycleNumber 1, got: ${cycle1.cycleNumber}`);
        if (cycle1.status !== ChitCycleStatus.UPCOMING) throw new Error(`Expected status UPCOMING, got: ${cycle1.status}`);
    });

    // -------------------------------------------------------------------------
    // TEST 2: Verify Cycle 1 Auction was Auto-Provisioned and Start Cycle 1
    // -------------------------------------------------------------------------
    await assertSuccess('2. Auto-provisioning and independent auction creation for Cycle 1', async () => {
        auction1 = await Auction.findOne({ cycleId: cycle1._id, isDeleted: false });
        if (!auction1) throw new Error('Auction 1 was not auto-provisioned for Cycle 1');
        if (auction1.auctionNumber !== 1) throw new Error(`Expected auctionNumber 1, got ${auction1.auctionNumber}`);
        if (auction1.groupId.toString() !== chitGroup._id.toString()) throw new Error('Auction groupId mismatch');
        if (auction1.cycleId.toString() !== cycle1._id.toString()) throw new Error('Auction cycleId mismatch');
        if (auction1.status !== AuctionStatus.SCHEDULED) throw new Error(`Expected status SCHEDULED, got ${auction1.status}`);

        // Start Cycle 1 -> Auto transitions Auction 1 to OPEN
        cycle1 = await cycleService.startCycle(organizer._id.toString(), UserRole.ORGANIZER, cycle1._id.toString());
        auction1 = await Auction.findById(auction1._id);
        if (auction1.status !== AuctionStatus.OPEN) throw new Error(`Expected Auction 1 to transition to OPEN, got ${auction1.status}`);
    });

    // -------------------------------------------------------------------------
    // TEST 3: Create Cycle 2 and verify separate SCHEDULED Auction 2
    // -------------------------------------------------------------------------
    await assertSuccess('3. Create Cycle 2 with independent SCHEDULED Auction 2 while Cycle 1 is ACTIVE', async () => {
        cycle2 = await cycleService.createCycle(organizer._id.toString(), UserRole.ORGANIZER, {
            groupId: chitGroup._id.toString(),
            scheduledStartDate: new Date(Date.now() + 86400000 * 30)
        });

        if (cycle2.cycleNumber !== 2) throw new Error(`Expected cycleNumber 2, got: ${cycle2.cycleNumber}`);
        auction2 = await Auction.findOne({ cycleId: cycle2._id, isDeleted: false });
        if (!auction2) throw new Error('Auction 2 was not auto-provisioned for Cycle 2');
        if (auction2.auctionNumber !== 2) throw new Error(`Expected auctionNumber 2, got ${auction2.auctionNumber}`);
        if (auction2.status !== AuctionStatus.SCHEDULED) throw new Error(`Expected Auction 2 to remain SCHEDULED, got ${auction2.status}`);
        if (auction2._id.toString() === auction1._id.toString()) throw new Error('Auction 1 and Auction 2 must have distinct IDs');
    });

    // -------------------------------------------------------------------------
    // TEST 4: Submit Bids to Cycle 1 (Open) and verify accepted
    // -------------------------------------------------------------------------
    await assertSuccess('4. Submit bids to Cycle 1 (OPEN auction)', async () => {
        bid1_A = await bidService.submitBid(memberA._id.toString(), UserRole.USER, {
            auctionId: auction1._id.toString(),
            bidPercentage: 15,
            remarks: 'Member A Cycle 1 bid'
        });

        bid1_B = await bidService.submitBid(memberB._id.toString(), UserRole.USER, {
            auctionId: auction1._id.toString(),
            bidPercentage: 20,
            remarks: 'Member B Cycle 1 bid'
        });

        if (bid1_A.cycleId.toString() !== cycle1._id.toString()) throw new Error('bid1_A not bound to cycle 1');
        if (bid1_B.cycleId.toString() !== cycle1._id.toString()) throw new Error('bid1_B not bound to cycle 1');
        if (bid1_A.auctionId.toString() !== auction1._id.toString()) throw new Error('bid1_A not bound to auction 1');
    });

    // -------------------------------------------------------------------------
    // TEST 5: Verify Cycle 2 (SCHEDULED) strictly REJECTS bids
    // -------------------------------------------------------------------------
    await assertRejection('5. Cycle 2 (SCHEDULED auction) strictly rejects bid submission', async () => {
        await bidService.submitBid(memberA._id.toString(), UserRole.USER, {
            auctionId: auction2._id.toString(),
            bidPercentage: 15
        });
    }, 'Bids can only be submitted when the auction is OPEN');

    // -------------------------------------------------------------------------
    // TEST 6: Query bids for Cycle 1 -> returns ONLY Cycle 1 bids
    // -------------------------------------------------------------------------
    await assertSuccess('6. Query getBidsByAuction(cycle1) returns ONLY Cycle 1 bids', async () => {
        const c1Bids = await bidService.getBidsByAuction(organizer._id.toString(), UserRole.ORGANIZER, auction1._id.toString());
        if (c1Bids.length !== 2) throw new Error(`Expected 2 bids in Cycle 1, got ${c1Bids.length}`);
        c1Bids.forEach(b => {
            if (b.auctionId.toString() !== auction1._id.toString()) throw new Error('Non-Cycle 1 bid leaked into Cycle 1 query');
        });
    });

    // -------------------------------------------------------------------------
    // TEST 7: Query bids for Cycle 2 -> returns ZERO bids (strict isolation)
    // -------------------------------------------------------------------------
    await assertSuccess('7. Query getBidsByAuction(cycle2) returns ZERO bids (No cross-cycle leakage)', async () => {
        const c2Bids = await bidService.getBidsByAuction(organizer._id.toString(), UserRole.ORGANIZER, auction2._id.toString());
        if (c2Bids.length !== 0) throw new Error(`Expected 0 bids in Cycle 2, got ${c2Bids.length}`);
    });

    // -------------------------------------------------------------------------
    // TEST 8: Close Cycle 1 Auction -> Verify Cycle 2 remains unaffected
    // -------------------------------------------------------------------------
    await assertSuccess('8. Close Cycle 1 auction does not affect Cycle 2 auction status', async () => {
        await auctionService.updateAuctionStatus(organizer._id.toString(), UserRole.ORGANIZER, auction1._id.toString(), AuctionStatus.CLOSED);
        const refetchedA1 = await Auction.findById(auction1._id);
        const refetchedA2 = await Auction.findById(auction2._id);

        if (refetchedA1?.status !== AuctionStatus.CLOSED) throw new Error(`Expected Auction 1 CLOSED, got ${refetchedA1?.status}`);
        if (refetchedA2?.status !== AuctionStatus.SCHEDULED) throw new Error(`Expected Auction 2 SCHEDULED, got ${refetchedA2?.status}`);
    });

    // -------------------------------------------------------------------------
    // TEST 9: Declare Cycle 1 Winner (Member A) -> Verify Cycle 1 winner recorded
    // -------------------------------------------------------------------------
    await assertSuccess('9. Declare Winner for Cycle 1 (Member A wins Cycle 1)', async () => {
        await auctionService.declareWinner(organizer._id.toString(), UserRole.ORGANIZER, auction1._id.toString(), {
            winningMembershipId: memA_doc._id.toString(),
            winningBidId: bid1_A._id.toString(),
            remarks: 'Member A won Cycle 1'
        });

        const refetchedA1 = await Auction.findById(auction1._id);
        const refetchedC1 = await ChitCycle.findById(cycle1._id);
        const refetchedMemA = await Membership.findById(memA_doc._id);

        if (refetchedA1?.status !== AuctionStatus.WINNER_DECLARED) throw new Error('Auction 1 not WINNER_DECLARED');
        if (refetchedC1?.winnerMembershipId?.toString() !== memA_doc._id.toString()) throw new Error('Cycle 1 winner mismatch');
        if (!refetchedMemA?.isWinner) throw new Error('Member A isWinner flag was not set to true');
    });

    // -------------------------------------------------------------------------
    // TEST 10: Verify Cycle 1 winner pot allocation ledger entry strictly references Cycle 1
    // -------------------------------------------------------------------------
    await assertSuccess('10. P5 Ledger accounting for Cycle 1 strictly references Cycle 1 ID', async () => {
        let p5Journal: any = null;
        for (let i = 0; i < 20; i++) {
            p5Journal = await JournalEntry.findOne({
                referenceId: auction1._id.toString(),
                entryType: DoubleEntryJournalType.WINNER_POT_ALLOCATION
            });
            if (p5Journal) break;
            await new Promise(r => setTimeout(r, 50));
        }

        if (!p5Journal) throw new Error('P5 Journal Entry for Auction 1 not found');
        if (p5Journal.cycleId.toString() !== cycle1._id.toString()) throw new Error(`P5 Journal cycleId mismatch: expected ${cycle1._id}, got ${p5Journal.cycleId}`);
        if (p5Journal.groupId.toString() !== chitGroup._id.toString()) throw new Error('P5 Journal groupId mismatch');
        if (p5Journal.memberId.toString() !== memberA._id.toString()) throw new Error('P5 Journal winner memberId mismatch');
    });

    // -------------------------------------------------------------------------
    // TEST 11: Complete Cycle 1 and Open Collections for Cycle 1
    // -------------------------------------------------------------------------
    await assertSuccess('11. Complete Cycle 1 and Open Collections for Cycle 1 only', async () => {
        await cycleService.openCollections(organizer._id.toString(), UserRole.ORGANIZER, cycle1._id.toString());
        await cycleService.completeCycle(organizer._id.toString(), UserRole.ORGANIZER, cycle1._id.toString());

        const refetchedC1 = await ChitCycle.findById(cycle1._id);
        const refetchedC2 = await ChitCycle.findById(cycle2._id);

        if (refetchedC1?.status !== ChitCycleStatus.COMPLETED) throw new Error('Cycle 1 not COMPLETED');
        if (refetchedC1?.paymentCollection.status !== PaymentCollectionStatus.OPEN) throw new Error('Cycle 1 collections not OPEN');
        if (refetchedC2?.paymentCollection.status !== PaymentCollectionStatus.NOT_STARTED) throw new Error('Cycle 2 collections must remain NOT_STARTED');
    });

    // -------------------------------------------------------------------------
    // TEST 12: Verify Cycle 1 collections status does NOT enable payments on Cycle 2
    // -------------------------------------------------------------------------
    await assertRejection('12. Cycle 1 OPEN collections strictly block payments on Cycle 2 (NOT_STARTED)', async () => {
        const instC2 = await Installment.create({
            groupId: chitGroup._id,
            cycleId: cycle2._id,
            membershipId: memB_doc._id,
            userId: memberB._id,
            installmentNumber: 2,
            amount: 10000,
            paymentStatus: PaymentStatus.PENDING,
            dueDate: new Date(Date.now() + 86400000 * 30)
        });

        await txnService.initiatePayment(memberB._id.toString(), {
            installmentId: instC2._id.toString(),
            paymentMethod: PaymentMethod.UPI,
            paymentGateway: PaymentGatewayProvider.MOCK
        });
    }, 'Collections have not been opened');

    // -------------------------------------------------------------------------
    // TEST 13: Start Cycle 2 -> Auto-opens Auction 2
    // -------------------------------------------------------------------------
    await assertSuccess('13. Start Cycle 2 and auto-transition Auction 2 to OPEN', async () => {
        cycle2 = await cycleService.startCycle(organizer._id.toString(), UserRole.ORGANIZER, cycle2._id.toString());
        auction2 = await Auction.findById(auction2._id);

        if (cycle2.status !== ChitCycleStatus.ACTIVE) throw new Error(`Expected Cycle 2 ACTIVE, got ${cycle2.status}`);
        if (auction2.status !== AuctionStatus.OPEN) throw new Error(`Expected Auction 2 OPEN, got ${auction2.status}`);
    });

    // -------------------------------------------------------------------------
    // TEST 14: Member A (Cycle 1 winner) is REJECTED from bidding in Cycle 2
    // -------------------------------------------------------------------------
    await assertRejection('14. Cycle 1 winner (Member A) is ineligible to bid in Cycle 2 (MEMBER_ALREADY_WON)', async () => {
        await bidService.submitBid(memberA._id.toString(), UserRole.USER, {
            auctionId: auction2._id.toString(),
            bidPercentage: 18
        });
    }, 'already won a previous auction');

    // -------------------------------------------------------------------------
    // TEST 15: Member B (eligible non-winner) successfully submits bid in Cycle 2
    // -------------------------------------------------------------------------
    await assertSuccess('15. Eligible non-winning Member B places valid bid in Cycle 2', async () => {
        bid2_B = await bidService.submitBid(memberB._id.toString(), UserRole.USER, {
            auctionId: auction2._id.toString(),
            bidPercentage: 12,
            remarks: 'Member B Cycle 2 bid'
        });

        if (bid2_B.cycleId.toString() !== cycle2._id.toString()) throw new Error('bid2_B not bound to cycle 2');
        if (bid2_B.auctionId.toString() !== auction2._id.toString()) throw new Error('bid2_B not bound to auction 2');
    });

    // -------------------------------------------------------------------------
    // TEST 16: Verify Cycle 2 bids contain ONLY Member B (no Cycle 1 bids)
    // -------------------------------------------------------------------------
    await assertSuccess('16. Query getBidsByAuction(cycle2) contains ONLY Cycle 2 bids', async () => {
        const c2Bids = await bidService.getBidsByAuction(organizer._id.toString(), UserRole.ORGANIZER, auction2._id.toString());
        if (c2Bids.length !== 1) throw new Error(`Expected exactly 1 bid in Cycle 2, got ${c2Bids.length}`);
        const firstBid: any = c2Bids[0];
        if (!firstBid || firstBid.userId?._id?.toString() !== memberB._id.toString()) throw new Error('Cycle 2 bidder mismatch');
        if (firstBid.bidPercentage !== 12) throw new Error('Cycle 2 bid percentage mismatch');
    });

    // -------------------------------------------------------------------------
    // TEST 17: Non-member/outside user cannot bid in Cycle 2
    // -------------------------------------------------------------------------
    await assertRejection('17. Non-member user cannot submit bids in Cycle 2', async () => {
        await bidService.submitBid(outsideUser._id.toString(), UserRole.USER, {
            auctionId: auction2._id.toString(),
            bidPercentage: 10
        });
    }, 'You are not a member of this Chit Group');

    // -------------------------------------------------------------------------
    // TEST 18: Duplicate active bid in same cycle by same member is rejected
    // -------------------------------------------------------------------------
    await assertRejection('18. Duplicate active bid by same member in same cycle is rejected', async () => {
        await bidService.submitBid(memberB._id.toString(), UserRole.USER, {
            auctionId: auction2._id.toString(),
            bidPercentage: 14
        });
    }, 'already submitted an active bid for this auction');

    // -------------------------------------------------------------------------
    // TEST 19: Self-Healing: AuctionRepository.findByGroup backfills missing cycle auctions
    // -------------------------------------------------------------------------
    await assertSuccess('19. Self-Healing: AuctionRepository.findByGroup backfills missing cycle auctions', async () => {
        const orphanCycle = await ChitCycle.create({
            groupId: chitGroup._id,
            cycleNumber: 3,
            status: ChitCycleStatus.UPCOMING,
            scheduledStartDate: new Date(Date.now() + 86400000 * 60)
        });

        const allAuctions = await auctionRepo.findByGroup(chitGroup._id.toString());
        const orphanAuction: any = allAuctions.find(a => a.cycleId && (typeof a.cycleId === 'object' ? (a.cycleId as any)._id?.toString() : (a.cycleId as any)?.toString()) === orphanCycle._id.toString());

        if (!orphanAuction) throw new Error('Self-healing findByGroup failed to auto-provision auction for Cycle 3');
        if (orphanAuction.auctionNumber !== 3) throw new Error(`Expected auctionNumber 3, got ${orphanAuction.auctionNumber}`);
        if (orphanAuction.status !== AuctionStatus.SCHEDULED) throw new Error(`Expected status SCHEDULED, got ${orphanAuction.status}`);
    });

    console.log('\n======================================================');
    console.log(`✅ PER-CYCLE ISOLATION TEST SUITE RESULTS: ${passedTests} / ${totalTests} PASSED`);
    console.log('======================================================\n');

    if (passedTests !== totalTests) {
        throw new Error(`${totalTests - passedTests} test(s) failed in Per-Cycle Isolation Suite`);
    }

    return { total: totalTests, passed: passedTests };
}

if (process.argv[1]?.includes('cycleIsolation.test.ts')) {
    runCycleIsolationTests()
        .then(() => {
            console.log('Cycle Isolation tests completed successfully.');
            process.exit(0);
        })
        .catch(err => {
            console.error('Test Suite Failed:', err);
            process.exit(1);
        });
}
