import { Router } from 'express';
import * as installmentController from '../controllers/installment.controller.js';
import { protect, restrictTo, checkAccountActive, checkKYCApproved } from '../middlewares/auth.js';
import {
    generateInstallmentsValidation,
    updateInstallmentValidation,
    updateInstallmentStatusValidation
} from '../middlewares/validator.middleware.js';
import { UserRole } from '../models/User.js';

const router = Router();

// =============================================================================
// PROTECTED READ ROUTES (AUTHENTICATED USERS)
// =============================================================================
router.use(protect);
router.use(checkAccountActive);

router.get('/cycle/:cycleId', installmentController.getInstallmentsByCycle);
router.get('/member/:membershipId', installmentController.getInstallmentsByMember);
router.get('/group/:groupId', installmentController.getInstallmentsByGroup);
router.get('/:id', installmentController.getInstallmentById);

// =============================================================================
// ORGANIZER & ADMIN MANAGEMENT ROUTES
// =============================================================================
router.use(restrictTo(UserRole.ORGANIZER, UserRole.ADMIN));
router.use(checkKYCApproved);

// Bulk Generate Installments for a Cycle
router.post('/generate/:cycleId', generateInstallmentsValidation, installmentController.generateInstallments);

// Update Status (PAID, PARTIALLY_PAID, WAIVED, OVERDUE)
router.patch('/:id/status', updateInstallmentStatusValidation, installmentController.updateInstallmentStatus);

// Update General Installment Fields (amount, dueDate, lateFee, remarks)
router.patch('/:id', updateInstallmentValidation, installmentController.updateInstallment);

export default router;
