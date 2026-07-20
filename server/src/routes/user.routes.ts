import { Router } from 'express';
import * as userController from '../controllers/user.controller.js';
import { protect, checkAccountActive } from '../middlewares/auth.js';
import { upload } from '../utils/upload.js';

const router = Router();

// All user routes require authentication
router.use(protect);

// Profile
router.get('/profile', userController.getProfile);

// Change Password
router.post('/change-password', checkAccountActive, userController.changePassword);

// User's own KYC document viewer (proxied — never exposes Cloudinary URLs)
router.get('/kyc/view/:field', userController.viewMyKYCDocument);

// Profile Picture Upload & Removal
router.post('/profile-picture', upload.single('profilePicture'), userController.uploadProfilePicture);
router.delete('/profile-picture', userController.deleteProfilePicture);

// Direct Upload Signature
router.get('/upload-signature', userController.getUploadSignature);

// Search User (for manual adding to groups)
router.get('/search', userController.searchUserByEmail);

export default router;
