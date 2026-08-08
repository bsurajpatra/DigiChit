import mongoose from 'mongoose';
import { SupportRepository } from '../repositories/SupportRepository.js';
import { IContactQuery, IMessage } from '../models/ContactQuery.js';
import {
    ISubmitExternalQueryInput,
    ISubmitInternalQueryInput,
    IRespondQueryInput,
    IUpdateStatusInput
} from '../interfaces/ISupport.js';
import { AppError } from '../../../shared/errors/AppError.js';
import { sendContactReplyEmail } from '../../../utils/email.js';

export class SupportService {
    private repo: SupportRepository;

    constructor() {
        this.repo = new SupportRepository();
    }

    /**
     * Migration Helper: Maps legacy fields to the new 'messages' structure on the fly
     */
    public mapLegacyMessages(query: IContactQuery) {
        const q = query.toObject();
        if ((!q.messages || q.messages.length === 0) && q.message) {
            const legacyMessages: IMessage[] = [
                {
                    senderRole: 'USER',
                    message: q.message,
                    sentAt: q.createdAt,
                    isRead: true
                }
            ];

            if (q.responses && q.responses.length > 0) {
                q.responses.forEach((res: any) => {
                    legacyMessages.push({
                        senderId: res.respondedBy,
                        senderRole: 'ADMIN',
                        message: res.message,
                        sentAt: res.respondedAt || q.updatedAt,
                        isRead: true
                    });
                });
            }
            q.messages = legacyMessages;
        }
        return q;
    }

    /**
     * Submits an external guest contact form query.
     */
    public async submitExternalQuery(input: ISubmitExternalQueryInput) {
        if (!input.name || !input.email || !input.subject || !input.message) {
            throw new AppError('All fields required.', 400, 'VALIDATION_ERROR');
        }

        const query = await this.repo.create({
            name: input.name,
            email: input.email,
            subject: input.subject,
            source: 'EXTERNAL',
            messages: [{
                senderRole: 'USER',
                message: input.message,
                sentAt: new Date(),
                isRead: false
            }]
        });

        return { queryId: query._id };
    }

    /**
     * Submits an internal inquiry from a registered User/Organizer.
     */
    public async submitInternalQuery(input: ISubmitInternalQueryInput) {
        if (!input.subject || !input.message) {
            throw new AppError('Subject and message required.', 400, 'VALIDATION_ERROR');
        }

        if (!input.userName || !input.userEmail) {
            throw new AppError('User profile incomplete for support.', 400, 'VALIDATION_ERROR');
        }

        const query = await this.repo.create({
            userId: new mongoose.Types.ObjectId(input.userId),
            name: input.userName,
            email: input.userEmail,
            subject: input.subject,
            source: 'INTERNAL',
            messages: [{
                senderId: new mongoose.Types.ObjectId(input.userId),
                senderRole: 'USER',
                message: input.message,
                sentAt: new Date(),
                isRead: true
            }]
        });

        return { query: this.mapLegacyMessages(query) };
    }

    /**
     * Retrieves support queries submitted by a specific user.
     */
    public async getMyQueries(userId: string) {
        const queries = await this.repo.findByUserId(userId);
        return { queries: queries.map((q) => this.mapLegacyMessages(q)) };
    }

    /**
     * Retrieves all support queries across the system (Admin only).
     */
    public async getAllQueries() {
        const queries = await this.repo.findAll();
        return { queries: queries.map((q) => this.mapLegacyMessages(q)) };
    }

    /**
     * Responds to an existing support inquiry (User or Admin).
     */
    public async respondToQuery(input: IRespondQueryInput) {
        if (!input.message) {
            throw new AppError('Message is required.', 400, 'VALIDATION_ERROR');
        }

        const query = await this.repo.findById(input.queryId);
        if (!query) {
            throw new AppError('No inquiry found.', 404, 'SUPPORT_NOT_FOUND');
        }

        const isAdmin = input.actorRole === 'ADMIN';

        // Security check: Only owner or admin can reply
        if (!isAdmin && query.userId?.toString() !== input.actorId) {
            throw new AppError('Unauthorized access.', 403, 'FORBIDDEN');
        }

        // Handle possible legacy data during response: move legacy fields to messages if needed
        if ((!query.messages || query.messages.length === 0) && query.message) {
            query.messages = [
                {
                    senderRole: 'USER',
                    message: query.message,
                    sentAt: query.createdAt,
                    isRead: true
                }
            ];
            if (query.responses && query.responses.length > 0) {
                query.responses.forEach((res: any) => {
                    query.messages.push({
                        senderId: res.respondedBy,
                        senderRole: 'ADMIN',
                        message: res.message,
                        sentAt: res.respondedAt || query.updatedAt,
                        isRead: true
                    });
                });
            }
        }

        query.messages.push({
            senderId: new mongoose.Types.ObjectId(input.actorId),
            senderRole: isAdmin ? 'ADMIN' : 'USER',
            message: input.message,
            sentAt: new Date(),
            isRead: false
        });

        await this.repo.save(query);

        // Send email only for external guest queries being replied to by admin
        if (isAdmin && query.source === 'EXTERNAL') {
            const originalMsg = query.messages[0]?.message || query.message || 'Legacy Inquiry';
            sendContactReplyEmail(query.email, query.name, originalMsg, input.message).catch((err) =>
                console.error('Email failed (External Guest):', err)
            );
        }

        return { query: this.mapLegacyMessages(query) };
    }

    /**
     * Updates the status of a support query (Admin only).
     */
    public async updateStatus(input: IUpdateStatusInput) {
        const query = await this.repo.updateStatus(input.queryId, input.status);
        if (!query) {
            throw new AppError('Not found', 404, 'SUPPORT_NOT_FOUND');
        }

        return { query: this.mapLegacyMessages(query) };
    }
}
