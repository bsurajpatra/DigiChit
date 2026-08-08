import { KYCStatus } from '@modules/user/models/User.js';

export interface SubmitKycDto {
    aadhaar: string;
    undertakingAccepted: boolean;
}

export interface AdminReviewKycDto {
    kycId: string;
    status: KYCStatus;
    rejectionReason?: string;
}
