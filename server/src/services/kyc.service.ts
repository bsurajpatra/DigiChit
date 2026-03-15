import KYC from '../models/KYC.js';
import User, { KYCStatus, UserRole, AccountStatus } from '../models/User.js';
import { encrypt } from '../utils/encryption.js';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { AppError } from '../utils/appError.js';
import { logAction } from './audit.service.js';
import { validateAadhaar } from '../utils/aadhaar.js';
import * as cloudinaryService from './cloudinary.service.js';
import axios from 'axios';

export interface KYCUploadFiles {
    document: Express.Multer.File;
    selfie: Express.Multer.File;
}

export const submitKYC = async (userId: string, aadhaar: string, files: KYCUploadFiles, undertakingAccepted: boolean) => {
    if (!validateAadhaar(aadhaar)) {
        throw new AppError('Invalid Aadhaar number.', 400, 'KYC_INVALID_AADHAAR');
    }

    const user = await User.findById(userId);
    if (!user) throw new AppError('User not found', 404, 'USER_NOT_FOUND');

    // Security Guard: Prevent upload if account is blocked
    if ([AccountStatus.FROZEN, AccountStatus.SUSPENDED, AccountStatus.DELETED].includes(user.accountStatus)) {
        throw new AppError(`Cannot submit KYC for a ${user.accountStatus.toLowerCase()} account.`, 403, 'ACCOUNT_BLOCKED');
    }

    const existingKYC = await KYC.findOne({ userId });
    
    // Guard: Prevent resubmission if already approved
    if (existingKYC && existingKYC.status === KYCStatus.APPROVED) {
        throw new AppError('KYC already approved', 400, 'KYC_ALREADY_APPROVED');
    }

    const aadhaarHash = crypto.createHash('sha256').update(aadhaar).digest('hex');

    // Duplicate Aadhaar check
    const aadhaarUsed = await KYC.findOne({ aadhaarHash, userId: { $ne: new mongoose.Types.ObjectId(userId) } });
    if (aadhaarUsed) {
        throw new AppError('This Aadhaar is already registered to another account.', 409, 'KYC_DUPLICATE_AADHAAR');
    }

    // Cleanup: Delete old files from Cloudinary if this is a resubmission (REJECTED -> PENDING)
    if (existingKYC) {
        await cloudinaryService.deleteFromCloudinary(existingKYC.documentPublicId);
        await cloudinaryService.deleteFromCloudinary(existingKYC.selfiePublicId);
    }

    // Upload new files to Cloudinary
    const folder = `digichit/kyc/${userId}`;
    const [docResult, selfieResult] = await Promise.all([
        cloudinaryService.uploadToCloudinary(files.document.buffer, folder, 'auto'),
        cloudinaryService.uploadToCloudinary(files.selfie.buffer, folder, 'image')
    ]);

    const aadhaarEncrypted = encrypt(aadhaar);
    const aadhaarLast4 = aadhaar.slice(-4);

    const kyc = await KYC.findOneAndUpdate(
        { userId },
        {
            userId: new mongoose.Types.ObjectId(userId),
            aadhaarHash,
            aadhaarEncrypted,
            aadhaarLast4,
            
            documentUrl: docResult.secure_url,
            documentPublicId: docResult.public_id,
            documentMimeType: files.document.mimetype,
            documentSize: files.document.size,
            
            selfieUrl: selfieResult.secure_url,
            selfiePublicId: selfieResult.public_id,
            selfieMimeType: files.selfie.mimetype,
            selfieSize: files.selfie.size,
            
            undertakingAccepted,
            status: KYCStatus.PENDING
        },
        { upsert: true, new: true }
    );

    await User.findByIdAndUpdate(userId, { kycStatus: KYCStatus.PENDING });

    return kyc;
};

/**
 * Fetches the document from Cloudinary and returns it as a stream.
 * This ensures public URLs are NOT exposed directly.
 */
export const getKYCDocumentStream = async (userId: string, field: 'document' | 'selfie') => {
    const kyc = await KYC.findOne({ userId });
    if (!kyc) throw new AppError('KYC record not found', 404, 'KYC_NOT_FOUND');

    const url = field === 'document' ? kyc.documentUrl : kyc.selfieUrl;
    if (!url) throw new AppError(`KYC ${field} URL not found`, 404, 'KYC_URL_MISSING');

    const mimeType = field === 'document' ? kyc.documentMimeType : kyc.selfieMimeType;

    const response = await axios.get(url, { responseType: 'stream' });
    
    return {
        stream: response.data,
        mimeType
    };
};

export const adminReviewKYC = async (
    kycId: string,
    adminId: string,
    adminRole: UserRole,
    status: KYCStatus,
    rejectionReason?: string,
    ipAddress?: string
) => {
    if (![KYCStatus.APPROVED, KYCStatus.REJECTED].includes(status)) {
        throw new AppError('Invalid status for review', 400, 'KYC_INVALID_TRANSITION');
    }

    const kyc = await KYC.findById(kycId);
    if (!kyc) {
        throw new AppError('KYC record not found', 404, 'KYC_NOT_FOUND');
    }

    // State Machine Guards
    if (kyc.status === KYCStatus.APPROVED) {
        throw new AppError('Cannot re-review an already APPROVED KYC', 400, 'KYC_ALREADY_APPROVED');
    }

    if (kyc.status !== KYCStatus.PENDING) {
        throw new AppError('Only PENDING KYC records can be reviewed', 400, 'KYC_NOT_PENDING');
    }

    const targetUser = await User.findById(kyc.userId);
    if (!targetUser) throw new AppError('User not found', 404, 'USER_NOT_FOUND');

    if (status === KYCStatus.APPROVED && [AccountStatus.SUSPENDED, AccountStatus.FROZEN].includes(targetUser.accountStatus)) {
        throw new AppError(`Cannot approve KYC for a ${targetUser.accountStatus.toLowerCase()} account.`, 403, 'ACCOUNT_BLOCKED');
    }

    const previousStatus = kyc.status;
    kyc.status = status;
    kyc.verifiedBy = new mongoose.Types.ObjectId(adminId);
    kyc.verifiedAt = new Date();
    if (rejectionReason) kyc.rejectionReason = rejectionReason;

    await kyc.save();
    await User.findByIdAndUpdate(kyc.userId, { kycStatus: status });

    // Auditor Log
    await logAction({
        actorId: adminId,
        actorRole: adminRole,
        action: `KYC_${status}`,
        targetUserId: kyc.userId.toString(),
        previousValue: { status: previousStatus },
        newValue: { status: status, reason: rejectionReason },
        ipAddress: ipAddress
    });

    return kyc;
};

export const getAllPendingKYC = async () => {
    return await KYC.find({ status: KYCStatus.PENDING }).populate('userId', 'name email age');
};
