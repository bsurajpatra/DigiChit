import { body, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/appError.js';

export const validate = (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (errors.isEmpty()) {
        return next();
    }

    const extractedErrors: string[] = [];
    errors.array().forEach(err => extractedErrors.push(err.msg));

    console.log('[Validation Error]:', extractedErrors);
    return next(new AppError(extractedErrors.join(', '), 400, 'VALIDATION_ERROR'));
};

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

export const kycSubmissionValidation = [
    body('aadhaar').isLength({ min: 12, max: 12 }).withMessage('Aadhaar must be 12 digits'),
    body('undertakingAccepted').equals('true').withMessage('You must accept the undertaking'),
    validate
];

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

export const generateInstallmentsValidation = [
    body('dueDate').optional().isISO8601().withMessage('Due date must be a valid ISO date'),
    validate
];

export const updateInstallmentValidation = [
    body('amount').optional().isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
    body('dueDate').optional().isISO8601().withMessage('Due date must be a valid ISO date'),
    body('lateFee').optional().isFloat({ min: 0 }).withMessage('Late fee must be greater than or equal to 0'),
    body('remarks').optional().isString().trim(),
    validate
];

export const updateInstallmentStatusValidation = [
    body('paymentStatus').isIn(['PENDING', 'PAID', 'PARTIALLY_PAID', 'FAILED', 'OVERDUE', 'WAIVED']).withMessage('Valid payment status is required'),
    body('paidAmount').optional().isFloat({ min: 0 }).withMessage('Paid amount must be greater than or equal to 0'),
    body('paymentMethod').optional().isString().trim(),
    body('remarks').optional().isString().trim(),
    validate
];




