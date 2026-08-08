import { body } from 'express-validator';
import { validate } from '@shared/validators/validate.middleware.js';

export { validate };

export const updateProfileValidation = [
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
    body('phone').optional().isMobilePhone('any').withMessage('Invalid phone number'),
    validate
];
