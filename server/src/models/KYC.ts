import mongoose, { Schema, Document } from 'mongoose';
import { KYCStatus } from './User.js';

export interface IKYC extends Document {
    userId: mongoose.Types.ObjectId;
    aadhaarEncrypted: string;
    aadhaarLast4: string;
    documentPath: string;
    selfiePath: string;
    undertakingAccepted: boolean;
    status: KYCStatus;
    verifiedBy?: mongoose.Types.ObjectId;
    verifiedAt?: Date;
    rejectionReason?: string;
    createdAt: Date;
    updatedAt: Date;
}

const KYCSchema: Schema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    aadhaarEncrypted: { type: String, required: true },
    aadhaarLast4: { type: String, required: true },
    documentPath: { type: String, required: true },
    selfiePath: { type: String, required: true },
    undertakingAccepted: { type: Boolean, required: true },
    status: { type: String, enum: Object.values(KYCStatus), default: KYCStatus.SUBMITTED },
    verifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    verifiedAt: { type: Date },
    rejectionReason: { type: String }
}, { timestamps: true });

export default mongoose.model<IKYC>('KYC', KYCSchema);
