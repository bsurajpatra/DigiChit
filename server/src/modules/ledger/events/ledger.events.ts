/**
 * Placeholder file for future Ledger Domain Events and Event Listeners.
 * Subscriptions to Payment/Transaction domain events (TRANSACTION_SUCCESS, TRANSACTION_REFUNDED)
 * will be connected in future iterations.
 */

export enum LedgerDomainEventType {
    ENTRY_CREATED = 'LEDGER_ENTRY_CREATED'
}

export interface LedgerDomainEvent {
    eventType: LedgerDomainEventType;
    timestamp: Date;
    data: Record<string, any>;
}
