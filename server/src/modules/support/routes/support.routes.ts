import { Router } from 'express';
import { SupportController } from '../controllers/SupportController.js';
import { protect, restrictTo } from '../../auth/middlewares/auth.js';
import { UserRole } from '../../user/models/User.js';

const router = Router();

// == PUBLIC ==
router.post('/submit', SupportController.submitQuery); // External guest contact form

// == PROTECTED ROUTES (REGISTERED USERS & ADMINS) ==
router.use(protect);

// USER SPECIFIC CHAT
router.post('/user/submit', SupportController.submitInternalQuery); // Submit internal inquiry
router.get('/user/my-queries', SupportController.getMyQueries);     // Fetch user's inquiry history
router.post('/user/respond/:queryId', SupportController.respondToQuery); // User responding back to admin

// == ADMIN ONLY ==
router.get('/queries', restrictTo(UserRole.ADMIN), SupportController.getAllQueries);
router.post('/respond/:queryId', restrictTo(UserRole.ADMIN), SupportController.respondToQuery);
router.patch('/status/:queryId', restrictTo(UserRole.ADMIN), SupportController.updateStatus);

export default router;
