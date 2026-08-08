import bcrypt from 'bcryptjs';
import { UserRepository } from '../repositories/UserRepository.js';
import { AppError } from '@shared/errors/AppError.js';
import * as cloudinaryService from '@shared/utils/cloudinary.service.js';
import { IChangePasswordInput, IUploadProfilePictureInput } from '../interfaces/IUser.js';

export class UserService {
    private repo: UserRepository;

    constructor() {
        this.repo = new UserRepository();
    }

    /**
     * Gets the full authenticated profile.
     */
    public async getProfile(userId: string) {
        const user = await this.repo.findProfileById(userId);
        if (!user) {
            throw new AppError('User not found', 404, 'USER_NOT_FOUND');
        }
        return { user };
    }

    /**
     * Allows user to change their password.
     */
    public async changePassword(input: IChangePasswordInput) {
        const { userId, currentPassword, newPassword } = input;

        if (!currentPassword || !newPassword) {
            throw new AppError('Current password and new password are required.', 400, 'VALIDATION_ERROR');
        }

        if (newPassword.length < 8) {
            throw new AppError('New password must be at least 8 characters long.', 400, 'VALIDATION_ERROR');
        }

        if (currentPassword === newPassword) {
            throw new AppError('New password must be different from your current password.', 400, 'VALIDATION_ERROR');
        }

        const user = await this.repo.findByIdWithPassword(userId);
        if (!user || !user.password) {
            throw new AppError('User not found', 404, 'USER_NOT_FOUND');
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            throw new AppError('Current password is incorrect.', 401, 'AUTH_WRONG_PASSWORD');
        }

        const salt = await bcrypt.genSalt(12);
        user.password = await bcrypt.hash(newPassword, salt);
        // Invalidate all other sessions
        user.tokenVersion = (user.tokenVersion || 0) + 1;
        await this.repo.save(user);

        return { message: 'Password changed successfully. Please log in again with your new password.' };
    }

    /**
     * Uploads user profile picture via direct URL or file buffer.
     */
    public async uploadProfilePicture(input: IUploadProfilePictureInput) {
        const { userId, publicId, url, fileBuffer } = input;

        const user = await this.repo.findById(userId);
        if (!user) {
            throw new AppError('User not found', 404, 'USER_NOT_FOUND');
        }

        let newAvatarUrl: string;
        let newPublicId: string;

        if (publicId && url) {
            newPublicId = publicId;
            newAvatarUrl = url;
        } else if (fileBuffer) {
            const folder = `digichit/users/${user._id}`;
            const uploadResult = await cloudinaryService.uploadToCloudinary(fileBuffer, folder, 'image');
            newAvatarUrl = uploadResult.secure_url;
            newPublicId = uploadResult.public_id;
        } else {
            throw new AppError('Please provide an image file or direct upload data.', 400, 'VALIDATION_ERROR');
        }

        if (user.profilePicturePublicId) {
            await cloudinaryService.deleteFromCloudinary(user.profilePicturePublicId).catch((err: any) => {
                console.error('Failed to delete old profile picture from cloudinary:', err);
            });
        }

        user.profilePictureUrl = newAvatarUrl;
        user.profilePicturePublicId = newPublicId;
        await this.repo.save(user);

        return { profilePictureUrl: newAvatarUrl };
    }

    /**
     * Removes user profile picture.
     */
    public async deleteProfilePicture(userId: string) {
        const user = await this.repo.findById(userId);
        if (!user) {
            throw new AppError('User not found', 404, 'USER_NOT_FOUND');
        }

        if (user.profilePicturePublicId) {
            await cloudinaryService.deleteFromCloudinary(user.profilePicturePublicId).catch((err: any) => {
                console.error('Failed to delete profile picture from cloudinary:', err);
            });
        }

        (user as any).profilePictureUrl = undefined;
        (user as any).profilePicturePublicId = undefined;
        await this.repo.save(user);

        return { profilePictureUrl: null };
    }

    /**
     * Searches for a KYC-approved user by email.
     */
    public async searchUserByEmail(email?: string) {
        if (!email || typeof email !== 'string') {
            throw new AppError('Email is required for searching.', 400, 'VALIDATION_ERROR');
        }

        const user = await this.repo.findApprovedUserByEmail(email);

        if (!user) {
            return {
                user: null,
                message: 'No KYC-approved user found with this email.'
            };
        }

        return {
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                profilePictureUrl: user.profilePictureUrl
            }
        };
    }

    /**
     * Generates a signed signature for client-side direct Cloudinary upload.
     */
    public getUploadSignature(userId: string) {
        const folder = `digichit/users/${userId}`;
        return cloudinaryService.generateSignature(folder);
    }
}
