export interface CreateOrderInput {
    amount: number;
    currency: string;
    receipt: string;
    notes?: Record<string, any>;
}

export interface CreateOrderOutput {
    gatewayOrderId: string;
    gatewayReference: string;
    amount: number;
    currency: string;
    status: string;
    rawResponse?: any;
}

export interface VerifyPaymentInput {
    gatewayOrderId: string;
    gatewayPaymentId: string;
    gatewaySignature?: string;
}

export interface VerifyPaymentOutput {
    isVerified: boolean;
    gatewayPaymentId: string;
    gatewayOrderId: string;
    paymentMethod?: string;
    failureReason?: string;
    rawResponse?: any;
}

export interface RefundInput {
    gatewayPaymentId: string;
    amount: number;
    currency?: string;
    reason?: string;
    metadata?: Record<string, any>;
}

export interface RefundOutput {
    refundId: string;
    gatewayPaymentId: string;
    amount: number;
    status: string;
    rawResponse?: any;
}

export interface CancelOrderInput {
    gatewayOrderId: string;
    reason?: string;
}

export interface CancelOrderOutput {
    success: boolean;
    gatewayOrderId: string;
    status: string;
}

export interface PaymentGateway {
    createOrder(input: CreateOrderInput): Promise<CreateOrderOutput>;
    verifyPayment(input: VerifyPaymentInput): Promise<VerifyPaymentOutput>;
    refund(input: RefundInput): Promise<RefundOutput>;
    cancel(input: CancelOrderInput): Promise<CancelOrderOutput>;
    getPayment(gatewayPaymentId: string): Promise<any>;
}
