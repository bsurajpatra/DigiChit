import { Response, NextFunction } from 'express';
import { AuthRequest } from '@modules/auth/index.js';
import { ChitCycleService } from '../services/ChitCycleService.js';
import { ChitCycleStatus } from '../models/ChitCycle.js';
import { UserRole } from '@modules/user/models/User.js';

const chitCycleService = new ChitCycleService();

export class ChitCycleController {
    public static async createCycle(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const actorId = req.user!.id;
            const actorRole = req.user!.role as UserRole;
            const cycle = await chitCycleService.createCycle(actorId, actorRole, req.body);

            res.status(201).json({
                success: true,
                message: `Cycle ${cycle.cycleNumber} created successfully`,
                data: { cycle }
            });
        } catch (error) {
            next(error);
        }
    }

    public static async startCycle(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const actorId = req.user!.id;
            const actorRole = req.user!.role as UserRole;
            const { actualStartDate } = req.body;
            const cycleId = req.params.id as string;

            const cycle = await chitCycleService.startCycle(actorId, actorRole, cycleId, actualStartDate);

            res.status(200).json({
                success: true,
                message: `Cycle ${cycle.cycleNumber} is now ACTIVE`,
                data: { cycle }
            });
        } catch (error) {
            next(error);
        }
    }

    public static async completeCycle(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const actorId = req.user!.id;
            const actorRole = req.user!.role as UserRole;
            const { actualEndDate } = req.body;
            const cycleId = req.params.id as string;

            const cycle = await chitCycleService.completeCycle(actorId, actorRole, cycleId, actualEndDate);

            res.status(200).json({
                success: true,
                message: `Cycle ${cycle.cycleNumber} is now COMPLETED`,
                data: { cycle }
            });
        } catch (error) {
            next(error);
        }
    }

    public static async cancelCycle(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const actorId = req.user!.id;
            const actorRole = req.user!.role as UserRole;
            const { remarks } = req.body;
            const cycleId = req.params.id as string;

            const cycle = await chitCycleService.cancelCycle(actorId, actorRole, cycleId, remarks);

            res.status(200).json({
                success: true,
                message: `Cycle ${cycle.cycleNumber} has been CANCELLED`,
                data: { cycle }
            });
        } catch (error) {
            next(error);
        }
    }

    public static async recordWinner(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const actorId = req.user!.id;
            const actorRole = req.user!.role as UserRole;
            const cycleId = req.params.id as string;

            const cycle = await chitCycleService.recordWinner(actorId, actorRole, cycleId, req.body);

            res.status(200).json({
                success: true,
                message: `Winner recorded successfully for Cycle ${cycle.cycleNumber}`,
                data: { cycle }
            });
        } catch (error) {
            next(error);
        }
    }

    public static async getCyclesByGroup(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const groupId = req.params.groupId as string;
            const status = req.query.status as ChitCycleStatus | undefined;

            const cycles = await chitCycleService.getCyclesByGroup(groupId, status);

            res.status(200).json({
                success: true,
                data: { cycles }
            });
        } catch (error) {
            next(error);
        }
    }

    public static async getActiveCycle(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const groupId = req.params.groupId as string;
            const cycle = await chitCycleService.getActiveCycle(groupId);

            res.status(200).json({
                success: true,
                data: { cycle }
            });
        } catch (error) {
            next(error);
        }
    }

    public static async getCycleDetails(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const cycleId = req.params.id as string;
            const cycle = await chitCycleService.getCycleById(cycleId);

            res.status(200).json({
                success: true,
                data: { cycle }
            });
        } catch (error) {
            next(error);
        }
    }

    public static async openCollections(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const actorId = req.user!.id;
            const actorRole = req.user!.role as UserRole;
            const cycleId = req.params.id as string;

            const cycle = await chitCycleService.openCollections(actorId, actorRole, cycleId);

            res.status(200).json({
                success: true,
                message: `Payment collections are now OPEN for Cycle ${cycle.cycleNumber}`,
                data: { cycle }
            });
        } catch (error) {
            next(error);
        }
    }

    public static async closeCollections(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const actorId = req.user!.id;
            const actorRole = req.user!.role as UserRole;
            const cycleId = req.params.id as string;

            const cycle = await chitCycleService.closeCollections(actorId, actorRole, cycleId);

            res.status(200).json({
                success: true,
                message: `Payment collections are now CLOSED for Cycle ${cycle.cycleNumber}`,
                data: { cycle }
            });
        } catch (error) {
            next(error);
        }
    }

    public static async getPaymentStatus(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const cycleId = req.params.id as string;
            const data = await chitCycleService.getPaymentStatus(cycleId);

            res.status(200).json({
                success: true,
                data
            });
        } catch (error) {
            next(error);
        }
    }
}
