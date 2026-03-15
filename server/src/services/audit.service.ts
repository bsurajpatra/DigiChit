import AuditLog from '../models/AuditLog.js';
import { UserRole } from '../models/User.js';
import mongoose from 'mongoose';

export interface AuditLogOptions {
    actorId: string;
    actorRole: UserRole;
    action: string;
    targetUserId?: string | undefined;
    previousValue?: Record<string, unknown> | undefined;
    newValue?: Record<string, unknown> | undefined;
    ipAddress?: string | undefined;
}

export const logAction = async (options: AuditLogOptions): Promise<void> => {
    try {
        await AuditLog.create({
            actorId: new mongoose.Types.ObjectId(options.actorId),
            actorRole: options.actorRole,
            action: options.action,
            targetUserId: options.targetUserId ? new mongoose.Types.ObjectId(options.targetUserId) : undefined,
            previousValue: options.previousValue,
            newValue: options.newValue,
            ipAddress: options.ipAddress,
            timestamp: new Date()
        });
    } catch (error) {
        console.error('FAILED TO CREATE AUDIT LOG:', error);
        // In a production system, we might want to alert if audit logging fails
    }
};
