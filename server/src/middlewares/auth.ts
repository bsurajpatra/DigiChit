import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User, { UserRole } from '../models/User.js';
import { AppError } from '../utils/appError.js';

export interface AuthRequest extends Request {
    user?: {
        id: string;
        role: UserRole;
    };
}

export const protect = async (req: AuthRequest, res: Response, next: NextFunction) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return next(new AppError('You are not logged in! Please log in to get access.', 401, 'AUTH_NO_TOKEN'));
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string; role: UserRole };

        // Check if user still exists
        const currentUser = await User.findById(decoded.id);
        if (!currentUser) {
            return next(new AppError('The user belonging to this token no longer exists', 401, 'AUTH_USER_DELETED'));
        }

        if (currentUser.accountStatus !== 'ACTIVE') {
            return next(new AppError(`This account is ${currentUser.accountStatus.toLowerCase()}`, 403, 'AUTH_ACCOUNT_STATUS'));
        }

        req.user = { id: decoded.id, role: decoded.role };
        next();
    } catch (error) {
        return next(new AppError('Invalid token. Please log in again!', 401, 'AUTH_TOKEN_INVALID'));
    }
};

export const restrictTo = (...roles: UserRole[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return next(new AppError('You do not have permission to perform this action', 403, 'AUTH_FORBIDDEN'));
        }
        next();
    };
};
