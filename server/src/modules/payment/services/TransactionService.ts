import { PaymentIdempotencyRepository } from '../repositories/PaymentIdempotencyRepository.js';
import { PaymentIdempotencyStatus, IPaymentIdempotency } from '../models/PaymentIdempotency.js';
import { generatePaymentFingerprint } from '../utils/idempotencyFingerprint.js';
import { logger } from '@shared/logger/logger.js';
import mongoose from 'mongoose';
import { PaymentStatus } from '@modules/installment/models/Installment.js';
import { PaymentCollectionStatus } from '@modules/chit-cycle/models/ChitCycle.js';
import { UserRole } from '@modules/user/models/User.js';
import { AppError } from '@shared/errors/AppError.js';
import { logAction } from '@shared/logger/auditLogger.js';

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
    private idempotencyRepo: PaymentIdempotencyRepository;

    constructor() {
        this.repo = new TransactionRepository();
        this.idempotencyRepo = new PaymentIdempotencyRepository();
    }

    /**
     * Initiates a payment order for a specific Installment obligation with user-scoped idempotency.
     */
    public async initiatePayment(actorId: string, dto: InitiatePaymentDTO, idempotencyKey?: string): Promise<ITransaction> {
        // If idempotencyKey is provided, wrap in user-scoped idempotency workflow
        if (idempotencyKey && idempotencyKey.trim().length > 0) {
            const trimmedKey = idempotencyKey.trim();
            const fingerprint = generatePaymentFingerprint({
                installmentId: dto.installmentId,
                paymentMethod: dto.paymentMethod,
                paymentGateway: dto.paymentGateway
            });

            // 1. Attempt to insert IN_PROGRESS record
            let idempotencyRecord: IPaymentIdempotency | null = null;
            try {
                idempotencyRecord = await this.idempotencyRepo.createInProgress(actorId, trimmedKey, fingerprint);
            } catch (err: any) {
                // Duplicate Key (E11000): An idempotency record already exists for this (userId, key)
                if (err.code === 11000 || err.message?.includes('duplicate key') || err.name === 'MongoServerError') {
                    const existing = await this.idempotencyRepo.findByUserAndKey(actorId, trimmedKey);
                    if (!existing) {
                        throw new AppError('Idempotency conflict detected', 409, 'IDEMPOTENCY_CONFLICT');
                    }

                    // A. Validate Request Fingerprint
                    if (existing.requestFingerprint !== fingerprint) {
                        logger.warn(`[PaymentIdempotency] Fingerprint mismatch for user ${actorId}, key ${trimmedKey}`);
                        throw new AppError(
                            'Idempotency-Key has already been used with different request parameters',
                            409,
                            'IDEMPOTENCY_CONFLICT'
                        );
                    }

                    // B. If SUCCESS: return existing completed transaction
                    if (existing.status === PaymentIdempotencyStatus.SUCCESS) {
                        logger.info(`[PaymentIdempotency] Returning existing transaction for idempotency key ${trimmedKey}`);
                        if (existing.transactionId) {
                            const cachedTxn = await this.repo.findById(existing.transactionId.toString());
                            if (cachedTxn) return cachedTxn;
                        }
                        // Fallback search if transactionId not directly linked
                        const fallbackTxn = await this.repo.findByInstallmentAndStatus(dto.installmentId, [
                            TransactionStatus.PENDING,
                            TransactionStatus.SUCCESS
                        ]);
                        if (fallbackTxn.length > 0 && fallbackTxn[0]) {
                            return fallbackTxn[0];
                        }
                    }

                    // C. If IN_PROGRESS: Check if transaction already exists (e.g. crash recovery) or await resolution
                    if (existing.status === PaymentIdempotencyStatus.IN_PROGRESS) {
                        // Fast-path crash recovery: check if transaction was already persisted
                        if (existing.transactionId) {
                            const cachedTxn = await this.repo.findById(existing.transactionId.toString());
                            if (cachedTxn) {
                                await this.idempotencyRepo.markSuccess(existing._id, cachedTxn._id.toString());
                                return cachedTxn;
                            }
                        }

                        const immediateTxn = await this.repo.findByInstallmentAndStatus(dto.installmentId, [
                            TransactionStatus.PENDING,
                            TransactionStatus.SUCCESS
                        ]);
                        if (immediateTxn.length > 0 && immediateTxn[0]) {
                            await this.idempotencyRepo.markSuccess(existing._id, immediateTxn[0]._id.toString(), {
                                transactionNumber: immediateTxn[0].transactionNumber,
                                gatewayOrderId: immediateTxn[0].gatewayOrderId
                            });
                            return immediateTxn[0];
                        }

                        logger.info(`[PaymentIdempotency] Concurrent request detected for key ${trimmedKey}. Awaiting resolution...`);
                        const startWait = Date.now();
                        const maxWaitMs = 10000; // 10s wait limit
                        while (Date.now() - startWait < maxWaitMs) {
                            await new Promise((r) => setTimeout(r, 100));
                            const polled = await this.idempotencyRepo.findByUserAndKey(actorId, trimmedKey);
                            if (polled?.status === PaymentIdempotencyStatus.SUCCESS) {
                                if (polled.transactionId) {
                                    const txn = await this.repo.findById(polled.transactionId.toString());
                                    if (txn) return txn;
                                }
                                const fallbackTxn = await this.repo.findByInstallmentAndStatus(dto.installmentId, [
                                    TransactionStatus.PENDING,
                                    TransactionStatus.SUCCESS
                                ]);
                                if (fallbackTxn.length > 0 && fallbackTxn[0]) return fallbackTxn[0];
                            }
                            if (polled?.status === PaymentIdempotencyStatus.FAILED) {
                                break;
                            }

                            // Also poll if transaction was created during concurrent execution
                            const asyncTxn = await this.repo.findByInstallmentAndStatus(dto.installmentId, [
                                TransactionStatus.PENDING,
                                TransactionStatus.SUCCESS
                            ]);
                            if (asyncTxn.length > 0 && asyncTxn[0]) {
                                await this.idempotencyRepo.markSuccess(existing._id, asyncTxn[0]._id.toString(), {
                                    transactionNumber: asyncTxn[0].transactionNumber,
                                    gatewayOrderId: asyncTxn[0].gatewayOrderId
                                });
                                return asyncTxn[0];
                            }
                        }

                        // If timed out and no transaction exists, reset to in_progress to retry
                        await this.idempotencyRepo.resetToInProgress(existing._id, fingerprint);
                        idempotencyRecord = existing;
                    }

                    // D. If FAILED: allow retry by resetting to IN_PROGRESS
                    if (existing.status === PaymentIdempotencyStatus.FAILED) {
                        logger.info(`[PaymentIdempotency] Retrying previously failed payment initiation for key ${trimmedKey}`);
                        await this.idempotencyRepo.resetToInProgress(existing._id, fingerprint);
                        idempotencyRecord = existing;
                    }
                } else {
                    throw err;
                }
            }

            // 2. Execute Payment Initiation Flow
            try {
                const transaction = await this.executePaymentInitiation(actorId, dto);

                // 3. Mark Idempotency as SUCCESS
                if (idempotencyRecord) {
                    await this.idempotencyRepo.markSuccess(idempotencyRecord._id, transaction._id.toString(), {
                        transactionNumber: transaction.transactionNumber,
                        gatewayOrderId: transaction.gatewayOrderId,
                        amount: transaction.amount,
                        currency: transaction.currency,
                        status: transaction.status
                    });
                }

                return transaction;
            } catch (executionError: any) {
                // 4. Mark Idempotency as FAILED
                if (idempotencyRecord) {
                    await this.idempotencyRepo.markFailed(idempotencyRecord._id, executionError.message || 'Payment initiation failed');
                }
                throw executionError;
            }
        }

        // If no idempotency key provided (internal call), execute standard flow
        return await this.executePaymentInitiation(actorId, dto);
    }

    /**
     * Internal core payment initiation execution
     */
    private async executePaymentInitiation(actorId: string, dto: InitiatePaymentDTO): Promise<ITransaction> {
        const installment = await this.repo.findInstallmentById(dto.installmentId);
        if (!installment) {
            throw new AppError('Installment obligation not found', 404, 'INSTALLMENT_NOT_FOUND');
        }

        // Security & Ownership Rule: Non-admins can only pay for their own installment
        const actor = await this.repo.findUserById(actorId);
        const instUserId = ((installment.userId as any)?._id || installment.userId)?.toString();
        if (actor?.role !== UserRole.ADMIN && instUserId && instUserId !== actorId) {
            throw new AppError('Unauthorized: You can only pay for your own installments', 403, 'UNAUTHORIZED_INSTALLMENT_PAYMENT');
        }

        // Business Rule: Validate ChitCycle paymentCollection.status == OPEN
        const cycle = await this.repo.findCycleById(installment.cycleId);
        if (!cycle) {
            throw new AppError('Associated Chit Cycle not found', 404, 'CYCLE_NOT_FOUND');
        }

        const collectionStatus = cycle.paymentCollection?.status || PaymentCollectionStatus.NOT_STARTED;

        if (collectionStatus !== PaymentCollectionStatus.OPEN) {
            if (collectionStatus === PaymentCollectionStatus.NOT_STARTED) {
                throw new AppError('Collections have not been opened by the organizer yet.', 400, 'COLLECTIONS_NOT_STARTED');
            }
            if (collectionStatus === PaymentCollectionStatus.CLOSED) {
                throw new AppError('Collections for this cycle have been closed.', 400, 'COLLECTIONS_CLOSED');
            }
            throw new AppError('Payment collections are not open for this cycle', 400, 'COLLECTIONS_NOT_OPEN');
        }

        // Business Rule: Prevent payments for already paid installments
        if (installment.paymentStatus === PaymentStatus.PAID) {
            throw new AppError('This installment has already been paid in full', 400, 'ALREADY_PAID');
        }

        if (installment.paymentStatus === PaymentStatus.WAIVED) {
            throw new AppError('This installment obligation has been waived', 400, 'OBLIGATION_WAIVED');
        }

        // Check for existing SUCCESS transaction for this installment
        const existingSuccess = await this.repo.findByInstallmentAndStatus(dto.installmentId, [TransactionStatus.SUCCESS]);
        if (existingSuccess.length > 0) {
            throw new AppError('A successful transaction already exists for this installment', 400, 'DUPLICATE_TRANSACTION');
        }

        // Server-authoritative monetary amount (client cannot manipulate dues)
        const authoritativeAmount = installment.amount + (installment.lateFee || 0);
        const amountToPay = authoritativeAmount;
        if (amountToPay <= 0) {
            throw new AppError('Transaction amount must be greater than zero', 400, 'INVALID_AMOUNT');
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
            throw new AppError('Transaction not found', 404, 'TRANSACTION_NOT_FOUND');
        }

        const actor = await this.repo.findUserById(actorId);

        // Security Rule: Non-admins can only verify their own transactions
        const txnMemberId = ((transaction.memberId as any)?._id || transaction.memberId)?.toString();
        if (actor?.role !== UserRole.ADMIN && txnMemberId && txnMemberId !== actorId) {
            throw new AppError('Unauthorized: You can only verify your own transactions', 403, 'UNAUTHORIZED_TRANSACTION_VERIFICATION');
        }

        if (transaction.status === TransactionStatus.SUCCESS) {
            return transaction; // Idempotent return for already verified successful transaction
        }

        if (transaction.status === TransactionStatus.CANCELLED || transaction.status === TransactionStatus.EXPIRED) {
            throw new AppError(`Cannot verify transaction in ${transaction.status} state`, 400, 'INVALID_TRANSACTION_STATE');
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
                throw new AppError('Failed to update transaction status', 500, 'UPDATE_FAILED');
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
                throw new AppError('Failed to update transaction status', 500, 'UPDATE_FAILED');
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

            throw new AppError(verification.failureReason || 'Payment verification failed', 400, 'VERIFICATION_FAILED');
        }
    }

    /**
     * Processes full or partial refund tracking for a completed transaction.
     */
    public async refundPayment(actorId: string, dto: RefundPaymentDTO): Promise<ITransaction> {
        const transaction = await this.repo.findById(dto.transactionId);
        if (!transaction) {
            throw new AppError('Transaction not found', 404, 'TRANSACTION_NOT_FOUND');
        }

        // Security Rule: Only Admin or Organizer can process refunds
        const refundActor = await this.repo.findUserById(actorId);
        if (refundActor?.role !== UserRole.ADMIN && refundActor?.role !== UserRole.ORGANIZER) {
            throw new AppError('Unauthorized: Only Organizers or Admins can process payment refunds', 403, 'UNAUTHORIZED_REFUND');
        }

        if (transaction.status !== TransactionStatus.SUCCESS && transaction.status !== TransactionStatus.PARTIALLY_REFUNDED) {
            throw new AppError(`Only SUCCESS or PARTIALLY_REFUNDED transactions can be refunded`, 400, 'INVALID_REFUND_STATE');
        }

        const refundAmount = dto.amount || transaction.amount;
        if (refundAmount <= 0 || refundAmount > transaction.amount) {
            throw new AppError(`Invalid refund amount. Must be between 0.01 and ${transaction.amount}`, 400, 'INVALID_REFUND_AMOUNT');
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
            throw new AppError('Failed to update transaction state for refund', 500, 'REFUND_UPDATE_FAILED');
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
            throw new AppError('Transaction record not found', 404, 'TRANSACTION_NOT_FOUND');
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
