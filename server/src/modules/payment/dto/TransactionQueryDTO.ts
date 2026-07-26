import { TransactionStatus, PaymentMethod, PaymentGatewayProvider } from '../models/Transaction.js';

export interface TransactionQueryDTO {
    memberId?: string;
    groupId?: string;
    cycleId?: string;
    installmentId?: string;
    status?: TransactionStatus;
    paymentMethod?: PaymentMethod;
    paymentGateway?: PaymentGatewayProvider;
    startDate?: string;
    endDate?: string;
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
