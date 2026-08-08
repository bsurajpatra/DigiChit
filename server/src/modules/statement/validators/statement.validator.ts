import { query } from 'express-validator';
import { validate } from '@shared/validators/validate.middleware.js';

export { validate };

export const statementQueryValidation = [
    query('startDate').optional().isISO8601().withMessage('Start date must be a valid ISO date'),
    query('endDate').optional().isISO8601().withMessage('End date must be a valid ISO date'),
    validate
];
