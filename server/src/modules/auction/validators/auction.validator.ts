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

export const createAuctionValidation = [
    body('cycleId').isMongoId().withMessage('Valid Cycle ID is required'),
    body('scheduledStartTime').isISO8601().withMessage('Valid scheduled start time is required'),
    body('scheduledEndTime').optional().isISO8601().withMessage('Scheduled end time must be a valid ISO date'),
    body('minimumBidPercentage').optional().isFloat({ min: 0, max: 100 }).withMessage('Minimum bid percentage must be between 0 and 100'),
    body('maximumBidPercentage').optional().isFloat({ min: 0, max: 100 }).withMessage('Maximum bid percentage must be between 0 and 100'),
    body('remarks').optional().isString().trim(),
    validate
];

export const updateAuctionValidation = [
    body('scheduledStartTime').optional().isISO8601().withMessage('Scheduled start time must be a valid ISO date'),
    body('scheduledEndTime').optional().isISO8601().withMessage('Scheduled end time must be a valid ISO date'),
    body('minimumBidPercentage').optional().isFloat({ min: 0, max: 100 }).withMessage('Minimum bid percentage must be between 0 and 100'),
    body('maximumBidPercentage').optional().isFloat({ min: 0, max: 100 }).withMessage('Maximum bid percentage must be between 0 and 100'),
    body('remarks').optional().isString().trim(),
    validate
];

export const declareAuctionWinnerValidation = [
    body('winningMembershipId').isMongoId().withMessage('Valid Winner Membership ID is required'),
    body('winningBidId').optional().isMongoId().withMessage('Winning Bid ID must be a valid Mongo ID if provided'),
    body('remarks').optional().isString().trim(),
    validate
];
