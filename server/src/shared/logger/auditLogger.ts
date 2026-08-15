import mongoose from 'mongoose';
import AuditLog from './models/AuditLog.js';
import { logger } from './logger.js';

export interface AuditLogOptions {
    actorId?: string | undefined;
    actorRole: string;
    action: string;
    targetUserId?: string | undefined;
    previousValue?: Record<string, unknown> | undefined;
    newValue?: Record<string, unknown> | undefined;
    ipAddress?: string | undefined;
}

/**
 * Helper to safely convert string to ObjectId if valid
 */
const toValidObjectId = (idStr?: string): mongoose.Types.ObjectId | undefined => {
    if (!idStr || typeof idStr !== 'string') return undefined;
    if (mongoose.Types.ObjectId.isValid(idStr) && String(new mongoose.Types.ObjectId(idStr)) === idStr) {
        return new mongoose.Types.ObjectId(idStr);
    }
    return undefined;
};

/**
 * Standardized Audit Logging helper. Supports both positional and options-object calls.
 */
export const logAction = async (
    actorIdOrOptions: string | AuditLogOptions,
    actorRole?: string,
    action?: string,
    details?: { targetUserId?: string; previousValue?: any; newValue?: any; ipAddress?: string }
): Promise<void> => {
    try {
        if (typeof actorIdOrOptions === 'object') {
            const opts = actorIdOrOptions;
            await AuditLog.create({
                actorId: toValidObjectId(opts.actorId),
                actorRole: opts.actorRole || 'UNKNOWN',
                action: opts.action,
                targetUserId: toValidObjectId(opts.targetUserId),
                previousValue: opts.previousValue,
                newValue: opts.newValue,
                ipAddress: opts.ipAddress,
                timestamp: new Date()
            });
        } else {
            await AuditLog.create({
                actorId: toValidObjectId(actorIdOrOptions),
                actorRole: actorRole || 'UNKNOWN',
                action: action!,
                targetUserId: toValidObjectId(details?.targetUserId),
                previousValue: details?.previousValue,
                newValue: details?.newValue,
                ipAddress: details?.ipAddress,
                timestamp: new Date()
            });
        }
    } catch (error) {
        logger.error('Audit Logging Failed:', error);
    }
};
