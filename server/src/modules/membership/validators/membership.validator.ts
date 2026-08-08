import { body } from 'express-validator';
import { validate } from '@shared/validators/validate.middleware.js';

export { validate };

export const requestJoinValidation = [
    body('chitGroupId').isMongoId().withMessage('Valid Chit Group ID is required'),
    validate
];
