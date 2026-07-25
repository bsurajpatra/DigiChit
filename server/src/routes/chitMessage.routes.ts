import { Router } from 'express';
import * as chitMessageController from '../controllers/chitMessage.controller.js';
import { protect, checkAccountActive } from '../middlewares/auth.js';

const router = Router();

router.use(protect);
router.use(checkAccountActive);

router.post('/group/:groupId', chitMessageController.createThread);
router.get('/group/:groupId', chitMessageController.getGroupThreads);
router.post('/thread/:threadId/reply', chitMessageController.replyToThread);
router.patch('/thread/:threadId/status', chitMessageController.updateStatus);

export default router;
