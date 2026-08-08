import { Request, Response, NextFunction } from 'express';
import { AppError } from '@shared/errors/AppError.js';
import { StatementService } from '../services/StatementService.js';

const statementService = new StatementService();

export class StatementController {
    /**
     * GET /api/statements/member/:memberId
     */
    public static async getMemberStatement(req: Request, res: Response, next: NextFunction) {
        try {
            const memberId = req.params.memberId as string;
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
    public static async getOrganizerStatement(req: Request, res: Response, next: NextFunction) {
        try {
            const organizerId = req.params.organizerId as string;
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
    public static async getGroupStatement(req: Request, res: Response, next: NextFunction) {
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
    public static async exportStatement(req: Request, res: Response, next: NextFunction) {
        try {
            const format = req.query.format as string;

            if (format === 'pdf') {
                const pdfResult = await statementService.generateStatementPDF(req.query);
                return res.status(200).json(pdfResult);
            }

            // Default: CSV Export
            const csvData = await statementService.generateStatementCSV(req.query);
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename=Financial_Statement_${Date.now()}.csv`);
            return res.status(200).send(csvData);
        } catch (error) {
            next(error);
        }
    }
}
