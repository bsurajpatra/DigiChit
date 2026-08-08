import { Router } from 'express';
import { AdminController } from '../controllers/AdminController.js';
import { protect, restrictTo } from '@modules/auth/middlewares/auth.js';
import { UserRole } from '@modules/user/models/User.js';

const router = Router();

// Protect all admin routes
router.use(protect);
router.use(restrictTo(UserRole.ADMIN));

router.post('/freeze-account', AdminController.freezeAccount);
router.post('/suspend-account', AdminController.suspendAccount);
router.post('/restore-account', AdminController.restoreAccount);
router.post('/delete-account', AdminController.softDeleteAccount);
router.post('/change-role', AdminController.changeRole);

export default router;
