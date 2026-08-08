import { body } from 'express-validator';
import { validate } from '../../../shared/validators/validate.middleware.js';

export { validate };

export const registerValidation = [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),
    body('age').isInt({ min: 21 }).withMessage('You must be at least 21 years old'),
    validate
];

export const loginValidation = [
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').notEmpty().withMessage('Password is required'),
    validate
];
