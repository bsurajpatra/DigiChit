import { Request, Response, NextFunction } from 'express';
import { LedgerService } from '../services/LedgerService.js';

const ledgerService = new LedgerService();

export class LedgerController {
    /**
     * GET /api/ledger/:id
     * Retrieves a single ledger entry by ID.
     */
    public static async getById(req: Request, res: Response, next: NextFunction) {
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
     */
    public static async getByMember(req: Request, res: Response, next: NextFunction) {
        try {
            const memberId = req.params.memberId as string;
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
    public static async getByGroup(req: Request, res: Response, next: NextFunction) {
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
    public static async search(req: Request, res: Response, next: NextFunction) {
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
