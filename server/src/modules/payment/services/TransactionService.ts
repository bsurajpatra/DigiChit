import mongoose from 'mongoose';
import { PaymentStatus } from '../../installment/models/Installment.js';
import { PaymentCollectionStatus } from '../../chit-cycle/models/ChitCycle.js';
import { UserRole } from '../../user/models/User.js';
import { logAction } from '../../../shared/logger/auditLogger.js';

import { TransactionRepository, PaginatedResult } from '../repositories/TransactionRepository.js';
import { ITransaction, TransactionStatus, PaymentMethod, PaymentGatewayProvider } from '../models/Transaction.js';
import { PaymentGatewayFactory } from '../gateways/PaymentGatewayFactory.js';
import { generateTransactionNumber } from '../utils/transactionNumberGenerator.js';
import { buildReceiptMetadata } from '../utils/receiptGenerator.js';
import { eventBus } from '../events/eventBus.js';
import { PaymentDomainEventType } from '../events/domainEvents.js';

import { InitiatePaymentDTO } from '../dto/InitiatePaymentDTO.js';
import { VerifyPaymentDTO } from '../dto/VerifyPaymentDTO.js';
import { RefundPaymentDTO } from '../dto/RefundPaymentDTO.js';
import { TransactionQueryDTO } from '../dto/TransactionQueryDTO.js';

export class TransactionService {
    private repo: TransactionRepository;

    constructor() {
        this.repo = new TransactionRepository();
    }

    /**
     * Initiates a payment order for a specific Installment obligation.
     */
    public async initiatePayment(actorId: string, dto: InitiatePaymentDTO): Promise<ITransaction> {
        const installment = await this.repo.findInstallmentById(dto.installmentId);
        if (!installment) {
            throw new Error('Installment obligation not found');
        }

        // Business Rule: Validate ChitCycle paymentCollection.status == OPEN
        const cycle = await this.repo.findCycleById(installment.cycleId);
        if (!cycle) {
            throw new Error('Associated Chit Cycle not found');
        }

        const collectionStatus = cycle.paymentCollection?.status || PaymentCollectionStatus.NOT_STARTED;

        if (collectionStatus !== PaymentCollectionStatus.OPEN) {
            if (collectionStatus === PaymentCollectionStatus.NOT_STARTED) {
                throw new Error('Collections have not been opened by the organizer yet.');
            }
            if (collectionStatus === PaymentCollectionStatus.CLOSED) {
                throw new Error('Collections for this cycle have been closed.');
            }
            throw new Error('Payment collections are not open for this cycle');
        }

        // Business Rule: Prevent payments for already paid installments
        if (installment.paymentStatus === PaymentStatus.PAID) {
            throw new Error('This installment has already been paid in full');
        }

        if (installment.paymentStatus === PaymentStatus.WAIVED) {
            throw new Error('This installment obligation has been waived');
        }

        // Check for existing SUCCESS transaction for this installment
        const existingSuccess = await this.repo.findByInstallmentAndStatus(dto.installmentId, [TransactionStatus.SUCCESS]);
        if (existingSuccess.length > 0) {
            throw new Error('A successful transaction already exists for this installment');
        }

        // Validate monetary amount
        const amountToPay = dto.amount || (installment.amount + (installment.lateFee || 0));
        if (amountToPay <= 0) {
            throw new Error('Transaction amount must be greater than zero');
        }

        // Get group financial config for currency
        const group = await this.repo.findGroupById(installment.groupId);
        const currency = dto.currency || group?.financialConfig?.currency || 'INR';

        const gatewayProvider = dto.paymentGateway || PaymentGatewayProvider.MOCK;
        const paymentMethod = dto.paymentMethod || PaymentMethod.MOCK;
        const gateway = PaymentGatewayFactory.getGateway(gatewayProvider);

        // Generate unique transaction number
        const transactionNumber = await generateTransactionNumber();

        // Initiate order with Gateway
        const orderResult = await gateway.createOrder({
            amount: amountToPay,
            currency,
            receipt: transactionNumber,
            notes: {
                installmentId: installment._id.toString(),
                groupId: installment.groupId.toString(),
                memberId: actorId
            }
        });

        // Persist PENDING transaction in MongoDB
        const transaction = await this.repo.create({
            transactionNumber,
            memberId: new mongoose.Types.ObjectId(actorId),
            groupId: installment.groupId,
            cycleId: installment.cycleId,
            installmentId: installment._id,
            amount: amountToPay,
            currency,
            paymentMethod,
            paymentGateway: gatewayProvider,
            gatewayOrderId: orderResult.gatewayOrderId,
            gatewayReference: orderResult.gatewayReference,
            status: TransactionStatus.PENDING,
            metadata: dto.metadata || {},
            initiatedAt: new Date(),
            createdBy: new mongoose.Types.ObjectId(actorId)
        });

        // Audit log
        await logAction(actorId, UserRole.USER, `PAYMENT_INITIATED`, {
            previousValue: undefined,
            newValue: {
                transactionId: transaction._id,
                transactionNumber: transaction.transactionNumber,
                amount: transaction.amount,
                gatewayOrderId: orderResult.gatewayOrderId
            }
        });

        // Publish Domain Event
        eventBus.publish({
            eventType: PaymentDomainEventType.TRANSACTION_CREATED,
            timestamp: new Date(),
            data: transaction
        });

        return transaction;
    }

