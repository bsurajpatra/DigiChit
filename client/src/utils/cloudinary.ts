import axios from 'axios';
import api from '../api/axios';
import { config } from '../config/env';

/**
 * Generates an optimized Cloudinary URL with auto format and quality.
 */
export const getOptimizedImageUrl = (publicId: string, width?: number, height?: number) => {
  if (!publicId) return '';
  
  // If it's already a full URL, we try to extract the public ID or just return it
  if (publicId.startsWith('http')) {
    // Basic extraction if it's a cloudinary URL
    if (publicId.includes('cloudinary.com')) {
      const parts = publicId.split('/');
      const lastPart = parts[parts.length - 1];
      // This is a naive implementation, but often works for simple cases
      // Better to store public_ids in DB
      publicId = lastPart.split('.')[0];
    } else {
      return publicId;
    }
  }

  const { cloudName, resBaseUrl } = config.cloudinary;
  const baseUrl = `${resBaseUrl}/${cloudName}/image/upload`;
  
  const transformations = ['f_auto', 'q_auto'];
  if (width) transformations.push(`w_${width}`);
  if (height) transformations.push(`h_${height}`);
  if (width || height) transformations.push('c_limit');

  return `${baseUrl}/${transformations.join(',')}/${publicId}`;
};

/**
 * Compresses an image using Canvas before upload.
 * This makes the upload "fast fast" by reducing payload size.
 */
export const compressImage = (file: File, maxWidth = 1200, quality = 0.8): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (maxWidth / width) * height;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Canvas toBlob failed'));
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = () => reject(new Error('Image load failed'));
    };
    reader.onerror = () => reject(new Error('FileReader failed'));
  });
};

/**
 * High-performance direct upload to Cloudinary.
 * Bypasses the app server for maximum speed.
 */
export const uploadImageDirectly = async (file: File | Blob, folder: string) => {
  try {
    // 1. Get signature from our server
    const { data } = await api.get('/user/upload-signature');
    const { signature, timestamp, apiKey, cloudName } = data.data;

    // 2. Prepare Form Data
    const formData = new FormData();
    formData.append('file', file);
    formData.append('signature', signature);
    formData.append('timestamp', timestamp);
    formData.append('api_key', apiKey);
    formData.append('folder', folder);

    // 3. Upload directly to Cloudinary
    const response = await axios.post(
      `${config.cloudinary.uploadBaseUrl}/${cloudName}/image/upload`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' }
      }
    );

    return {
      secure_url: response.data.secure_url,
      public_id: response.data.public_id,
      optimized_url: getOptimizedImageUrl(response.data.public_id)
    };
  } catch (error) {
    console.error('Direct upload failed:', error);
    throw error;
  }
};
