import { v2 as cloudinary } from 'cloudinary';
import { config } from './env.js';

const { cloudName, apiKey, apiSecret } = config.cloudinary;

cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true
});

export default cloudinary;
