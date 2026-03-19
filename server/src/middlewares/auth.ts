import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User, { UserRole, AccountStatus, KYCStatus, OrganizerStatus } from '../models/User.js';
import { AppError } from '../utils/appError.js';

export interface AuthRequest extends Request {
    user?: {
        id: string;
        role: UserRole;
        accountStatus: AccountStatus;
        kycStatus: KYCStatus;
        organizerStatus: OrganizerStatus;
    };
}

export const protect = async (req: AuthRequest, res: Response, next: NextFunction) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    } else if (req.query.token) {
        token = req.query.token as string;
    }

    if (!token) {
        return next(new AppError('You are not logged in! Please log in to get access.', 401, 'AUTH_NO_TOKEN'));
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string; role: UserRole; tokenVersion: number };

        // Check if user still exists
        const currentUser = await User.findById(decoded.id);
        if (!currentUser) {
            return next(new AppError('The user belonging to this token no longer exists', 401, 'AUTH_USER_DELETED'));
        }

        // Token Version Check (Force logout if version mismatch)
        if (currentUser.tokenVersion !== decoded.tokenVersion) {
            return next(new AppError('This session is no longer valid. Please log in again.', 401, 'AUTH_SESSION_EXPIRED'));
        }

        // Base Status Check
        if (currentUser.accountStatus === AccountStatus.DELETED) {
            return next(new AppError('This account has been deleted.', 403, 'AUTH_ACCOUNT_DELETED'));
        }

        // Allow REGISTERED users to only access verification routes if we check in the router
        // but generally block protected routes for non-active users
        req.user = { 
            id: decoded.id, 
            role: decoded.role,
            accountStatus: currentUser.accountStatus,
            kycStatus: currentUser.kycStatus,
            organizerStatus: currentUser.organizerStatus
        };
        next();
    } catch (error) {
        return next(new AppError('Invalid token. Please log in again!', 401, 'AUTH_TOKEN_INVALID'));
    }
};

/**
 * Ensures account is in ACTIVE state for sensitive operations.
 * Block: FROZEN, SUSPENDED, REGISTERED
 */
export const checkAccountActive = (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) return next(new AppError('Authentication required', 401, 'AUTH_REQUIRED'));

    if (req.user.accountStatus === AccountStatus.ACTIVE) {
        return next();
    }

    if (req.user.accountStatus === AccountStatus.REGISTERED) {
        return next(new AppError('Please verify your email to activate your account.', 403, 'AUTH_ACCOUNT_NOT_VERIFIED'));
    }

    return next(new AppError(`Access denied. Your account is currently ${req.user.accountStatus.toLowerCase()}.`, 403, 'AUTH_ACCOUNT_BLOCKED'));
};

/**
 * Ensures user identity is verified (Fintech Guard).
 * Block financial actions if KYC is not APPROVED.
 */
export const checkKYCApproved = (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) return next(new AppError('Authentication required', 401, 'AUTH_REQUIRED'));

    if (req.user.kycStatus !== KYCStatus.APPROVED) {
        throw new AppError('Identity verification required for this action. Please complete your KYC.', 403, 'KYC_REQUIRED');
    }

    next();
};

/**
 * Ensures user is eligible to apply for organizer status.
 */
export const checkOrganizerEligible = (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) return next(new AppError('Authentication required', 401, 'AUTH_REQUIRED'));

    if (req.user.accountStatus !== AccountStatus.ACTIVE) {
        return next(new AppError('Your account must be ACTIVE to apply.', 403, 'ACCOUNT_NOT_ACTIVE'));
    }

    if (req.user.kycStatus !== KYCStatus.APPROVED) {
        return next(new AppError('Your identity must be fully verified (KYC Approved) to apply.', 403, 'KYC_NOT_APPROVED'));
    }

    if (req.user.organizerStatus === OrganizerStatus.PENDING || req.user.organizerStatus === OrganizerStatus.APPROVED) {
        return next(new AppError('You have already applied or are an approved Organizer.', 400, 'ALREADY_APPLIED'));
    }

    next();
};

export const restrictTo = (...roles: UserRole[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return next(new AppError('You do not have permission to perform this action', 403, 'AUTH_FORBIDDEN'));
        }
        next();
    };
};
