import User, { UserRole, AccountStatus } from '../models/User.js';
import { AppError } from '../utils/appError.js';
import { logAction } from './audit.service.js';

/**
 * Freezes a user account.
 * Transition: ACTIVE -> FROZEN
 */
export const freezeAccount = async (targetUserId: string, adminId: string, adminRole: UserRole, reason: string, ipAddress?: string) => {
    const user = await User.findById(targetUserId);
    if (!user) throw new AppError('User not found', 404, 'USER_NOT_FOUND');

    if (user.accountStatus === AccountStatus.FROZEN) {
        throw new AppError('Account is already frozen', 400, 'ACCOUNT_ALREADY_FROZEN');
    }

    if (user.accountStatus === AccountStatus.SUSPENDED) {
        throw new AppError('Cannot freeze a suspended account. Restore it first.', 400, 'ACCOUNT_SUSPENDED');
    }

    const previousStatus = user.accountStatus;
    user.accountStatus = AccountStatus.FROZEN;
    user.frozenReason = reason;
    user.tokenVersion += 1; // Invalidate all existing sessions

    await user.save();

    await logAction({
        actorId: adminId,
        actorRole: adminRole,
        action: 'ACCOUNT_FROZEN',
        targetUserId: targetUserId,
        previousValue: { accountStatus: previousStatus },
        newValue: { accountStatus: AccountStatus.FROZEN, reason },
        ipAddress
    });

    return user;
};

/**
 * Suspends a user account.
 * Transition: ANY -> SUSPENDED
 */
export const suspendAccount = async (targetUserId: string, adminId: string, adminRole: UserRole, reason: string, ipAddress?: string) => {
    const user = await User.findById(targetUserId);
    if (!user) throw new AppError('User not found', 404, 'USER_NOT_FOUND');

    if (user.accountStatus === AccountStatus.SUSPENDED) {
        throw new AppError('Account is already suspended', 400, 'ACCOUNT_ALREADY_SUSPENDED');
    }

    const previousStatus = user.accountStatus;
    user.accountStatus = AccountStatus.SUSPENDED;
    user.suspendedReason = reason;
    user.tokenVersion += 1; // Invalidate all existing sessions

    await user.save();

    await logAction({
        actorId: adminId,
        actorRole: adminRole,
        action: 'ACCOUNT_SUSPENDED',
        targetUserId: targetUserId,
        previousValue: { accountStatus: previousStatus },
        newValue: { accountStatus: AccountStatus.SUSPENDED, reason },
        ipAddress
    });

    return user;
};

/**
 * Restores a user account to ACTIVE status.
 * Transition: [FROZEN, SUSPENDED, INACTIVE] -> ACTIVE
 */
export const restoreAccount = async (targetUserId: string, adminId: string, adminRole: UserRole, ipAddress?: string) => {
    const user = await User.findById(targetUserId);
    if (!user) throw new AppError('User not found', 404, 'USER_NOT_FOUND');

    const blockedStatuses = [AccountStatus.FROZEN, AccountStatus.SUSPENDED, AccountStatus.INACTIVE];
    if (!blockedStatuses.includes(user.accountStatus)) {
        throw new AppError('Account is already active or in a state that cannot be manually restored', 400, 'ACCOUNT_NOT_RESTORABLE');
    }

    const previousStatus = user.accountStatus;
    user.accountStatus = AccountStatus.ACTIVE;
    user.suspendedReason = '';
    user.frozenReason = '';

    await user.save();

    await logAction({
        actorId: adminId,
        actorRole: adminRole,
        action: 'ACCOUNT_RESTORED',
        targetUserId: targetUserId,
        previousValue: { accountStatus: previousStatus },
        newValue: { accountStatus: AccountStatus.ACTIVE },
        ipAddress
    });

    return user;
};

/**
 * Soft deletes a user account.
 * Transition: ANY -> DELETED
 */
export const softDeleteAccount = async (targetUserId: string, adminId: string, adminRole: UserRole, ipAddress?: string) => {
    const user = await User.findById(targetUserId);
    if (!user) throw new AppError('User not found', 404, 'USER_NOT_FOUND');

    if (user.accountStatus === AccountStatus.DELETED) {
        throw new AppError('Account is already deleted', 400, 'ACCOUNT_ALREADY_DELETED');
    }

    const previousStatus = user.accountStatus;
    user.tokenVersion += 1; // Invalidate all sessions
    user.accountStatus = AccountStatus.DELETED;
    user.deletedAt = new Date();

    await user.save();

    await logAction({
        actorId: adminId,
        actorRole: adminRole,
        action: 'ACCOUNT_DELETED',
        targetUserId: targetUserId,
        previousValue: { accountStatus: previousStatus },
        newValue: { accountStatus: AccountStatus.DELETED, deletedAt: user.deletedAt },
        ipAddress
    });

    return user;
};

export const changeUserRole = async (targetUserId: string, adminId: string, adminRole: UserRole, newRole: UserRole, ipAddress?: string) => {
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
