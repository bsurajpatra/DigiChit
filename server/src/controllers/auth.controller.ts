import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/auth.service.js';

export const register = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = await authService.register(req.body);
        res.status(201).json({
            success: true,
            message: 'Registration successful. Please check your email for verification.',
            data: { user: { id: user._id, email: user.email, name: user.name } }
        });
    } catch (error: any) {
        next(error);
    }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, password } = req.body;
        const { user, token } = await authService.login(email, password);
        res.status(200).json({
            success: true,
            token,
            data: { user: { id: user._id, email: user.email, name: user.name, role: user.role } }
        });
    } catch (error: any) {
        next(error);
    }
};

export const verifyEmail = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { token } = req.query;
        if (!token) throw new Error('Token is required');
        await authService.verifyEmail(token as string);
        res.status(200).json({ success: true, message: 'Email verified successfully' });
    } catch (error: any) {
        next(error);
    }
};

export const resendVerification = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email } = req.body;
        if (!email) throw new Error('Email is required');
        await authService.resendVerificationToken(email);
        res.status(200).json({ success: true, message: 'Verification email resent successfully' });
    } catch (error: any) {
        next(error);
    }
};
