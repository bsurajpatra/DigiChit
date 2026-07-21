import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/appError.js';

export const globalErrorHandler = (
    err: unknown,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const error = err as AppError;
    const statusCode = error.statusCode || 500;
    const status = error.status || 'error';

    // Only log full stack trace for non-operational or 500 internal server errors
    if (!error.isOperational || statusCode >= 500) {
        console.error('GLOBAL ERROR CATCHER (CRITICAL):', err);
    } else {
        console.warn(`[${req.method} ${req.originalUrl}] ${statusCode} - ${error.message}`);
    }

    if (process.env.NODE_ENV === 'development') {
        res.status(statusCode).json({
            success: false,
            status: status,
            error: error,
            message: error.message,
            errorCode: error.errorCode,
            stack: error.stack,
        });
    } else {
        // Production: Don't leak detail
        if (error.isOperational) {
            res.status(statusCode).json({
                success: false,
                message: error.message,
                errorCode: error.errorCode,
            });
        } else {
            // Programming or other unknown error: don't leak error details
            console.error('ERROR 💥', error);
            res.status(500).json({
                success: false,
                message: 'Something went very wrong!',
            });
        }
    }
};
