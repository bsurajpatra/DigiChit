import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const requiredEnv = [
    'MONGODB_URI',
    'JWT_SECRET',
    'ENCRYPTION_KEY',
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET',
    'FRONTEND_URL'
];

// Validate that all required environment variables are set
for (const env of requiredEnv) {
    if (!process.env[env]) {
        throw new Error(`CRITICAL: Environment variable ${env} is missing!`);
    }
}

export const config = {
    port: parseInt(process.env.PORT || '5000', 10),
    mongoUri: process.env.MONGODB_URI as string,
    jwtSecret: process.env.JWT_SECRET as string,
    encryptionKey: process.env.ENCRYPTION_KEY as string,
    nodeEnv: process.env.NODE_ENV || 'development',
    frontendUrl: process.env.FRONTEND_URL as string,
    cloudinary: {
        cloudName: process.env.CLOUDINARY_CLOUD_NAME as string,
        apiKey: process.env.CLOUDINARY_API_KEY as string,
        apiSecret: process.env.CLOUDINARY_API_SECRET as string
    },
    email: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
        from: process.env.EMAIL_FROM
    }
};
