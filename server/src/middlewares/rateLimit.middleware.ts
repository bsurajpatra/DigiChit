import rateLimit from 'express-rate-limit';
import { AppError } from '../utils/appError.js';

export const authRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 requests per windowMs
    message: {
        success: false,
        message: 'Too many attempts from this IP, please try again after 15 minutes',
        errorCode: 'RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true, 
    legacyHeaders: false,
    skip: () => process.env.NODE_ENV === 'development',
});

export const apiRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: {
        success: false,
        message: 'Too many requests from this IP, please try again later',
        errorCode: 'API_RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => process.env.NODE_ENV === 'development',
});
