import mongoose from 'mongoose';
import User, { IUser } from '../models/User.js';

export class UserRepository {
    /**
     * Finds user profile by ID with selected public fields.
     */
    public async findProfileById(userId: string): Promise<IUser | null> {
        if (!mongoose.Types.ObjectId.isValid(userId)) return null;
        return await User.findById(userId).select(
            'name email role age kycStatus accountStatus emailVerified lastLoginAt createdAt profilePictureUrl organizerStatus organizerRejectedReason kycRejectedReason city occupation incomeRange expectedChitValueRange expectedGroupSizeRange organizerApplicationReason'
        );
    }

    /**
     * Finds user by ID including password hash.
     */
    public async findByIdWithPassword(userId: string): Promise<IUser | null> {
        if (!mongoose.Types.ObjectId.isValid(userId)) return null;
        return await User.findById(userId).select('+password');
    }

    /**
     * Finds user by ID.
     */
    public async findById(userId: string): Promise<IUser | null> {
        if (!mongoose.Types.ObjectId.isValid(userId)) return null;
        return await User.findById(userId);
    }

    /**
     * Finds a KYC-approved non-admin user by email.
     */
    public async findApprovedUserByEmail(email: string): Promise<IUser | null> {
        return await User.findOne({
            email: email.toLowerCase(),
            kycStatus: 'APPROVED',
            role: { $ne: 'ADMIN' }
        }).select('name email kycStatus profilePictureUrl');
    }

    /**
     * Saves changes on an existing Mongoose User document.
     */
    public async save(userDoc: IUser): Promise<IUser> {
        return await userDoc.save();
    }
}
