import { Router } from 'express';
import { UserController } from '../controllers/UserController.js';
import { protect, checkAccountActive } from '@modules/auth/index.js';
import { upload } from '@shared/middleware/upload.middleware.js';

const router = Router();

// All user routes require authentication
router.use(protect);

// Profile
router.get('/profile', UserController.getProfile);

// Change Password
router.post('/change-password', checkAccountActive, UserController.changePassword);

// User's own KYC document viewer (proxied — never exposes Cloudinary URLs)
router.get('/kyc/view/:field', UserController.viewMyKYCDocument);

// Profile Picture Upload & Removal
router.post('/profile-picture', upload.single('profilePicture'), UserController.uploadProfilePicture);
router.delete('/profile-picture', UserController.deleteProfilePicture);

// Direct Upload Signature
router.get('/upload-signature', UserController.getUploadSignature);

// Search User (for manual adding to groups)
router.get('/search', UserController.searchUserByEmail);

export default router;
