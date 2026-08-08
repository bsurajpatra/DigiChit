import mongoose from 'mongoose';
import { BidRepository } from '../repositories/BidRepository.js';
import Bid, { IBid, BidStatus } from '../models/Bid.js';
import { AuctionStatus } from '../../auction/models/Auction.js';
import { MembershipStatus } from '../../membership/models/Membership.js';
import { AccountStatus, UserRole } from '../../user/models/User.js';
import { AppError } from '../../../shared/errors/AppError.js';
import { logAction } from '../../../shared/logger/auditLogger.js';
import { ISubmitBidInput, IUpdateBidInput } from '../interfaces/IBid.js';

export class BidService {
    private repo: BidRepository;

    constructor() {
        this.repo = new BidRepository();
    }

    /**
     * Submits a new bid for an active auction.
     */
    public async submitBid(
        actorId: string,
        actorRole: UserRole,
        data: ISubmitBidInput,
        ipAddress?: string
    ): Promise<IBid> {
        const { auctionId, bidPercentage, bidAmount, deviceFingerprint, remarks } = data;

        // 1. Rule 6: Reject bids from suspended, frozen, or inactive users
        const user = await this.repo.findUserById(actorId);
        if (!user || (user.accountStatus !== AccountStatus.ACTIVE && user.accountStatus !== AccountStatus.REGISTERED)) {
            throw new AppError('Account is inactive, suspended, or frozen. Bidding is restricted.', 403, 'USER_INACTIVE');
        }

        // 2. Rule 2 & 3 & 5: Fetch auction and verify it is OPEN
        const auction = await this.repo.findAuctionById(auctionId);
        if (!auction) {
            throw new AppError('Auction not found.', 404, 'AUCTION_NOT_FOUND');
        }

        if (auction.status !== AuctionStatus.OPEN) {
            throw new AppError(
                `Bids can only be submitted when the auction is OPEN. Current auction status is ${auction.status}.`,
                400,
                'AUCTION_NOT_OPEN'
            );
        }

        // 3. Rule 2: Verify user has an ACTIVE membership in the group
        const membership = await this.repo.findMembershipByUserAndGroup(auction.groupId, actorId);
        if (!membership) {
            throw new AppError('You are not a member of this Chit Group.', 403, 'MEMBERSHIP_NOT_FOUND');
        }

        if (membership.status !== MembershipStatus.ACTIVE_MEMBER && membership.status !== MembershipStatus.APPROVED) {
            throw new AppError('Only active members of this Chit Group may place bids.', 403, 'MEMBERSHIP_INACTIVE');
        }

        // Check if member has already won a previous cycle in this group
        if (membership.isWinner) {
            throw new AppError('You have already won a previous auction in this Chit Group and are ineligible to bid again.', 400, 'MEMBER_ALREADY_WON');
        }

        // 4. Rule 1 & 4: Check for duplicate active bids by this member in this auction
        const existingActiveBid = await this.repo.findOneActiveBid(auction._id, membership._id);
        if (existingActiveBid) {
            throw new AppError(
                'You have already submitted an active bid for this auction. Update your existing bid instead of submitting a new one.',
                400,
                'DUPLICATE_BID'
            );
        }

        // 5. Rule 10: Validate bid bounds against auction configuration
        if (bidPercentage < auction.minimumBidPercentage || bidPercentage > auction.maximumBidPercentage) {
            throw new AppError(
                `Bid percentage (${bidPercentage}%) must be between auction minimum (${auction.minimumBidPercentage}%) and maximum (${auction.maximumBidPercentage}%).`,
                400,
                'BID_PERCENTAGE_OUT_OF_BOUNDS'
            );
        }

        // Calculate bid amount if not explicitly provided
        let calculatedBidAmount = bidAmount;
        if (calculatedBidAmount === undefined || calculatedBidAmount === null) {
            const group = await this.repo.findGroupById(auction.groupId);
            if (group) {
                const totalChitValue = group.monthlyContribution * group.totalMembers;
                calculatedBidAmount = (totalChitValue * bidPercentage) / 100;
            }
        }

        // 6. Instantiate and save the Bid
        const bid = new Bid({
            auctionId: auction._id,
            cycleId: auction.cycleId,
            groupId: auction.groupId,
            membershipId: membership._id,
            userId: user._id,
            bidPercentage,
            bidAmount: calculatedBidAmount || 0,
            status: BidStatus.VALID,
            isWinningBid: false,
            submittedAt: new Date(),
            ipAddress: ipAddress || null,
            deviceFingerprint: deviceFingerprint || null,
            remarks: remarks || null
        });

        await this.repo.save(bid);

        // 7. Audit Log
        await logAction(actorId, actorRole, 'BID_SUBMITTED', {
            newValue: {
                bidId: (bid._id as mongoose.Types.ObjectId).toString(),
                auctionId: auction._id.toString(),
                bidPercentage,
                bidAmount: bid.bidAmount
            },
            ...(ipAddress ? { ipAddress } : {})
        });

        return bid;
    }

