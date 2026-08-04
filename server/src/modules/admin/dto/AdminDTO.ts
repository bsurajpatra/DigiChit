import { UserRole } from '../../user/models/User.js';

export interface FreezeAccountDto {
    targetUserId: string;
    reason: string;
}

export interface SuspendAccountDto {
    targetUserId: string;
    reason: string;
}

export interface RestoreAccountDto {
    targetUserId: string;
}

export interface SoftDeleteAccountDto {
    targetUserId: string;
}

export interface ChangeRoleDto {
    targetUserId: string;
    newRole: UserRole;
}
