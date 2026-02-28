import User, { UserRole } from '../models/User.js';
import { AppError } from '../utils/appError.js';
import { logAction } from './audit.service.js';

export const freezeAccount = async (
    targetUserId: string,
    adminId: string,
    adminRole: UserRole,
    status: 'ACTIVE' | 'SUSPENDED' | 'INACTIVE',
    reason: string,
    ipAddress?: string
) => {
    const user = await User.findById(targetUserId);
    if (!user) {
        throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    const previousStatus = user.accountStatus;
    user.accountStatus = status;
    await user.save();

    await logAction({
        actorId: adminId,
        actorRole: adminRole,
        action: `ACCOUNT_${status}`,
        targetUserId: targetUserId,
        previousValue: { accountStatus: previousStatus },
        newValue: { accountStatus: status, reason },
        ipAddress
    });

    return user;
};

export const changeUserRole = async (
    targetUserId: string,
    adminId: string,
    adminRole: UserRole,
    newRole: UserRole,
    ipAddress?: string
) => {
    const user = await User.findById(targetUserId);
    if (!user) {
        throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    const previousRole = user.role;
    user.role = newRole;
    await user.save();

    await logAction({
        actorId: adminId,
        actorRole: adminRole,
        action: 'ROLE_CHANGE',
        targetUserId: targetUserId,
        previousValue: { role: previousRole },
        newValue: { role: newRole },
        ipAddress
    });

    return user;
};
