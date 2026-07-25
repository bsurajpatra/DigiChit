import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.js';
import * as chitMessageService from '../services/chitMessage.service.js';

export const createThread = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const actorId = req.user!.id;
        const groupId = req.params.groupId as string;
        const { subject, message } = req.body;

        if (!subject || !message) {
            res.status(400).json({ success: false, message: 'Subject and message body are required' });
            return;
        }

        const thread = await chitMessageService.createHelpThread(actorId, groupId, subject, message);

        res.status(201).json({
            success: true,
            message: 'Help inquiry submitted successfully',
            data: { thread }
        });
    } catch (error) {
        next(error);
    }
};

export const getGroupThreads = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const actorId = req.user!.id;
        const groupId = req.params.groupId as string;

        const threads = await chitMessageService.getGroupHelpThreads(actorId, groupId);

        res.status(200).json({
            success: true,
            data: { threads }
        });
    } catch (error) {
        next(error);
    }
};

export const replyToThread = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const actorId = req.user!.id;
        const threadId = req.params.threadId as string;
        const { text } = req.body;

        if (!text) {
            res.status(400).json({ success: false, message: 'Message text is required' });
            return;
        }

        const thread = await chitMessageService.replyToHelpThread(actorId, threadId, text);

        res.status(200).json({
            success: true,
            message: 'Reply added successfully',
            data: { thread }
        });
    } catch (error) {
        next(error);
    }
};

export const updateStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const actorId = req.user!.id;
        const threadId = req.params.threadId as string;
        const { status } = req.body;

        if (!status || !['OPEN', 'RESOLVED'].includes(status)) {
            res.status(400).json({ success: false, message: 'Valid status (OPEN or RESOLVED) is required' });
            return;
        }

        const thread = await chitMessageService.updateThreadStatus(actorId, threadId, status);

        res.status(200).json({
            success: true,
            message: `Thread marked as ${status}`,
            data: { thread }
        });
    } catch (error) {
        next(error);
    }
};
