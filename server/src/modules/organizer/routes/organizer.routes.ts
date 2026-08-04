import { Router } from 'express';
import { OrganizerController } from '../controllers/OrganizerController.js';
import { protect, restrictTo, checkOrganizerEligible } from '../../../middlewares/auth.js';
import { UserRole } from '../../../models/User.js';

const router = Router();

// Fully protect all organizer operations
router.use(protect);

// == USER ROUTES ==
// POST /api/organizer/apply
router.post('/apply', checkOrganizerEligible, OrganizerController.applyForOrganizer);

// == ADMIN ROUTES ==
// To prevent ordinary users from accessing these endpoints
router.use(restrictTo(UserRole.ADMIN));

// GET /api/organizer/applications
router.get('/applications', OrganizerController.getPendingApplications);

// POST /api/organizer/approve/:userId
router.post('/approve/:userId', OrganizerController.approveOrganizer);

// POST /api/organizer/reject/:userId
router.post('/reject/:userId', OrganizerController.rejectOrganizer);

export default router;
