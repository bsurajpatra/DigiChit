import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.js';
import * as organizerService from '../services/organizer.service.js';
import { AppError } from '../utils/appError.js';

export const applyForOrganizer = async (req: AuthRequest, res: Response, next: NextFunction) => {
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
};

export const getPendingApplications = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const applications = await organizerService.getPendingApplications();

        res.status(200).json({
            success: true,
            data: { applications }
        });
    } catch (error) {
        next(error);
    }
};

export const approveOrganizer = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const targetUserId = req.params.userId as string;
        if (!targetUserId) return next(new AppError('User ID is required', 400, 'VALIDATION_ERROR'));

        const user = await organizerService.approveOrganizer(req.user!.id, req.user!.role, targetUserId);

        res.status(200).json({
            success: true,
            message: 'Organizer approved successfully.',
            data: { organizerStatus: user.organizerStatus }
        });
    } catch (error) {
        next(error);
    }
};

export const rejectOrganizer = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const targetUserId = req.params.userId as string;
        const { reason } = req.body;

        if (!targetUserId) return next(new AppError('User ID is required', 400, 'VALIDATION_ERROR'));
        if (!reason) return next(new AppError('Rejection reason is required', 400, 'VALIDATION_ERROR'));

        const user = await organizerService.rejectOrganizer(req.user!.id, req.user!.role, targetUserId, reason);

        res.status(200).json({
            success: true,
            message: 'Organizer application rejected.',
            data: { organizerStatus: user.organizerStatus }
        });
    } catch (error) {
        next(error);
    }
};
