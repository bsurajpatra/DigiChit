import mongoose from 'mongoose';
import KYC, { IKYC } from '../models/KYC.js';
import User, { IUser, KYCStatus } from '../../user/models/User.js';

export class KYCRepository {
    /**
     * Finds user document by ID.
     */
    public async findUserById(userId: string): Promise<IUser | null> {
        if (!mongoose.Types.ObjectId.isValid(userId)) return null;
        return await User.findById(userId);
    }

    /**
     * Finds KYC document by user ID.
     */
    public async findOneByUserId(userId: string): Promise<IKYC | null> {
        if (!mongoose.Types.ObjectId.isValid(userId)) return null;
        return await KYC.findOne({ userId: new mongoose.Types.ObjectId(userId) });
    }

    /**
     * Checks if Aadhaar hash is used by another user.
     */
    public async findDuplicateAadhaar(aadhaarHash: string, userId: string): Promise<IKYC | null> {
        if (!mongoose.Types.ObjectId.isValid(userId)) return null;
        return await KYC.findOne({
            aadhaarHash,
            userId: { $ne: new mongoose.Types.ObjectId(userId) }
        });
    }

    /**
     * Upserts KYC document for user.
     */
    public async findOneAndUpdate(userId: string, updateData: any): Promise<IKYC | null> {
        if (!mongoose.Types.ObjectId.isValid(userId)) return null;
        return await KYC.findOneAndUpdate(
            { userId: new mongoose.Types.ObjectId(userId) },
            updateData,
            { upsert: true, new: true }
        );
    }

    /**
     * Updates User's KYC status fields.
     */
    public async updateUserKYCStatus(userId: mongoose.Types.ObjectId | string, userUpdate: any): Promise<IUser | null> {
        return await User.findByIdAndUpdate(userId, userUpdate);
    }

    /**
     * Finds KYC document by ID.
     */
    public async findById(kycId: string): Promise<IKYC | null> {
        if (!mongoose.Types.ObjectId.isValid(kycId)) return null;
        return await KYC.findById(kycId);
    }

    /**
     * Saves changes on an existing Mongoose KYC document.
     */
    public async save(kycDoc: IKYC): Promise<IKYC> {
        return await kycDoc.save();
    }

    /**
     * Finds all pending KYC documents populated with User info.
     */
    public async findAllPending(): Promise<IKYC[]> {
        return await KYC.find({ status: KYCStatus.PENDING }).populate('userId', 'name email age');
    }
}
