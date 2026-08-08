import { body } from 'express-validator';
import { validate } from '@shared/validators/validate.middleware.js';

export { validate };

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
