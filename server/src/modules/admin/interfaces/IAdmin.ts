import { UserRole } from '@modules/user/models/User.js';

export interface IFreezeAccountInput {
    targetUserId: string;
    adminId: string;
    adminRole: UserRole;
    reason: string;
    ipAddress?: string;
}

export interface ISuspendAccountInput {
    targetUserId: string;
    adminId: string;
    adminRole: UserRole;
    reason: string;
    ipAddress?: string;
}

export interface IRestoreAccountInput {
    targetUserId: string;
    adminId: string;
    adminRole: UserRole;
    ipAddress?: string;
}

export interface ISoftDeleteAccountInput {
    targetUserId: string;
    adminId: string;
    adminRole: UserRole;
    ipAddress?: string;
}

export interface IChangeUserRoleInput {
    targetUserId: string;
    adminId: string;
    adminRole: UserRole;
    newRole: UserRole;
    ipAddress?: string;
}
