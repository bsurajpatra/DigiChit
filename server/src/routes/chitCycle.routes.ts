import { Router } from 'express';
import * as chitCycleController from '../controllers/chitCycle.controller.js';
import { protect, restrictTo, checkAccountActive, checkKYCApproved } from '../middlewares/auth.js';
import { createCycleValidation, recordWinnerValidation } from '../middlewares/validator.middleware.js';
import { UserRole } from '../models/User.js';

const router = Router();

// =============================================================================
// PROTECTED ROUTES (AUTHENTICATED & ACTIVE USERS)
// =============================================================================
router.use(protect);
router.use(checkAccountActive);

// Read cycle details & queries
router.get('/group/:groupId', chitCycleController.getCyclesByGroup);
router.get('/group/:groupId/active', chitCycleController.getActiveCycle);
router.get('/:id', chitCycleController.getCycleDetails);

// =============================================================================
// ORGANIZER & ADMIN MANAGEMENT ROUTES
// =============================================================================
router.use(restrictTo(UserRole.ORGANIZER, UserRole.ADMIN));
router.use(checkKYCApproved);

// Create next sequential cycle
router.post('/', createCycleValidation, chitCycleController.createCycle);

// Lifecycle State Transitions
router.patch('/:id/start', chitCycleController.startCycle);
router.patch('/:id/complete', chitCycleController.completeCycle);
router.patch('/:id/cancel', chitCycleController.cancelCycle);

// Record Auction Winner
router.patch('/:id/winner', recordWinnerValidation, chitCycleController.recordWinner);

export default router;
