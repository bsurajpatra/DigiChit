export class AppError extends Error {
    public readonly statusCode: number;
    public readonly status: string;
    public readonly errorCode: string;
    public readonly isOperational: boolean;
    public readonly details: any[];
    public readonly meta: Record<string, any>;

    constructor(
        message: string,
        statusCode: number = 500,
        errorCode: string = 'INTERNAL_SERVER_ERROR',
        details: any[] = [],
        isOperational: boolean = true,
        meta: Record<string, any> = {}
    ) {
        super(message);

        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.errorCode = errorCode;
        this.details = details;
        this.isOperational = isOperational;
        this.meta = meta;

        Error.captureStackTrace(this, this.constructor);
    }

    public static badRequest(message: string, errorCode: string = 'BAD_REQUEST', details: any[] = []): AppError {
        return new AppError(message, 400, errorCode, details);
    }

    public static unauthorized(message: string = 'Unauthorized access', errorCode: string = 'UNAUTHORIZED', details: any[] = []): AppError {
        return new AppError(message, 401, errorCode, details);
    }

    public static forbidden(message: string = 'Access forbidden', errorCode: string = 'FORBIDDEN', details: any[] = []): AppError {
        return new AppError(message, 403, errorCode, details);
    }

    public static notFound(message: string = 'Resource not found', errorCode: string = 'NOT_FOUND', details: any[] = []): AppError {
        return new AppError(message, 404, errorCode, details);
    }

    public static conflict(message: string = 'Resource conflict', errorCode: string = 'CONFLICT', details: any[] = []): AppError {
        return new AppError(message, 409, errorCode, details);
    }

    public static unprocessableEntity(message: string = 'Unprocessable entity', errorCode: string = 'UNPROCESSABLE_ENTITY', details: any[] = []): AppError {
        return new AppError(message, 422, errorCode, details);
    }

    public static internal(message: string = 'Internal server error', errorCode: string = 'INTERNAL_SERVER_ERROR', details: any[] = []): AppError {
        return new AppError(message, 500, errorCode, details, false);
    }
}
