import mongoose from 'mongoose';
import { OrganizerRepository } from '../repositories/OrganizerRepository.js';
import { OrganizerStatus, UserRole } from '../../../models/User.js';
import { IApplyData, IApproveOrganizerInput, IRejectOrganizerInput } from '../interfaces/IOrganizer.js';
import { AppError } from '../../../utils/appError.js';
import { sendOrganizerApprovedEmail, sendOrganizerRejectedEmail } from '../../../utils/email.js';

export class OrganizerService {
    private repo: OrganizerRepository;

    constructor() {
        this.repo = new OrganizerRepository();
    }

    /**
     * User applies to become an Organizer.
     */
    public async applyForOrganizer(userId: string, data: IApplyData) {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const user = await this.repo.findById(userId, session);
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

            await this.repo.saveUser(user, session);

            await this.repo.createAuditLog({
                actorId: user._id,
                actorRole: user.role,
                action: 'ORGANIZER_APPLY',
                targetUserId: user._id,
                newValue: { status: OrganizerStatus.PENDING }
            }, session);

            await session.commitTransaction();
            return user;
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }

    /**
     * Admin fetches all pending organizer applications.
     */
    public async getPendingApplications() {
        return await this.repo.findPendingApplications();
    }

    /**
     * Admin approves a pending organizer application.
     */
    public async approveOrganizer(input: IApproveOrganizerInput) {
        const { adminId, adminRole, targetUserId } = input;
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const user = await this.repo.findById(targetUserId, session);
            if (!user) throw new AppError('User not found', 404, 'USER_NOT_FOUND');

            if (user.organizerStatus !== OrganizerStatus.PENDING) {
                throw new AppError('Only pending applications can be approved', 400, 'INVALID_STATE');
            }

            user.organizerStatus = OrganizerStatus.APPROVED;
            user.role = UserRole.ORGANIZER;
            user.organizerApprovedAt = new Date();
            // Invalidate sessions so their new role takes effect immediately
            user.tokenVersion = (user.tokenVersion || 0) + 1;

            await this.repo.saveUser(user, session);

            await this.repo.createAuditLog({
                actorId: new mongoose.Types.ObjectId(adminId),
                actorRole: adminRole,
                action: 'ORGANIZER_APPROVE',
                targetUserId: user._id,
                newValue: { status: OrganizerStatus.APPROVED, role: UserRole.ORGANIZER }
            }, session);

            await session.commitTransaction();

            // Send confirmation email (non-blocking)
            sendOrganizerApprovedEmail(user.email, user.name).catch((err) =>
                console.error('Failed to send organizer approval email:', err)
            );

            return user;
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }

    /**
     * Admin rejects a pending organizer application with a reason.
     */
    public async rejectOrganizer(input: IRejectOrganizerInput) {
        const { adminId, adminRole, targetUserId, reason } = input;
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const user = await this.repo.findById(targetUserId, session);
            if (!user) throw new AppError('User not found', 404, 'USER_NOT_FOUND');

            if (user.organizerStatus !== OrganizerStatus.PENDING) {
                throw new AppError('Only pending applications can be rejected', 400, 'INVALID_STATE');
            }

            user.organizerStatus = OrganizerStatus.REJECTED;
            user.organizerRejectedReason = reason;

            await this.repo.saveUser(user, session);

            await this.repo.createAuditLog({
                actorId: new mongoose.Types.ObjectId(adminId),
                actorRole: adminRole,
                action: 'ORGANIZER_REJECT',
                targetUserId: user._id,
                newValue: { status: OrganizerStatus.REJECTED, reason }
            }, session);

            await session.commitTransaction();

            // Send rejection email (non-blocking)
            sendOrganizerRejectedEmail(user.email, user.name, reason).catch((err) =>
                console.error('Failed to send organizer rejection email:', err)
            );

            return user;
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }
}
