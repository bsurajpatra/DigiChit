import { Router } from 'express';
import * as chitGroupController from '../controllers/chitGroup.controller.js';
import { protect, restrictTo, checkKYCApproved, checkAccountActive } from '../middlewares/auth.js';
import { UserRole } from '../models/User.js';

const router = Router();

// == PUBLIC ROUTES (OPEN PREVIEWS) ==
router.get('/details/:id', chitGroupController.getChitGroupDetails); // Detailed view for invites

// == PROTECTED ROUTES (REGISTERED USERS & ADMINS) ==
router.use(protect);
router.use(checkAccountActive);

// DISCOVERY
router.get('/', chitGroupController.getChitGroups); // Find FORMING groups
router.get('/my-memberships', chitGroupController.getMyMemberships); // Personal enrollment history

// JOIN SYSTEM (KYC REQUIRED)
router.post('/:id/request-join', checkKYCApproved, chitGroupController.requestJoin);

// == ORGANIZER ONLY ==
router.use(restrictTo(UserRole.ORGANIZER));
router.use(checkKYCApproved); // Organizer must also be KYC approved

router.post('/', chitGroupController.createChitGroup); // Create new group
router.get('/my-groups', chitGroupController.getOrganizerGroups); // Organizer's dashboard
router.post('/members/approve/:membershipId', chitGroupController.approveMember); // Approve membership
router.post('/members/reject/:membershipId', chitGroupController.rejectMember); // Reject membership
router.post('/:id/add-member', chitGroupController.manualAddMember); // Manually add a member by email

export default router;
