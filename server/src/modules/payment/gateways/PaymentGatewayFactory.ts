import { PaymentGateway } from '../interfaces/IPaymentGateway.js';
import { PaymentGatewayProvider } from '../models/Transaction.js';
import { MockPaymentGateway } from './mock/MockPaymentGateway.js';
import { RazorpayPaymentGateway } from './razorpay/RazorpayPaymentGateway.js';
import { config } from '@shared/config/env.js';

export class PaymentGatewayFactory {
    private static mockInstance: MockPaymentGateway | null = null;
    private static razorpayInstance: RazorpayPaymentGateway | null = null;

    public static getGateway(provider: PaymentGatewayProvider = PaymentGatewayProvider.MOCK): PaymentGateway {
        switch (provider) {
            case PaymentGatewayProvider.RAZORPAY:
                if (!PaymentGatewayFactory.razorpayInstance) {
                    PaymentGatewayFactory.razorpayInstance = new RazorpayPaymentGateway(
                        config.razorpay.keyId,
                        config.razorpay.keySecret
                    );
                }
                return PaymentGatewayFactory.razorpayInstance;

            case PaymentGatewayProvider.MOCK:
            default:
                if (!PaymentGatewayFactory.mockInstance) {
                    PaymentGatewayFactory.mockInstance = new MockPaymentGateway();
                }
                return PaymentGatewayFactory.mockInstance;
        }
    }

    /**
     * Test / override hooks for mocking gateways in test runners.
     */
    public static setRazorpayInstance(instance: RazorpayPaymentGateway | null): void {
        PaymentGatewayFactory.razorpayInstance = instance;
    }

    public static setMockInstance(instance: MockPaymentGateway | null): void {
        PaymentGatewayFactory.mockInstance = instance;
    }

    public static resetInstances(): void {
        PaymentGatewayFactory.mockInstance = null;
        PaymentGatewayFactory.razorpayInstance = null;
    }
}
