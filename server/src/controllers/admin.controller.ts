import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.js';
import * as adminService from '../services/admin.service.js';

export const freezeAccount = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { targetUserId, reason } = req.body;
        const user = await adminService.freezeAccount(
            targetUserId,
            req.user!.id,
            req.user!.role,
            reason,
            req.ip || ''
        );

        res.status(200).json({
            success: true,
            message: 'Account frozen successfully',
            data: { user: { id: user._id, accountStatus: user.accountStatus } }
        });
    } catch (error) {
        next(error);
    }
};

export const suspendAccount = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { targetUserId, reason } = req.body;
        const user = await adminService.suspendAccount(
            targetUserId,
            req.user!.id,
            req.user!.role,
            reason,
            req.ip || ''
        );

        res.status(200).json({
            success: true,
            message: 'Account suspended successfully',
            data: { user: { id: user._id, accountStatus: user.accountStatus } }
        });
    } catch (error) {
        next(error);
    }
};

export const restoreAccount = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { targetUserId } = req.body;
        const user = await adminService.restoreAccount(
            targetUserId,
            req.user!.id,
            req.user!.role,
            req.ip || ''
        );

        res.status(200).json({
            success: true,
            message: 'Account restored to active successfully',
            data: { user: { id: user._id, accountStatus: user.accountStatus } }
        });
    } catch (error) {
        next(error);
    }
};

export const softDeleteAccount = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { targetUserId } = req.body;
        const user = await adminService.softDeleteAccount(
            targetUserId,
            req.user!.id,
            req.user!.role,
            req.ip || ''
        );

        res.status(200).json({
            success: true,
            message: 'Account soft-deleted successfully',
            data: { user: { id: user._id, accountStatus: user.accountStatus } }
        });
    } catch (error) {
        next(error);
    }
};

export const changeRole = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { targetUserId, newRole } = req.body;
        const user = await adminService.changeUserRole(
            targetUserId,
            req.user!.id,
            req.user!.role,
            newRole,
            req.ip || ''
        );

        res.status(200).json({
            success: true,
            message: 'User role updated successfully',
            data: { user: { id: user._id, role: user.role } }
        });
    } catch (error) {
        next(error);
    }
};
