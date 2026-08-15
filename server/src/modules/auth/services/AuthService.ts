import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { AuthRepository } from '../repositories/AuthRepository.js';
import { IUser, UserRole, AccountStatus } from '@modules/user/models/User.js';
import { sendVerificationEmail, sendPasswordResetEmail, sendWelcomeEmail } from '@shared/utils/email.js';
import { AppError } from '@shared/errors/AppError.js';
import { IRegisterInput, ILoginResponse, IVerifyEmailResponse } from '../interfaces/IAuth.js';
import { logAction } from '@shared/logger/auditLogger.js';
import { logger } from '@shared/logger/logger.js';
import { config } from '@shared/config/env.js';

export class AuthService {
    private repo: AuthRepository;

    constructor() {
        this.repo = new AuthRepository();
    }

    public async register(userData: Record<string, any>): Promise<IUser> {
        const name = userData.name as string;
        const rawEmail = userData.email as string;
        const password = userData.password as string;
        const age = userData.age as number;

        if (!name || !rawEmail || !password || !age) {
            throw new AppError('Name, email, password and age are required', 400, 'AUTH_MISSING_FIELDS');
        }

        const email = rawEmail.trim().toLowerCase();
        logger.info(`[AUTH_SERVICE] register: Checking existing user with email "${email}"`);

        if (age < 21) {
            throw new AppError('You must be at least 21 years old to register', 400, 'AUTH_INVALID_AGE');
        }

        const existingUser = await this.repo.findUserByEmail(email);
        if (existingUser) {
            logger.warn(`[AUTH_SERVICE] register: Duplicate registration attempt for "${email}"`);
            throw new AppError('An account with this email address already exists. Please log in instead.', 400, 'AUTH_EMAIL_EXISTS');
        }

        const hashedPassword = await bcrypt.hash(password, 12);
        const user = await this.repo.createUser({
            name: name.trim(),
            email,
            password: hashedPassword,
            age,
            role: UserRole.USER,
            emailVerified: false,
            accountStatus: AccountStatus.REGISTERED,
            tokenVersion: 0
        });

        const verificationToken = crypto.randomBytes(32).toString('hex');
        await this.repo.createToken(
            user._id,
            verificationToken,
            new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
        );

        try {
            await sendVerificationEmail(email, verificationToken);
        } catch (e) {
            logger.warn('Verification email dispatch warning:', e);
        }

        logger.info(`[AUTH_SERVICE] register: Successfully created user "${email}" (ID: ${user._id})`);
        return user;
    }

    public async login(rawEmail: string, password: string): Promise<ILoginResponse> {
        if (!rawEmail || !password) {
            logger.warn('[AUTH_SERVICE] login: Missing email or password in request payload');
            throw new AppError('Email and password are required', 400, 'AUTH_MISSING_FIELDS');
        }

        const email = rawEmail.trim().toLowerCase();
        logger.info(`[AUTH_SERVICE] login: Step 1 - Querying database for email: "${email}"`);
        
        const user = await this.repo.findUserByEmail(email, true);
        if (!user) {
            logger.warn(`[AUTH_SERVICE] login: Step 1 FAILED - No user found for "${email}"`);
            await logAction('anonymous', 'UNKNOWN', 'LOGIN_FAILED', { newValue: { email, reason: 'Email not found' } });
            throw new AppError('No account found with this email address. Please check your email or register.', 404, 'AUTH_EMAIL_NOT_FOUND');
        }

        logger.info(`[AUTH_SERVICE] login: Step 2 - User found (ID: ${user._id}, Role: ${user.role}, Verified: ${user.emailVerified}, Status: ${user.accountStatus}, HasPasswordHash: ${!!user.password})`);

        if (!user.password) {
            logger.error(`[AUTH_SERVICE] login: Step 2 FAILED - User "${email}" has no password hash in database`);
            await logAction(user._id.toString(), user.role, 'LOGIN_FAILED', { newValue: { email, reason: 'Password hash missing' } });
            throw new AppError('Account authentication data is invalid. Please reset your password.', 400, 'AUTH_INVALID_PASSWORD');
        }

        logger.info(`[AUTH_SERVICE] login: Step 3 - Validating password hash with bcrypt`);
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            logger.warn(`[AUTH_SERVICE] login: Step 3 FAILED - Incorrect password supplied for "${email}"`);
            await logAction(user._id.toString(), user.role, 'LOGIN_FAILED', { newValue: { email, reason: 'Incorrect password' } });
            throw new AppError('Incorrect password. Please check your password and try again.', 401, 'AUTH_INCORRECT_PASSWORD');
        }

        logger.info(`[AUTH_SERVICE] login: Step 4 - Password valid! Checking email verification & account status`);

        // Require email verification unless ADMIN
        if (user.role !== UserRole.ADMIN && !user.emailVerified) {
            logger.warn(`[AUTH_SERVICE] login: Step 4 FAILED - Email unverified for "${email}"`);
            await logAction(user._id.toString(), user.role, 'LOGIN_FAILED', { newValue: { email, reason: 'Email unverified' } });
            throw new AppError('Your email address is not verified yet. Please check your inbox or resend verification.', 403, 'AUTH_EMAIL_UNVERIFIED');
        }

