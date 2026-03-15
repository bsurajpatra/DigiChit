import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.js';
import * as kycService from '../services/kyc.service.js';
import { KYCStatus } from '../models/User.js';

export const submitKYC = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const files = req.files as { [fieldname: string]: Express.Multer.File[] };

        if (!files || !files.document || !files.selfie) {
            throw new Error('Both document and selfie are required');
        }

        const kyc = await kycService.submitKYC(
            req.user!.id, 
            req.body.aadhaar,
            {
                document: files.document[0]!,
                selfie: files.selfie[0]!
            },
            req.body.undertakingAccepted === 'true'
        );

        res.status(200).json({
            success: true,
            message: 'KYC submitted successfully and is under review',
            data: { kyc }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Proxy endpoint to serve KYC documents only to admins.
 * GET /api/kyc/admin/view/:userId/:field (field = document | selfie)
 */
export const viewKYCDocument = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { userId, field } = req.params;
        
        if (field !== 'document' && field !== 'selfie') {
            throw new Error('Invalid document field requested');
        }

        const { stream, mimeType } = await kycService.getKYCDocumentStream(userId as string, field as 'document' | 'selfie');
        
        res.setHeader('Content-Type', mimeType);
        // Important for security: Prevent browser from Sniffing MIME types
        res.setHeader('X-Content-Type-Options', 'nosniff');
        
        stream.pipe(res);
    } catch (error) {
        next(error);
    }
};

export const adminReview = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { kycId, status, rejectionReason } = req.body;
        const kyc = await kycService.adminReviewKYC(kycId, req.user!.id, req.user!.role, status as KYCStatus, rejectionReason, req.ip || '');

        res.status(200).json({
            success: true,
            message: `KYC ${status.toLowerCase()} successfully`,
            data: { kyc }
        });
    } catch (error) {
        next(error);
    }
};

export const getPending = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const pendings = await kycService.getAllPendingKYC();
        res.status(200).json({ success: true, data: { pendings } });
    } catch (error) {
        next(error);
    }
};
