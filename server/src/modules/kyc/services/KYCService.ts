import crypto from 'crypto';
import mongoose from 'mongoose';
import axios from 'axios';
import { KYCRepository } from '../repositories/KYCRepository.js';
import { IKYC } from '../models/KYC.js';
import { KYCStatus, UserRole, AccountStatus } from '../../user/models/User.js';
import { ISubmitKYCInput, IAdminReviewKYCInput } from '../interfaces/IKYC.js';
import { encrypt, decrypt } from '../../../shared/utils/encryption.js';
import { AppError } from '../../../shared/errors/AppError.js';
import { logAction } from '../../../shared/logger/auditLogger.js';
import { validateAadhaar } from '../utils/aadhaar.js';
import * as cloudinaryService from '../../../shared/utils/cloudinary.service.js';
import { sendKYCApprovedEmail, sendKYCRejectedEmail } from '../../../shared/utils/email.js';

export class KYCService {
    private repo: KYCRepository;

    constructor() {
        this.repo = new KYCRepository();
    }

    /**
     * Submits KYC details and uploads files to Cloudinary.
     */
    public async submitKYC(input: ISubmitKYCInput): Promise<IKYC> {
        const { userId, aadhaar, files, undertakingAccepted } = input;

        if (!validateAadhaar(aadhaar)) {
            throw new AppError('Invalid Aadhaar number.', 400, 'KYC_INVALID_AADHAAR');
        }

        const user = await this.repo.findUserById(userId);
        if (!user) throw new AppError('User not found', 404, 'USER_NOT_FOUND');

        // Security Guard: Prevent upload if account is blocked
        if ([AccountStatus.FROZEN, AccountStatus.SUSPENDED, AccountStatus.DELETED].includes(user.accountStatus)) {
            throw new AppError(`Cannot submit KYC for a ${user.accountStatus.toLowerCase()} account.`, 403, 'ACCOUNT_BLOCKED');
        }

        const existingKYC = await this.repo.findOneByUserId(userId);

        // Guard: Prevent resubmission if already approved
        if (existingKYC && existingKYC.status === KYCStatus.APPROVED) {
            throw new AppError('KYC already approved', 400, 'KYC_ALREADY_APPROVED');
        }

        const aadhaarHash = crypto.createHash('sha256').update(aadhaar).digest('hex');

        // Duplicate Aadhaar check
        const aadhaarUsed = await this.repo.findDuplicateAadhaar(aadhaarHash, userId);
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

        const kyc = await this.repo.findOneAndUpdate(userId, {
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
            status: KYCStatus.PENDING,
            rejectionReason: null // Clear old reason
        });

        if (!kyc) throw new AppError('Failed to save KYC record', 500, 'KYC_SAVE_ERROR');

        await this.repo.updateUserKYCStatus(userId, {
            kycStatus: KYCStatus.PENDING,
            kycRejectedReason: null // Clear old reason from profile
        });

        return kyc;
    }

    /**
     * Fetches the document from Cloudinary and returns it as a stream.
     * This ensures public URLs are NOT exposed directly.
     */
    public async getKYCDocumentStream(userId: string, field: 'document' | 'selfie') {
        const kyc = await this.repo.findOneByUserId(userId);
        if (!kyc) throw new AppError('KYC record not found', 404, 'KYC_NOT_FOUND');

        const url = field === 'document' ? kyc.documentUrl : kyc.selfieUrl;
        if (!url) throw new AppError(`KYC ${field} URL not found`, 404, 'KYC_URL_MISSING');

        const mimeType = field === 'document' ? kyc.documentMimeType : kyc.selfieMimeType;

        try {
            const response = await axios.get(url, { responseType: 'stream' });

            return {
                stream: response.data,
                mimeType
            };
        } catch (error: any) {
            console.error(
                `KYC_STREAM_ERROR [Field: ${field}, User: ${userId}, URL: ${url}]:`,
                error.response?.status,
                error.response?.statusText || error.message
            );
            throw new AppError(`Failed to retrieve KYC ${field} stream.`, 500, 'KYC_STREAM_ERROR');
        }
    }

    /**
     * Admin reviews and approves/rejects a pending KYC application.
     */
    public async adminReviewKYC(input: IAdminReviewKYCInput): Promise<IKYC> {
        const { kycId, adminId, adminRole, status, rejectionReason, ipAddress } = input;

        if (![KYCStatus.APPROVED, KYCStatus.REJECTED].includes(status)) {
            throw new AppError('Invalid status for review', 400, 'KYC_INVALID_TRANSITION');
        }

        const kyc = await this.repo.findById(kycId);
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

        const targetUser = await this.repo.findUserById(kyc.userId.toString());
        if (!targetUser) throw new AppError('User not found', 404, 'USER_NOT_FOUND');

        if (status === KYCStatus.APPROVED && [AccountStatus.SUSPENDED, AccountStatus.FROZEN].includes(targetUser.accountStatus)) {
            throw new AppError(`Cannot approve KYC for a ${targetUser.accountStatus.toLowerCase()} account.`, 403, 'ACCOUNT_BLOCKED');
        }

        const previousStatus = kyc.status;
        kyc.status = status;
        kyc.verifiedBy = new mongoose.Types.ObjectId(adminId);
        kyc.verifiedAt = new Date();
        if (rejectionReason) kyc.rejectionReason = rejectionReason;

        await this.repo.save(kyc);

        // Sync to user for easy profile fetching
        const userUpdate: any = { kycStatus: status };
        if (status === KYCStatus.REJECTED && rejectionReason) {
            userUpdate.kycRejectedReason = rejectionReason;
        } else if (status === KYCStatus.APPROVED) {
            userUpdate.kycRejectedReason = null; // Clear if approved later
        }

        await this.repo.updateUserKYCStatus(kyc.userId, userUpdate);

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

        // Send Email Notification
        if (status === KYCStatus.APPROVED) {
            sendKYCApprovedEmail(targetUser.email, targetUser.name);
        } else if (status === KYCStatus.REJECTED) {
            sendKYCRejectedEmail(targetUser.email, targetUser.name, rejectionReason || 'No specific reason provided.');
        }

        return kyc;
    }

    /**
     * Gets all pending KYC records with decrypted Aadhaar values.
     */
    public async getAllPendingKYC() {
        const pendings = await this.repo.findAllPending();
        return pendings.map((kyc) => {
            const kycObj: any = kyc.toObject();
            try {
                kycObj.aadhaarFull = decrypt(kyc.aadhaarEncrypted);
            } catch (e) {
                kycObj.aadhaarFull = 'DECRYPTION_FAILED';
            }
            return kycObj;
        });
    }
}
