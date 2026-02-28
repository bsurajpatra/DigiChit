import KYC from '../models/KYC.js';
import User, { KYCStatus, UserRole } from '../models/User.js';
import { encrypt } from '../utils/encryption.js';
import mongoose from 'mongoose';
import { AppError } from '../utils/appError.js';
import { logAction } from './audit.service.js';

export const submitKYC = async (userId: string, kycData: any) => {
    const { aadhaar, documentPath, selfiePath, undertakingAccepted } = kycData;

    const existingKYC = await KYC.findOne({ userId });
    if (existingKYC && existingKYC.status === KYCStatus.APPROVED) {
        throw new AppError('KYC already approved', 400, 'KYC_ALREADY_APPROVED');
    }

    const aadhaarEncrypted = encrypt(aadhaar);
    const aadhaarLast4 = aadhaar.slice(-4);

    const kyc = await KYC.findOneAndUpdate(
        { userId },
        {
            userId: new mongoose.Types.ObjectId(userId),
            aadhaarEncrypted,
            aadhaarLast4,
            documentPath,
            selfiePath,
            undertakingAccepted,
            status: KYCStatus.SUBMITTED
        },
        { upsert: true, new: true }
    );

    await User.findByIdAndUpdate(userId, { kycStatus: KYCStatus.SUBMITTED });

    return kyc;
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
        throw new AppError('Invalid status for review', 400, 'INVALID_STATUS');
    }

    const kyc = await KYC.findById(kycId);
    if (!kyc) {
        throw new AppError('KYC record not found', 404, 'KYC_NOT_FOUND');
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
    return await KYC.find({ status: KYCStatus.SUBMITTED }).populate('userId', 'name email');
};
