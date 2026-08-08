import { Router } from 'express';
import { AuctionController } from '../controllers/AuctionController.js';
import { protect, restrictTo, checkAccountActive, checkKYCApproved } from '../../auth/middlewares/auth.js';
import {
    createAuctionValidation,
    updateAuctionValidation,
    declareAuctionWinnerValidation
} from '../validators/auction.validator.js';
import { UserRole } from '../../user/models/User.js';

const router = Router();

// =============================================================================
// PROTECTED READ ROUTES (AUTHENTICATED USERS)
// =============================================================================
router.use(protect);
router.use(checkAccountActive);

router.get('/cycle/:cycleId', AuctionController.getAuctionByCycle);
router.get('/group/:groupId', AuctionController.getAuctionsByGroup);
router.get('/:id', AuctionController.getAuctionById);

// =============================================================================
// ORGANIZER & ADMIN MANAGEMENT ROUTES
// =============================================================================
router.use(restrictTo(UserRole.ORGANIZER, UserRole.ADMIN));
router.use(checkKYCApproved);

// Create Auction
router.post('/', createAuctionValidation, AuctionController.createAuction);

// Update Schedule / Metadata
router.put('/:id', updateAuctionValidation, AuctionController.updateAuction);

// Lifecycle State Transition (SCHEDULED -> OPEN -> CLOSED -> CANCELLED)
router.patch('/:id/status', AuctionController.updateAuctionStatus);

// Declare Winner
router.patch('/:id/declare-winner', declareAuctionWinnerValidation, AuctionController.declareWinner);

// Soft Delete (Allowed only in SCHEDULED status)
router.delete('/:id', AuctionController.deleteAuction);

export default router;
