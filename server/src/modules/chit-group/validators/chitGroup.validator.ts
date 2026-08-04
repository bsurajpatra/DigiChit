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

export const createGroupValidation = [
    body('name').trim().notEmpty().withMessage('Group name is required'),
    body('totalMembers').isInt({ min: 2 }).withMessage('Total members must be at least 2'),
    body('monthlyContribution').isFloat({ min: 100 }).withMessage('Monthly contribution must be at least 100'),
    body('durationMonths').isInt({ min: 1 }).withMessage('Duration must be at least 1 month'),
    body('startDate').isISO8601().withMessage('Start date must be a valid ISO date'),
    validate
];
