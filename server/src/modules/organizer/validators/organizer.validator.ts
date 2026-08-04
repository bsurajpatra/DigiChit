import { body, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../../../utils/appError.js';

export const validate = (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (errors.isEmpty()) {
        return next();
    }

    const extractedErrors: string[] = [];
    errors.array().forEach(err => extractedErrors.push(err.msg));

    return next(new AppError(extractedErrors.join(', '), 400, 'VALIDATION_ERROR'));
};

export const applyOrganizerValidation = [
    body('businessName').trim().notEmpty().withMessage('Business name is required'),
    body('businessAddress').trim().notEmpty().withMessage('Business address is required'),
    body('experienceYears').isInt({ min: 0 }).withMessage('Experience years must be a positive integer'),
    validate
];
