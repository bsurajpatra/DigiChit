import { useState, useEffect, useCallback } from 'react';
import type {
    TransactionRecord,
    TransactionQueryParams,
    InitiatePaymentPayload,
    VerifyPaymentPayload,
    RefundPaymentPayload,
    PaginatedTransactionsResponse
} from '../api/transaction.api';
import * as transactionApi from '../api/transaction.api';

export const useTransactions = (params?: TransactionQueryParams) => {
    const [data, setData] = useState<PaginatedTransactionsResponse>({
        data: [],
        total: 0,
        page: params?.page || 1,
        limit: params?.limit || 20,
        totalPages: 1
    });
    const [loading, setLoading] = useState<boolean>(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const loadData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await transactionApi.fetchAllTransactions(params);
            setData(response);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to fetch transactions history');
        } finally {
            setLoading(false);
        }
    }, [
        params?.page,
        params?.limit,
        params?.memberId,
        params?.groupId,
        params?.cycleId,
        params?.status,
        params?.search,
        params?.sortBy,
        params?.sortOrder
    ]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const initiatePayment = async (payload: InitiatePaymentPayload) => {
        setActionLoading('initiate');
        setError(null);
        try {
            const res = await transactionApi.initiatePayment(payload);
            await loadData();
            return res;
        } catch (err: any) {
            const msg = err.response?.data?.message || 'Failed to initiate payment';
            setError(msg);
            throw new Error(msg);
        } finally {
            setActionLoading(null);
        }
    };

    const verifyPayment = async (payload: VerifyPaymentPayload) => {
        setActionLoading('verify');
        setError(null);
        try {
            const res = await transactionApi.verifyPayment(payload);
            await loadData();
            return res;
        } catch (err: any) {
            const msg = err.response?.data?.message || 'Failed to verify payment';
            setError(msg);
            throw new Error(msg);
        } finally {
            setActionLoading(null);
        }
    };

    const refundPayment = async (payload: RefundPaymentPayload) => {
        setActionLoading('refund');
        setError(null);
        try {
            const res = await transactionApi.refundPayment(payload);
            await loadData();
            return res;
        } catch (err: any) {
            const msg = err.response?.data?.message || 'Failed to process refund';
            setError(msg);
            throw new Error(msg);
        } finally {
            setActionLoading(null);
        }
    };

    return {
        data,
        transactions: data.data,
        total: data.total,
        page: data.page,
        totalPages: data.totalPages,
        loading,
        isLoading: loading,
        actionLoading,
        error,
        refetch: loadData,
        initiatePayment,
        verifyPayment,
        refundPayment
    };
};

export const useMemberTransactions = (memberId?: string, params?: TransactionQueryParams) => {
    const [data, setData] = useState<PaginatedTransactionsResponse>({
        data: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 1
    });
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const loadData = useCallback(async () => {
        if (!memberId) return;
        setLoading(true);
        setError(null);
        try {
            const res = await transactionApi.fetchMemberTransactions(memberId, params);
            setData(res);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to load member transactions');
        } finally {
            setLoading(false);
        }
    }, [memberId, params?.page, params?.status]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    return { data, loading, isLoading: loading, error, refetch: loadData };
};

export const useGroupTransactions = (groupId?: string, params?: TransactionQueryParams) => {
    const [data, setData] = useState<PaginatedTransactionsResponse>({
        data: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 1
    });
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const loadData = useCallback(async () => {
        if (!groupId) return;
        setLoading(true);
        setError(null);
        try {
            const res = await transactionApi.fetchGroupTransactions(groupId, params);
            setData(res);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to load group transactions');
        } finally {
            setLoading(false);
        }
    }, [groupId, params?.page, params?.status]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    return { data, loading, isLoading: loading, error, refetch: loadData };
};

export const useTransactionDetails = (transactionId?: string) => {
    const [transaction, setTransaction] = useState<TransactionRecord | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const loadData = useCallback(async () => {
        if (!transactionId) return;
        setLoading(true);
        setError(null);
        try {
            const res = await transactionApi.fetchTransactionById(transactionId);
            setTransaction(res);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to fetch transaction record');
        } finally {
            setLoading(false);
        }
    }, [transactionId]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    return { transaction, loading, isLoading: loading, error, refetch: loadData };
};

export const useInitiatePayment = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const mutateAsync = async (payload: InitiatePaymentPayload) => {
        setLoading(true);
        setError(null);
        try {
            return await transactionApi.initiatePayment(payload);
        } catch (err: any) {
            const msg = err.response?.data?.message || 'Failed to initiate payment';
            setError(msg);
            throw new Error(msg);
        } finally {
            setLoading(false);
        }
    };

    return { mutateAsync, isPending: loading, error };
};

export const useVerifyPayment = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const mutateAsync = async (payload: VerifyPaymentPayload) => {
        setLoading(true);
        setError(null);
        try {
            return await transactionApi.verifyPayment(payload);
        } catch (err: any) {
            const msg = err.response?.data?.message || 'Failed to verify payment';
            setError(msg);
            throw new Error(msg);
        } finally {
            setLoading(false);
        }
    };

    return { mutateAsync, isPending: loading, error };
};

export const useRefundPayment = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const mutateAsync = async (payload: RefundPaymentPayload) => {
        setLoading(true);
        setError(null);
        try {
            return await transactionApi.refundPayment(payload);
        } catch (err: any) {
            const msg = err.response?.data?.message || 'Failed to process refund';
            setError(msg);
            throw new Error(msg);
        } finally {
            setLoading(false);
        }
    };

    return { mutateAsync, isPending: loading, error };
};
