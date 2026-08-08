import mongoose from 'mongoose';
import { PaymentCollectionStatus } from '../../chit-cycle/models/ChitCycle.js';
import { UserRole } from '../../user/models/User.js';
import { AppError } from '../../../shared/errors/AppError.js';
import { logAction } from '../../../utils/auditLogger.js';
import { eventBus } from '../../payment/events/eventBus.js';
import { PaymentDomainEventType } from '../../payment/events/domainEvents.js';
import { CollectionRepository } from '../repositories/CollectionRepository.js';

export class CollectionService {
    private repo: CollectionRepository;

    constructor() {
        this.repo = new CollectionRepository();
    }

    /**
     * Opens payment collections for a chit cycle.
     */
    public async openCollections(
        actorId: string,
        actorRole: UserRole,
        cycleId: string,
        remarks?: string
    ) {
        const cycle = await this.repo.findCycleById(cycleId);
        if (!cycle) {
            throw new AppError('Chit Cycle not found.', 404, 'CYCLE_NOT_FOUND');
        }

        const group = await this.repo.findGroupById(cycle.groupId);
        if (!group) {
            throw new AppError('Associated Chit Group not found.', 404, 'GROUP_NOT_FOUND');
        }

        if (actorRole !== UserRole.ADMIN && group.organizerId.toString() !== actorId) {
            throw new AppError('Unauthorized to manage payment collections for this Chit Group.', 403, 'UNAUTHORIZED');
        }

        // Rule 1: Winner must be declared before opening collections
        if (!cycle.winnerMembershipId) {
            throw new AppError(
                'Cannot open payment collections. Winner must be declared for this cycle first.',
                400,
                'WINNER_NOT_DECLARED'
            );
        }

        const currentStatus = cycle.paymentCollection?.status || PaymentCollectionStatus.NOT_STARTED;

        // Rule 2: Cannot open if already open
        if (currentStatus === PaymentCollectionStatus.OPEN) {
            throw new AppError('Payment collections are already OPEN for this cycle.', 400, 'COLLECTIONS_ALREADY_OPEN');
        }

        // Rule 3: Cannot reopen if closed
        if (currentStatus === PaymentCollectionStatus.CLOSED) {
            throw new AppError('Payment collections are CLOSED for this cycle and cannot be reopened.', 400, 'COLLECTIONS_CLOSED');
        }

        cycle.paymentCollection = {
            status: PaymentCollectionStatus.OPEN,
            openedAt: new Date(),
            openedBy: new mongoose.Types.ObjectId(actorId),
            closedAt: cycle.paymentCollection?.closedAt || null,
            closedBy: cycle.paymentCollection?.closedBy || null,
            remarks: remarks || cycle.paymentCollection?.remarks || null
        };

        await this.repo.saveCycle(cycle);

        // Domain Event
        eventBus.publish({
            eventType: PaymentDomainEventType.COLLECTIONS_OPENED,
            timestamp: new Date(),
            data: {
                cycleId: cycle._id.toString(),
                groupId: cycle.groupId.toString(),
                openedBy: actorId,
                remarks
            } as any
        });

        // Audit Log
        await logAction(actorId, actorRole, 'COLLECTIONS_OPENED', {
            newValue: {
                cycleId: cycle._id.toString(),
                groupId: cycle.groupId.toString(),
                cycleNumber: cycle.cycleNumber,
                status: cycle.paymentCollection.status,
                openedAt: cycle.paymentCollection.openedAt,
                remarks
            }
        });

        return cycle;
    }

    /**
     * Closes payment collections for a chit cycle.
     */
    public async closeCollections(
        actorId: string,
        actorRole: UserRole,
        cycleId: string,
        remarks?: string
    ) {
        const cycle = await this.repo.findCycleById(cycleId);
        if (!cycle) {
            throw new AppError('Chit Cycle not found.', 404, 'CYCLE_NOT_FOUND');
        }

        const group = await this.repo.findGroupById(cycle.groupId);
        if (!group) {
            throw new AppError('Associated Chit Group not found.', 404, 'GROUP_NOT_FOUND');
        }

        if (actorRole !== UserRole.ADMIN && group.organizerId.toString() !== actorId) {
            throw new AppError('Unauthorized to manage payment collections for this Chit Group.', 403, 'UNAUTHORIZED');
        }

        const currentStatus = cycle.paymentCollection?.status || PaymentCollectionStatus.NOT_STARTED;

        if (currentStatus === PaymentCollectionStatus.NOT_STARTED) {
            throw new AppError('Cannot close payment collections before opening them.', 400, 'COLLECTIONS_NOT_STARTED');
        }

        if (currentStatus === PaymentCollectionStatus.CLOSED) {
            throw new AppError('Payment collections are already CLOSED for this cycle.', 400, 'COLLECTIONS_ALREADY_CLOSED');
        }

        cycle.paymentCollection = {
            status: PaymentCollectionStatus.CLOSED,
            openedAt: cycle.paymentCollection?.openedAt || null,
            openedBy: cycle.paymentCollection?.openedBy || null,
            closedAt: new Date(),
            closedBy: new mongoose.Types.ObjectId(actorId),
            remarks: remarks || cycle.paymentCollection?.remarks || null
        };

        await this.repo.saveCycle(cycle);

        // Domain Event
        eventBus.publish({
            eventType: PaymentDomainEventType.COLLECTIONS_CLOSED,
            timestamp: new Date(),
            data: {
                cycleId: cycle._id.toString(),
                groupId: cycle.groupId.toString(),
                closedBy: actorId,
                remarks
            } as any
        });

        // Audit Log
        await logAction(actorId, actorRole, 'COLLECTIONS_CLOSED', {
            newValue: {
                cycleId: cycle._id.toString(),
                groupId: cycle.groupId.toString(),
                cycleNumber: cycle.cycleNumber,
                status: cycle.paymentCollection.status,
                closedAt: cycle.paymentCollection.closedAt,
                remarks
            }
        });

        return cycle;
    }

    /**
     * Retrieves lightweight collection status info.
     */
    public async getCollectionStatus(cycleId: string) {
        const cycle = await this.repo.findCycleById(cycleId);
        if (!cycle) {
            throw new AppError('Chit Cycle not found.', 404, 'CYCLE_NOT_FOUND');
        }

        return {
            cycleId: cycle._id,
            groupId: cycle.groupId,
            cycleNumber: cycle.cycleNumber,
            paymentCollection: cycle.paymentCollection || { status: PaymentCollectionStatus.NOT_STARTED }
        };
    }

    /**
     * Retrieves aggregated collection summary for dashboard analytics.
     */
    public async getCollectionSummary(cycleId: string) {
        const summary = await this.repo.getCollectionSummary(cycleId);
        if (!summary) {
            throw new AppError('Chit Cycle not found.', 404, 'CYCLE_NOT_FOUND');
        }
        return summary;
    }

    /**
     * Retrieves member installment list for collection tracking.
     */
    public async getPendingMembers(cycleId: string, statusFilter?: string, searchTerm?: string) {
        const cycle = await this.repo.findCycleById(cycleId);
        if (!cycle) {
            throw new AppError('Chit Cycle not found.', 404, 'CYCLE_NOT_FOUND');
        }
        return this.repo.getPendingMembers(cycleId, statusFilter, searchTerm);
    }
}
