import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../auth/middlewares/auth.js';
import { KYCService } from '../services/KYCService.js';
import { KYCStatus } from '../../user/models/User.js';

const kycService = new KYCService();

export class KYCController {
    public static async submitKYC(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const files = req.files as { [fieldname: string]: Express.Multer.File[] };

            if (!files || !files.document || !files.selfie) {
                throw new Error('Both document and selfie are required');
            }

            const kyc = await kycService.submitKYC({
                userId: req.user!.id,
                aadhaar: req.body.aadhaar,
                files: {
                    document: files.document[0]!,
                    selfie: files.selfie[0]!
                },
                undertakingAccepted: req.body.undertakingAccepted === 'true'
            });

            res.status(200).json({
                success: true,
                message: 'KYC submitted successfully and is under review',
                data: { kyc }
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Proxy endpoint to serve KYC documents only to admins.
     * GET /api/kyc/admin/view/:userId/:field (field = document | selfie)
     */
    public static async viewKYCDocument(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { userId, field } = req.params;

            if (field !== 'document' && field !== 'selfie') {
                throw new Error('Invalid document field requested');
            }

            const { stream, mimeType } = await kycService.getKYCDocumentStream(userId as string, field as 'document' | 'selfie');

            res.setHeader('Content-Type', mimeType);
            res.setHeader('X-Content-Type-Options', 'nosniff');

            stream.pipe(res);
        } catch (error) {
            next(error);
        }
    }

    public static async adminReview(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { kycId, status, rejectionReason } = req.body;
            const kyc = await kycService.adminReviewKYC({
                kycId,
                adminId: req.user!.id,
                adminRole: req.user!.role,
                status: status as KYCStatus,
                rejectionReason,
                ipAddress: req.ip || ''
            });

            res.status(200).json({
                success: true,
                message: `KYC ${status.toLowerCase()} successfully`,
                data: { kyc }
            });
        } catch (error) {
            next(error);
        }
    }

    public static async getPending(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const pendings = await kycService.getAllPendingKYC();
            res.status(200).json({ success: true, data: { pendings } });
        } catch (error) {
            next(error);
        }
    }
}
