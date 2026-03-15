export class AppError extends Error {
    public readonly statusCode: number;
    public readonly status: string;
    public readonly isOperational: boolean;
    public readonly errorCode?: string;

    constructor(message: string, statusCode: number, errorCode?: string) {
        super(message);

        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true;
        
        if (errorCode) {
            this.errorCode = errorCode;
        }

        Error.captureStackTrace(this, this.constructor);
    }
}
