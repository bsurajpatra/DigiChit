import { body } from 'express-validator';
import { validate } from '@shared/validators/validate.middleware.js';

export { validate };

export const sendMessageValidation = [
    body('chitGroupId').isMongoId().withMessage('Valid Group ID is required'),
    body('text').trim().notEmpty().withMessage('Message text is required'),
    validate
];
