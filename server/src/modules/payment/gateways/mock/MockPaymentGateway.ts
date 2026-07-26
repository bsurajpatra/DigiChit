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

export class MockPaymentGateway implements PaymentGateway {
    public async createOrder(input: CreateOrderInput): Promise<CreateOrderOutput> {
        // Simulate random processing latency (100ms - 300ms)
        await new Promise((resolve) => setTimeout(resolve, 150));

        const gatewayOrderId = `order_mock_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        const gatewayReference = `ref_mock_${Date.now()}`;

        return {
            gatewayOrderId,
            gatewayReference,
            amount: input.amount,
            currency: input.currency,
            status: 'created',
            rawResponse: {
                provider: 'MOCK_PAYMENT_GATEWAY',
                created_at: new Date().toISOString()
            }
        };
    }

    public async verifyPayment(input: VerifyPaymentInput): Promise<VerifyPaymentOutput> {
        await new Promise((resolve) => setTimeout(resolve, 200));

        // Allow simulating failure if gatewayPaymentId includes "fail"
        const shouldFail = input.gatewayPaymentId.toLowerCase().includes('fail');

        if (shouldFail) {
            return {
                isVerified: false,
                gatewayPaymentId: input.gatewayPaymentId,
                gatewayOrderId: input.gatewayOrderId,
                failureReason: 'Mock Payment verification rejected by test flag',
                rawResponse: { provider: 'MOCK_PAYMENT_GATEWAY', status: 'FAILED' }
            };
        }

        return {
            isVerified: true,
            gatewayPaymentId: input.gatewayPaymentId || `pay_mock_${Date.now()}`,
            gatewayOrderId: input.gatewayOrderId,
            paymentMethod: 'UPI',
            rawResponse: { provider: 'MOCK_PAYMENT_GATEWAY', status: 'SUCCESS' }
        };
    }

    public async refund(input: RefundInput): Promise<RefundOutput> {
        await new Promise((resolve) => setTimeout(resolve, 200));

        const refundId = `rfnd_mock_${Date.now()}`;

        return {
            refundId,
            gatewayPaymentId: input.gatewayPaymentId,
            amount: input.amount,
            status: 'PROCESSED',
            rawResponse: { provider: 'MOCK_PAYMENT_GATEWAY', refunded_at: new Date().toISOString() }
        };
    }

    public async cancel(input: CancelOrderInput): Promise<CancelOrderOutput> {
        await new Promise((resolve) => setTimeout(resolve, 100));

        return {
            success: true,
            gatewayOrderId: input.gatewayOrderId,
            status: 'CANCELLED'
        };
    }

    public async getPayment(gatewayPaymentId: string): Promise<any> {
        return {
            id: gatewayPaymentId,
            entity: 'payment',
            amount: 10000,
            currency: 'INR',
            status: 'captured',
            method: 'upi'
        };
    }
}
