import { body } from 'express-validator';
import { validate } from '../../../shared/validators/validate.middleware.js';

export { validate };

export const openCollectionValidation = [
    body('remarks').optional().isString().trim(),
    validate
];
