import { eventBus } from '../../../shared/event-bus/EventBus.js';
import { PaymentDomainEvent, PaymentDomainEventType } from '../events/domainEvents.js';
import Installment, { PaymentStatus } from '../../installment/models/Installment.js';

export const initPaymentEventListeners = (): void => {
    eventBus.on(PaymentDomainEventType.TRANSACTION_SUCCESS, async (event: PaymentDomainEvent<any>) => {
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
                console.log(`[PaymentEventListener] Updated Installment ${txn.installmentId} to PAID.`);
            }
        } catch (err) {
            console.error('[PaymentEventListener Error] Failed to update installment on TRANSACTION_SUCCESS:', err);
        }
    });

    console.log('[PaymentEventListener] Event listeners registered for TRANSACTION_SUCCESS.');
};
