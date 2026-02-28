import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.js';
import * as adminService from '../services/admin.service.js';

export const freezeAccount = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { targetUserId, status, reason } = req.body;
        const user = await adminService.freezeAccount(
            targetUserId,
            req.user!.id,
            req.user!.role,
            status,
            reason,
            req.ip || ''
        );

        res.status(200).json({
            success: true,
            message: `Account ${status.toLowerCase()} successfully`,
            data: { user: { id: user._id, accountStatus: user.accountStatus } }
        });
    } catch (error: any) {
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
    } catch (error: any) {
        next(error);
    }
};
