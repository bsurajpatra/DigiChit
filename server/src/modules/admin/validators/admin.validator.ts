import { body } from 'express-validator';
import { validate } from '../../../shared/validators/validate.middleware.js';

export { validate };

export const freezeAccountValidation = [
    body('targetUserId').isMongoId().withMessage('Valid Target User ID is required'),
    body('reason').trim().notEmpty().withMessage('Reason for freezing account is required'),
    validate
];

export const suspendAccountValidation = [
    body('targetUserId').isMongoId().withMessage('Valid Target User ID is required'),
    body('reason').trim().notEmpty().withMessage('Reason for suspending account is required'),
    validate
];
