import { Router } from 'express';
import { protect } from '@modules/auth/index.js';
import * as transactionController from '../controller/TransactionController.js';
import * as transactionValidator from '../validators/transaction.validator.js';

const router = Router();

router.use(protect);

// Transactions API Routes
router.post('/initiate', transactionValidator.validateInitiatePayment, transactionController.initiatePayment);
router.post('/verify', transactionValidator.validateVerifyPayment, transactionController.verifyPayment);
router.post('/refund', transactionValidator.validateRefundPayment, transactionController.refundPayment);

router.get('/member/:memberId', transactionController.getMemberTransactions);
router.get('/group/:groupId', transactionController.getGroupTransactions);
router.get('/installment/:installmentId', transactionController.getInstallmentTransactions);
router.get('/:id', transactionController.getTransactionById);
router.get('/', transactionController.getAllTransactions);

export default router;
