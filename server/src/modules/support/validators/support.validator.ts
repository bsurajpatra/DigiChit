import { body } from 'express-validator';
import { validate } from '../../../shared/validators/validate.middleware.js';

export { validate };

export const createContactQueryValidation = [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('subject').trim().notEmpty().withMessage('Subject is required'),
    body('message').trim().notEmpty().withMessage('Message is required'),
    validate
];
