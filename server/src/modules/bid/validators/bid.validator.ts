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

export const submitBidValidation = [
    body('auctionId').isMongoId().withMessage('Valid Auction ID is required'),
    body('bidPercentage').isFloat({ min: 0, max: 100 }).withMessage('Bid percentage must be between 0 and 100'),
    body('bidAmount').optional().isFloat({ min: 0 }).withMessage('Bid amount must be greater than or equal to 0'),
    body('deviceFingerprint').optional().isString().trim(),
    body('remarks').optional().isString().trim(),
    validate
];

export const updateBidValidation = [
    body('bidPercentage').isFloat({ min: 0, max: 100 }).withMessage('Bid percentage must be between 0 and 100'),
    body('bidAmount').optional().isFloat({ min: 0 }).withMessage('Bid amount must be greater than or equal to 0'),
    body('remarks').optional().isString().trim(),
    validate
];
