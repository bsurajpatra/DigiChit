import mongoose from 'mongoose';
import AuditLog from '../models/AuditLog.js';
import { UserRole } from '../models/User.js';

export const logAction = async (
    actorId: string, 
    actorRole: UserRole, 
    action: string, 
    details?: { targetUserId?: string; previousValue?: any; newValue?: any; ipAddress?: string }
) => {
    try {
        await AuditLog.create({
            actorId: new mongoose.Types.ObjectId(actorId),
            actorRole,
            action,
            targetUserId: details?.targetUserId ? new mongoose.Types.ObjectId(details.targetUserId) : undefined,
            previousValue: details?.previousValue,
            newValue: details?.newValue,
            ipAddress: details?.ipAddress,
            timestamp: new Date()
        });
    } catch (error) {
        console.error('Audit Logging Failed:', error);
    }
};
