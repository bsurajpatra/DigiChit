import { Router } from 'express';
import { AuthController } from '../controllers/AuthController.js';
import { authRateLimiter } from '../../../middlewares/rateLimit.middleware.js';
import { registerValidation, loginValidation } from '../../../middlewares/validator.middleware.js';

const router = Router();

// Apply rate limiting to all auth endpoints
router.use(authRateLimiter);

router.post('/register', ...registerValidation, AuthController.register);
router.post('/login', ...loginValidation, AuthController.login);
router.get('/verify-email', AuthController.verifyEmail);
router.post('/resend-verification', AuthController.resendVerification);
router.post('/forgot-password', AuthController.forgotPassword);
router.post('/reset-password', AuthController.resetPassword);

export default router;
