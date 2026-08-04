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

export const freezeAccountValidation = [
    body('targetUserId').isMongoId().withMessage('Valid Target User ID is required'),
    body('reason').trim().notEmpty().withMessage('Reason for freezing account is required'),
    validate
];

export const suspendAccountValidation = [
    body('targetUserId').isMongoId().withMessage('Valid Target User ID is required'),
    body('reason').trim().notEmpty().withMessage('Reason for suspending account is required'),
    validate
];
