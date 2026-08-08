import { body } from 'express-validator';
import { validate } from '../../../shared/validators/validate.middleware.js';

export { validate };

export const applyOrganizerValidation = [
    body('businessName').trim().notEmpty().withMessage('Business name is required'),
    body('businessAddress').trim().notEmpty().withMessage('Business address is required'),
    body('experienceYears').isInt({ min: 0 }).withMessage('Experience years must be a positive integer'),
    validate
];
