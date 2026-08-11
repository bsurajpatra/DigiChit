import { Router } from 'express';
import { BidController } from '../controllers/BidController.js';
import { protect, checkAccountActive, checkKYCApproved } from '@modules/auth/index.js';
import { submitBidValidation, updateBidValidation } from '../validators/bid.validator.js';

const router = Router();

// =============================================================================
// PROTECTED ROUTES (AUTHENTICATED & ACTIVE USERS)
// =============================================================================
router.use(protect);
router.use(checkAccountActive);

// Read Bids
router.get('/auction/:auctionId', BidController.getBidsByAuction);
router.get('/member/:membershipId', BidController.getBidsByMember);
router.get('/:id', BidController.getBidById);

// Submit Bid (KYC Approved members)
router.post('/', checkKYCApproved, submitBidValidation, BidController.submitBid);

// Modify/Withdraw Bid while auction is OPEN
router.patch('/:id', checkKYCApproved, updateBidValidation, BidController.updateBid);
router.delete('/:id', checkKYCApproved, BidController.withdrawBid);

export default router;
