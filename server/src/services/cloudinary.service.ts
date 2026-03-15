import cloudinary from '../config/cloudinary.js';
import { AppError } from '../utils/appError.js';
import * as streamifier from 'streamifier';

export interface CloudinaryUploadResult {
    secure_url: string;
    public_id: string;
    resource_type: string;
    format: string;
    bytes: number;
}

/**
 * Uploads a file buffer to Cloudinary.
 * Used for memory-based uploads from Multer.
 */
export const uploadToCloudinary = (
    fileBuffer: Buffer,
    folder: string,
    resourceType: 'image' | 'raw' | 'auto' | 'video' = 'auto'
): Promise<CloudinaryUploadResult> => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder,
                resource_type: resourceType,
            },
            (error: any, result: any) => {
                if (error) {
                    console.error('CLOUDINARY_UPLOAD_ERROR:', error);
                    return reject(new AppError('Cloudinary upload failed', 500, 'CLOUDINARY_ERROR'));
                }
                if (!result) {
                    return reject(new AppError('Cloudinary upload returned no result', 500, 'CLOUDINARY_ERROR'));
                }
                resolve({
                    secure_url: result.secure_url,
                    public_id: result.public_id,
                    resource_type: result.resource_type,
                    format: result.format,
                    bytes: result.bytes
                });
            }
        );

        streamifier.createReadStream(fileBuffer).pipe(uploadStream);
    });
};

/**
 * Deletes a file from Cloudinary by public_id.
 */
export const deleteFromCloudinary = async (public_id: string): Promise<void> => {
    try {
        await cloudinary.uploader.destroy(public_id);
    } catch (error) {
        console.error('CLOUDINARY_DELETE_ERROR:', error);
        // We don't throw here to avoid blocking flows, but we log it.
    }
};

/**
 * Generates a signed URL for secure document access.
 * Note: For KYC, we prefer proxying the file through our server for absolute control.
 */
export const getSignedUrl = (public_id: string): string => {
    return cloudinary.url(public_id, {
        sign_url: true,
        secure: true,
        type: 'authenticated'
    });
};
