import mongoose, { Schema, Document } from 'mongoose';

/**
 * Payment status for an individual installment contribution.
 */
export enum PaymentStatus {
    PENDING = 'PENDING',
    PAID = 'PAID',
    PARTIALLY_PAID = 'PARTIALLY_PAID',
    FAILED = 'FAILED',
    OVERDUE = 'OVERDUE',
    WAIVED = 'WAIVED'
}

/**
 * Interface representing an Installment document in MongoDB.
 * Tracks monthly contribution obligations for each member within a specific ChitCycle.
 */
export interface IInstallment extends Document {
    membershipId: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    groupId: mongoose.Types.ObjectId;
    cycleId: mongoose.Types.ObjectId;
    installmentNumber: number;
    amount: number;
    paidAmount: number;
    dueDate: Date;
    paidDate?: Date | null;
    paymentStatus: PaymentStatus;
    paymentMethod?: string | null;
    transactionId?: mongoose.Types.ObjectId | null;
    lateFee: number;
    remarks?: string | null;
    createdAt: Date;
    updatedAt: Date;
}

const InstallmentSchema: Schema = new Schema<IInstallment>(
    {
        membershipId: {
            type: Schema.Types.ObjectId,
            ref: 'Membership',
            required: [true, 'Membership ID is required']
        },
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'User ID is required']
        },
        groupId: {
            type: Schema.Types.ObjectId,
            ref: 'ChitGroup',
            required: [true, 'Group ID is required']
        },
        cycleId: {
            type: Schema.Types.ObjectId,
            ref: 'ChitCycle',
            required: [true, 'Cycle ID is required']
        },
        installmentNumber: {
            type: Number,
            required: [true, 'Installment number is required'],
            min: [1, 'Installment number must start at 1']
        },
        amount: {
            type: Number,
            required: [true, 'Installment amount is required'],
            min: [0, 'Amount cannot be negative']
        },
        paidAmount: {
            type: Number,
            default: 0,
            min: [0, 'Paid amount cannot be negative']
        },
        dueDate: {
            type: Date,
            required: [true, 'Due date is required']
        },
        paidDate: {
            type: Date,
            default: null
        },
        paymentStatus: {
            type: String,
            enum: Object.values(PaymentStatus),
            default: PaymentStatus.PENDING,
            required: true
        },
        paymentMethod: {
            type: String,
            trim: true,
            default: null
        },
        transactionId: {
            type: Schema.Types.ObjectId,
            ref: 'Transaction',
            default: null
        },
        lateFee: {
            type: Number,
            default: 0,
            min: [0, 'Late fee cannot be negative']
        },
        remarks: {
            type: String,
            trim: true,
            default: null
        }
    },
    {
        timestamps: true
    }
);

// -----------------------------------------------------------------------------
// INDEXES
// -----------------------------------------------------------------------------

// Business Rule 3: Unique constraint to guarantee ONE installment per membership per cycle
InstallmentSchema.index({ cycleId: 1, membershipId: 1 }, { unique: true });

// Query optimization for member payment history & group compliance reports
InstallmentSchema.index({ membershipId: 1, paymentStatus: 1 });
InstallmentSchema.index({ cycleId: 1, paymentStatus: 1 });
InstallmentSchema.index({ groupId: 1, installmentNumber: 1 });

export default mongoose.model<IInstallment>('Installment', InstallmentSchema);
