import { Response, NextFunction } from 'express';
import { AuthRequest } from '@modules/auth/middlewares/auth.js';
import { InstallmentService } from '../services/InstallmentService.js';
import { PaymentStatus } from '../models/Installment.js';
import { UserRole } from '@modules/user/models/User.js';

const installmentService = new InstallmentService();

export class InstallmentController {
    public static async generateInstallments(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const actorId = req.user!.id;
            const actorRole = req.user!.role as UserRole;
            const cycleId = req.params.cycleId as string;
            const { dueDate } = req.body;

            const result = await installmentService.generateInstallmentsForCycle(actorId, actorRole, cycleId, dueDate);

            res.status(201).json({
                success: true,
                message: `Generated ${result.createdCount} installment(s). (${result.existingCount} already existed).`,
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    public static async updateInstallmentStatus(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const actorId = req.user!.id;
            const actorRole = req.user!.role as UserRole;
            const installmentId = req.params.id as string;

            const installment = await installmentService.updateInstallmentStatus(actorId, actorRole, installmentId, req.body);

            res.status(200).json({
                success: true,
                message: `Installment payment status updated to ${installment.paymentStatus}`,
                data: { installment }
            });
        } catch (error) {
            next(error);
        }
    }

    public static async updateInstallment(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const actorId = req.user!.id;
            const actorRole = req.user!.role as UserRole;
            const installmentId = req.params.id as string;

            const installment = await installmentService.updateInstallment(actorId, actorRole, installmentId, req.body);

            res.status(200).json({
                success: true,
                message: 'Installment updated successfully',
                data: { installment }
            });
        } catch (error) {
            next(error);
        }
    }

    public static async getInstallmentById(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const actorId = req.user!.id;
            const actorRole = req.user!.role as UserRole;
            const installmentId = req.params.id as string;

            const installment = await installmentService.getInstallmentById(actorId, actorRole, installmentId);

            res.status(200).json({
                success: true,
                data: { installment }
            });
        } catch (error) {
            next(error);
        }
    }

    public static async getInstallmentsByCycle(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const actorId = req.user!.id;
            const actorRole = req.user!.role as UserRole;
            const cycleId = req.params.cycleId as string;
            const status = req.query.status as PaymentStatus | undefined;

            const installments = await installmentService.getInstallmentsByCycle(actorId, actorRole, cycleId, status);

            res.status(200).json({
                success: true,
                data: { installments }
            });
        } catch (error) {
            next(error);
        }
    }

    public static async getInstallmentsByMember(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const actorId = req.user!.id;
            const actorRole = req.user!.role as UserRole;
            const membershipId = req.params.membershipId as string;

            const installments = await installmentService.getInstallmentsByMember(actorId, actorRole, membershipId);

            res.status(200).json({
                success: true,
                data: { installments }
            });
        } catch (error) {
            next(error);
        }
    }

    public static async getInstallmentsByGroup(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const actorId = req.user!.id;
            const actorRole = req.user!.role as UserRole;
            const groupId = req.params.groupId as string;
            const status = req.query.status as PaymentStatus | undefined;

            const installments = await installmentService.getInstallmentsByGroup(actorId, actorRole, groupId, status);

            res.status(200).json({
                success: true,
                data: { installments }
            });
        } catch (error) {
            next(error);
        }
    }
}
