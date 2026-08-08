import { Router } from 'express';
import { ChitMessageController } from '../controllers/ChitMessageController.js';
import { protect, checkAccountActive } from '@modules/auth/middlewares/auth.js';

const router = Router();

router.use(protect);
router.use(checkAccountActive);

router.post('/group/:groupId', ChitMessageController.createThread);
router.get('/group/:groupId', ChitMessageController.getGroupThreads);
router.post('/thread/:threadId/reply', ChitMessageController.replyToThread);
router.patch('/thread/:threadId/status', ChitMessageController.updateStatus);

export default router;
