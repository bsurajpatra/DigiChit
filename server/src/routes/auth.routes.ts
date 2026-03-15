import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import { authRateLimiter } from '../middlewares/rateLimit.middleware.js';
import { registerValidation, loginValidation } from '../middlewares/validator.middleware.js';

const router = Router();

// Apply rate limiting to all auth endpoints
router.use(authRateLimiter);

router.post('/register', ...registerValidation, authController.register);
router.post('/login', ...loginValidation, authController.login);
router.get('/verify-email', authController.verifyEmail);
router.post('/resend-verification', authController.resendVerification);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

export default router;
