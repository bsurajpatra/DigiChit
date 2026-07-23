import { Router } from 'express';
import * as auctionController from '../controllers/auction.controller.js';
import { protect, restrictTo, checkAccountActive, checkKYCApproved } from '../middlewares/auth.js';
import {
    createAuctionValidation,
    updateAuctionValidation,
    declareAuctionWinnerValidation
} from '../middlewares/validator.middleware.js';
import { UserRole } from '../models/User.js';

const router = Router();

// =============================================================================
// PROTECTED READ ROUTES (AUTHENTICATED USERS)
// =============================================================================
router.use(protect);
router.use(checkAccountActive);

router.get('/cycle/:cycleId', auctionController.getAuctionByCycle);
router.get('/group/:groupId', auctionController.getAuctionsByGroup);
router.get('/:id', auctionController.getAuctionById);

// =============================================================================
// ORGANIZER & ADMIN MANAGEMENT ROUTES
// =============================================================================
router.use(restrictTo(UserRole.ORGANIZER, UserRole.ADMIN));
router.use(checkKYCApproved);

// Create Auction
router.post('/', createAuctionValidation, auctionController.createAuction);

// Update Schedule / Metadata
router.put('/:id', updateAuctionValidation, auctionController.updateAuction);

// Lifecycle State Transition (SCHEDULED -> OPEN -> CLOSED -> CANCELLED)
router.patch('/:id/status', auctionController.updateAuctionStatus);

// Declare Winner
router.patch('/:id/declare-winner', declareAuctionWinnerValidation, auctionController.declareWinner);

// Soft Delete (Allowed only in SCHEDULED status)
router.delete('/:id', auctionController.deleteAuction);

export default router;