    /**
     * Verifies payment completion with gateway and transitions transaction state.
     */
    public async verifyPayment(actorId: string, dto: VerifyPaymentDTO): Promise<ITransaction> {
        const transaction = await this.repo.findById(dto.transactionId);
        if (!transaction) {
            throw new Error('Transaction not found');
        }

        if (transaction.status === TransactionStatus.SUCCESS) {
            return transaction; // Idempotent return for already verified successful transaction
        }

        if (transaction.status === TransactionStatus.CANCELLED || transaction.status === TransactionStatus.EXPIRED) {
            throw new Error(`Cannot verify transaction in ${transaction.status} state`);
        }

        const gateway = PaymentGatewayFactory.getGateway(transaction.paymentGateway);

        // Call Gateway Verification API
        const verifyPayload: any = {
            gatewayOrderId: dto.gatewayOrderId || transaction.gatewayOrderId || '',
            gatewayPaymentId: dto.gatewayPaymentId
        };
        if (dto.gatewaySignature) {
            verifyPayload.gatewaySignature = dto.gatewaySignature;
        }

        const verification = await gateway.verifyPayment(verifyPayload);

        const actor = await this.repo.findUserById(actorId);

        if (verification.isVerified) {
            // Build Receipt Metadata
            const receipt = await buildReceiptMetadata(transaction, actor?.name, actor?.email);

            const updateData: Partial<ITransaction> = {
                gatewayPaymentId: dto.gatewayPaymentId,
                completedAt: new Date(),
                receiptNumber: receipt.receiptNumber,
                metadata: {
                    ...(transaction.metadata || {}),
                    receipt,
                    verificationResponse: verification.rawResponse
                },
                updatedBy: new mongoose.Types.ObjectId(actorId)
            };
            if (receipt.receiptUrl) {
                updateData.receiptUrl = receipt.receiptUrl;
            }

            const updatedTxn = await this.repo.updateStatus(transaction._id.toString(), TransactionStatus.SUCCESS, updateData);

            if (!updatedTxn) {
                throw new Error('Failed to update transaction status');
            }

            // Audit log
            await logAction(actorId, (actor?.role as UserRole) || UserRole.USER, `PAYMENT_SUCCESS`, {
                previousValue: { status: transaction.status },
                newValue: {
                    transactionId: updatedTxn._id,
                    transactionNumber: updatedTxn.transactionNumber,
                    receiptNumber: receipt.receiptNumber
                }
            });

            // Publish Domain Event (triggers Installment update to PAID asynchronously)
            eventBus.publish({
                eventType: PaymentDomainEventType.TRANSACTION_SUCCESS,
                timestamp: new Date(),
                data: updatedTxn
            });

            return updatedTxn;
        } else {
            // Payment Verification Failed
            const failedTxn = await this.repo.updateStatus(transaction._id.toString(), TransactionStatus.FAILED, {
                gatewayPaymentId: dto.gatewayPaymentId,
                failureReason: verification.failureReason || 'Gateway payment verification failed',
                updatedBy: new mongoose.Types.ObjectId(actorId)
            });

            if (!failedTxn) {
                throw new Error('Failed to update transaction status');
            }

            // Audit log
            await logAction(actorId, (actor?.role as UserRole) || UserRole.USER, `PAYMENT_FAILED`, {
                previousValue: { status: transaction.status },
                newValue: {
                    transactionId: failedTxn._id,
                    failureReason: failedTxn.failureReason
                }
            });

            // Publish Domain Event
            eventBus.publish({
                eventType: PaymentDomainEventType.TRANSACTION_FAILED,
                timestamp: new Date(),
                data: failedTxn
            });

            throw new Error(verification.failureReason || 'Payment verification failed');
        }
    }

