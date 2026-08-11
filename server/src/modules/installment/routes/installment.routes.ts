import { Router } from 'express';
import { InstallmentController } from '../controllers/InstallmentController.js';
import { protect, restrictTo, checkAccountActive, checkKYCApproved } from '@modules/auth/index.js';
import {
    generateInstallmentsValidation,
    updateInstallmentValidation,
    updateInstallmentStatusValidation
} from '../validators/installment.validator.js';
import { UserRole } from '@modules/user/models/User.js';

const router = Router();

// =============================================================================
// PROTECTED READ ROUTES (AUTHENTICATED USERS)
// =============================================================================
router.use(protect);
router.use(checkAccountActive);

router.get('/cycle/:cycleId', InstallmentController.getInstallmentsByCycle);
router.get('/member/:membershipId', InstallmentController.getInstallmentsByMember);
router.get('/group/:groupId', InstallmentController.getInstallmentsByGroup);
router.get('/:id', InstallmentController.getInstallmentById);

// =============================================================================
// ORGANIZER & ADMIN MANAGEMENT ROUTES
// =============================================================================
router.use(restrictTo(UserRole.ORGANIZER, UserRole.ADMIN));
router.use(checkKYCApproved);

// Bulk Generate Installments for a Cycle
router.post('/generate/:cycleId', generateInstallmentsValidation, InstallmentController.generateInstallments);

// Update Status (PAID, PARTIALLY_PAID, WAIVED, OVERDUE)
router.patch('/:id/status', updateInstallmentStatusValidation, InstallmentController.updateInstallmentStatus);

// Update General Installment Fields (amount, dueDate, lateFee, remarks)
router.patch('/:id', updateInstallmentValidation, InstallmentController.updateInstallment);

export default router;
