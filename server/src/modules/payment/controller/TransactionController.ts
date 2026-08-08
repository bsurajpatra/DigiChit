import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../auth/middlewares/auth.js';
import { TransactionService } from '../services/TransactionService.js';

const transactionService = new TransactionService();

export const initiatePayment = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const actorId = req.user!.id;
        const transaction = await transactionService.initiatePayment(actorId, req.body);

        res.status(201).json({
            success: true,
            message: 'Payment transaction initiated successfully',
            data: { transaction }
        });
    } catch (error) {
        next(error);
    }
};

export const verifyPayment = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const actorId = req.user!.id;
        const transaction = await transactionService.verifyPayment(actorId, req.body);

        res.status(200).json({
            success: true,
            message: 'Payment transaction verified successfully',
            data: { transaction }
        });
    } catch (error) {
        next(error);
    }
};

export const refundPayment = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const actorId = req.user!.id;
        const transaction = await transactionService.refundPayment(actorId, req.body);

        res.status(200).json({
            success: true,
            message: 'Payment refund processed successfully',
            data: { transaction }
        });
    } catch (error) {
        next(error);
    }
};

export const getTransactionById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;
        const transaction = await transactionService.getTransactionById(id as string);

        res.status(200).json({
            success: true,
            data: { transaction }
        });
    } catch (error) {
        next(error);
    }
};

export const getMemberTransactions = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { memberId } = req.params;
        const result = await transactionService.getMemberTransactions(memberId as string, req.query as any);

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
};

export const getGroupTransactions = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { groupId } = req.params;
        const result = await transactionService.getGroupTransactions(groupId as string, req.query as any);

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
};

export const getInstallmentTransactions = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { installmentId } = req.params;
        const transactions = await transactionService.getInstallmentTransactions(installmentId as string);

        res.status(200).json({
            success: true,
            data: { transactions }
        });
    } catch (error) {
        next(error);
    }
};

export const getAllTransactions = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const result = await transactionService.getAllTransactions(req.query as any);

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
};
