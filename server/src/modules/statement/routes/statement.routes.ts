import { Router } from 'express';
import { protect, checkAccountActive } from '../../../middlewares/auth.js';
import { StatementController } from '../controllers/StatementController.js';

const router = Router();

// Protected Routes: Requires active authenticated user
router.use(protect);
router.use(checkAccountActive);

// Statement Export (CSV / PDF)
router.get('/export', StatementController.exportStatement);

// Financial Statements Read-Only APIs
router.get('/member/:memberId', StatementController.getMemberStatement);
router.get('/organizer/:organizerId', StatementController.getOrganizerStatement);
router.get('/group/:groupId', StatementController.getGroupStatement);

export default router;
