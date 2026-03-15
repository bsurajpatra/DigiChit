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

export enum AccountStatus {
    REGISTERED = 'REGISTERED',
    ACTIVE = 'ACTIVE',
    FROZEN = 'FROZEN',
    SUSPENDED = 'SUSPENDED',
    INACTIVE = 'INACTIVE',
    DELETED = 'DELETED'
}

export interface IUser extends Document {
    name: string;
    email: string;
    password?: string;
    role: UserRole;
    emailVerified: boolean;
    kycStatus: KYCStatus;
    age: number;
    accountStatus: AccountStatus;
    tokenVersion: number;
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
    age: { type: Number, required: true },
    accountStatus: { type: String, enum: Object.values(AccountStatus), default: AccountStatus.REGISTERED },
    tokenVersion: { type: Number, default: 0 },
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
