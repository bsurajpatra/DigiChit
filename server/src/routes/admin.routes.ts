import { Router } from 'express';
import * as adminController from '../controllers/admin.controller.js';
import { protect, restrictTo } from '../middlewares/auth.js';
import { UserRole } from '../models/User.js';

const router = Router();

// Protect all admin routes
router.use(protect);
router.use(restrictTo(UserRole.ADMIN));

router.post('/freeze-account', adminController.freezeAccount);
router.post('/suspend-account', adminController.suspendAccount);
router.post('/restore-account', adminController.restoreAccount);
router.post('/delete-account', adminController.softDeleteAccount);
router.post('/change-role', adminController.changeRole);

export default router;
