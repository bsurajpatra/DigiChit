import { Router } from 'express';
import * as organizerController from '../controllers/organizer.controller.js';
import { protect, restrictTo, checkOrganizerEligible } from '../middlewares/auth.js';
import { UserRole } from '../models/User.js';

const router = Router();

// Fully protect all organizer operations
router.use(protect);

// == USER ROUTES ==
// POST /api/organizer/apply
router.post('/apply', checkOrganizerEligible, organizerController.applyForOrganizer);

// == ADMIN ROUTES ==
// To prevent ordinary users from accessing these endpoints
router.use(restrictTo(UserRole.ADMIN));

// GET /api/organizer/applications
router.get('/applications', organizerController.getPendingApplications);

// POST /api/organizer/approve/:userId
router.post('/approve/:userId', organizerController.approveOrganizer);

// POST /api/organizer/reject/:userId
router.post('/reject/:userId', organizerController.rejectOrganizer);

export default router;
