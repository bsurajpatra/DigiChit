import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/AuthService.js';
import { AppError } from '@shared/errors/AppError.js';

const authService = new AuthService();

export class AuthController {
    public static async register(req: Request, res: Response, next: NextFunction) {
        try {
            const user = await authService.register(req.body);
            res.status(201).json({
                success: true,
                message: 'Registration successful. Please check your email for verification.',
                data: { user: { id: user._id, email: user.email, name: user.name, role: user.role, emailVerified: user.emailVerified, kycStatus: user.kycStatus, organizerStatus: user.organizerStatus, accountStatus: user.accountStatus, profilePictureUrl: user.profilePictureUrl } }
            });
        } catch (error) {
            next(error);
        }
    }

    public static async login(req: Request, res: Response, next: NextFunction) {
        try {
            const { email, password } = req.body;
            const { user, token } = await authService.login(email, password);
            res.status(200).json({
                success: true,
                token,
                data: { user: { id: user._id, email: user.email, name: user.name, role: user.role, emailVerified: user.emailVerified, kycStatus: user.kycStatus, organizerStatus: user.organizerStatus, accountStatus: user.accountStatus, profilePictureUrl: user.profilePictureUrl } }
            });
        } catch (error) {
            next(error);
        }
    }

    public static async verifyEmail(req: Request, res: Response, next: NextFunction) {
        try {
            const { token } = req.query;
            if (!token) throw AppError.badRequest('Token is required', 'VALIDATION_ERROR');
            const { user, token: jwtToken } = await authService.verifyEmail(token as string);
            res.status(200).json({ 
                success: true, 
                message: 'Email verified successfully',
                token: jwtToken,
                data: { user: { id: user._id, email: user.email, name: user.name, role: user.role, emailVerified: user.emailVerified, kycStatus: user.kycStatus, organizerStatus: user.organizerStatus, accountStatus: user.accountStatus, profilePictureUrl: user.profilePictureUrl } }
            });
        } catch (error) {
            next(error);
        }
    }

    public static async resendVerification(req: Request, res: Response, next: NextFunction) {
        try {
            const { email } = req.body;
            if (!email) throw AppError.badRequest('Email is required', 'VALIDATION_ERROR');
            await authService.resendVerificationToken(email);
            res.status(200).json({ success: true, message: 'Verification email resent successfully' });
        } catch (error) {
            next(error);
        }
    }

    public static async forgotPassword(req: Request, res: Response, next: NextFunction) {
        try {
            const { email } = req.body;
            if (!email) throw AppError.badRequest('Email is required', 'VALIDATION_ERROR');
            await authService.forgotPassword(email);
            res.status(200).json({ success: true, message: 'Password reset link sent to your email.' });
        } catch (error) {
            next(error);
        }
    }

    public static async resetPassword(req: Request, res: Response, next: NextFunction) {
        try {
            const { token, newPassword } = req.body;
            if (!token) throw AppError.badRequest('Token is required', 'VALIDATION_ERROR');
            if (!newPassword) throw AppError.badRequest('New password is required', 'VALIDATION_ERROR');
            await authService.resetPassword(token as string, newPassword);
            res.status(200).json({ success: true, message: 'Password reset successfully. You can now login with your new password.' });
        } catch (error) {
            next(error);
        }
    }
}
