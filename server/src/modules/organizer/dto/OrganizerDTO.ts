import { OrganizerStatus } from '@modules/user/models/User.js';

export interface ApplyOrganizerDto {
    businessName: string;
    businessAddress: string;
    gstNumber?: string;
    experienceYears: number;
}

export interface ReviewOrganizerDto {
    userId: string;
    status: OrganizerStatus;
    rejectionReason?: string;
}
