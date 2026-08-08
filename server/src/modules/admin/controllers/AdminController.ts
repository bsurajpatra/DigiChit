import { Response, NextFunction } from 'express';
import { AuthRequest } from '@modules/auth/middlewares/auth.js';
import { AdminService } from '../services/AdminService.js';

const adminService = new AdminService();

export class AdminController {
    public static async freezeAccount(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { targetUserId, reason } = req.body;
            const user = await adminService.freezeAccount({
                targetUserId,
                adminId: req.user!.id,
                adminRole: req.user!.role,
                reason,
                ipAddress: req.ip || ''
            });

            res.status(200).json({
                success: true,
                message: 'Account frozen successfully',
                data: { user: { id: user._id, accountStatus: user.accountStatus } }
            });
        } catch (error) {
            next(error);
        }
    }

    public static async suspendAccount(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { targetUserId, reason } = req.body;
            const user = await adminService.suspendAccount({
                targetUserId,
                adminId: req.user!.id,
                adminRole: req.user!.role,
                reason,
                ipAddress: req.ip || ''
            });

            res.status(200).json({
                success: true,
                message: 'Account suspended successfully',
                data: { user: { id: user._id, accountStatus: user.accountStatus } }
            });
        } catch (error) {
            next(error);
        }
    }

    public static async restoreAccount(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { targetUserId } = req.body;
            const user = await adminService.restoreAccount({
                targetUserId,
                adminId: req.user!.id,
                adminRole: req.user!.role,
                ipAddress: req.ip || ''
            });

            res.status(200).json({
                success: true,
                message: 'Account restored to active successfully',
                data: { user: { id: user._id, accountStatus: user.accountStatus } }
            });
        } catch (error) {
            next(error);
        }
    }

    public static async softDeleteAccount(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { targetUserId } = req.body;
            const user = await adminService.softDeleteAccount({
                targetUserId,
                adminId: req.user!.id,
                adminRole: req.user!.role,
                ipAddress: req.ip || ''
            });

            res.status(200).json({
                success: true,
                message: 'Account soft-deleted successfully',
                data: { user: { id: user._id, accountStatus: user.accountStatus } }
            });
        } catch (error) {
            next(error);
        }
    }

    public static async changeRole(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { targetUserId, newRole } = req.body;
            const user = await adminService.changeUserRole({
                targetUserId,
                adminId: req.user!.id,
                adminRole: req.user!.role,
                newRole,
                ipAddress: req.ip || ''
            });

            res.status(200).json({
                success: true,
                message: 'User role updated successfully',
                data: { user: { id: user._id, role: user.role } }
            });
        } catch (error) {
            next(error);
        }
    }
}
