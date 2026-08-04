import { IChitMessage, IThreadMessage } from '../models/ChitMessage.js';

export interface ICreateThreadInput {
    actorId: string;
    groupId: string;
    subject: string;
    initialMessage: string;
}

export interface IReplyThreadInput {
    actorId: string;
    threadId: string;
    text: string;
}

export interface IUpdateThreadStatusInput {
    actorId: string;
    threadId: string;
    status: 'OPEN' | 'RESOLVED';
}

export type { IChitMessage, IThreadMessage };
