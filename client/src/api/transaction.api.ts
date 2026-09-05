import api from './axios';

export type TransactionStatus =
    | 'PENDING'
    | 'SUCCESS'
    | 'FAILED'
    | 'CANCELLED'
    | 'REFUNDED'
    | 'PARTIALLY_REFUNDED'
    | 'EXPIRED';

export type PaymentMethod = 'UPI' | 'CARD' | 'NET_BANKING' | 'WALLET' | 'MOCK';
export type PaymentGatewayProvider = 'MOCK' | 'RAZORPAY' | 'CASHFREE' | 'STRIPE';

export interface TransactionRecord {
    _id: string;
    transactionNumber: string;
    memberId: { _id: string; name: string; email: string };
    groupId: { _id: string; name: string; monthlyContribution?: number };
    cycleId: { _id: string; cycleNumber: number; status?: string };
    installmentId: { _id: string; installmentNumber: number; dueDate?: string; amount: number; paymentStatus?: string };
    amount: number;
    currency: string;
    paymentMethod: PaymentMethod;
    paymentGateway: PaymentGatewayProvider;
    gatewayReference?: string;
    gatewayOrderId?: string;
    gatewayPaymentId?: string;
    status: TransactionStatus;
    failureReason?: string;
    receiptNumber?: string;
    receiptUrl?: string;
    metadata?: Record<string, any>;
    initiatedAt: string;
    completedAt?: string;
    refundedAt?: string;
    createdAt: string;
    updatedAt: string;
}

export interface PaginatedTransactionsResponse {
    data: TransactionRecord[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface InitiatePaymentPayload {
    installmentId: string;
    amount?: number;
    currency?: string;
    paymentMethod?: PaymentMethod;
    paymentGateway?: PaymentGatewayProvider;
    metadata?: Record<string, any>;
}

export interface VerifyPaymentPayload {
    transactionId: string;
    gatewayOrderId?: string;
    gatewayPaymentId: string;
    gatewaySignature?: string;
}

export interface RefundPaymentPayload {
    transactionId: string;
    amount?: number;
    reason?: string;
}

export interface TransactionQueryParams {
    memberId?: string;
    groupId?: string;
    cycleId?: string;
    installmentId?: string;
    status?: TransactionStatus;
    paymentMethod?: PaymentMethod;
    paymentGateway?: PaymentGatewayProvider;
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export const initiatePayment = async (
    payload: InitiatePaymentPayload,
    idempotencyKey?: string
): Promise<TransactionRecord> => {
    const key =
        idempotencyKey ||
        (typeof crypto !== 'undefined' && crypto.randomUUID
            ? crypto.randomUUID()
            : `idemp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`);
    const res = await api.post('/transactions/initiate', payload, {
        headers: {
            'Idempotency-Key': key
        }
    });
    return res.data.data.transaction;
};

export const verifyPayment = async (payload: VerifyPaymentPayload): Promise<TransactionRecord> => {
    const res = await api.post('/transactions/verify', payload);
    return res.data.data.transaction;
};

export const refundPayment = async (payload: RefundPaymentPayload): Promise<TransactionRecord> => {
    const res = await api.post('/transactions/refund', payload);
    return res.data.data.transaction;
};

export const fetchTransactionById = async (id: string): Promise<TransactionRecord> => {
    const res = await api.get(`/transactions/${id}`);
    return res.data.data.transaction;
};

export const fetchMemberTransactions = async (
    memberId: string,
    params?: TransactionQueryParams
): Promise<PaginatedTransactionsResponse> => {
    const res = await api.get(`/transactions/member/${memberId}`, { params });
    return res.data.data;
};

export const fetchGroupTransactions = async (
    groupId: string,
    params?: TransactionQueryParams
): Promise<PaginatedTransactionsResponse> => {
    const res = await api.get(`/transactions/group/${groupId}`, { params });
    return res.data.data;
};

export const fetchAllTransactions = async (
    params?: TransactionQueryParams
): Promise<PaginatedTransactionsResponse> => {
    const res = await api.get('/transactions', { params });
    return res.data.data;
};