    /**
     * Updates a submitted bid while the auction is OPEN.
     */
    public async updateBid(
        actorId: string,
        actorRole: UserRole,
        bidId: string,
        data: IUpdateBidInput
    ): Promise<IBid> {
        const bid = await this.repo.findById(bidId);
        if (!bid) {
            throw new AppError('Bid not found.', 404, 'BID_NOT_FOUND');
        }

        // Ownership check: Only the bidder or Admin can modify the bid
        if (actorRole !== UserRole.ADMIN && bid.userId.toString() !== actorId) {
            throw new AppError('Unauthorized to update this bid.', 403, 'UNAUTHORIZED');
        }

        // Rule 8 & 9: Verify auction is still OPEN
        const auction = await this.repo.findAuctionById(bid.auctionId.toString());
        if (!auction || auction.status !== AuctionStatus.OPEN) {
            throw new AppError('Bids are immutable because the auction is closed or unavailable.', 400, 'AUCTION_CLOSED');
        }

        if (bid.status === BidStatus.WITHDRAWN || bid.status === BidStatus.REJECTED) {
            throw new AppError(`Cannot update a ${bid.status} bid. Submit a new bid if eligible.`, 400, 'BID_INACTIVE');
        }

        // Validate percentage bounds
        if (data.bidPercentage < auction.minimumBidPercentage || data.bidPercentage > auction.maximumBidPercentage) {
            throw new AppError(
                `Bid percentage (${data.bidPercentage}%) must be between auction minimum (${auction.minimumBidPercentage}%) and maximum (${auction.maximumBidPercentage}%).`,
                400,
                'BID_PERCENTAGE_OUT_OF_BOUNDS'
            );
        }

        let calculatedBidAmount = data.bidAmount;
        if (calculatedBidAmount === undefined || calculatedBidAmount === null) {
            const group = await this.repo.findGroupById(auction.groupId);
            if (group) {
                const totalChitValue = group.monthlyContribution * group.totalMembers;
                calculatedBidAmount = (totalChitValue * data.bidPercentage) / 100;
            }
        }

        bid.bidPercentage = data.bidPercentage;
        if (calculatedBidAmount !== undefined) {
            bid.bidAmount = calculatedBidAmount;
        }
        if (data.remarks !== undefined) {
            bid.remarks = data.remarks;
        }
        bid.submittedAt = new Date();

        await this.repo.save(bid);

        await logAction(actorId, actorRole, 'BID_UPDATED', {
            newValue: {
                bidId,
                bidPercentage: bid.bidPercentage,
                bidAmount: bid.bidAmount
            }
        });

        return bid;
    }

    /**
     * Withdraws a bid while the auction is OPEN.
     */
    public async withdrawBid(
        actorId: string,
        actorRole: UserRole,
        bidId: string
    ): Promise<IBid> {
        const bid = await this.repo.findById(bidId);
        if (!bid) {
            throw new AppError('Bid not found.', 404, 'BID_NOT_FOUND');
        }

        if (actorRole !== UserRole.ADMIN && bid.userId.toString() !== actorId) {
            throw new AppError('Unauthorized to withdraw this bid.', 403, 'UNAUTHORIZED');
        }

        const auction = await this.repo.findAuctionById(bid.auctionId.toString());
        if (!auction || auction.status !== AuctionStatus.OPEN) {
            throw new AppError('Bids cannot be withdrawn after the auction has closed.', 400, 'AUCTION_CLOSED');
        }

        if (bid.status === BidStatus.WITHDRAWN) {
            throw new AppError('Bid is already withdrawn.', 400, 'BID_ALREADY_WITHDRAWN');
        }

        bid.status = BidStatus.WITHDRAWN;
        await this.repo.save(bid);

        await logAction(actorId, actorRole, 'BID_WITHDRAWN', {
            newValue: { bidId, status: bid.status }
        });

        return bid;
    }

    /**
     * Fetches single bid by ID with population.
     */
    public async getBidById(actorId: string, actorRole: UserRole, bidId: string): Promise<IBid> {
        const bid = await this.repo.findPopulatedById(bidId);
        if (!bid) {
            throw new AppError('Bid not found.', 404, 'BID_NOT_FOUND');
        }

        const group = await this.repo.findGroupById(bid.groupId);
        const isOrganizer = group && group.organizerId.toString() === actorId;

        if (actorRole !== UserRole.ADMIN && !isOrganizer && bid.userId.toString() !== actorId) {
            throw new AppError('Unauthorized to view this bid.', 403, 'UNAUTHORIZED');
        }

        return bid;
    }

    /**
     * Retrieves all bids for a specific auction.
     */
    public async getBidsByAuction(
        actorId: string,
        actorRole: UserRole,
        auctionId: string
    ): Promise<IBid[]> {
        const auction = await this.repo.findAuctionById(auctionId);
        if (!auction) {
            throw new AppError('Auction not found.', 404, 'AUCTION_NOT_FOUND');
        }

        const group = await this.repo.findGroupById(auction.groupId);
        const isOrganizer = group && group.organizerId.toString() === actorId;

        const filterByValidOnly = !isOrganizer && actorRole !== UserRole.ADMIN;
        return await this.repo.findBidsByAuction(auctionId, filterByValidOnly);
    }

    /**
     * Retrieves all bids submitted by a specific member.
     */
    public async getBidsByMember(
        actorId: string,
        actorRole: UserRole,
        membershipId: string
    ): Promise<IBid[]> {
        const membership = await this.repo.findMembershipById(membershipId);
        if (!membership) {
            throw new AppError('Membership not found.', 404, 'MEMBERSHIP_NOT_FOUND');
        }

        const group = await this.repo.findGroupById(membership.chitGroupId);
        const isOrganizer = group && group.organizerId.toString() === actorId;

        if (actorRole !== UserRole.ADMIN && !isOrganizer && membership.userId.toString() !== actorId) {
            throw new AppError('Unauthorized to view these member bids.', 403, 'UNAUTHORIZED');
        }

        return await this.repo.findBidsByMember(membershipId);
    }
}
