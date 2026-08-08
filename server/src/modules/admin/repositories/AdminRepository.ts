import mongoose from 'mongoose';
import User, { IUser } from '@modules/user/models/User.js';

export class AdminRepository {
    /**
     * Finds user by ID.
     */
    public async findUserById(targetUserId: string): Promise<IUser | null> {
        if (!mongoose.Types.ObjectId.isValid(targetUserId)) return null;
        return await User.findById(targetUserId);
    }

    /**
     * Saves changes on an existing User document.
     */
    public async saveUser(userDoc: IUser): Promise<IUser> {
        return await userDoc.save();
    }
}
