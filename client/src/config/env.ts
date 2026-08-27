/**
 * Centralized Client-side Environment Configuration
 */

const requiredEnv = [
  'VITE_API_URL',
  'VITE_CLOUDINARY_CLOUD_NAME'
];

// In development, we can log warnings. In production, we might want to throw if critical.
requiredEnv.forEach(env => {
  if (!import.meta.env[env]) {
    console.warn(`[Config] Environment variable ${env} is missing!`);
  }
});

export const config = {
  apiUrl: import.meta.env.VITE_API_URL as string,
  cloudinary: {
    cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string,
    uploadBaseUrl: 'https://api.cloudinary.com/v1_1',
    resBaseUrl: 'https://res.cloudinary.com'
  },
  razorpay: {
    keyId: (import.meta.env.VITE_RAZORPAY_KEY_ID as string) || ''
  }
};
