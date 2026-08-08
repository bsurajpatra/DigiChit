import { Response } from 'express';

export interface ApiResponseOptions<T = any> {
    success: boolean;
    message?: string;
    data?: T;
    errorCode?: string;
    errors?: any[];
    meta?: Record<string, any>;
}

export class ApiResponse {
    public static success<T = any>(
        res: Response,
        message: string,
        data?: T,
        statusCode: number = 200,
        meta: Record<string, any> = {}
    ): Response {
        return res.status(statusCode).json({
            success: true,
            message,
            data: data !== undefined ? data : null,
            meta
        });
    }

    public static error(
        res: Response,
        message: string,
        errorCode: string = 'INTERNAL_SERVER_ERROR',
        statusCode: number = 500,
        errors: any[] = [],
        meta: Record<string, any> = {}
    ): Response {
        return res.status(statusCode).json({
            success: false,
            message,
            errorCode,
            errors,
            meta
        });
    }
}
