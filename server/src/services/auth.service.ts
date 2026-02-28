import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User, { IUser, UserRole } from '../models/User.js';
import Token from '../models/Token.js';
import { sendVerificationEmail } from '../utils/email.js';
import { AppError } from '../utils/appError.js';

export const register = async (userData: any) => {
    const { name, email, password } = userData;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
        throw new AppError('Email already registered', 400, 'AUTH_EMAIL_EXISTS');
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await User.create({
        name,
        email,
        password: hashedPassword,
        role: UserRole.USER
    });

    const verificationToken = crypto.randomBytes(32).toString('hex');
    await Token.create({
        userId: user._id,
        token: verificationToken,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000) // 15 mins
    });

    await sendVerificationEmail(email, verificationToken);

    return user;
};

export const login = async (email: string, password: string) => {
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await bcrypt.compare(password, user.password!))) {
        throw new AppError('Invalid email or password', 401, 'AUTH_INVALID_CREDENTIALS');
    }

    if (!user.emailVerified) {
        throw new AppError('Please verify your email first', 403, 'AUTH_EMAIL_UNVERIFIED');
    }

    if (user.accountStatus !== 'ACTIVE') {
        throw new AppError(`Your account is ${user.accountStatus.toLowerCase()}`, 403, 'AUTH_ACCOUNT_STATUS');
    }

    const token = jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET!,
        { expiresIn: '1d' }
    );

    return { user, token };
};

export const verifyEmail = async (tokenString: string) => {
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

    user.emailVerified = true;
    await user.save();
    await Token.deleteMany({ userId: user._id }); // Clean up all tokens for this user

    return user;
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
        expiresAt: new Date(Date.now() + 15 * 60 * 1000) // 15 mins
    });

    await sendVerificationEmail(email, verificationToken);
};
