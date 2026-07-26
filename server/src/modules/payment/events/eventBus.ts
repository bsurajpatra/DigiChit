import { EventEmitter } from 'events';
import { PaymentDomainEvent, PaymentDomainEventType } from './domainEvents.js';
import Installment, { PaymentStatus } from '../../../models/Installment.js';

class DomainEventBus extends EventEmitter {
    private static instance: DomainEventBus;

    private constructor() {
        super();
        this.registerDefaultListeners();
    }

    public static getInstance(): DomainEventBus {
        if (!DomainEventBus.instance) {
            DomainEventBus.instance = new DomainEventBus();
        }
        return DomainEventBus.instance;
    }

    public publish<T>(event: PaymentDomainEvent<T>): void {
        console.log(`[EventBus] Publishing Domain Event: ${event.eventType} for transaction ${(event.data as any)?.transactionNumber || ''}`);
        this.emit(event.eventType, event);
    }

    private registerDefaultListeners(): void {
        // Event Listener: When TRANSACTION_SUCCESS fires, update associated Installment status to PAID
        this.on(PaymentDomainEventType.TRANSACTION_SUCCESS, async (event: PaymentDomainEvent<any>) => {
            try {
                const txn = event.data;
                if (txn && txn.installmentId) {
                    await Installment.findByIdAndUpdate(txn.installmentId, {
                        paymentStatus: PaymentStatus.PAID,
                        paidAmount: txn.amount,
                        paidDate: txn.completedAt || new Date(),
                        paymentMethod: txn.paymentMethod,
                        transactionId: txn._id
                    });
                    console.log(`[EventBus Listener] Updated Installment ${txn.installmentId} to PAID.`);
                }
            } catch (err) {
                console.error('[EventBus Listener Error] Failed to update installment on TRANSACTION_SUCCESS:', err);
            }
        });
    }
}

export const eventBus = DomainEventBus.getInstance();
