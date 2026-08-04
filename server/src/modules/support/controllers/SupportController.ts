import { Request, Response, NextFunction } from 'express';
import { SupportService } from '../services/SupportService.js';
import { AuthRequest } from '../../../middlewares/auth.js';

const supportService = new SupportService();

export class SupportController {
    /**
     * PUBLIC: POST /api/contact/submit
     * External contact form submission (GUEST)
     */
    public static async submitQuery(req: Request, res: Response, next: NextFunction) {
        try {
            const { name, email, subject, message } = req.body;
            const result = await supportService.submitExternalQuery({ name, email, subject, message });

            res.status(201).json({
                success: true,
                message: 'Inquiry received. We will contact you via email.',
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * PROTECTED: POST /api/contact/user/submit
     * Internal inquiry from a REGISTERED User/Organizer
     */
    public static async submitInternalQuery(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { subject, message } = req.body;
            const result = await supportService.submitInternalQuery({
                userId: req.user!.id,
                userName: req.user!.name,
                userEmail: req.user!.email,
                subject,
                message
            });

            res.status(201).json({
                success: true,
                message: 'Inquiry posted to your dashboard.',
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * PROTECTED: GET /api/contact/user/my-queries
     */
    public static async getMyQueries(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const result = await supportService.getMyQueries(req.user!.id);
            res.status(200).json({
                success: true,
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET ALL /api/contact/queries (ADMIN ONLY)
     */
    public static async getAllQueries(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const result = await supportService.getAllQueries();
            res.status(200).json({
                success: true,
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/contact/respond/:queryId (ADMIN or USER)
     */
    public static async respondToQuery(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const queryId = req.params.queryId as string;
            const { message } = req.body;
            const result = await supportService.respondToQuery({
                queryId,
                actorId: req.user!.id,
                actorRole: req.user!.role === 'ADMIN' ? 'ADMIN' : 'USER',
                message
            });

            res.status(200).json({
                success: true,
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * PATCH /api/contact/status/:queryId (ADMIN ONLY)
     */
    public static async updateStatus(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const queryId = req.params.queryId as string;
            const { status } = req.body;
            const result = await supportService.updateStatus({ queryId, status });

            res.status(200).json({
                success: true,
                data: result
            });
        } catch (error) {
            next(error);
        }
    }
}
