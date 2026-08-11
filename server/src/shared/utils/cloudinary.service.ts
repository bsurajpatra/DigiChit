import { logger } from '@shared/logger/logger.js';
import cloudinary from '../config/cloudinary.js';
import { AppError } from '../errors/AppError.js';
import * as streamifier from 'streamifier';

export interface CloudinaryUploadResult {
    secure_url: string;
    public_id: string;
    resource_type: string;
    format: string;
    bytes: number;
    optimized_url?: string;
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
                    logger.error('CLOUDINARY_UPLOAD_ERROR:', { error: error?.message || error, folder, resourceType });
                    return reject(new AppError(error?.message || 'Cloudinary upload failed', 500, 'CLOUDINARY_ERROR'));
                }
                if (!result) {
                    logger.error('CLOUDINARY_UPLOAD_NO_RESULT:', { folder, resourceType });
                    return reject(new AppError('Cloudinary upload returned no result', 500, 'CLOUDINARY_ERROR'));
                }
                resolve({
                    secure_url: result.secure_url,
                    public_id: result.public_id,
                    resource_type: result.resource_type,
                    format: result.format,
                    bytes: result.bytes,
                    optimized_url: cloudinary.url(result.public_id, {
                        fetch_format: 'auto',
                        quality: 'auto'
                    })
                });
            }
        );

        // Stream the buffer to Cloudinary
        const readStream = streamifier.createReadStream(fileBuffer);
        readStream.pipe(uploadStream);
    });
};

/**
 * Deletes an asset from Cloudinary using its public_id.
 */
export const deleteFromCloudinary = async (
    publicId: string,
    resourceType: 'image' | 'raw' | 'video' = 'image'
): Promise<void> => {
    try {
        await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    } catch (error: any) {
        logger.error(`Failed to delete asset ${publicId} from Cloudinary:`, error?.message || error);
    }
};

/**
 * Generates a signed signature for client-side direct Cloudinary upload.
 */
export const generateSignature = (folder: string): { timestamp: number; signature: string; apiKey: string; cloudName: string; folder: string } => {
    const timestamp = Math.round(new Date().getTime() / 1000);
    const signature = cloudinary.utils.api_sign_request(
        { timestamp, folder },
        cloudinary.config().api_secret!
    );
    return {
        timestamp,
        signature,
        apiKey: cloudinary.config().api_key!,
        cloudName: cloudinary.config().cloud_name!,
        folder
    };
};
