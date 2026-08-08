import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { AppError } from '../errors/AppError.js';
import { ErrorCodes } from '../errors/ErrorCodes.js';

export const validate = (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (errors.isEmpty()) {
        return next();
    }

    const details = errors.array().map((err: any) => ({
        field: err.path || err.param || 'unknown',
        message: err.msg
    }));

    const firstMsg = details[0]?.message || 'Validation failed';
    return next(new AppError(firstMsg, 400, ErrorCodes.VALIDATION_ERROR, details));
};
