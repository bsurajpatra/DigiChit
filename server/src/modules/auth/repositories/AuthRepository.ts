import mongoose from 'mongoose';
import User, { IUser } from '@modules/user/models/User.js';
import Token, { IToken } from '../models/Token.js';

export class AuthRepository {
    public async findUserByEmail(email: string, selectPassword = false): Promise<IUser | null> {
        if (!email) return null;
        const normalizedEmail = email.trim().toLowerCase();
        const query = User.findOne({ email: normalizedEmail });
        if (selectPassword) {
            query.select('+password');
        }
        return await query;
    }

    public async findUserById(userId: any): Promise<IUser | null> {
        if (!mongoose.Types.ObjectId.isValid(userId)) return null;
        return await User.findById(userId);
    }

    public async createUser(data: Partial<IUser>): Promise<IUser> {
        if (data.email) {
            data.email = data.email.trim().toLowerCase();
        }
        return await User.create(data);
    }

    public async saveUser(userDoc: IUser): Promise<IUser> {
        return await userDoc.save({ validateBeforeSave: false });
    }

    public async findTokenByString(token: string): Promise<IToken | null> {
        return await Token.findOne({ token });
    }

    public async findValidPasswordResetToken(token: string): Promise<IToken | null> {
        return await Token.findOne({
            token,
            expiresAt: { $gt: new Date() }
        });
    }

    public async createToken(userId: any, token: string, expiresAt: Date): Promise<IToken> {
        return await Token.create({
            userId,
            token,
            expiresAt
        });
    }

    public async deleteTokenById(tokenId: any): Promise<void> {
        await Token.deleteOne({ _id: tokenId });
    }

    public async deleteTokensByUserId(userId: any): Promise<void> {
        await Token.deleteMany({ userId });
    }
}
