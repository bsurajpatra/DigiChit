import { Response, NextFunction } from 'express';
import { AuthRequest } from '@modules/auth/middlewares/auth.js';
import { CollectionService } from '../services/CollectionService.js';
import { UserRole } from '@modules/user/models/User.js';

const collectionService = new CollectionService();

export class CollectionController {
    public static openCollections = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const actorId = req.user!.id;
            const actorRole = req.user!.role as UserRole;
            const cycleId = (req.params.cycleId || req.params.id) as string;
            const { remarks } = req.body;

            const cycle = await collectionService.openCollections(actorId, actorRole, cycleId, remarks);

            res.status(200).json({
                success: true,
                message: `Payment collections are now OPEN for Cycle ${cycle.cycleNumber}`,
                data: { cycle }
            });
        } catch (error) {
            next(error);
        }
    };

    public static closeCollections = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const actorId = req.user!.id;
            const actorRole = req.user!.role as UserRole;
            const cycleId = (req.params.cycleId || req.params.id) as string;
            const { remarks } = req.body;

            const cycle = await collectionService.closeCollections(actorId, actorRole, cycleId, remarks);

            res.status(200).json({
                success: true,
                message: `Payment collections are now CLOSED for Cycle ${cycle.cycleNumber}`,
                data: { cycle }
            });
        } catch (error) {
            next(error);
        }
    };

    public static getCollectionStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const cycleId = (req.params.cycleId || req.params.id) as string;
            const data = await collectionService.getCollectionStatus(cycleId);

            res.status(200).json({
                success: true,
                data
            });
        } catch (error) {
            next(error);
        }
    };

    public static getCollectionSummary = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const cycleId = (req.params.cycleId || req.params.id) as string;
            const summary = await collectionService.getCollectionSummary(cycleId);

            res.status(200).json({
                success: true,
                data: { summary }
            });
        } catch (error) {
            next(error);
        }
    };

    public static getPendingMembers = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const cycleId = (req.params.cycleId || req.params.id) as string;
            const statusFilter = req.query.status as string | undefined;
            const searchTerm = req.query.search as string | undefined;

            const members = await collectionService.getPendingMembers(cycleId, statusFilter, searchTerm);

            res.status(200).json({
                success: true,
                data: { members }
            });
        } catch (error) {
            next(error);
        }
    };
}
