import { body } from 'express-validator';
import { validate } from '@shared/validators/validate.middleware.js';

export { validate };

export const createGroupValidation = [
    body('name').trim().notEmpty().withMessage('Group name is required'),
    body('totalMembers').isInt({ min: 2 }).withMessage('Total members must be at least 2'),
    body('monthlyContribution').isFloat({ min: 100 }).withMessage('Monthly contribution must be at least 100'),
    body('durationMonths').isInt({ min: 1 }).withMessage('Duration must be at least 1 month'),
    body('startDate').isISO8601().withMessage('Start date must be a valid ISO date'),
    validate
];
