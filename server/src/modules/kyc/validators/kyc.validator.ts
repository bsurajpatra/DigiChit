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

export const kycSubmissionValidation = [
    body('aadhaar').isLength({ min: 12, max: 12 }).withMessage('Aadhaar must be 12 digits'),
    body('undertakingAccepted').equals('true').withMessage('You must accept the undertaking'),
    validate
];
