import api from './axios';

export interface ThreadMessage {
    _id?: string;
    senderId: string;
    senderRole: 'MEMBER' | 'ORGANIZER';
    senderName: string;
    text: string;
    sentAt: string;
}

export interface ChitHelpThread {
    _id: string;
    groupId: string;
    memberId: {
        _id: string;
        name: string;
        email: string;
    };
    organizerId: {
        _id: string;
        name: string;
        email: string;
    };
    subject: string;
    status: 'OPEN' | 'RESOLVED';
    messages: ThreadMessage[];
    createdAt: string;
    updatedAt: string;
}

export const createHelpThread = async (groupId: string, subject: string, message: string): Promise<ChitHelpThread> => {
    const res = await api.post(`/chit-messages/group/${groupId}`, { subject, message });
    return res.data.data.thread;
};

export const fetchGroupThreads = async (groupId: string): Promise<ChitHelpThread[]> => {
    const res = await api.get(`/chit-messages/group/${groupId}`);
    return res.data.data.threads || [];
};

export const replyToThread = async (threadId: string, text: string): Promise<ChitHelpThread> => {
    const res = await api.post(`/chit-messages/thread/${threadId}/reply`, { text });
    return res.data.data.thread;
};

export const updateThreadStatus = async (threadId: string, status: 'OPEN' | 'RESOLVED'): Promise<ChitHelpThread> => {
    const res = await api.patch(`/chit-messages/thread/${threadId}/status`, { status });
    return res.data.data.thread;
};
