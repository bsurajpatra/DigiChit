import { PaymentMethod, PaymentGatewayProvider } from '../models/Transaction.js';

export interface InitiatePaymentDTO {
    installmentId: string;
    amount?: number;
    currency?: string;
    paymentMethod?: PaymentMethod;
    paymentGateway?: PaymentGatewayProvider;
    metadata?: Record<string, any>;
}
