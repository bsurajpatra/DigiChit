import mongoose from 'mongoose';
import { ChitMessageRepository } from '../repositories/ChitMessageRepository.js';
import { IChitMessage } from '../models/ChitMessage.js';
import {
    ICreateThreadInput,
    IReplyThreadInput,
    IUpdateThreadStatusInput
} from '../interfaces/IChitMessage.js';
import { AppError } from '@shared/errors/AppError.js';

export class ChitMessageService {
    private repo: ChitMessageRepository;

    constructor() {
        this.repo = new ChitMessageRepository();
    }

    /**
     * Service to create a new help thread in a Chit Group.
     */
    public async createHelpThread(input: ICreateThreadInput): Promise<IChitMessage> {
        const { actorId, groupId, subject, initialMessage } = input;

        const group = await this.repo.findGroupById(groupId);
        if (!group) {
            throw new AppError('Chit Group not found', 404, 'GROUP_NOT_FOUND');
        }

        // Verify user is organizer or a valid member of this chit group
        const isOrganizer = group.organizerId.toString() === actorId;
        const membership = await this.repo.findMembershipByUserAndGroup(groupId, actorId);

        if (!isOrganizer && !membership) {
            throw new AppError('Unauthorized: You must be a member of this Chit Group to send a message', 403, 'UNAUTHORIZED');
        }

        const actor = await this.repo.findUserById(actorId);
        if (!actor) {
            throw new AppError('User not found', 404, 'USER_NOT_FOUND');
        }

        const thread = await this.repo.create({
            groupId: new mongoose.Types.ObjectId(groupId),
            memberId: new mongoose.Types.ObjectId(actorId),
            organizerId: group.organizerId,
            subject,
            status: 'OPEN',
            messages: [{
                senderId: new mongoose.Types.ObjectId(actorId),
                senderRole: isOrganizer ? 'ORGANIZER' : 'MEMBER',
                senderName: actor.name,
                text: initialMessage,
                sentAt: new Date()
            }]
        });

        return thread;
    }

    /**
     * Service to fetch help threads for a group.
     * If user is Organizer: returns all member threads in the group.
     * If user is Member: returns only threads created by this member.
     */
    public async getGroupHelpThreads(actorId: string, groupId: string): Promise<IChitMessage[]> {
        const group = await this.repo.findGroupById(groupId);
        if (!group) {
            throw new AppError('Chit Group not found', 404, 'GROUP_NOT_FOUND');
        }

        const isOrganizer = group.organizerId.toString() === actorId;
        const memberIdFilter = isOrganizer ? undefined : actorId;

        const threads = await this.repo.findGroupThreads(groupId, memberIdFilter);
        return threads;
    }

    /**
     * Service to add a reply to an existing help thread.
     */
    public async replyToHelpThread(input: IReplyThreadInput): Promise<IChitMessage> {
        const { actorId, threadId, text } = input;

        const thread = await this.repo.findById(threadId);
        if (!thread) {
            throw new AppError('Help thread not found', 404, 'THREAD_NOT_FOUND');
        }

        const group = await this.repo.findGroupById(thread.groupId.toString());
        const isOrganizer = group ? group.organizerId.toString() === actorId : thread.organizerId.toString() === actorId;
        const isMember = thread.memberId.toString() === actorId;

        if (!isOrganizer && !isMember) {
            throw new AppError('Unauthorized: You are not a participant of this conversation', 403, 'UNAUTHORIZED');
        }

        const actor = await this.repo.findUserById(actorId);

        thread.messages.push({
            senderId: new mongoose.Types.ObjectId(actorId),
            senderRole: isOrganizer ? 'ORGANIZER' : 'MEMBER',
            senderName: actor?.name || (isOrganizer ? 'Organizer' : 'Member'),
            text,
            sentAt: new Date()
        });

        // Reopen thread if organizer or member posts a reply
        if (thread.status === 'RESOLVED') {
            thread.status = 'OPEN';
        }

        await this.repo.save(thread);
        return thread;
    }

    /**
     * Service to update thread status (OPEN / RESOLVED).
     */
    public async updateThreadStatus(input: IUpdateThreadStatusInput): Promise<IChitMessage> {
        const { actorId, threadId, status } = input;

        const thread = await this.repo.findById(threadId);
        if (!thread) {
            throw new AppError('Help thread not found', 404, 'THREAD_NOT_FOUND');
        }

        const isOrganizer = thread.organizerId.toString() === actorId;
        const isMember = thread.memberId.toString() === actorId;

        if (!isOrganizer && !isMember) {
            throw new AppError('Unauthorized', 403, 'UNAUTHORIZED');
        }

        thread.status = status;
        await this.repo.save(thread);
        return thread;
    }
}
