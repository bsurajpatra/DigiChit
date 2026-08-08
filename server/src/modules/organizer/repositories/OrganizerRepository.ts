import mongoose, { ClientSession } from 'mongoose';
import User, { IUser, OrganizerStatus } from '@modules/user/models/User.js';
import AuditLog from '@shared/logger/models/AuditLog.js';

export class OrganizerRepository {
    /**
     * Finds a single User document by ID.
     */
    public async findById(userId: string, session?: ClientSession): Promise<IUser | null> {
        if (!mongoose.Types.ObjectId.isValid(userId)) return null;
        return session ? await User.findById(userId).session(session) : await User.findById(userId);
    }

    /**
     * Retrieves all pending organizer applications.
     */
    public async findPendingApplications(): Promise<Partial<IUser>[]> {
        return await User.find({ organizerStatus: OrganizerStatus.PENDING })
            .select('name email profilePictureUrl kycStatus accountStatus createdAt organizerApplicationReason expectedChitValueRange expectedGroupSizeRange city occupation incomeRange')
            .sort({ updatedAt: -1 });
    }

    /**
     * Saves changes on an existing Mongoose User document.
     */
    public async saveUser(userDoc: IUser, session?: ClientSession): Promise<IUser> {
        return session ? await userDoc.save({ session }) : await userDoc.save();
    }

    /**
     * Creates an AuditLog entry.
     */
    public async createAuditLog(logData: any, session?: ClientSession): Promise<any> {
        return session ? await AuditLog.create([logData], { session }) : await AuditLog.create([logData]);
    }
}
