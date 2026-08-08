import { body } from 'express-validator';
import { validate } from '../../../shared/validators/validate.middleware.js';

export { validate };

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
