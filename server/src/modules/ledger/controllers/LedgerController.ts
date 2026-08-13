import { Response, NextFunction } from 'express';
import { AuthRequest } from '@modules/auth/index.js';
import { UserRole } from '@modules/user/models/User.js';
import { AppError } from '@shared/errors/AppError.js';
import { LedgerService } from '../services/LedgerService.js';

const ledgerService = new LedgerService();

export class LedgerController {
    /**
     * GET /api/ledger/:id
     * Retrieves a single ledger entry by ID.
     */
    public static async getById(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const id = req.params.id as string;
            const entry = await ledgerService.findById(id);
            res.status(200).json({
                success: true,
                data: entry
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/ledger/member/:memberId
     * Retrieves paginated ledger entries for a specific member.
     * Authorization Rule:
     * 1. ADMIN may access any member ledger.
     * 2. USER / ORGANIZER may access ONLY their own ledger (actorId === memberId).
     */
    public static async getByMember(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const memberId = req.params.memberId as string;
            const actorId = req.user!.id;
            const actorRole = req.user!.role as UserRole;

            if (actorRole !== UserRole.ADMIN && actorId !== memberId) {
                throw new AppError('Unauthorized: You can only access your own financial ledger.', 403, 'UNAUTHORIZED');
            }

            const result = await ledgerService.findByMember(memberId, req.query);
            res.status(200).json({
                success: true,
                ...result
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/ledger/group/:groupId
     * Retrieves paginated ledger entries for a specific Chit Group.
     */
    public static async getByGroup(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const groupId = req.params.groupId as string;
            const result = await ledgerService.findByGroup(groupId, req.query);
            res.status(200).json({
                success: true,
                ...result
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/ledger
     * Search and filter ledger entries across the system.
     */
    public static async search(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const result = await ledgerService.search(req.query);
            res.status(200).json({
                success: true,
                ...result
            });
        } catch (error) {
            next(error);
        }
    }
}
