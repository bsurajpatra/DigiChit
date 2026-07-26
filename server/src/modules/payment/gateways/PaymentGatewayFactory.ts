import { PaymentGateway } from '../interfaces/IPaymentGateway.js';
import { PaymentGatewayProvider } from '../models/Transaction.js';
import { MockPaymentGateway } from './mock/MockPaymentGateway.js';

export class PaymentGatewayFactory {
    private static mockInstance: MockPaymentGateway;

    public static getGateway(provider: PaymentGatewayProvider = PaymentGatewayProvider.MOCK): PaymentGateway {
        switch (provider) {
            case PaymentGatewayProvider.MOCK:
                if (!PaymentGatewayFactory.mockInstance) {
                    PaymentGatewayFactory.mockInstance = new MockPaymentGateway();
                }
                return PaymentGatewayFactory.mockInstance;

            case PaymentGatewayProvider.RAZORPAY:
            case PaymentGatewayProvider.CASHFREE:
            case PaymentGatewayProvider.STRIPE:
                // Future production gateway integration hooks
                // Fallback to MockGateway if credentials are not configured yet
                if (!PaymentGatewayFactory.mockInstance) {
                    PaymentGatewayFactory.mockInstance = new MockPaymentGateway();
                }
                return PaymentGatewayFactory.mockInstance;

            default:
                if (!PaymentGatewayFactory.mockInstance) {
                    PaymentGatewayFactory.mockInstance = new MockPaymentGateway();
                }
                return PaymentGatewayFactory.mockInstance;
        }
    }
}