    /**
     * Processes full or partial refund tracking for a completed transaction.
     */
    public async refundPayment(actorId: string, dto: RefundPaymentDTO): Promise<ITransaction> {
        const transaction = await this.repo.findById(dto.transactionId);
        if (!transaction) {
            throw new Error('Transaction not found');
        }

        if (transaction.status !== TransactionStatus.SUCCESS && transaction.status !== TransactionStatus.PARTIALLY_REFUNDED) {
            throw new Error(`Only SUCCESS or PARTIALLY_REFUNDED transactions can be refunded`);
        }

        const refundAmount = dto.amount || transaction.amount;
        if (refundAmount <= 0 || refundAmount > transaction.amount) {
            throw new Error(`Invalid refund amount. Must be between 0.01 and ${transaction.amount}`);
        }

        const gateway = PaymentGatewayFactory.getGateway(transaction.paymentGateway);

        const refundResult = await gateway.refund({
            gatewayPaymentId: transaction.gatewayPaymentId || `pay_mock_${transaction._id}`,
            amount: refundAmount,
            currency: transaction.currency,
            reason: dto.reason || 'Requested by Organizer/Admin'
        });

        const isFullRefund = refundAmount === transaction.amount;
        const newStatus = isFullRefund ? TransactionStatus.REFUNDED : TransactionStatus.PARTIALLY_REFUNDED;

        const updatedTxn = await this.repo.updateStatus(transaction._id.toString(), newStatus, {
            refundedAt: new Date(),
            metadata: {
                ...(transaction.metadata || {}),
                refund: refundResult,
                refundReason: dto.reason
            },
            updatedBy: new mongoose.Types.ObjectId(actorId)
        });

        if (!updatedTxn) {
            throw new Error('Failed to update transaction state for refund');
        }

        const actor = await this.repo.findUserById(actorId);

        // Audit log
        await logAction(actorId, (actor?.role as UserRole) || UserRole.ORGANIZER, `PAYMENT_REFUNDED`, {
            previousValue: { status: transaction.status, amount: transaction.amount },
            newValue: {
                transactionId: updatedTxn._id,
                refundId: refundResult.refundId,
                refundAmount,
                status: newStatus
            }
        });

        // Publish Domain Event
        eventBus.publish({
            eventType: PaymentDomainEventType.TRANSACTION_REFUNDED,
            timestamp: new Date(),
            data: updatedTxn
        });

        return updatedTxn;
    }

    /**
     * Retrieves a single transaction by ID.
     */
    public async getTransactionById(id: string): Promise<ITransaction> {
        const transaction = await this.repo.findById(id);
        if (!transaction) {
            throw new Error('Transaction record not found');
        }
        return transaction;
    }

    private buildPaginationOptions(query: TransactionQueryDTO) {
        const options: any = {};
        if (query.page !== undefined) options.page = Number(query.page);
        if (query.limit !== undefined) options.limit = Number(query.limit);
        if (query.sortBy) options.sortBy = query.sortBy;
        if (query.sortOrder) options.sortOrder = query.sortOrder;
        return options;
    }

    /**
     * Fetches paginated transaction history for a specific member.
     */
    public async getMemberTransactions(memberId: string, query: TransactionQueryDTO): Promise<PaginatedResult<ITransaction>> {
        const filter: any = { memberId: new mongoose.Types.ObjectId(memberId) };
        if (query.status) filter.status = query.status;
        if (query.paymentMethod) filter.paymentMethod = query.paymentMethod;

        return await this.repo.findPaginated(filter, this.buildPaginationOptions(query));
    }

    /**
     * Fetches paginated transaction history for a specific Chit Group.
     */
    public async getGroupTransactions(groupId: string, query: TransactionQueryDTO): Promise<PaginatedResult<ITransaction>> {
        const filter: any = { groupId: new mongoose.Types.ObjectId(groupId) };
        if (query.status) filter.status = query.status;
        if (query.cycleId) filter.cycleId = new mongoose.Types.ObjectId(query.cycleId);

        return await this.repo.findPaginated(filter, this.buildPaginationOptions(query));
    }

    /**
     * Fetches transactions for a specific Installment.
     */
    public async getInstallmentTransactions(installmentId: string): Promise<ITransaction[]> {
        return await this.repo.findByInstallmentAndStatus(installmentId, Object.values(TransactionStatus));
    }

    /**
     * Global transaction log query for Admins / Organizers.
     */
    public async getAllTransactions(query: TransactionQueryDTO): Promise<PaginatedResult<ITransaction>> {
        const filter: any = {};
        if (query.memberId) filter.memberId = new mongoose.Types.ObjectId(query.memberId);
        if (query.groupId) filter.groupId = new mongoose.Types.ObjectId(query.groupId);
        if (query.installmentId) filter.installmentId = new mongoose.Types.ObjectId(query.installmentId);
        if (query.status) filter.status = query.status;
        if (query.paymentMethod) filter.paymentMethod = query.paymentMethod;
        if (query.paymentGateway) filter.paymentGateway = query.paymentGateway;

        if (query.search) {
            filter.$or = [
                { transactionNumber: new RegExp(query.search, 'i') },
                { receiptNumber: new RegExp(query.search, 'i') },
                { gatewayOrderId: new RegExp(query.search, 'i') }
            ];
        }

        return await this.repo.findPaginated(filter, this.buildPaginationOptions(query));
    }
}
