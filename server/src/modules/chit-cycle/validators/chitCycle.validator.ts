import { body } from 'express-validator';
import { validate } from '../../../shared/validators/validate.middleware.js';

export { validate };

export const createCycleValidation = [
    body('groupId').isMongoId().withMessage('Valid Group ID is required'),
    body('scheduledStartDate').isISO8601().withMessage('Valid scheduled start date is required'),
    body('scheduledEndDate').optional().isISO8601().withMessage('Scheduled end date must be a valid ISO date'),
    body('auctionDate').optional().isISO8601().withMessage('Auction date must be a valid ISO date'),
    body('remarks').optional().isString().trim(),
    validate
];

export const recordWinnerValidation = [
    body('winnerMembershipId').isMongoId().withMessage('Valid Winner Membership ID is required'),
    body('winningBidPercentage').optional().isFloat({ min: 0, max: 100 }).withMessage('Winning bid percentage must be between 0 and 100'),
    body('winningBidAmount').optional().isFloat({ min: 0 }).withMessage('Winning bid amount must be greater than or equal to 0'),
    body('prizeAmount').optional().isFloat({ min: 0 }).withMessage('Prize amount must be greater than or equal to 0'),
    body('dividendAmount').optional().isFloat({ min: 0 }).withMessage('Dividend amount must be greater than or equal to 0'),
    body('remarks').optional().isString().trim(),
    validate
];
