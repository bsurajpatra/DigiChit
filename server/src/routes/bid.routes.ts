import { Router } from 'express';
import * as bidController from '../controllers/bid.controller.js';
import { protect, checkAccountActive, checkKYCApproved } from '../middlewares/auth.js';
import { submitBidValidation, updateBidValidation } from '../middlewares/validator.middleware.js';

const router = Router();

// =============================================================================
// PROTECTED ROUTES (AUTHENTICATED & ACTIVE USERS)
// =============================================================================
router.use(protect);
router.use(checkAccountActive);

// Read Bids
router.get('/auction/:auctionId', bidController.getBidsByAuction);
router.get('/member/:membershipId', bidController.getBidsByMember);
router.get('/:id', bidController.getBidById);

// Submit Bid (KYC Approved members)
router.post('/', checkKYCApproved, submitBidValidation, bidController.submitBid);

// Modify/Withdraw Bid while auction is OPEN
router.patch('/:id', checkKYCApproved, updateBidValidation, bidController.updateBid);
router.delete('/:id', checkKYCApproved, bidController.withdrawBid);

export default router;
