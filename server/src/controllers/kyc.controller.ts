import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.js';
import * as kycService from '../services/kyc.service.js';
import { KYCStatus } from '../models/User.js';

export const submitKYC = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const files = req.files as { [fieldname: string]: Express.Multer.File[] };

        if (!files.document || !files.selfie) {
            throw new Error('Both document and selfie are required');
        }

        const kycData = {
            aadhaar: req.body.aadhaar,
            documentPath: files.document?.[0]?.path || '',
            selfiePath: files.selfie?.[0]?.path || '',
            undertakingAccepted: req.body.undertakingAccepted === 'true',
        };

        const kyc = await kycService.submitKYC(req.user!.id, kycData);

        res.status(200).json({
            success: true,
            message: 'KYC submitted successfully and is under review',
            data: { kyc }
        });
    } catch (error: any) {
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
    } catch (error: any) {
        next(error);
    }
};

export const getPending = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const pendings = await kycService.getAllPendingKYC();
        res.status(200).json({ success: true, data: { pendings } });
    } catch (error: any) {
        next(error);
    }
};
