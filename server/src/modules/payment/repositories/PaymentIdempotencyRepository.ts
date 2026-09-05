import mongoose from 'mongoose';
import PaymentIdempotency, { IPaymentIdempotency, PaymentIdempotencyStatus } from '../models/PaymentIdempotency.js';

export class PaymentIdempotencyRepository {
    public async createInProgress(
        userId: string,
        key: string,
        requestFingerprint: string,
        ttlMs: number = 24 * 60 * 60 * 1000
    ): Promise<IPaymentIdempotency> {
        const expiresAt = new Date(Date.now() + ttlMs);
        return await PaymentIdempotency.create({
            userId: new mongoose.Types.ObjectId(userId),
            key: key.trim(),
            requestFingerprint,
            status: PaymentIdempotencyStatus.IN_PROGRESS,
            expiresAt
        });
    }

    public async findByUserAndKey(userId: string, key: string): Promise<IPaymentIdempotency | null> {
        if (!mongoose.Types.ObjectId.isValid(userId) || !key) return null;
        return await PaymentIdempotency.findOne({
            userId: new mongoose.Types.ObjectId(userId),
            key: key.trim()
        });
    }

    public async markSuccess(
        id: string | mongoose.Types.ObjectId,
        transactionId: string | mongoose.Types.ObjectId,
        responseData?: Record<string, any>
    ): Promise<IPaymentIdempotency | null> {
        return await PaymentIdempotency.findByIdAndUpdate(
            id,
            {
                status: PaymentIdempotencyStatus.SUCCESS,
                transactionId: new mongoose.Types.ObjectId(transactionId.toString()),
                responseData: responseData || null,
                failureReason: null
            },
            { returnDocument: 'after' }
        );
    }

    public async markFailed(
        id: string | mongoose.Types.ObjectId,
        failureReason?: string
    ): Promise<IPaymentIdempotency | null> {
        return await PaymentIdempotency.findByIdAndUpdate(
            id,
            {
                status: PaymentIdempotencyStatus.FAILED,
                failureReason: failureReason || 'Payment initiation failed'
            },
            { returnDocument: 'after' }
        );
    }

    public async resetToInProgress(
        id: string | mongoose.Types.ObjectId,
        requestFingerprint: string
    ): Promise<IPaymentIdempotency | null> {
        return await PaymentIdempotency.findByIdAndUpdate(
            id,
            {
                status: PaymentIdempotencyStatus.IN_PROGRESS,
                requestFingerprint,
                failureReason: null
            },
            { returnDocument: 'after' }
        );
    }

    public async deleteById(id: string | mongoose.Types.ObjectId): Promise<void> {
        await PaymentIdempotency.findByIdAndDelete(id);
    }
}
