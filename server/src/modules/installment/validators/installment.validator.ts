import { body } from 'express-validator';
import { validate } from '@shared/validators/validate.middleware.js';

export { validate };

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
