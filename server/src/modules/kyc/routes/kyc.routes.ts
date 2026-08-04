import { Router } from 'express';
import { KYCController } from '../controllers/KYCController.js';
import { protect, restrictTo, checkAccountActive } from '../../../middlewares/auth.js';
import { UserRole } from '../../user/models/User.js';
import { upload } from '../../../utils/upload.js';
import { kycSubmissionValidation } from '../../../middlewares/validator.middleware.js';

const router = Router();

// User routes
router.post(
    '/submit',
    protect,
    checkAccountActive, // Ensure account is not frozen/suspended
    upload.fields([
        { name: 'document', maxCount: 1 },
        { name: 'selfie', maxCount: 1 }
    ]),
    kycSubmissionValidation,
    KYCController.submitKYC
);

// Admin routes
router.get(
    '/pending',
    protect,
    restrictTo(UserRole.ADMIN),
    KYCController.getPending
);

router.post(
    '/review',
    protect,
    restrictTo(UserRole.ADMIN),
    KYCController.adminReview
);

// Secure proxy for viewing documents (never expose public URLs)
router.get(
    '/admin/view/:userId/:field',
    protect,
    restrictTo(UserRole.ADMIN),
    KYCController.viewKYCDocument
);

export default router;
