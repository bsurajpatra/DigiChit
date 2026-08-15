import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/AuthService.js';
import { AppError } from '@shared/errors/AppError.js';
import { logger } from '@shared/logger/logger.js';

const authService = new AuthService();

export class AuthController {
    public static async register(req: Request, res: Response, next: NextFunction) {
        try {
            logger.info(`[AUTH_HTTP] POST /api/auth/register - Initiating registration for: ${req.body?.email} | IP: ${req.ip}`);
            const user = await authService.register(req.body);
            logger.info(`[AUTH_HTTP] POST /api/auth/register - Successfully registered user ID: ${user._id}`);
            res.status(201).json({
                success: true,
                message: 'Registration successful. Please check your email for verification.',
                data: { user: { id: user._id, email: user.email, name: user.name, role: user.role, emailVerified: user.emailVerified, kycStatus: user.kycStatus, organizerStatus: user.organizerStatus, accountStatus: user.accountStatus, profilePictureUrl: user.profilePictureUrl } }
            });
        } catch (error) {
            logger.error(`[AUTH_HTTP_ERROR] POST /api/auth/register failed for ${req.body?.email}:`, error);
            next(error);
        }
    }

    public static async login(req: Request, res: Response, next: NextFunction) {
        const email = req.body?.email;
        const ip = req.ip || req.socket.remoteAddress;
        try {
            logger.info(`[AUTH_HTTP] POST /api/auth/login - Request received from IP ${ip} | Email: "${email}" | HasPassword: ${!!req.body?.password}`);
            const { user, token } = await authService.login(email, req.body?.password);
            
            logger.info(`[AUTH_HTTP] POST /api/auth/login - Authentication successful for ${user.email} (ID: ${user._id}, Role: ${user.role})`);
            res.status(200).json({
                success: true,
                token,
                data: { user: { id: user._id, email: user.email, name: user.name, role: user.role, emailVerified: user.emailVerified, kycStatus: user.kycStatus, organizerStatus: user.organizerStatus, accountStatus: user.accountStatus, profilePictureUrl: user.profilePictureUrl } }
            });
        } catch (error: any) {
            logger.warn(`[AUTH_HTTP_REJECTED] POST /api/auth/login failed for email "${email}" from IP ${ip} - Reason: ${error.errorCode || error.message}`);
            next(error);
        }
    }

    public static async verifyEmail(req: Request, res: Response, next: NextFunction) {
        try {
            const { token } = req.query;
            logger.info(`[AUTH_HTTP] GET /api/auth/verify-email - Token received: ${token ? 'YES' : 'NO'}`);
            if (!token) throw AppError.badRequest('Token is required', 'VALIDATION_ERROR');
            const { user, token: jwtToken } = await authService.verifyEmail(token as string);
            logger.info(`[AUTH_HTTP] GET /api/auth/verify-email - Email verified for ${user.email}`);
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
            logger.info(`[AUTH_HTTP] POST /api/auth/resend-verification for: ${email}`);
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
            logger.info(`[AUTH_HTTP] POST /api/auth/forgot-password for: ${email}`);
            if (!email) throw AppError.badRequest('Email is required', 'VALIDATION_ERROR');
            await authService.forgotPassword(email);
            res.status(200).json({ success: true, message: 'If an account exists, a password reset email has been sent.' });
        } catch (error) {
            next(error);
        }
    }

    public static async resetPassword(req: Request, res: Response, next: NextFunction) {
        try {
            const { token, newPassword } = req.body;
            logger.info(`[AUTH_HTTP] POST /api/auth/reset-password - Token present: ${!!token}`);
            if (!token || !newPassword) throw AppError.badRequest('Token and new password are required', 'VALIDATION_ERROR');
            await authService.resetPassword(token, newPassword);
            res.status(200).json({ success: true, message: 'Password reset successful. You may now log in.' });
        } catch (error) {
            next(error);
        }
    }
}
