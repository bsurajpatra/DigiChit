import { Response, NextFunction } from 'express';
import { AuthRequest } from '@modules/auth/middlewares/auth.js';
import { OrganizerService } from '../services/OrganizerService.js';
import { AppError } from '@shared/errors/AppError.js';
import { UserRole } from '@modules/user/models/User.js';

const organizerService = new OrganizerService();

export class OrganizerController {
    public static async applyForOrganizer(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { organizerApplicationReason, expectedChitValueRange, expectedGroupSizeRange, city, occupation, incomeRange } = req.body;

            if (!organizerApplicationReason || !expectedChitValueRange || !city || !occupation || !incomeRange) {
                return next(new AppError('All fields (except group size range) are required to apply.', 400, 'VALIDATION_ERROR'));
            }

            const user = await organizerService.applyForOrganizer(req.user!.id, {
                organizerApplicationReason,
                expectedChitValueRange,
                expectedGroupSizeRange,
                city,
                occupation,
                incomeRange
            });

            res.status(200).json({
                success: true,
                message: 'Application submitted successfully. Under review.',
                data: { organizerStatus: user.organizerStatus }
            });
        } catch (error) {
            next(error);
        }
    }

    public static async getPendingApplications(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const applications = await organizerService.getPendingApplications();

            res.status(200).json({
                success: true,
                data: { applications }
            });
        } catch (error) {
            next(error);
        }
    }

    public static async approveOrganizer(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const targetUserId = req.params.userId as string;
            if (!targetUserId) return next(new AppError('User ID is required', 400, 'VALIDATION_ERROR'));

            const user = await organizerService.approveOrganizer({
                adminId: req.user!.id,
                adminRole: req.user!.role,
                targetUserId
            });

            res.status(200).json({
                success: true,
                message: 'Organizer approved successfully.',
                data: { organizerStatus: user.organizerStatus }
            });
        } catch (error) {
            next(error);
        }
    }

    public static async rejectOrganizer(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const targetUserId = req.params.userId as string;
            const { reason } = req.body;

            if (!targetUserId) return next(new AppError('User ID is required', 400, 'VALIDATION_ERROR'));
            if (!reason) return next(new AppError('Rejection reason is required', 400, 'VALIDATION_ERROR'));

            const user = await organizerService.rejectOrganizer({
                adminId: req.user!.id,
                adminRole: req.user!.role,
                targetUserId,
                reason
            });

            res.status(200).json({
                success: true,
                message: 'Organizer application rejected.',
                data: { organizerStatus: user.organizerStatus }
            });
        } catch (error) {
            next(error);
        }
    }
}
