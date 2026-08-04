import { param, query, body, validationResult } from 'express-validator';
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

export const createLedgerEntryValidation = [
    body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
    body('entryType').isString().notEmpty().withMessage('Entry type is required'),
    validate
];

export const getLedgerByIdValidation = [
    param('id').isMongoId().withMessage('Valid Ledger Entry ID is required'),
    validate
];

export const getLedgerByMemberValidation = [
    param('memberId').isMongoId().withMessage('Valid Member ID is required'),
    validate
];

export const getLedgerByGroupValidation = [
    param('groupId').isMongoId().withMessage('Valid Group ID is required'),
    validate
];

export const searchLedgerValidation = [
    query('startDate').optional().isISO8601().withMessage('Start date must be a valid ISO date'),
    query('endDate').optional().isISO8601().withMessage('End date must be a valid ISO date'),
    validate
];
