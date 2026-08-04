import { IContactQuery, IMessage } from '../models/ContactQuery.js';

export interface ISubmitExternalQueryInput {
    name: string;
    email: string;
    subject: string;
    message: string;
}

export interface ISubmitInternalQueryInput {
    userId: string;
    userName: string;
    userEmail: string;
    subject: string;
    message: string;
}

export interface IRespondQueryInput {
    queryId: string;
    actorId: string;
    actorRole: 'USER' | 'ADMIN';
    message: string;
}

export interface IUpdateStatusInput {
    queryId: string;
    status: 'PENDING' | 'RESOLVED';
}

export type { IContactQuery, IMessage };
