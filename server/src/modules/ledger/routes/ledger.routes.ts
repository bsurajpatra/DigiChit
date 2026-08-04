import { Router } from 'express';
import { protect, checkAccountActive } from '../../../middlewares/auth.js';
import { LedgerController } from '../controllers/LedgerController.js';
import {
    getLedgerByIdValidation,
    getLedgerByMemberValidation,
    getLedgerByGroupValidation,
    searchLedgerValidation
} from '../validators/ledger.validator.js';

const router = Router();

// Protected Routes: Requires authentication & active user account
router.use(protect);
router.use(checkAccountActive);

// Read-only Ledger Endpoints
router.get('/member/:memberId', getLedgerByMemberValidation, LedgerController.getByMember);
router.get('/group/:groupId', getLedgerByGroupValidation, LedgerController.getByGroup);
router.get('/:id', getLedgerByIdValidation, LedgerController.getById);
router.get('/', searchLedgerValidation, LedgerController.search);

export default router;
