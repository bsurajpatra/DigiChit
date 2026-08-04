import { Router } from 'express';
import { CollectionController } from '../controllers/CollectionController.js';
import { protect, restrictTo, checkAccountActive, checkKYCApproved } from '../../../middlewares/auth.js';
import { UserRole } from '../../../models/User.js';

const router = Router({ mergeParams: true });

// =============================================================================
// PROTECTED ROUTES (AUTHENTICATED & ACTIVE USERS)
// =============================================================================
router.use(protect);
router.use(checkAccountActive);

// Read collection status, financial summary analytics, and member installment breakdown
router.get('/:cycleId/collection-status', CollectionController.getCollectionStatus);
router.get('/:cycleId/collection-summary', CollectionController.getCollectionSummary);
router.get('/:cycleId/pending-members', CollectionController.getPendingMembers);

// Also support routes mounted at /chit-cycles/:cycleId/...
router.get('/collection-status', CollectionController.getCollectionStatus);
router.get('/collection-summary', CollectionController.getCollectionSummary);
router.get('/pending-members', CollectionController.getPendingMembers);

// =============================================================================
// ORGANIZER & ADMIN MANAGEMENT ROUTES
// =============================================================================
router.use(restrictTo(UserRole.ORGANIZER, UserRole.ADMIN));
router.use(checkKYCApproved);

router.patch('/:cycleId/open-collections', CollectionController.openCollections);
router.patch('/:cycleId/close-collections', CollectionController.closeCollections);
router.patch('/open-collections', CollectionController.openCollections);
router.patch('/close-collections', CollectionController.closeCollections);

export default router;
