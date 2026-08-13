import mongoose, { Schema, Document } from 'mongoose';
import { AccountType, AccountCategory, AccountScope } from '../enums/account.enum.js';
import { AppError } from '@shared/errors/AppError.js';

export interface IAccount extends Document {
    accountNumber: string;
    name: string;
    type: AccountType;
    category: AccountCategory;
    scope: AccountScope;
    groupId?: mongoose.Types.ObjectId | null;
    memberId?: mongoose.Types.ObjectId | null;
    currency: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const AccountSchema = new Schema<IAccount>(
    {
        accountNumber: {
            type: String,
            required: [true, 'Account number is required'],
            unique: true,
            trim: true
        },
        name: {
            type: String,
            required: [true, 'Account name is required'],
            trim: true
        },
        type: {
            type: String,
            enum: Object.values(AccountType),
            required: [true, 'Account type is required']
        },
        category: {
            type: String,
            enum: Object.values(AccountCategory),
            required: [true, 'Account category is required']
        },
        scope: {
            type: String,
            enum: Object.values(AccountScope),
            required: [true, 'Account scope is required']
        },
        groupId: {
            type: Schema.Types.ObjectId,
            ref: 'ChitGroup',
            default: null
        },
        memberId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            default: null
        },
        currency: {
            type: String,
            default: 'INR',
            uppercase: true,
            trim: true
        },
        isActive: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true
    }
);

// Scope Integrity Pre-save Hook
AccountSchema.pre('save', function (this: IAccount) {
    if (this.scope === AccountScope.SYSTEM) {
        if (this.groupId || this.memberId) {
            throw new AppError('SYSTEM scoped account must have null groupId and memberId', 400, 'INVALID_ACCOUNT_SCOPE');
        }
    } else if (this.scope === AccountScope.GROUP) {
        if (!this.groupId) {
            throw new AppError('GROUP scoped account requires a valid groupId', 400, 'INVALID_ACCOUNT_SCOPE');
        }
        if (this.memberId) {
            throw new AppError('GROUP scoped account must have null memberId', 400, 'INVALID_ACCOUNT_SCOPE');
        }
    } else if (this.scope === AccountScope.MEMBER) {
        if (!this.groupId || !this.memberId) {
            throw new AppError('MEMBER scoped account requires both groupId and memberId', 400, 'INVALID_ACCOUNT_SCOPE');
        }
    }
});

// Indexes
AccountSchema.index({ groupId: 1, scope: 1 });
AccountSchema.index({ memberId: 1, groupId: 1 });

export default mongoose.model<IAccount>('Account', AccountSchema);
