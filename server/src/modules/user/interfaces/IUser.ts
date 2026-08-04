import {
    IUser,
    UserRole,
    KYCStatus,
    OrganizerStatus,
    AccountStatus,
    ChitValueRange,
    GroupSizeRange
} from '../models/User.js';

export interface IChangePasswordInput {
    userId: string;
    currentPassword?: string;
    newPassword?: string;
}

export interface IUploadProfilePictureInput {
    userId: string;
    publicId?: string | undefined;
    url?: string | undefined;
    fileBuffer?: Buffer | undefined;
}

export interface ISearchUserByEmailInput {
    email?: string;
}

export type {
    IUser,
    UserRole,
    KYCStatus,
    OrganizerStatus,
    AccountStatus,
    ChitValueRange,
    GroupSizeRange
};
