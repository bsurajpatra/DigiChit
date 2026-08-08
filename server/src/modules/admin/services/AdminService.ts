import { AdminRepository } from '../repositories/AdminRepository.js';
import { UserRole, AccountStatus, IUser } from '@modules/user/models/User.js';
import { AppError } from '@shared/errors/AppError.js';
import { logAction } from '@shared/logger/auditLogger.js';
import {
    IFreezeAccountInput,
    ISuspendAccountInput,
    IRestoreAccountInput,
    ISoftDeleteAccountInput,
    IChangeUserRoleInput
} from '../interfaces/IAdmin.js';

export class AdminService {
    private repo: AdminRepository;

    constructor() {
        this.repo = new AdminRepository();
    }

    /**
     * Freezes a user account.
     * Transition: ACTIVE -> FROZEN
     */
    public async freezeAccount(input: IFreezeAccountInput): Promise<IUser> {
        const { targetUserId, adminId, adminRole, reason, ipAddress } = input;

        const user = await this.repo.findUserById(targetUserId);
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

        await this.repo.saveUser(user);

        await logAction({
            actorId: adminId,
            actorRole: adminRole,
            action: 'ACCOUNT_FROZEN',
            targetUserId,
            previousValue: { accountStatus: previousStatus },
            newValue: { accountStatus: AccountStatus.FROZEN, reason },
            ipAddress
        });

        return user;
    }

    /**
     * Suspends a user account.
     * Transition: ANY -> SUSPENDED
     */
    public async suspendAccount(input: ISuspendAccountInput): Promise<IUser> {
        const { targetUserId, adminId, adminRole, reason, ipAddress } = input;

        const user = await this.repo.findUserById(targetUserId);
        if (!user) throw new AppError('User not found', 404, 'USER_NOT_FOUND');

        if (user.accountStatus === AccountStatus.SUSPENDED) {
            throw new AppError('Account is already suspended', 400, 'ACCOUNT_ALREADY_SUSPENDED');
        }

        const previousStatus = user.accountStatus;
        user.accountStatus = AccountStatus.SUSPENDED;
        user.suspendedReason = reason;
        user.tokenVersion += 1; // Invalidate all existing sessions

        await this.repo.saveUser(user);

        await logAction({
            actorId: adminId,
            actorRole: adminRole,
            action: 'ACCOUNT_SUSPENDED',
            targetUserId,
            previousValue: { accountStatus: previousStatus },
            newValue: { accountStatus: AccountStatus.SUSPENDED, reason },
            ipAddress
        });

        return user;
    }

    /**
     * Restores a user account to ACTIVE status.
     * Transition: [FROZEN, SUSPENDED, INACTIVE] -> ACTIVE
     */
    public async restoreAccount(input: IRestoreAccountInput): Promise<IUser> {
        const { targetUserId, adminId, adminRole, ipAddress } = input;

        const user = await this.repo.findUserById(targetUserId);
        if (!user) throw new AppError('User not found', 404, 'USER_NOT_FOUND');

        const blockedStatuses = [AccountStatus.FROZEN, AccountStatus.SUSPENDED, AccountStatus.INACTIVE];
        if (!blockedStatuses.includes(user.accountStatus)) {
            throw new AppError('Account is already active or in a state that cannot be manually restored', 400, 'ACCOUNT_NOT_RESTORABLE');
        }

        const previousStatus = user.accountStatus;
        user.accountStatus = AccountStatus.ACTIVE;
        user.suspendedReason = '';
        user.frozenReason = '';

        await this.repo.saveUser(user);

        await logAction({
            actorId: adminId,
            actorRole: adminRole,
            action: 'ACCOUNT_RESTORED',
            targetUserId,
            previousValue: { accountStatus: previousStatus },
            newValue: { accountStatus: AccountStatus.ACTIVE },
            ipAddress
        });

        return user;
    }

    /**
     * Soft deletes a user account.
     * Transition: ANY -> DELETED
     */
    public async softDeleteAccount(input: ISoftDeleteAccountInput): Promise<IUser> {
        const { targetUserId, adminId, adminRole, ipAddress } = input;

        const user = await this.repo.findUserById(targetUserId);
        if (!user) throw new AppError('User not found', 404, 'USER_NOT_FOUND');

        if (user.accountStatus === AccountStatus.DELETED) {
            throw new AppError('Account is already deleted', 400, 'ACCOUNT_ALREADY_DELETED');
        }

        const previousStatus = user.accountStatus;
        user.tokenVersion += 1; // Invalidate all sessions
        user.accountStatus = AccountStatus.DELETED;
        user.deletedAt = new Date();

        await this.repo.saveUser(user);

        await logAction({
            actorId: adminId,
            actorRole: adminRole,
            action: 'ACCOUNT_DELETED',
            targetUserId,
            previousValue: { accountStatus: previousStatus },
            newValue: { accountStatus: AccountStatus.DELETED, deletedAt: user.deletedAt },
            ipAddress
        });

        return user;
    }

    /**
     * Changes a user's role.
     */
    public async changeUserRole(input: IChangeUserRoleInput): Promise<IUser> {
        const { targetUserId, adminId, adminRole, newRole, ipAddress } = input;

        const user = await this.repo.findUserById(targetUserId);
        if (!user) {
            throw new AppError('User not found', 404, 'USER_NOT_FOUND');
        }

        const previousRole = user.role;
        user.role = newRole;
        await this.repo.saveUser(user);

        await logAction({
            actorId: adminId,
            actorRole: adminRole,
            action: 'ROLE_CHANGE',
            targetUserId,
            previousValue: { role: previousRole },
            newValue: { role: newRole },
            ipAddress
        });

        return user;
    }
}
