import api from './axios';
import type { ChitCycle } from '../types/chitCycle';

export interface CollectionSummaryData {
    cycleId: string;
    groupId: string;
    groupName: string;
    currency: string;
    cycleNumber: number;
    winner: {
        membershipId?: string;
        userName?: string;
        userEmail?: string;
        winningBidAmount?: number;
        winningBidPercentage?: number;
        prizeAmount?: number;
        dividendAmount?: number;
    } | null;
    paymentCollection: {
        status: 'NOT_STARTED' | 'OPEN' | 'CLOSED';
        openedAt?: string | null;
        openedBy?: string | null;
        closedAt?: string | null;
        closedBy?: string | null;
        remarks?: string | null;
    };
    totalMembers: number;
    paidMembers: number;
    pendingMembers: number;
    lateMembers: number;
    totalAmountExpected: number;
    totalAmountCollected: number;
    collectionPercentage: number;
}

export const openCollections = async (cycleId: string, remarks?: string): Promise<ChitCycle> => {
    const res = await api.patch(`/chit-cycles/${cycleId}/open-collections`, { remarks });
    return res.data.data.cycle;
};

export const closeCollections = async (cycleId: string, remarks?: string): Promise<ChitCycle> => {
    const res = await api.patch(`/chit-cycles/${cycleId}/close-collections`, { remarks });
    return res.data.data.cycle;
};

export const fetchCollectionStatus = async (cycleId: string) => {
    const res = await api.get(`/chit-cycles/${cycleId}/collection-status`);
    return res.data.data;
};

export const fetchCollectionSummary = async (cycleId: string): Promise<CollectionSummaryData> => {
    const res = await api.get(`/chit-cycles/${cycleId}/collection-summary`);
    return res.data.data.summary;
};

export const fetchPendingMembers = async (cycleId: string, params?: { status?: string; search?: string }) => {
    const res = await api.get(`/chit-cycles/${cycleId}/pending-members`, { params });
    return res.data.data.members;
};
