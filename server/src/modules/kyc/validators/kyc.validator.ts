import { body } from 'express-validator';
import { validate } from '../../../shared/validators/validate.middleware.js';

export { validate };

export const kycSubmissionValidation = [
    body('aadhaar').isLength({ min: 12, max: 12 }).withMessage('Aadhaar must be 12 digits'),
    body('undertakingAccepted').equals('true').withMessage('You must accept the undertaking'),
    validate
];
