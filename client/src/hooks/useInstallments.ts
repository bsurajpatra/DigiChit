import { useState, useEffect, useCallback } from 'react';
import type { Installment, InstallmentGroupStats } from '../types/installment';
import * as installmentApi from '../api/installment.api';

export const useInstallments = (groupId?: string, cycleId?: string, isMyInstallments: boolean = false) => {
    const [installments, setInstallments] = useState<Installment[]>([]);
    const [stats, setStats] = useState<InstallmentGroupStats | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const loadData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            let fetched: Installment[] = [];
            if (cycleId) {
                fetched = await installmentApi.fetchCycleInstallments(cycleId);
            } else if (groupId) {
                fetched = await installmentApi.fetchGroupInstallments(groupId);
            } else if (isMyInstallments) {
                // For member dashboard, fetch installments for all their groups
                fetched = [];
            }

            setInstallments(fetched);

            // Compute statistics dynamically from fetched group/cycle installments
            if (fetched.length > 0) {
                const totalExpectedAmount = fetched.reduce((sum, i) => sum + (i.amount || 0) + (i.lateFee || 0), 0);
                const totalCollectedAmount = fetched.reduce((sum, i) => sum + (i.paidAmount || 0), 0);
                const totalPendingAmount = Math.max(0, totalExpectedAmount - totalCollectedAmount);
                const collectionPercentage = totalExpectedAmount > 0 ? (totalCollectedAmount / totalExpectedAmount) * 100 : 0;
                
                const paidCount = fetched.filter((i) => (i.paymentStatus || i.status) === 'PAID').length;
                const pendingCount = fetched.filter((i) => (i.paymentStatus || i.status) === 'PENDING').length;
                const overdueCount = fetched.filter((i) => (i.paymentStatus || i.status) === 'OVERDUE').length;
                const totalLateFeesAccrued = fetched.reduce((sum, i) => sum + (i.lateFee || 0), 0);

                setStats({
                    totalExpectedAmount,
                    totalCollectedAmount,
                    totalPendingAmount,
                    collectionPercentage,
                    totalInstallments: fetched.length,
                    paidCount,
                    pendingCount,
                    overdueCount,
                    totalLateFeesAccrued
                });
            } else {
                setStats(null);
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to load installments data');
        } finally {
            setLoading(false);
        }
    }, [groupId, cycleId, isMyInstallments]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleGenerateCycle = async (cId: string, dueDate?: string) => {
        setActionLoading('generate');
        setError(null);
        try {
            const generated = await installmentApi.generateCycleInstallments(cId, dueDate);
            await loadData();
            return generated;
        } catch (err: any) {
            const msg = err.response?.data?.message || 'Failed to generate cycle installments';
            setError(msg);
            throw new Error(msg);
        } finally {
            setActionLoading(null);
        }
    };

    const handleWaiveLateFee = async (installmentId: string, remarks?: string) => {
        setActionLoading(`waive-${installmentId}`);
        setError(null);
        try {
            const updated = await installmentApi.waiveLateFee(installmentId, remarks);
            await loadData();
            return updated;
        } catch (err: any) {
            const msg = err.response?.data?.message || 'Failed to waive late fee';
            setError(msg);
            throw new Error(msg);
        } finally {
            setActionLoading(null);
        }
    };

    return {
        installments,
        stats,
        loading,
        actionLoading,
        error,
        refetch: loadData,
        generateCycleInstallments: handleGenerateCycle,
        waiveLateFee: handleWaiveLateFee
    };
};
