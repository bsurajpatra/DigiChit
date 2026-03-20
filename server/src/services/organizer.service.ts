import mongoose from 'mongoose';
import User, { OrganizerStatus, UserRole } from '../models/User.js';
import AuditLog from '../models/AuditLog.js';
import { AppError } from '../utils/appError.js';
import { sendOrganizerApprovedEmail, sendOrganizerRejectedEmail } from '../utils/email.js';

interface ApplyData {
    organizerApplicationReason: string;
    expectedChitValueRange: string;
    expectedGroupSizeRange?: string;
    city: string;
    occupation: string;
    incomeRange: string;
}

export const applyForOrganizer = async (userId: string, data: ApplyData) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const user = await User.findById(userId).session(session);
        if (!user) throw new AppError('User not found', 404, 'USER_NOT_FOUND');

        if (user.organizerStatus === OrganizerStatus.PENDING || user.organizerStatus === OrganizerStatus.APPROVED) {
            throw new AppError('You have already applied or are approved.', 400, 'ALREADY_APPLIED');
        }

        user.organizerStatus = OrganizerStatus.PENDING;
        user.organizerApplicationReason = data.organizerApplicationReason;
        user.expectedChitValueRange = data.expectedChitValueRange as any;
        user.expectedGroupSizeRange = data.expectedGroupSizeRange as any;
        user.city = data.city;
        user.occupation = data.occupation;
        user.incomeRange = data.incomeRange;
        user.organizerRejectedReason = '';

        await user.save({ session });

        await AuditLog.create([{
            actorId: user._id,
            actorRole: user.role,
            action: 'ORGANIZER_APPLY',
            targetUserId: user._id,
            newValue: { status: OrganizerStatus.PENDING }
        }], { session });

        await session.commitTransaction();
        return user;
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
};

export const getPendingApplications = async () => {
    return User.find({ organizerStatus: OrganizerStatus.PENDING })
        .select('name email profilePictureUrl kycStatus accountStatus createdAt organizerApplicationReason expectedChitValueRange expectedGroupSizeRange city occupation incomeRange')
        .sort({ updatedAt: -1 });
};

export const approveOrganizer = async (adminId: string, adminRole: UserRole, targetUserId: string) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const user = await User.findById(targetUserId).session(session);
        if (!user) throw new AppError('User not found', 404, 'USER_NOT_FOUND');

        if (user.organizerStatus !== OrganizerStatus.PENDING) {
            throw new AppError('Only pending applications can be approved', 400, 'INVALID_STATE');
        }

        user.organizerStatus = OrganizerStatus.APPROVED;
        user.role = UserRole.ORGANIZER;
        user.organizerApprovedAt = new Date();
        // Invalidate sessions so their new role takes effect immediately
        user.tokenVersion = (user.tokenVersion || 0) + 1;

        await user.save({ session });

        await AuditLog.create([{
            actorId: new mongoose.Types.ObjectId(adminId),
            actorRole: adminRole,
            action: 'ORGANIZER_APPROVE',
            targetUserId: user._id,
            newValue: { status: OrganizerStatus.APPROVED, role: UserRole.ORGANIZER }
        }], { session });

        await session.commitTransaction();

        // Send confirmation email (non-blocking)
        sendOrganizerApprovedEmail(user.email, user.name).catch(err => 
            console.error('Failed to send organizer approval email:', err)
        );

        return user;
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
};

export const rejectOrganizer = async (adminId: string, adminRole: UserRole, targetUserId: string, reason: string) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const user = await User.findById(targetUserId).session(session);
        if (!user) throw new AppError('User not found', 404, 'USER_NOT_FOUND');

        if (user.organizerStatus !== OrganizerStatus.PENDING) {
            throw new AppError('Only pending applications can be rejected', 400, 'INVALID_STATE');
        }

        user.organizerStatus = OrganizerStatus.REJECTED;
        user.organizerRejectedReason = reason;

        await user.save({ session });

        await AuditLog.create([{
            actorId: new mongoose.Types.ObjectId(adminId),
            actorRole: adminRole,
            action: 'ORGANIZER_REJECT',
            targetUserId: user._id,
            newValue: { status: OrganizerStatus.REJECTED, reason }
        }], { session });

        await session.commitTransaction();

        // Send rejection email (non-blocking)
        sendOrganizerRejectedEmail(user.email, user.name, reason).catch(err => 
            console.error('Failed to send organizer rejection email:', err)
        );

        return user;
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
};
