import { Router } from 'express';
import { MembershipController } from '../controllers/MembershipController.js';
import { protect, restrictTo, checkAccountActive, checkKYCApproved } from '@modules/auth/index.js';
import { UserRole } from '@modules/user/models/User.js';

const router = Router();

router.use(protect);
router.use(checkAccountActive);

// Member queries
router.get('/my-memberships', MembershipController.getMyMemberships);
router.get('/group/:groupId', MembershipController.getGroupMembers);

// Organizer actions
router.post('/approve/:membershipId', restrictTo(UserRole.ORGANIZER), MembershipController.approveMember);
router.post('/reject/:membershipId', restrictTo(UserRole.ORGANIZER), MembershipController.rejectMember);

export default router;
