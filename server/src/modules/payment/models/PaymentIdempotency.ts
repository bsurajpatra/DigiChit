import mongoose, { Schema, Document } from 'mongoose';

export enum PaymentIdempotencyStatus {
    IN_PROGRESS = 'IN_PROGRESS',
    SUCCESS = 'SUCCESS',
    FAILED = 'FAILED'
}

export interface IPaymentIdempotency extends Document {
    userId: mongoose.Types.ObjectId;
    key: string;
    requestFingerprint: string;
    status: PaymentIdempotencyStatus;
    transactionId?: mongoose.Types.ObjectId | null;
    responseData?: Record<string, any> | null;
    failureReason?: string | null;
    expiresAt: Date;
    createdAt: Date;
    updatedAt: Date;
}

const PaymentIdempotencySchema = new Schema<IPaymentIdempotency>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'User ID is required']
        },
        key: {
            type: String,
            required: [true, 'Idempotency key is required'],
            trim: true,
            maxlength: [255, 'Idempotency key cannot exceed 255 characters']
        },
        requestFingerprint: {
            type: String,
            required: [true, 'Request fingerprint is required'],
            trim: true
        },
        status: {
            type: String,
            enum: Object.values(PaymentIdempotencyStatus),
            default: PaymentIdempotencyStatus.IN_PROGRESS,
            required: true
        },
        transactionId: {
            type: Schema.Types.ObjectId,
            ref: 'Transaction',
            default: null
        },
        responseData: {
            type: Schema.Types.Mixed,
            default: null
        },
        failureReason: {
            type: String,
            default: null
        },
        expiresAt: {
            type: Date,
            required: true
        }
    },
    {
        timestamps: true,
        collection: 'paymentidempotencies'
    }
);

// Enforce unique compound constraint for User + Key
PaymentIdempotencySchema.index({ userId: 1, key: 1 }, { unique: true });

// MongoDB TTL Index for automatic expiration cleanup after 24h
PaymentIdempotencySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const PaymentIdempotency = mongoose.model<IPaymentIdempotency>('PaymentIdempotency', PaymentIdempotencySchema);
export default PaymentIdempotency;
