import { Router } from 'express';
import { ChitCycleController } from '../controllers/ChitCycleController.js';
import { protect, restrictTo, checkAccountActive, checkKYCApproved } from '@modules/auth/index.js';
import { createCycleValidation, recordWinnerValidation } from '../validators/chitCycle.validator.js';
import { UserRole } from '@modules/user/models/User.js';

const router = Router();

// =============================================================================
// PROTECTED ROUTES (AUTHENTICATED & ACTIVE USERS)
// =============================================================================
router.use(protect);
router.use(checkAccountActive);

// Read cycle details & queries
router.get('/group/:groupId', ChitCycleController.getCyclesByGroup);
router.get('/group/:groupId/active', ChitCycleController.getActiveCycle);
router.get('/:id/payment-status', ChitCycleController.getPaymentStatus);
router.get('/:id', ChitCycleController.getCycleDetails);

// =============================================================================
// ORGANIZER & ADMIN MANAGEMENT ROUTES
// =============================================================================
router.use(restrictTo(UserRole.ORGANIZER, UserRole.ADMIN));
router.use(checkKYCApproved);

// Create next sequential cycle
router.post('/', createCycleValidation, ChitCycleController.createCycle);

// Lifecycle State Transitions
router.patch('/:id/start', ChitCycleController.startCycle);
router.patch('/:id/complete', ChitCycleController.completeCycle);
router.patch('/:id/cancel', ChitCycleController.cancelCycle);

// Payment Collection Controls
router.patch('/:id/open-collections', ChitCycleController.openCollections);
router.patch('/:id/close-collections', ChitCycleController.closeCollections);

// Record Auction Winner
router.patch('/:id/winner', recordWinnerValidation, ChitCycleController.recordWinner);

export default router;
