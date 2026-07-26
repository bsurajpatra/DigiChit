export interface VerifyPaymentDTO {
    transactionId: string;
    gatewayOrderId?: string;
    gatewayPaymentId: string;
    gatewaySignature?: string;
}
