import mongoose from 'mongoose';
import ChitMessage, { IChitMessage } from '../models/ChitMessage.js';
import ChitGroup from '../models/ChitGroup.js';
import Membership, { MembershipStatus } from '../models/Membership.js';
import User from '../models/User.js';

/**
 * Service to create a new help thread in a Chit Group.
 */
export const createHelpThread = async (
    actorId: string,
    groupId: string,
    subject: string,
    initialMessage: string
): Promise<IChitMessage> => {
    const group = await ChitGroup.findById(groupId);
    if (!group) {
        throw new Error('Chit Group not found');
    }

    // Verify user is organizer or a valid member of this chit group
    const isOrganizer = group.organizerId.toString() === actorId;
    const membership = await Membership.findOne({
        chitGroupId: groupId,
        userId: actorId,
        status: { $ne: MembershipStatus.REJECTED }
    });

    if (!isOrganizer && !membership) {
        throw new Error('Unauthorized: You must be a member of this Chit Group to send a message');
    }

    const actor = await User.findById(actorId);
    if (!actor) {
        throw new Error('User not found');
    }

    const thread = await ChitMessage.create({
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
};

/**
 * Service to fetch help threads for a group.
 * If user is Organizer: returns all member threads in the group.
 * If user is Member: returns only threads created by this member.
 */
export const getGroupHelpThreads = async (
    actorId: string,
    groupId: string
): Promise<IChitMessage[]> => {
    const group = await ChitGroup.findById(groupId);
    if (!group) {
        throw new Error('Chit Group not found');
    }

    const isOrganizer = group.organizerId.toString() === actorId;

    let filter: any = { groupId: new mongoose.Types.ObjectId(groupId) };
    if (!isOrganizer) {
        filter.memberId = new mongoose.Types.ObjectId(actorId);
    }

    const threads = await ChitMessage.find(filter)
        .populate('memberId', 'name email')
        .populate('organizerId', 'name email')
        .sort({ updatedAt: -1 });

    return threads;
};

/**
 * Service to add a reply to an existing help thread.
 */
export const replyToHelpThread = async (
    actorId: string,
    threadId: string,
    text: string
): Promise<IChitMessage> => {
    const thread = await ChitMessage.findById(threadId);
    if (!thread) {
        throw new Error('Help thread not found');
    }

    const group = await ChitGroup.findById(thread.groupId);
    const isOrganizer = group ? group.organizerId.toString() === actorId : thread.organizerId.toString() === actorId;
    const isMember = thread.memberId.toString() === actorId;

    if (!isOrganizer && !isMember) {
        throw new Error('Unauthorized: You are not a participant of this conversation');
    }

    const actor = await User.findById(actorId);

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

    await thread.save();
    return thread;
};

/**
 * Service to update thread status (OPEN / RESOLVED).
 */
export const updateThreadStatus = async (
    actorId: string,
    threadId: string,
    status: 'OPEN' | 'RESOLVED'
): Promise<IChitMessage> => {
    const thread = await ChitMessage.findById(threadId);
    if (!thread) {
        throw new Error('Help thread not found');
    }

    const isOrganizer = thread.organizerId.toString() === actorId;
    const isMember = thread.memberId.toString() === actorId;

    if (!isOrganizer && !isMember) {
        throw new Error('Unauthorized');
    }

    thread.status = status;
    await thread.save();
    return thread;
};
