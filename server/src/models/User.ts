import mongoose, { Schema, Document } from 'mongoose';

export enum UserRole {
    USER = 'USER',
    ORGANIZER = 'ORGANIZER',
    ADMIN = 'ADMIN'
}

export enum KYCStatus {
    PENDING = 'PENDING',
    SUBMITTED = 'SUBMITTED',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED'
}

export interface IUser extends Document {
    name: string;
    email: string;
    password?: string;
    role: UserRole;
    emailVerified: boolean;
    kycStatus: KYCStatus;
    accountStatus: 'ACTIVE' | 'SUSPENDED' | 'INACTIVE';
    createdAt: Date;
    updatedAt: Date;
}

const UserSchema: Schema = new Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    role: { type: String, enum: Object.values(UserRole), default: UserRole.USER },
    emailVerified: { type: Boolean, default: false },
    kycStatus: { type: String, enum: Object.values(KYCStatus), default: KYCStatus.PENDING },
    accountStatus: { type: String, enum: ['ACTIVE', 'SUSPENDED', 'INACTIVE'], default: 'ACTIVE' }
}, { timestamps: true });

export default mongoose.model<IUser>('User', UserSchema);
