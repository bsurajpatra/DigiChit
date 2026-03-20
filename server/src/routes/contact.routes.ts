import { Router } from 'express';
import * as contactController from '../controllers/contact.controller.js';
import { protect, restrictTo } from '../middlewares/auth.js';
import { UserRole } from '../models/User.js';

const router = Router();

// == PUBLIC ==
router.post('/submit', contactController.submitQuery); // External guest contact form

// == PROTECTED ROUTES (REGISTERED USERS & ADMINS) ==
router.use(protect);

// USER SPECIFIC CHAT
router.post('/user/submit', contactController.submitInternalQuery); // Submit internal inquiry
router.get('/user/my-queries', contactController.getMyQueries);     // Fetch user's inquiry history
router.post('/user/respond/:queryId', contactController.respondToQuery); // User responding back to admin

// == ADMIN ONLY ==
router.get('/queries', restrictTo(UserRole.ADMIN), contactController.getAllQueries);
router.post('/respond/:queryId', restrictTo(UserRole.ADMIN), contactController.respondToQuery);
router.patch('/status/:queryId', restrictTo(UserRole.ADMIN), contactController.updateStatus);

export default router;
