import mongoose from 'mongoose';
import ChitMessage, { IChitMessage } from '../models/ChitMessage.js';

export class ChitMessageRepository {
    /**
     * Creates a new ChitMessage thread.
     */
    public async create(data: Partial<IChitMessage>): Promise<IChitMessage> {
        return await ChitMessage.create(data);
    }

    /**
     * Finds a single ChitMessage thread by ID.
     */
    public async findById(threadId: string): Promise<IChitMessage | null> {
        if (!mongoose.Types.ObjectId.isValid(threadId)) return null;
        return await ChitMessage.findById(threadId);
    }

    /**
     * Finds threads for a group with optional member filter, populated with user info.
     */
    public async findGroupThreads(groupId: string, memberId?: string): Promise<IChitMessage[]> {
        if (!mongoose.Types.ObjectId.isValid(groupId)) return [];

        const filter: any = { groupId: new mongoose.Types.ObjectId(groupId) };
        if (memberId && mongoose.Types.ObjectId.isValid(memberId)) {
            filter.memberId = new mongoose.Types.ObjectId(memberId);
        }

        return await ChitMessage.find(filter)
            .populate('memberId', 'name email')
            .populate('organizerId', 'name email')
            .sort({ updatedAt: -1 });
    }

    /**
     * Saves changes on an existing Mongoose ChitMessage document.
     */
    public async save(threadDoc: IChitMessage): Promise<IChitMessage> {
        return await threadDoc.save();
    }
}
