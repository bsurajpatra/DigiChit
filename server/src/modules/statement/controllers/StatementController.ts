import { Response, NextFunction } from 'express';
import { AuthRequest } from '@modules/auth/index.js';
import { UserRole } from '@modules/user/models/User.js';
import { AppError } from '@shared/errors/AppError.js';
import { StatementService } from '../services/StatementService.js';

const statementService = new StatementService();

export class StatementController {
    /**
     * GET /api/statements/member/:memberId
     */
    public static async getMemberStatement(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const memberId = req.params.memberId as string;
            const actorId = req.user?.id;
            const actorRole = req.user?.role as UserRole;

            if (actorRole !== UserRole.ADMIN && actorId && actorId !== memberId) {
                throw new AppError('Unauthorized: You can only access your own financial statement.', 403, 'UNAUTHORIZED');
            }

            const result = await statementService.getMemberStatement(memberId, req.query);
            res.status(200).json({
                success: true,
                ...result
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/statements/organizer/:organizerId
     */
    public static async getOrganizerStatement(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const organizerId = req.params.organizerId as string;
            const actorId = req.user?.id;
            const actorRole = req.user?.role as UserRole;

            if (actorRole !== UserRole.ADMIN && actorId && actorId !== organizerId) {
                throw new AppError('Unauthorized: You can only access your own organizer statement.', 403, 'UNAUTHORIZED');
            }

            const result = await statementService.getOrganizerStatement(organizerId, req.query);
            res.status(200).json({
                success: true,
                ...result
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/statements/group/:groupId
     */
    public static async getGroupStatement(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const groupId = req.params.groupId as string;
            const result = await statementService.getGroupStatement(groupId, req.query);
            res.status(200).json({
                success: true,
                ...result
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/statements/export
     * Exports financial statement as CSV or PDF placeholder.
     */
    public static async exportStatement(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const format = (req.query.format as string) || 'csv';

            if (format === 'csv') {
                const csvData = await statementService.generateStatementCSV(req.query);
                res.setHeader('Content-Type', 'text/csv');
                res.setHeader('Content-Disposition', `attachment; filename="financial_statement_${Date.now()}.csv"`);
                return res.status(200).send(csvData);
            }

            throw new AppError(`Unsupported export format: ${format}`, 400, 'UNSUPPORTED_FORMAT');
        } catch (error) {
            next(error);
        }
    }
}
