import { logger } from '@shared/logger/logger.js';
import { Request, Response, NextFunction } from 'express';
import { AppError } from './AppError.js';
import { ErrorCodes } from './ErrorCodes.js';

interface MongooseValidationError extends Error {
    name: 'ValidationError';
    errors: Record<string, { message: string; path?: string; value?: any }>;
}

interface MongooseCastError extends Error {
    name: 'CastError';
    path: string;
    value: any;
}

interface MongoDuplicateKeyError extends Error {
    code: 11000;
    keyValue?: Record<string, any>;
}

export const globalErrorHandler = (
    err: unknown,
    req: Request,
    res: Response,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _next: NextFunction
) => {
    let error: AppError;

    if (err instanceof AppError) {
        error = err;
    } else {
        const errorObj = err as any;

        // 1. Mongoose ValidationError
        if (errorObj?.name === 'ValidationError' && errorObj?.errors) {
            const valErr = errorObj as MongooseValidationError;
            const details = Object.values(valErr.errors).map(e => ({
                field: e.path || 'unknown',
                message: e.message
            }));
            error = new AppError('Validation failed.', 400, ErrorCodes.VALIDATION_ERROR, details);
        }
        // 2. Mongoose CastError (Invalid ObjectId)
        else if (errorObj?.name === 'CastError') {
            const castErr = errorObj as MongooseCastError;
            error = new AppError(`Invalid format for field '${castErr.path}'.`, 400, ErrorCodes.INVALID_ID);
        }
        // 3. MongoDB Duplicate Key Error (E11000)
        else if (errorObj?.code === 11000) {
            const dupErr = errorObj as MongoDuplicateKeyError;
            const fields = dupErr.keyValue ? Object.keys(dupErr.keyValue).join(', ') : 'field';
            error = new AppError(`A record with duplicate ${fields} already exists.`, 409, ErrorCodes.DUPLICATE_KEY_ERROR);
        }
        // 4. JWT Errors
        else if (errorObj?.name === 'JsonWebTokenError') {
            error = new AppError('Invalid token. Please log in again!', 401, ErrorCodes.AUTH_TOKEN_INVALID);
        }
        else if (errorObj?.name === 'TokenExpiredError') {
            error = new AppError('Your session has expired. Please log in again.', 401, ErrorCodes.AUTH_SESSION_EXPIRED);
        }
        // 5. Unknown / Native Errors
        else {
            const message = errorObj?.message || 'An unexpected error occurred.';
            const statusCode = typeof errorObj?.statusCode === 'number' ? errorObj.statusCode : 500;
            const errorCode = errorObj?.errorCode || ErrorCodes.INTERNAL_SERVER_ERROR;
            error = new AppError(message, statusCode, errorCode, [], false);
        }
    }

    const statusCode = error.statusCode || 500;

    // Logging policy: log critical/non-operational/500 errors fully; log operational as warning
    if (!error.isOperational || statusCode >= 500) {
        logger.error('GLOBAL ERROR CATCHER (CRITICAL):', {
            method: req.method,
            url: req.originalUrl,
            message: error.message,
            errorCode: error.errorCode,
            stack: error.stack
        });
    } else {
        logger.warn(`[${req.method} ${req.originalUrl}] ${statusCode} - ${error.errorCode} - ${error.message}`);
    }

    // Security: Never leak stack traces to clients in production
    const isDev = process.env.NODE_ENV === 'development';

    const responsePayload: Record<string, any> = {
        success: false,
        message: error.isOperational || isDev ? error.message : 'An unexpected error occurred. Please try again later.',
        errorCode: error.errorCode || ErrorCodes.INTERNAL_SERVER_ERROR,
        errors: error.details || [],
        meta: error.meta || {}
    };

    if (isDev && error.stack) {
        responsePayload.stack = error.stack;
    }

    res.status(statusCode).json(responsePayload);
};
