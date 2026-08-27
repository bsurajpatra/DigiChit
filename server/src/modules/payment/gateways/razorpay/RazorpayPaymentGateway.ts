import crypto from 'crypto';
import axios from 'axios';
import {
    PaymentGateway,
    CreateOrderInput,
    CreateOrderOutput,
    VerifyPaymentInput,
    VerifyPaymentOutput,
    RefundInput,
    RefundOutput,
    CancelOrderInput,
    CancelOrderOutput
} from '../../interfaces/IPaymentGateway.js';
import { AppError } from '@shared/errors/AppError.js';

export class RazorpayPaymentGateway implements PaymentGateway {
    private keyId: string;
    private keySecret: string;
    private baseUrl = 'https://api.razorpay.com/v1';

    constructor(keyId: string, keySecret: string) {
        this.keyId = keyId;
        this.keySecret = keySecret;
    }

    private getAuthHeader(): string {
        return `Basic ${Buffer.from(`${this.keyId}:${this.keySecret}`).toString('base64')}`;
    }

    /**
     * Creates an order with Razorpay in Test Mode.
     * Amount is passed in Rupees and converted to integer paise.
     */
    public async createOrder(input: CreateOrderInput): Promise<CreateOrderOutput> {
        if (!this.keyId || !this.keySecret) {
            throw new AppError('Razorpay API keys (RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET) are not configured', 500, 'RAZORPAY_CONFIG_MISSING');
        }

        const amountInPaise = Math.round(input.amount * 100);
        if (amountInPaise <= 0) {
            throw new AppError('Order amount must be greater than zero', 400, 'INVALID_AMOUNT');
        }

        const receiptStr = (input.receipt || `rcpt_${Date.now()}`).substring(0, 40);

        try {
            const response = await axios.post(
                `${this.baseUrl}/orders`,
                {
                    amount: amountInPaise,
                    currency: input.currency || 'INR',
                    receipt: receiptStr,
                    notes: input.notes || {}
                },
                {
                    headers: {
                        Authorization: this.getAuthHeader(),
                        'Content-Type': 'application/json'
                    }
                }
            );

            const order = response.data;

            return {
                gatewayOrderId: order.id,
                gatewayReference: order.receipt || receiptStr,
                amount: input.amount,
                currency: order.currency || 'INR',
                status: order.status || 'created',
                rawResponse: order
            };
        } catch (error: any) {
            const errorMsg = error.response?.data?.error?.description || error.message || 'Razorpay order creation failed';
            throw new AppError(errorMsg, error.response?.status || 500, 'RAZORPAY_ORDER_FAILED');
        }
    }

    /**
     * Cryptographically verifies Razorpay payment signature using HMAC-SHA256.
     * Formula: HMAC_SHA256(order_id + "|" + payment_id, secret) == signature
     */
    public async verifyPayment(input: VerifyPaymentInput): Promise<VerifyPaymentOutput> {
        if (!input.gatewayPaymentId) {
            return {
                isVerified: false,
                gatewayPaymentId: '',
                gatewayOrderId: input.gatewayOrderId || '',
                failureReason: 'Missing Razorpay Payment ID',
                rawResponse: { isVerified: false }
            };
        }

        if (!input.gatewayOrderId) {
            return {
                isVerified: false,
                gatewayPaymentId: input.gatewayPaymentId,
                gatewayOrderId: '',
                failureReason: 'Missing Razorpay Order ID',
                rawResponse: { isVerified: false }
            };
        }

        if (!input.gatewaySignature) {
            return {
                isVerified: false,
                gatewayPaymentId: input.gatewayPaymentId,
                gatewayOrderId: input.gatewayOrderId,
                failureReason: 'Missing Razorpay Payment Signature',
                rawResponse: { isVerified: false }
            };
        }

        if (!this.keySecret) {
            throw new AppError('Razorpay key secret is not configured on server', 500, 'RAZORPAY_SECRET_MISSING');
        }

        try {
            const payload = `${input.gatewayOrderId}|${input.gatewayPaymentId}`;
            const expectedSignature = crypto
                .createHmac('sha256', this.keySecret)
                .update(payload)
                .digest('hex');

            // Timing-safe comparison to prevent timing attacks
            const signatureBuffer = Buffer.from(input.gatewaySignature, 'utf8');
            const expectedBuffer = Buffer.from(expectedSignature, 'utf8');

            const isVerified =
                signatureBuffer.length === expectedBuffer.length &&
                crypto.timingSafeEqual(signatureBuffer, expectedBuffer);

            if (isVerified) {
                return {
                    isVerified: true,
                    gatewayPaymentId: input.gatewayPaymentId,
                    gatewayOrderId: input.gatewayOrderId,
                    paymentMethod: 'RAZORPAY',
                    rawResponse: {
                        provider: 'RAZORPAY',
                        verified: true,
                        signatureMatch: true
                    }
                };
            } else {
                return {
                    isVerified: false,
                    gatewayPaymentId: input.gatewayPaymentId,
                    gatewayOrderId: input.gatewayOrderId,
                    failureReason: 'Invalid Razorpay payment signature',
                    rawResponse: {
                        provider: 'RAZORPAY',
                        verified: false,
                        signatureMatch: false
                    }
                };
            }
        } catch (error: any) {
            return {
                isVerified: false,
                gatewayPaymentId: input.gatewayPaymentId,
                gatewayOrderId: input.gatewayOrderId,
                failureReason: error.message || 'Signature verification calculation error',
                rawResponse: { error: error.message }
            };
        }
    }

    /**
     * Issues full or partial refund on Razorpay.
     */
    public async refund(input: RefundInput): Promise<RefundOutput> {
        if (!this.keyId || !this.keySecret) {
            throw new AppError('Razorpay API keys are not configured', 500, 'RAZORPAY_CONFIG_MISSING');
        }

        const amountInPaise = Math.round(input.amount * 100);

        try {
            const response = await axios.post(
                `${this.baseUrl}/payments/${input.gatewayPaymentId}/refund`,
                {
                    amount: amountInPaise,
                    notes: {
                        reason: input.reason || 'DigiChit Refund'
                    }
                },
                {
                    headers: {
                        Authorization: this.getAuthHeader(),
                        'Content-Type': 'application/json'
                    }
                }
            );

            const refund = response.data;

            return {
                refundId: refund.id,
                gatewayPaymentId: input.gatewayPaymentId,
                amount: input.amount,
                status: refund.status || 'processed',
                rawResponse: refund
            };
        } catch (error: any) {
            const errorMsg = error.response?.data?.error?.description || error.message || 'Razorpay refund failed';
            throw new AppError(errorMsg, error.response?.status || 500, 'RAZORPAY_REFUND_FAILED');
        }
    }

    public async cancel(input: CancelOrderInput): Promise<CancelOrderOutput> {
        return {
            success: true,
            gatewayOrderId: input.gatewayOrderId,
            status: 'CANCELLED'
        };
    }

    public async getPayment(gatewayPaymentId: string): Promise<any> {
        if (!this.keyId || !this.keySecret) {
            throw new AppError('Razorpay API keys are not configured', 500, 'RAZORPAY_CONFIG_MISSING');
        }

        try {
            const response = await axios.get(`${this.baseUrl}/payments/${gatewayPaymentId}`, {
                headers: {
                    Authorization: this.getAuthHeader()
                }
            });
            return response.data;
        } catch (error: any) {
            const errorMsg = error.response?.data?.error?.description || error.message || 'Failed to fetch Razorpay payment';
            throw new AppError(errorMsg, error.response?.status || 500, 'RAZORPAY_FETCH_FAILED');
        }
    }
}
