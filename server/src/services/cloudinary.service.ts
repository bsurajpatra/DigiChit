import cloudinary from '../config/cloudinary.js';
import { AppError } from '../utils/appError.js';
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
                    console.error('CLOUDINARY_UPLOAD_ERROR:', error?.message || error, { folder, resourceType });
                    return reject(new AppError(error?.message || 'Cloudinary upload failed', 500, 'CLOUDINARY_ERROR'));
                }
                if (!result) {
                    console.error('CLOUDINARY_UPLOAD_NO_RESULT:', { folder, resourceType });
                    return reject(new AppError('Cloudinary upload returned no result', 500, 'CLOUDINARY_ERROR'));
                }
                resolve({
                    secure_url: result.secure_url,
                    public_id: result.public_id,
                    resource_type: result.resource_type,
                    format: result.format,
                    bytes: result.bytes,
                    optimized_url: cloudinary.url(result.public_id, {
                        secure: true,
                        quality: 'auto',
                        fetch_format: 'auto'
                    })
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
        console.error('CLOUDINARY_DELETE_ERROR [public_id:', public_id, ']:', error);
        // We don't throw here to avoid blocking flows, but we log it.
    }
};

/**
 * Generates a signed URL for secure document access.
 */
export const getSignedUrl = (public_id: string): string => {
    return cloudinary.url(public_id, {
        sign_url: true,
        secure: true,
        type: 'authenticated'
    });
};

/**
 * Generates an optimized URL for public images.
 * Uses auto-format and auto-quality for maximum speed.
 */
export const getOptimizedUrl = (public_id: string, width?: number, height?: number): string => {
    return cloudinary.url(public_id, {
        secure: true,
        quality: 'auto',
        fetch_format: 'auto',
        width: width,
        height: height,
        crop: (width || height) ? 'limit' : undefined
    });
};

/**
 * Generates a signature for direct client-side uploads.
 * This is the FASTEST way to upload as it bypasses the app server.
 */
export const generateSignature = (folder: string) => {
    if (!process.env.CLOUDINARY_API_SECRET || !process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY) {
        console.error('CLOUDINARY_CONFIG_ERROR: Missing Cloudinary environment variables (API Key/Secret/CloudName).');
        throw new AppError('Cloudinary server configuration missing', 500, 'CLOUDINARY_CONFIG_ERROR');
    }

    const timestamp = Math.round((new Date()).getTime() / 1000);
    const signature = cloudinary.utils.api_sign_request(
        { timestamp, folder },
        process.env.CLOUDINARY_API_SECRET as string
    );

    return {
        signature,
        timestamp,
        cloudName: process.env.CLOUDINARY_CLOUD_NAME,
        apiKey: process.env.CLOUDINARY_API_KEY,
        folder
    };
};
