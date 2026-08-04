import { Router } from 'express';
import { ChitGroupController } from '../controllers/ChitGroupController.js';
import { protect, restrictTo, checkKYCApproved, checkAccountActive } from '../../../middlewares/auth.js';
import { UserRole } from '../../user/models/User.js';

const router = Router();

// == PUBLIC ROUTES (OPEN PREVIEWS) ==
router.get('/details/:id', ChitGroupController.getChitGroupDetails); // Detailed view for invites

// == PROTECTED ROUTES (REGISTERED USERS & ADMINS) ==
router.use(protect);
router.use(checkAccountActive);

// DISCOVERY
router.get('/', ChitGroupController.getChitGroups); // Find FORMING groups
router.get('/my-memberships', ChitGroupController.getMyMemberships); // Personal enrollment history

// JOIN SYSTEM (KYC REQUIRED)
router.post('/:id/request-join', checkKYCApproved, ChitGroupController.requestJoin);

// == ORGANIZER & ADMIN EDITING ==
router.put('/:id', restrictTo(UserRole.ORGANIZER, UserRole.ADMIN), ChitGroupController.updateChitGroup);
router.patch('/:id', restrictTo(UserRole.ORGANIZER, UserRole.ADMIN), ChitGroupController.updateChitGroup);

// == ORGANIZER ONLY ==
router.use(restrictTo(UserRole.ORGANIZER));
router.use(checkKYCApproved); // Organizer must also be KYC approved

router.post('/', ChitGroupController.createChitGroup); // Create new group
router.get('/my-groups', ChitGroupController.getOrganizerGroups); // Organizer's dashboard
router.post('/members/approve/:membershipId', ChitGroupController.approveMember); // Approve membership
router.post('/members/reject/:membershipId', ChitGroupController.rejectMember); // Reject membership
router.post('/:id/add-member', ChitGroupController.manualAddMember); // Manually add a member by email

export default router;
