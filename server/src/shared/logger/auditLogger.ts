import mongoose from 'mongoose';
import AuditLog from './models/AuditLog.js';

export interface AuditLogOptions {
    actorId: string;
    actorRole: string;
    action: string;
    targetUserId?: string | undefined;
    previousValue?: Record<string, unknown> | undefined;
    newValue?: Record<string, unknown> | undefined;
    ipAddress?: string | undefined;
}

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
                actorId: new mongoose.Types.ObjectId(opts.actorId),
                actorRole: opts.actorRole,
                action: opts.action,
                targetUserId: opts.targetUserId ? new mongoose.Types.ObjectId(opts.targetUserId) : undefined,
                previousValue: opts.previousValue,
                newValue: opts.newValue,
                ipAddress: opts.ipAddress,
                timestamp: new Date()
            });
        } else {
            await AuditLog.create({
                actorId: new mongoose.Types.ObjectId(actorIdOrOptions),
                actorRole: actorRole!,
                action: action!,
                targetUserId: details?.targetUserId ? new mongoose.Types.ObjectId(details.targetUserId) : undefined,
                previousValue: details?.previousValue,
                newValue: details?.newValue,
                ipAddress: details?.ipAddress,
                timestamp: new Date()
            });
        }
    } catch (error) {
        console.error('Audit Logging Failed:', error);
    }
};
