import api from './axios';
import type { ChitCycle, ChitCycleStatus, CreateCycleInput, RecordWinnerInput } from '../types/chitCycle';

export const fetchCyclesByGroup = async (groupId: string, status?: ChitCycleStatus): Promise<ChitCycle[]> => {
    const res = await api.get(`/chit-cycles/group/${groupId}`, {
        params: status ? { status } : {}
    });
    return res.data.data.cycles;
};

export const fetchActiveCycle = async (groupId: string): Promise<ChitCycle | null> => {
    const res = await api.get(`/chit-cycles/group/${groupId}/active`);
    return res.data.data.cycle;
};

export const fetchCycleDetails = async (cycleId: string): Promise<ChitCycle> => {
    const res = await api.get(`/chit-cycles/${cycleId}`);
    return res.data.data.cycle;
};

export const createChitCycle = async (input: CreateCycleInput): Promise<ChitCycle> => {
    const res = await api.post('/chit-cycles', input);
    return res.data.data.cycle;
};

export const startChitCycle = async (cycleId: string, actualStartDate?: string): Promise<ChitCycle> => {
    const res = await api.patch(`/chit-cycles/${cycleId}/start`, { actualStartDate });
    return res.data.data.cycle;
};

export const completeChitCycle = async (cycleId: string, actualEndDate?: string): Promise<ChitCycle> => {
    const res = await api.patch(`/chit-cycles/${cycleId}/complete`, { actualEndDate });
    return res.data.data.cycle;
};

export const cancelChitCycle = async (cycleId: string, remarks?: string): Promise<ChitCycle> => {
    const res = await api.patch(`/chit-cycles/${cycleId}/cancel`, { remarks });
    return res.data.data.cycle;
};

export const recordCycleWinner = async (cycleId: string, input: RecordWinnerInput): Promise<ChitCycle> => {
    const res = await api.patch(`/chit-cycles/${cycleId}/winner`, input);
    return res.data.data.cycle;
};
