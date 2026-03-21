import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.js';
import User from '../models/User.js';
import { AppError } from '../utils/appError.js';
import bcrypt from 'bcryptjs';
import * as kycService from '../services/kyc.service.js';
import * as cloudinaryService from '../services/cloudinary.service.js';

/**
 * GET /api/user/profile
 * Returns the authenticated user's full profile.
 */
export const getProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const user = await User.findById(req.user!.id).select(
            'name email role age kycStatus accountStatus emailVerified lastLoginAt createdAt profilePictureUrl organizerStatus organizerRejectedReason kycRejectedReason city occupation incomeRange expectedChitValueRange expectedGroupSizeRange organizerApplicationReason'
        );

        if (!user) {
            return next(new AppError('User not found', 404, 'USER_NOT_FOUND'));
        }

        res.status(200).json({
            success: true,
            data: { user }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/user/change-password
 * Allows an authenticated user to change their own password.
 */
export const changePassword = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return next(new AppError('Current password and new password are required.', 400, 'VALIDATION_ERROR'));
        }

        if (newPassword.length < 8) {
            return next(new AppError('New password must be at least 8 characters long.', 400, 'VALIDATION_ERROR'));
        }

        if (currentPassword === newPassword) {
            return next(new AppError('New password must be different from your current password.', 400, 'VALIDATION_ERROR'));
        }

        const user = await User.findById(req.user!.id).select('+password');
        if (!user || !user.password) {
            return next(new AppError('User not found', 404, 'USER_NOT_FOUND'));
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return next(new AppError('Current password is incorrect.', 401, 'AUTH_WRONG_PASSWORD'));
        }

        const salt = await bcrypt.genSalt(12);
        user.password = await bcrypt.hash(newPassword, salt);
        // Invalidate all other sessions
        user.tokenVersion = (user.tokenVersion || 0) + 1;
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Password changed successfully. Please log in again with your new password.'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/user/kyc/view/:field
 * Allows authenticated users to view their own KYC documents (document | selfie).
 */
export const viewMyKYCDocument = async (req: AuthRequest, res: Response, next: NextFunction) => {
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
};

/**
 * POST /api/user/profile-picture
 * Uploads a profile picture to Cloudinary and saves URL to User.
 */
export const uploadProfilePicture = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.file) {
            return next(new AppError('Please provide an image file.', 400, 'VALIDATION_ERROR'));
        }

        const user = await User.findById(req.user!.id);
        if (!user) {
            return next(new AppError('User not found', 404, 'USER_NOT_FOUND'));
        }

        // 1. Upload to Cloudinary first
        const folder = `digichit/users/${user._id}`;
        const uploadResult = await cloudinaryService.uploadToCloudinary(req.file.buffer, folder, 'image');

        const newAvatarUrl = uploadResult.secure_url;
        const newPublicId = uploadResult.public_id;

        // 2. Delete old image if it existed
        if (user.profilePicturePublicId) {
            await cloudinaryService.deleteFromCloudinary(user.profilePicturePublicId).catch(err => {
                console.error('Failed to delete old profile picture from cloudinary:', err);
                // Non-blocking error, we still update the new one
            });
        }

        // 3. Update User document
        user.profilePictureUrl = newAvatarUrl;
        user.profilePicturePublicId = newPublicId;
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Profile picture updated successfully',
            data: { profilePictureUrl: newAvatarUrl }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/user/search?email=...
 * Searches for a user by email, returns only if KYC is APPROVED.
 */
export const searchUserByEmail = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { email } = req.query;

        if (!email || typeof email !== 'string') {
            return next(new AppError('Email is required for searching.', 400, 'VALIDATION_ERROR'));
        }

        const user = await User.findOne({ 
            email: email.toLowerCase(), 
            kycStatus: 'APPROVED',
            role: { $ne: 'ADMIN' }
        })
            .select('name email kycStatus profilePictureUrl');

        if (!user) {
            return next(new AppError('No KYC-approved user found with this email.', 404, 'USER_NOT_FOUND'));
        }

        res.status(200).json({
            success: true,
            data: { 
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    profilePictureUrl: user.profilePictureUrl
                }
            }
        });
    } catch (error) {
        next(error);
    }
};
