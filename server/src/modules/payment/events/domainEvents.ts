import { ITransaction } from '../models/Transaction.js';

export enum PaymentDomainEventType {
    TRANSACTION_CREATED = 'TRANSACTION_CREATED',
    TRANSACTION_SUCCESS = 'TRANSACTION_SUCCESS',
    TRANSACTION_FAILED = 'TRANSACTION_FAILED',
    TRANSACTION_REFUNDED = 'TRANSACTION_REFUNDED',
    COLLECTIONS_OPENED = 'COLLECTIONS_OPENED',
    COLLECTIONS_CLOSED = 'COLLECTIONS_CLOSED'
}

export interface PaymentDomainEvent<T = ITransaction> {
    eventType: PaymentDomainEventType;
    timestamp: Date;
    data: T;
    metadata?: Record<string, any>;
}
