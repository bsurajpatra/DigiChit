import { useState, useEffect, useCallback } from 'react';
import type { ChitCycle, CreateCycleInput, RecordWinnerInput } from '../types/chitCycle';
import * as cycleApi from '../api/chitCycle.api';

export const useChitCycles = (groupId?: string) => {
    const [cycles, setCycles] = useState<ChitCycle[]>([]);
    const [activeCycle, setActiveCycle] = useState<ChitCycle | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const loadCycles = useCallback(async () => {
        if (!groupId) return;
        setLoading(true);
        setError(null);
        try {
            const data = await cycleApi.fetchCyclesByGroup(groupId);
            setCycles(data);
            const active = data.find(c => c.status === 'ACTIVE') || null;
            setActiveCycle(active);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to load Chit Cycles');
        } finally {
            setLoading(false);
        }
    }, [groupId]);

    useEffect(() => {
        loadCycles();
    }, [loadCycles]);

    const handleCreateCycle = async (input: CreateCycleInput) => {
        setActionLoading('create');
        setError(null);
        try {
            const newCycle = await cycleApi.createChitCycle(input);
            await loadCycles();
            return newCycle;
        } catch (err: any) {
            const msg = err.response?.data?.message || 'Failed to create cycle';
            setError(msg);
            throw new Error(msg);
        } finally {
            setActionLoading(null);
        }
    };

    const handleStartCycle = async (cycleId: string, actualStartDate?: string) => {
        setActionLoading(`start-${cycleId}`);
        setError(null);
        try {
            const updated = await cycleApi.startChitCycle(cycleId, actualStartDate);
            await loadCycles();
            return updated;
        } catch (err: any) {
            const msg = err.response?.data?.message || 'Failed to start cycle';
            setError(msg);
            throw new Error(msg);
        } finally {
            setActionLoading(null);
        }
    };

    const handleCompleteCycle = async (cycleId: string, actualEndDate?: string) => {
        setActionLoading(`complete-${cycleId}`);
        setError(null);
        try {
            const updated = await cycleApi.completeChitCycle(cycleId, actualEndDate);
            await loadCycles();
            return updated;
        } catch (err: any) {
            const msg = err.response?.data?.message || 'Failed to complete cycle';
            setError(msg);
            throw new Error(msg);
        } finally {
            setActionLoading(null);
        }
    };

    const handleCancelCycle = async (cycleId: string, remarks?: string) => {
        setActionLoading(`cancel-${cycleId}`);
        setError(null);
        try {
            const updated = await cycleApi.cancelChitCycle(cycleId, remarks);
            await loadCycles();
            return updated;
        } catch (err: any) {
            const msg = err.response?.data?.message || 'Failed to cancel cycle';
            setError(msg);
            throw new Error(msg);
        } finally {
            setActionLoading(null);
        }
    };

    const handleRecordWinner = async (cycleId: string, input: RecordWinnerInput) => {
        setActionLoading(`winner-${cycleId}`);
        setError(null);
        try {
            const updated = await cycleApi.recordCycleWinner(cycleId, input);
            await loadCycles();
            return updated;
        } catch (err: any) {
            const msg = err.response?.data?.message || 'Failed to record winner';
            setError(msg);
            throw new Error(msg);
        } finally {
            setActionLoading(null);
        }
    };

    const handleOpenCollections = async (cycleId: string) => {
        setActionLoading(`open-collections-${cycleId}`);
        setError(null);
        try {
            const updated = await cycleApi.openCollections(cycleId);
            await loadCycles();
            return updated;
        } catch (err: any) {
            const msg = err.response?.data?.message || 'Failed to open collections';
            setError(msg);
            throw new Error(msg);
        } finally {
            setActionLoading(null);
        }
    };

    const handleCloseCollections = async (cycleId: string) => {
        setActionLoading(`close-collections-${cycleId}`);
        setError(null);
        try {
            const updated = await cycleApi.closeCollections(cycleId);
            await loadCycles();
            return updated;
        } catch (err: any) {
            const msg = err.response?.data?.message || 'Failed to close collections';
            setError(msg);
            throw new Error(msg);
        } finally {
            setActionLoading(null);
        }
    };

    return {
        cycles,
        activeCycle,
        loading,
        actionLoading,
        error,
        refetch: loadCycles,
        createCycle: handleCreateCycle,
        startCycle: handleStartCycle,
        completeCycle: handleCompleteCycle,
        cancelCycle: handleCancelCycle,
        recordWinner: handleRecordWinner,
        openCollections: handleOpenCollections,
        closeCollections: handleCloseCollections
    };
};
