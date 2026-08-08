import { param, query, body } from 'express-validator';
import { validate } from '../../../shared/validators/validate.middleware.js';

export { validate };

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
