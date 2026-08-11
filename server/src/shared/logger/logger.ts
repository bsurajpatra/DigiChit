type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const SENSITIVE_KEYS = [
    'password',
    'pass',
    'jwtSecret',
    'secret',
    'encryptionKey',
    'aadhaar',
    'token',
    'apiKey',
    'apiSecret',
    'cvv',
    'cardNumber'
];

/**
 * Recursively sanitizes objects to mask sensitive security keys before logging.
 */

function sanitizeLogData(data: any): any {
    if (data === null || data === undefined) return data;
    if (typeof data === 'string') return data;
    if (data instanceof Error) {
        return {
            name: data.name,
            message: data.message,
            stack: process.env.NODE_ENV === 'development' ? data.stack : undefined
        };
    }
    if (typeof data !== 'object') return data;

    if (Array.isArray(data)) {
        return data.map(sanitizeLogData);
    }

    const sanitized: Record<string, any> = {};
    for (const key of Object.keys(data)) {
        const lowerKey = key.toLowerCase();
        if (SENSITIVE_KEYS.some(k => lowerKey.includes(k.toLowerCase()))) {
            sanitized[key] = '***MASKED***';
        } else if (typeof data[key] === 'object' && data[key] !== null) {
            sanitized[key] = sanitizeLogData(data[key]);
        } else {
            sanitized[key] = data[key];
        }
    }
    return sanitized;
}

export class Logger {
    private static instance: Logger;

    private constructor() {}

    public static getInstance(): Logger {
        if (!Logger.instance) {
            Logger.instance = new Logger();
        }
        return Logger.instance;
    }

    public debug(message: string, meta?: any): void {
        if (process.env.NODE_ENV === 'development') {
            console.debug(`[DEBUG] ${message}`, meta ? sanitizeLogData(meta) : '');
        }
    }

    public info(message: string, meta?: any): void {
        console.info(`[INFO] ${message}`, meta ? sanitizeLogData(meta) : '');
    }

    public warn(message: string, meta?: any): void {
        console.warn(`[WARN] ${message}`, meta ? sanitizeLogData(meta) : '');
    }

    public error(message: string, meta?: any): void {
        console.error(`[ERROR] ${message}`, meta ? sanitizeLogData(meta) : '');
    }
}

export const logger = Logger.getInstance();
