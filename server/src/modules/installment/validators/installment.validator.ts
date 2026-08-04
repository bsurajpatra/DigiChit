import { body, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../../../utils/appError.js';

export const validate = (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (errors.isEmpty()) {
        return next();
    }

    const extractedErrors: string[] = [];
    errors.array().forEach(err => extractedErrors.push(err.msg));

    return next(new AppError(extractedErrors.join(', '), 400, 'VALIDATION_ERROR'));
};

export const generateInstallmentsValidation = [
    body('dueDate').optional().isISO8601().withMessage('Due date must be a valid ISO date'),
    validate
];

export const updateInstallmentValidation = [
    body('amount').optional().isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
    body('dueDate').optional().isISO8601().withMessage('Due date must be a valid ISO date'),
    body('lateFee').optional().isFloat({ min: 0 }).withMessage('Late fee must be greater than or equal to 0'),
    body('remarks').optional().isString().trim(),
    validate
];

export const updateInstallmentStatusValidation = [
    body('paymentStatus').isIn(['PENDING', 'PAID', 'PARTIALLY_PAID', 'FAILED', 'OVERDUE', 'WAIVED']).withMessage('Valid payment status is required'),
    body('paidAmount').optional().isFloat({ min: 0 }).withMessage('Paid amount must be greater than or equal to 0'),
    body('paymentMethod').optional().isString().trim(),
    body('remarks').optional().isString().trim(),
    validate
];
