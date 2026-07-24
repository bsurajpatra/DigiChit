import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User, { IUser, UserRole, AccountStatus } from '../models/User.js';
import Token from '../models/Token.js';
import { sendVerificationEmail, sendPasswordResetEmail, sendWelcomeEmail } from '../utils/email.js';
import { AppError } from '../utils/appError.js';

export const register = async (userData: Record<string, any>) => {
    const name = userData.name as string;
    const email = userData.email as string;
    const password = userData.password as string;
    const age = userData.age as number;

    if (!name || !email || !password || !age) {
        throw new AppError('Name, email, password and age are required', 400, 'AUTH_MISSING_FIELDS');
    }

    if (age < 21) {
        throw new AppError('You must be at least 21 years old to register', 400, 'AUTH_INVALID_AGE');
    }

    const existingUser = await User.findOne({ email: email as string });
    if (existingUser) {
        throw new AppError('An account with this email address already exists. Please log in instead.', 400, 'AUTH_EMAIL_EXISTS');
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await User.create({
        name,
        email,
        password: hashedPassword,
        age,
        role: UserRole.USER,
        emailVerified: false,
        accountStatus: AccountStatus.REGISTERED
    });

    const verificationToken = crypto.randomBytes(32).toString('hex');
    await Token.create({
        userId: user._id,
        token: verificationToken,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    });

    try {
        await sendVerificationEmail(email, verificationToken);
    } catch (e) {
        console.warn('Verification email dispatch warning:', e);
    }

    return user;
};

export const login = async (email: string, password: string) => {
    const user = await User.findOne({ email: email as string }).select('+password');
    if (!user) {
        throw new AppError('No account found with this email address. Please check your email or register.', 404, 'AUTH_EMAIL_NOT_FOUND');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password!);
    if (!isPasswordValid) {
        throw new AppError('Incorrect password. Please check your password and try again.', 401, 'AUTH_INCORRECT_PASSWORD');
    }

    // Require email verification unless ADMIN
    if (user.role !== UserRole.ADMIN && !user.emailVerified) {
        throw new AppError('Your email address is not verified yet. Please check your inbox or resend verification.', 403, 'AUTH_EMAIL_UNVERIFIED');
    }

    const isAccountBlocked = [AccountStatus.FROZEN, AccountStatus.SUSPENDED, AccountStatus.DELETED].includes(user.accountStatus);
    if (isAccountBlocked) {
        throw new AppError(`Your account is ${user.accountStatus.toLowerCase()}. Access denied.`, 403, 'AUTH_ACCOUNT_BLOCKED');
    }

    if (user.accountStatus === AccountStatus.INACTIVE || user.accountStatus === AccountStatus.REGISTERED) {
        user.accountStatus = AccountStatus.ACTIVE;
    }
    user.lastLoginAt = new Date();
    await user.save({ validateBeforeSave: false });

    const token = jwt.sign(
        { id: user._id, role: user.role, tokenVersion: user.tokenVersion },
        process.env.JWT_SECRET!,
        { expiresIn: '1d' }
    );

    return { user, token };
};

export const verifyEmail = async (tokenString: string) => {
    const tokenDoc = await Token.findOne({ token: tokenString });

    if (!tokenDoc) {
        throw new AppError('Verification link is invalid or has already been used.', 400, 'AUTH_TOKEN_INVALID');
    }

    if (tokenDoc.expiresAt && new Date(tokenDoc.expiresAt) < new Date()) {
        throw new AppError('Verification link has expired. Please request a new verification link.', 400, 'AUTH_TOKEN_EXPIRED');
    }

    const user = await User.findById(tokenDoc.userId);
    if (!user) {
        throw new AppError('User not found', 404, 'AUTH_USER_NOT_FOUND');
    }

    if (!user.emailVerified || user.accountStatus === AccountStatus.REGISTERED) {
        user.emailVerified = true;
        if (user.accountStatus === AccountStatus.REGISTERED) {
            user.accountStatus = AccountStatus.ACTIVE;
        }
        await user.save({ validateBeforeSave: false });
        
        try {
            await sendWelcomeEmail(user.email, user.name);
        } catch (e) {
            console.error('Welcome email failed:', e);
        }
    }

    // Delete token once verified
    await Token.deleteOne({ _id: tokenDoc._id });

    // Issue JWT token on verification for seamless single-click login
    const token = jwt.sign(
        { id: user._id, role: user.role, tokenVersion: user.tokenVersion },
        process.env.JWT_SECRET!,
        { expiresIn: '1d' }
    );

    return { user, token };
};

export const resendVerificationToken = async (email: string) => {
    const user = await User.findOne({ email });
    if (!user) {
        throw new AppError('User not found with this email', 404, 'AUTH_USER_NOT_FOUND');
    }

    if (user.emailVerified) {
        throw new AppError('Email is already verified', 400, 'AUTH_EMAIL_ALREADY_VERIFIED');
    }

    // Delete existing tokens
    await Token.deleteMany({ userId: user._id });

    const verificationToken = crypto.randomBytes(32).toString('hex');
    await Token.create({
        userId: user._id,
        token: verificationToken,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    });

    await sendVerificationEmail(email, verificationToken);
};

export const forgotPassword = async (email: string) => {
    const user = await User.findOne({ email });
    if (!user) {
        throw new AppError('User not found with this email', 404, 'AUTH_USER_NOT_FOUND');
    }

    // Optional: Only allow active users to reset password
    if (user.accountStatus !== 'ACTIVE') {
        throw new AppError('Account is not active', 403, 'AUTH_ACCOUNT_STATUS');
    }

    // Delete existing tokens for resetting password
    await Token.deleteMany({ userId: user._id });

    const resetToken = crypto.randomBytes(32).toString('hex');
    await Token.create({
        userId: user._id,
        token: resetToken,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000) // 1 hr
    });

    await sendPasswordResetEmail(email, resetToken);
};

export const resetPassword = async (tokenString: string, newPassword: string) => {
    const tokenDoc = await Token.findOne({
        token: tokenString,
        expiresAt: { $gt: new Date() }
    });

    if (!tokenDoc) {
        throw new AppError('Token invalid or expired', 400, 'AUTH_TOKEN_INVALID');
    }

    const user = await User.findById(tokenDoc.userId);
    if (!user) {
        throw new AppError('User not found', 404, 'AUTH_USER_NOT_FOUND');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    user.password = hashedPassword;
    await user.save({ validateBeforeSave: false });

    await Token.deleteMany({ userId: user._id }); // Clean up tokens
};
