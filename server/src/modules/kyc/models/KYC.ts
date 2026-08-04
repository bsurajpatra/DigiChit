import mongoose, { Schema, Document } from 'mongoose';
import { KYCStatus } from '../../user/models/User.js';

export interface IKYC extends Document {
    userId: mongoose.Types.ObjectId;
    aadhaarHash: string;
    aadhaarEncrypted: string;
    aadhaarLast4: string;
    
    documentUrl: string;
    documentPublicId: string;
    documentMimeType: string;
    documentSize: number;
    
    selfieUrl: string;
    selfiePublicId: string;
    selfieMimeType: string;
    selfieSize: number;
    
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
    aadhaarHash: { type: String, required: true, unique: true },
    aadhaarEncrypted: { type: String, required: true },
    aadhaarLast4: { type: String, required: true },
    
    documentUrl: { type: String, required: true },
    documentPublicId: { type: String, required: true },
    documentMimeType: { type: String, required: true },
    documentSize: { type: Number, required: true },
    
    selfieUrl: { type: String, required: true },
    selfiePublicId: { type: String, required: true },
    selfieMimeType: { type: String, required: true },
    selfieSize: { type: Number, required: true },
    
    undertakingAccepted: { type: Boolean, required: true },
    status: { type: String, enum: Object.values(KYCStatus), default: KYCStatus.PENDING },
    verifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    verifiedAt: { type: Date },
    rejectionReason: { type: String }
}, { timestamps: true });

export default mongoose.model<IKYC>('KYC', KYCSchema);