        const isAccountBlocked = [AccountStatus.FROZEN, AccountStatus.SUSPENDED, AccountStatus.DELETED].includes(user.accountStatus as AccountStatus);
        if (isAccountBlocked) {
            logger.warn(`[AUTH_SERVICE] login: Step 4 FAILED - Account status is ${user.accountStatus} for "${email}"`);
            await logAction(user._id.toString(), user.role, 'LOGIN_FAILED', { newValue: { email, reason: `Account ${user.accountStatus}` } });
            throw new AppError(`Your account is ${user.accountStatus.toLowerCase()}. Access denied.`, 403, 'AUTH_ACCOUNT_BLOCKED');
        }

        if (user.accountStatus === AccountStatus.INACTIVE || user.accountStatus === AccountStatus.REGISTERED) {
            user.accountStatus = AccountStatus.ACTIVE;
        }
        user.lastLoginAt = new Date();
        await this.repo.saveUser(user);

        logger.info(`[AUTH_SERVICE] login: Step 5 - Issuing JWT token (TokenVersion: ${user.tokenVersion ?? 0})`);
        const token = jwt.sign(
            { id: user._id.toString(), role: user.role, tokenVersion: user.tokenVersion ?? 0 },
            config.jwtSecret,
            { expiresIn: '1d' }
        );

        await logAction(user._id.toString(), user.role, 'LOGIN_SUCCESS', { newValue: { email } });
        logger.info(`[AUTH_SERVICE] login: SUCCESS - Token generated and login audit logged for "${email}"`);

        return { user, token };
    }

    public async verifyEmail(tokenString: string): Promise<IVerifyEmailResponse> {
        const tokenDoc = await this.repo.findTokenByString(tokenString);

        if (!tokenDoc) {
            throw new AppError('Verification link is invalid or has already been used.', 400, 'AUTH_TOKEN_INVALID');
        }

        if (tokenDoc.expiresAt && new Date(tokenDoc.expiresAt) < new Date()) {
            throw new AppError('Verification link has expired. Please request a new verification link.', 400, 'AUTH_TOKEN_EXPIRED');
        }

        const user = await this.repo.findUserById(tokenDoc.userId);
        if (!user) {
            throw new AppError('User not found', 404, 'AUTH_USER_NOT_FOUND');
        }

        if (!user.emailVerified || user.accountStatus === AccountStatus.REGISTERED) {
            user.emailVerified = true;
            if (user.accountStatus === AccountStatus.REGISTERED) {
                user.accountStatus = AccountStatus.ACTIVE;
            }
            await this.repo.saveUser(user);
            
            try {
                await sendWelcomeEmail(user.email, user.name);
            } catch (e) {
                logger.error('Welcome email failed:', e);
            }
            await logAction(user._id.toString(), user.role, 'EMAIL_VERIFIED', { newValue: { email: user.email } });
        }

        // Delete token once verified
        await this.repo.deleteTokenById(tokenDoc._id);

        // Issue JWT token on verification for seamless single-click login
        const token = jwt.sign(
            { id: user._id.toString(), role: user.role, tokenVersion: user.tokenVersion ?? 0 },
            config.jwtSecret,
            { expiresIn: '1d' }
        );

        return { user, token };
    }

    public async resendVerificationToken(rawEmail: string): Promise<void> {
        const email = (rawEmail || '').trim().toLowerCase();
        const user = await this.repo.findUserByEmail(email);
        if (!user) {
            throw new AppError('User not found with this email', 404, 'AUTH_USER_NOT_FOUND');
        }

        if (user.emailVerified) {
            throw new AppError('Email is already verified', 400, 'AUTH_EMAIL_ALREADY_VERIFIED');
        }

        // Delete existing tokens
        await this.repo.deleteTokensByUserId(user._id);

        const verificationToken = crypto.randomBytes(32).toString('hex');
        await this.repo.createToken(
            user._id,
            verificationToken,
            new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
        );

        await sendVerificationEmail(email, verificationToken);
    }

    public async forgotPassword(rawEmail: string): Promise<void> {
        const email = (rawEmail || '').trim().toLowerCase();
        const user = await this.repo.findUserByEmail(email);
        if (!user) {
            throw new AppError('User not found with this email', 404, 'AUTH_USER_NOT_FOUND');
        }

        if (user.accountStatus !== 'ACTIVE') {
            throw new AppError('Account is not active', 403, 'AUTH_ACCOUNT_STATUS');
        }

        // Delete existing tokens for resetting password
        await this.repo.deleteTokensByUserId(user._id);

        const resetToken = crypto.randomBytes(32).toString('hex');
        await this.repo.createToken(
            user._id,
            resetToken,
            new Date(Date.now() + 60 * 60 * 1000) // 1 hr
        );

        await sendPasswordResetEmail(email, resetToken);
    }

    public async resetPassword(tokenString: string, newPassword: string): Promise<void> {
        const tokenDoc = await this.repo.findValidPasswordResetToken(tokenString);
        if (!tokenDoc) {
            throw new AppError('Token invalid or expired', 400, 'AUTH_TOKEN_INVALID');
        }

        const user = await this.repo.findUserById(tokenDoc.userId);
        if (!user) {
            throw new AppError('User not found', 404, 'AUTH_USER_NOT_FOUND');
        }

        const hashedPassword = await bcrypt.hash(newPassword, 12);
        user.password = hashedPassword;
        user.tokenVersion = (user.tokenVersion || 0) + 1; // Invalidate previous sessions
        await this.repo.saveUser(user);

        await this.repo.deleteTokensByUserId(user._id);
        await logAction(user._id.toString(), user.role, 'PASSWORD_RESET', { newValue: { email: user.email } });
    }
}
