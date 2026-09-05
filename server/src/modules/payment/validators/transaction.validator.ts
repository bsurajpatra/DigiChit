import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { PaymentMethod, PaymentGatewayProvider, TransactionStatus } from '../models/Transaction.js';

export const validateInitiatePayment = (req: Request, res: Response, next: NextFunction): void => {
    // 1. Validate Idempotency-Key Header
    const rawKey = req.header('Idempotency-Key') || req.headers['idempotency-key'];
    if (!rawKey || typeof rawKey !== 'string' || rawKey.trim().length === 0) {
        res.status(400).json({
            success: false,
            message: 'Idempotency-Key header is required for payment initiation',
            code: 'MISSING_IDEMPOTENCY_KEY'
        });
        return;
    }

    const trimmedKey = rawKey.trim();
    if (trimmedKey.length > 255) {
        res.status(400).json({
            success: false,
            message: 'Idempotency-Key exceeds maximum allowed length of 255 characters',
            code: 'INVALID_IDEMPOTENCY_KEY'
        });
        return;
    }

    const { installmentId, amount, paymentMethod, paymentGateway } = req.body;

    if (!installmentId || !mongoose.Types.ObjectId.isValid(installmentId)) {
        res.status(400).json({ success: false, message: 'Valid Installment ID is required' });
        return;
    }

    if (amount !== undefined && (typeof amount !== 'number' || amount <= 0)) {
        res.status(400).json({ success: false, message: 'Amount must be a positive number' });
        return;
    }

    if (paymentMethod && !Object.values(PaymentMethod).includes(paymentMethod)) {
        res.status(400).json({ success: false, message: `Invalid payment method. Allowed: ${Object.values(PaymentMethod).join(', ')}` });
        return;
    }

    if (paymentGateway && !Object.values(PaymentGatewayProvider).includes(paymentGateway)) {
        res.status(400).json({ success: false, message: `Invalid payment gateway. Allowed: ${Object.values(PaymentGatewayProvider).join(', ')}` });
        return;
    }

    next();
};

export const validateVerifyPayment = (req: Request, res: Response, next: NextFunction): void => {
    const { transactionId, gatewayPaymentId } = req.body;

    if (!transactionId || !mongoose.Types.ObjectId.isValid(transactionId)) {
        res.status(400).json({ success: false, message: 'Valid Transaction ID is required' });
        return;
    }

    if (!gatewayPaymentId || typeof gatewayPaymentId !== 'string') {
        res.status(400).json({ success: false, message: 'Gateway Payment ID string is required' });
        return;
    }

    next();
};

export const validateRefundPayment = (req: Request, res: Response, next: NextFunction): void => {
    const { transactionId, amount } = req.body;

    if (!transactionId || !mongoose.Types.ObjectId.isValid(transactionId)) {
        res.status(400).json({ success: false, message: 'Valid Transaction ID is required' });
        return;
    }

    if (amount !== undefined && (typeof amount !== 'number' || amount <= 0)) {
        res.status(400).json({ success: false, message: 'Refund amount must be a positive number' });
        return;
    }

    next();
};
