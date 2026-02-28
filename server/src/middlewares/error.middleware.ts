import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/appError.js';

export const globalErrorHandler = (
    err: any,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    if (process.env.NODE_ENV === 'development') {
        res.status(err.statusCode).json({
            success: false,
            status: err.status,
            error: err,
            message: err.message,
            errorCode: err.errorCode,
            stack: err.stack,
        });
    } else {
        // Production: Don't leak detail
        if (err.isOperational) {
            res.status(err.statusCode).json({
                success: false,
                message: err.message,
                errorCode: err.errorCode,
            });
        } else {
            // Programming or other unknown error: don't leak error details
            console.error('ERROR 💥', err);
            res.status(500).json({
                success: false,
                message: 'Something went very wrong!',
            });
        }
    }
};
