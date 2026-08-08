import { IUser, OrganizerStatus, UserRole } from '../../user/models/User.js';

export interface IApplyData {
    organizerApplicationReason: string;
    expectedChitValueRange: string;
    expectedGroupSizeRange?: string;
    city: string;
    occupation: string;
    incomeRange: string;
}

export interface IApproveOrganizerInput {
    adminId: string;
    adminRole: UserRole;
    targetUserId: string;
}

export interface IRejectOrganizerInput {
    adminId: string;
    adminRole: UserRole;
    targetUserId: string;
    reason: string;
}

export type { IUser, OrganizerStatus, UserRole };
