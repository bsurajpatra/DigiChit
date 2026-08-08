import { Response, NextFunction } from 'express';
import { AuthRequest } from '@modules/auth/middlewares/auth.js';
import { UserService } from '../services/UserService.js';
import { AppError } from '@shared/errors/AppError.js';
import { KYCService } from '@modules/kyc/services/KYCService.js';

const userService = new UserService();
const kycService = new KYCService();

export class UserController {
    /**
     * GET /api/user/profile
     */
    public static async getProfile(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const result = await userService.getProfile(req.user!.id);
            res.status(200).json({
                success: true,
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/user/change-password
     */
    public static async changePassword(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { currentPassword, newPassword } = req.body;
            const result = await userService.changePassword({
                userId: req.user!.id,
                currentPassword,
                newPassword
            });

            res.status(200).json({
                success: true,
                message: result.message
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/user/kyc/view/:field
     */
    public static async viewMyKYCDocument(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { field } = req.params;

            if (field !== 'document' && field !== 'selfie') {
                return next(new AppError('Invalid document field requested', 400, 'VALIDATION_ERROR'));
            }

            const { stream, mimeType } = await kycService.getKYCDocumentStream(req.user!.id, field as 'document' | 'selfie');

            res.setHeader('Content-Type', mimeType);
            res.setHeader('X-Content-Type-Options', 'nosniff');
            res.setHeader('Content-Disposition', 'inline');

            stream.pipe(res);
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/user/profile-picture
     */
    public static async uploadProfilePicture(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const result = await userService.uploadProfilePicture({
                userId: req.user!.id,
                publicId: req.body.publicId,
                url: req.body.url,
                fileBuffer: req.file?.buffer
            });

            res.status(200).json({
                success: true,
                message: 'Profile picture updated successfully',
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * DELETE /api/user/profile-picture
     */
    public static async deleteProfilePicture(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const result = await userService.deleteProfilePicture(req.user!.id);

            res.status(200).json({
                success: true,
                message: 'Profile picture removed successfully',
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/user/search?email=...
     */
    public static async searchUserByEmail(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const email = req.query.email as string | undefined;
            const result = await userService.searchUserByEmail(email);

            res.status(200).json({
                success: true,
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/user/upload-signature
     */
    public static async getUploadSignature(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const signatureData = userService.getUploadSignature(req.user!.id);

            res.status(200).json({
                success: true,
                data: signatureData
            });
        } catch (error) {
            next(error);
        }
    }
}
