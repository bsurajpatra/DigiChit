import { param, query, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../../../utils/appError.js';
import { LedgerEntryType, LedgerDirection } from '../enums/ledger.enum.js';

export const validateLedger = (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (errors.isEmpty()) {
        return next();
    }
    const extractedErrors = errors.array().map((err) => err.msg);
    return next(new AppError(extractedErrors.join(', '), 400, 'VALIDATION_ERROR'));
};

export const getLedgerByIdValidation = [
    param('id').isMongoId().withMessage('Invalid Ledger Entry ID'),
    validateLedger
];

export const getLedgerByMemberValidation = [
    param('memberId').isMongoId().withMessage('Invalid Member ID'),
    query('entryType').optional().isIn(Object.values(LedgerEntryType)).withMessage('Invalid entry type'),
    query('direction').optional().isIn(Object.values(LedgerDirection)).withMessage('Invalid ledger direction'),
    query('startDate').optional().isISO8601().withMessage('Invalid start date format'),
    query('endDate').optional().isISO8601().withMessage('Invalid end date format'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    validateLedger
];

export const getLedgerByGroupValidation = [
    param('groupId').isMongoId().withMessage('Invalid Group ID'),
    query('cycleId').optional().isMongoId().withMessage('Invalid Cycle ID'),
    query('entryType').optional().isIn(Object.values(LedgerEntryType)).withMessage('Invalid entry type'),
    query('direction').optional().isIn(Object.values(LedgerDirection)).withMessage('Invalid ledger direction'),
    query('startDate').optional().isISO8601().withMessage('Invalid start date format'),
    query('endDate').optional().isISO8601().withMessage('Invalid end date format'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    validateLedger
];

export const searchLedgerValidation = [
    query('memberId').optional().isMongoId().withMessage('Invalid Member ID'),
    query('groupId').optional().isMongoId().withMessage('Invalid Group ID'),
    query('cycleId').optional().isMongoId().withMessage('Invalid Cycle ID'),
    query('installmentId').optional().isMongoId().withMessage('Invalid Installment ID'),
    query('transactionId').optional().isMongoId().withMessage('Invalid Transaction ID'),
    query('entryType').optional().isIn(Object.values(LedgerEntryType)).withMessage('Invalid entry type'),
    query('direction').optional().isIn(Object.values(LedgerDirection)).withMessage('Invalid ledger direction'),
    query('startDate').optional().isISO8601().withMessage('Invalid start date format'),
    query('endDate').optional().isISO8601().withMessage('Invalid end date format'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    validateLedger
];
