import mongoose, { Schema, Document } from 'mongoose';

export enum TransactionStatus {
    PENDING = 'PENDING',
    SUCCESS = 'SUCCESS',
    FAILED = 'FAILED',
    CANCELLED = 'CANCELLED',
    REFUNDED = 'REFUNDED',
    PARTIALLY_REFUNDED = 'PARTIALLY_REFUNDED',
    EXPIRED = 'EXPIRED'
}

export enum PaymentMethod {
    UPI = 'UPI',
    CARD = 'CARD',
    NET_BANKING = 'NET_BANKING',
    WALLET = 'WALLET',
    MOCK = 'MOCK'
}

export enum PaymentGatewayProvider {
    MOCK = 'MOCK',
    RAZORPAY = 'RAZORPAY',
    CASHFREE = 'CASHFREE',
    STRIPE = 'STRIPE'
}

export interface IReceiptMetadata {
    receiptNumber: string;
    receiptUrl?: string;
    issuedAt: Date;
    payerName?: string;
    payerEmail?: string;
    details?: Record<string, any>;
}

export interface ITransaction extends Document {
    transactionNumber: string;
    memberId: mongoose.Types.ObjectId;
    groupId: mongoose.Types.ObjectId;
    cycleId: mongoose.Types.ObjectId;
    installmentId: mongoose.Types.ObjectId;
    amount: number;
    currency: string;
    paymentMethod: PaymentMethod;
    paymentGateway: PaymentGatewayProvider;
    gatewayReference?: string | null;
    gatewayOrderId?: string | null;
    gatewayPaymentId?: string | null;
    status: TransactionStatus;
    failureReason?: string | null;
    receiptNumber?: string | null;
    receiptUrl?: string | null;
    metadata?: Record<string, any>;
    initiatedAt: Date;
    completedAt?: Date | null;
    refundedAt?: Date | null;
    createdBy?: mongoose.Types.ObjectId | null;
    updatedBy?: mongoose.Types.ObjectId | null;
    deletedAt?: Date | null;
    createdAt: Date;
    updatedAt: Date;
}

const TransactionSchema: Schema = new Schema<ITransaction>(
    {
        transactionNumber: {
            type: String,
            required: [true, 'Transaction number is required'],
            unique: true,
            trim: true
        },
        memberId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Member ID is required'],
            index: true
        },
        groupId: {
            type: Schema.Types.ObjectId,
            ref: 'ChitGroup',
            required: [true, 'Group ID is required'],
            index: true
        },
        cycleId: {
            type: Schema.Types.ObjectId,
            ref: 'ChitCycle',
            required: [true, 'Cycle ID is required'],
            index: true
        },
        installmentId: {
            type: Schema.Types.ObjectId,
            ref: 'Installment',
            required: [true, 'Installment ID is required'],
            index: true
        },
        amount: {
            type: Number,
            required: [true, 'Transaction amount is required'],
            min: [0.01, 'Amount must be greater than zero']
        },
        currency: {
            type: String,
            required: [true, 'Currency is required'],
            default: 'INR',
            uppercase: true,
            trim: true
        },
        paymentMethod: {
            type: String,
            enum: Object.values(PaymentMethod),
            default: PaymentMethod.MOCK,
            required: true
        },
        paymentGateway: {
            type: String,
            enum: Object.values(PaymentGatewayProvider),
            default: PaymentGatewayProvider.MOCK,
            required: true
        },
        gatewayReference: {
            type: String,
            sparse: true,
            trim: true
        },
        gatewayOrderId: {
            type: String,
            sparse: true,
            trim: true
        },
        gatewayPaymentId: {
            type: String,
            sparse: true,
            trim: true
        },
        status: {
            type: String,
            enum: Object.values(TransactionStatus),
            default: TransactionStatus.PENDING,
            required: true,
            index: true
        },
        failureReason: {
            type: String,
            default: null
        },
        receiptNumber: {
            type: String,
            sparse: true,
            trim: true
        },
        receiptUrl: {
            type: String,
            default: null
        },
        metadata: {
            type: Schema.Types.Mixed,
            default: {}
        },
        initiatedAt: {
            type: Date,
            default: Date.now,
            required: true
        },
        completedAt: {
            type: Date,
            default: null
        },
        refundedAt: {
            type: Date,
            default: null
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            default: null
        },
        updatedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            default: null
        },
        deletedAt: {
            type: Date,
            default: null,
            index: true
        }
    },
    {
        timestamps: true
    }
);

// Indexes
TransactionSchema.index({ transactionNumber: 1 }, { unique: true });
TransactionSchema.index({ gatewayReference: 1 }, { unique: true, sparse: true });
TransactionSchema.index({ memberId: 1, status: 1 });
TransactionSchema.index({ installmentId: 1, status: 1 });
TransactionSchema.index({ groupId: 1, createdAt: -1 });
TransactionSchema.index({ createdAt: -1 });

export default mongoose.model<ITransaction>('Transaction', TransactionSchema);
