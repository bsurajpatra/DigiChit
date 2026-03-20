import { Request, Response, NextFunction } from 'express';
import ContactQuery, { IContactQuery, IMessage } from '../models/ContactQuery.js';
import { AppError } from '../utils/appError.js';
import { sendContactReplyEmail } from '../utils/email.js';
import { AuthRequest } from '../middlewares/auth.js';

/**
 * Migration Helper: Maps legacy fields to the new 'messages' structure on the fly
 */
const mapLegacyMessages = (query: IContactQuery) => {
    const q = query.toObject();
    // If messages array is empty but we have a legacy legacy message field
    if ((!q.messages || q.messages.length === 0) && q.message) {
        const legacyMessages: IMessage[] = [
            {
                senderRole: 'USER',
                message: q.message,
                sentAt: q.createdAt,
                isRead: true
            }
        ];

        // Add legacy responses if they exist
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
};

/**
 * PUBLIC: POST /api/contact/submit
 * External contact form submission (GUEST)
 */
export const submitQuery = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { name, email, subject, message } = req.body;

        if (!name || !email || !subject || !message) {
            return next(new AppError('All fields required.', 400, 'VALIDATION_ERROR'));
        }

        const query = await ContactQuery.create({
            name,
            email,
            subject,
            source: 'EXTERNAL',
            messages: [{
                senderRole: 'USER',
                message,
                sentAt: new Date(),
                isRead: false
            }]
        });

        res.status(201).json({
            success: true,
            message: 'Inquiry received. We will contact you via email.',
            data: { queryId: query._id }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * PROTECTED: POST /api/contact/user/submit
 * Internal inquiry from a REGISTERED User/Organizer
 */
export const submitInternalQuery = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { subject, message } = req.body;
        if (!subject || !message) {
            return next(new AppError('Subject and message required.', 400, 'VALIDATION_ERROR'));
        }

        if (!req.user?.name || !req.user?.email) {
            return next(new AppError('User profile incomplete for support.', 400));
        }

        const query = await ContactQuery.create({
            userId: req.user!.id,
            name: req.user!.name,
            email: req.user!.email,
            subject,
            source: 'INTERNAL',
            messages: [{
                senderId: req.user!.id as any,
                senderRole: 'USER',
                message,
                sentAt: new Date(),
                isRead: true
            }]
        });

        res.status(201).json({
            success: true,
            message: 'Inquiry posted to your dashboard.',
            data: { query: mapLegacyMessages(query) }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * PROTECTED: GET /api/contact/user/my-queries
 */
export const getMyQueries = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const queries = await ContactQuery.find({ userId: req.user!.id }).sort({ updatedAt: -1 });
        const formattedQueries = queries.map(mapLegacyMessages);
        
        res.status(200).json({ success: true, data: { queries: formattedQueries } });
    } catch (error) {
        next(error);
    }
};

/**
 * GET ALL /api/contact/queries (ADMIN ONLY)
 */
export const getAllQueries = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const queries = await ContactQuery.find().sort({ updatedAt: -1 });
        const formattedQueries = queries.map(q => mapLegacyMessages(q as any));

        res.status(200).json({ success: true, data: { queries: formattedQueries } });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/contact/respond/:queryId (ADMIN or USER)
 */
export const respondToQuery = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { queryId } = req.params;
        const { message } = req.body;

        if (!message) return next(new AppError('Message is required.', 400));

        const query = await ContactQuery.findById(queryId);
        if (!query) return next(new AppError('No inquiry found.', 404));

        const isAdmin = req.user!.role === 'ADMIN';

        // Security check: Only owner or admin can reply
        if (!isAdmin && query.userId?.toString() !== req.user!.id) {
            return next(new AppError('Unauthorized access.', 403));
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
            senderId: req.user!.id as any,
            senderRole: isAdmin ? 'ADMIN' : 'USER',
            message,
            sentAt: new Date(),
            isRead: false
        });

        await query.save();

        // Send email only for external guest queries being replied to by admin
        if (isAdmin && query.source === 'EXTERNAL') {
            // Use query.messages[0] if mapped, else fallback
            const originalMsg = query.messages[0]?.message || query.message || 'Legacy Inquiry';
            sendContactReplyEmail(query.email, query.name, originalMsg, message).catch(err => 
                console.error('Email failed (External Guest):', err)
            );
        }

        res.status(200).json({ success: true, data: { query: mapLegacyMessages(query) } });
    } catch (error) {
        next(error);
    }
};

/**
 * PATCH /api/contact/status/:queryId (ADMIN ONLY)
 */
export const updateStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { queryId } = req.params;
        const { status } = req.body;

        const query = await ContactQuery.findByIdAndUpdate(queryId, { status }, { new: true });
        if (!query) return next(new AppError('Not found', 404));

        res.status(200).json({ success: true, data: { query: mapLegacyMessages(query as any) } });
    } catch (error) {
        next(error);
    }
};
