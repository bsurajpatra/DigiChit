import mongoose, { Schema, Document } from 'mongoose';

export enum UserRole {
    USER = 'USER',
    ORGANIZER = 'ORGANIZER',
    ADMIN = 'ADMIN'
}

export enum KYCStatus {
    NOT_SUBMITTED = 'NOT_SUBMITTED',
    PENDING = 'PENDING',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED'
}

export enum OrganizerStatus {
    NOT_APPLIED = 'NOT_APPLIED',
    PENDING = 'PENDING',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED'
}

export enum AccountStatus {
    REGISTERED = 'REGISTERED',
    ACTIVE = 'ACTIVE',
    FROZEN = 'FROZEN',
    SUSPENDED = 'SUSPENDED',
    INACTIVE = 'INACTIVE',
    DELETED = 'DELETED'
}

export enum ChitValueRange {
    UP_TO_1_LAKH = 'UP_TO_1_LAKH',
    ONE_TO_FIVE_LAKH = 'ONE_TO_FIVE_LAKH',
    FIVE_TO_TEN_LAKH = 'FIVE_TO_TEN_LAKH',
    TEN_TO_TWENTY_FIVE_LAKH = 'TEN_TO_TWENTY_FIVE_LAKH',
    ABOVE_TWENTY_FIVE_LAKH = 'ABOVE_TWENTY_FIVE_LAKH'
}

export enum GroupSizeRange {
    SMALL_5_TO_10 = 'SMALL_5_TO_10',
    MEDIUM_10_TO_20 = 'MEDIUM_10_TO_20',
    LARGE_20_TO_50 = 'LARGE_20_TO_50',
    VERY_LARGE_50_PLUS = 'VERY_LARGE_50_PLUS'
}

export interface IUser extends Document {
    name: string;
    email: string;
    password?: string;
    role: UserRole;
    emailVerified: boolean;
    kycStatus: KYCStatus;
    organizerStatus: OrganizerStatus;
    organizerApplicationReason?: string;
    expectedChitValueRange?: ChitValueRange;
    expectedGroupSizeRange?: GroupSizeRange;
    city?: string;
    occupation?: string;
    incomeRange?: string;
    organizerRejectedReason?: string;
    organizerApprovedAt?: Date;
    age: number;
    accountStatus: AccountStatus;
    tokenVersion: number;
    profilePictureUrl?: string;
    profilePicturePublicId?: string;
    lastLoginAt?: Date;
    suspendedReason?: string;
    frozenReason?: string;
    deletedAt?: Date | null;
    createdAt: Date;
    updatedAt: Date;
}

const UserSchema: Schema = new Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    role: { type: String, enum: Object.values(UserRole), default: UserRole.USER },
    emailVerified: { type: Boolean, default: false },
    kycStatus: { type: String, enum: Object.values(KYCStatus), default: KYCStatus.NOT_SUBMITTED },
    organizerStatus: { type: String, enum: Object.values(OrganizerStatus), default: OrganizerStatus.NOT_APPLIED },
    organizerApplicationReason: { type: String },
    expectedChitValueRange: { type: String, enum: Object.values(ChitValueRange) },
    expectedGroupSizeRange: { type: String, enum: Object.values(GroupSizeRange) },
    city: { type: String },
    occupation: { type: String },
    incomeRange: { type: String },
    organizerRejectedReason: { type: String },
    organizerApprovedAt: { type: Date },
    age: { type: Number, required: true },
    accountStatus: { type: String, enum: Object.values(AccountStatus), default: AccountStatus.REGISTERED },
    tokenVersion: { type: Number, default: 0 },
    profilePictureUrl: { type: String },
    profilePicturePublicId: { type: String },
    lastLoginAt: { type: Date },
    suspendedReason: { type: String },
    frozenReason: { type: String },
    deletedAt: { type: Date, default: null }
}, { timestamps: true });

// Global query middleware to exclude soft-deleted users
UserSchema.pre(['find', 'findOne', 'findOneAndUpdate', 'countDocuments'], function(this: any) {
    this.where({ deletedAt: null });
});

export default mongoose.model<IUser>('User', UserSchema);
