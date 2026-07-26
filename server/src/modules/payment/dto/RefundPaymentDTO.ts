export interface RefundPaymentDTO {
    transactionId: string;
    amount?: number;
    reason?: string;
}
