import { IKYC } from '../models/KYC.js';
import { KYCStatus, UserRole } from '@modules/user/models/User.js';

export interface KYCUploadFiles {
    document: Express.Multer.File;
    selfie: Express.Multer.File;
}

export interface ISubmitKYCInput {
    userId: string;
    aadhaar: string;
    files: KYCUploadFiles;
    undertakingAccepted: boolean;
}

export interface IAdminReviewKYCInput {
    kycId: string;
    adminId: string;
    adminRole: UserRole;
    status: KYCStatus;
    rejectionReason?: string | undefined;
    ipAddress?: string | undefined;
}

export interface PendingKYCResponse {
    pendings: any[];
}

export type { IKYC };
