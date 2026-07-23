import { useState, useEffect, useCallback } from 'react';
import type { Bid, SubmitBidInput, UpdateBidInput } from '../types/bid';
import * as bidApi from '../api/bid.api';

export const useBids = (auctionId?: string, currentUserId?: string) => {
    const [bids, setBids] = useState<Bid[]>([]);
    const [myActiveBid, setMyActiveBid] = useState<Bid | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const loadBids = useCallback(async () => {
        if (!auctionId) return;
        setLoading(true);
        setError(null);
        try {
            const data = await bidApi.fetchBidsByAuction(auctionId);
            setBids(data);

            if (currentUserId) {
                const myBid = data.find((b) => {
                    const uId = typeof b.userId === 'object' ? b.userId._id : b.userId;
                    return uId === currentUserId && b.status !== 'WITHDRAWN';
                });
                setMyActiveBid(myBid || null);
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to load auction bids');
        } finally {
            setLoading(false);
        }
    }, [auctionId, currentUserId]);

    useEffect(() => {
        loadBids();
    }, [loadBids]);

    const handleSubmitBid = async (input: SubmitBidInput) => {
        setActionLoading('submit');
        try {
            const newBid = await bidApi.submitBid(input);
            await loadBids();
            return newBid;
        } catch (err: any) {
            const msg = err.response?.data?.message || 'Failed to submit bid';
            throw new Error(msg);
        } finally {
            setActionLoading(null);
        }
    };

    const handleUpdateBid = async (bidId: string, input: UpdateBidInput) => {
        setActionLoading(`update-${bidId}`);
        try {
            const updated = await bidApi.updateBid(bidId, input);
            await loadBids();
            return updated;
        } catch (err: any) {
            const msg = err.response?.data?.message || 'Failed to update bid';
            throw new Error(msg);
        } finally {
            setActionLoading(null);
        }
    };

    const handleWithdrawBid = async (bidId: string) => {
        setActionLoading(`withdraw-${bidId}`);
        try {
            const res = await bidApi.withdrawBid(bidId);
            await loadBids();
            return res;
        } catch (err: any) {
            const msg = err.response?.data?.message || 'Failed to withdraw bid';
            throw new Error(msg);
        } finally {
            setActionLoading(null);
        }
    };

    return {
        bids,
        myActiveBid,
        loading,
        actionLoading,
        error,
        refetch: loadBids,
        submitBid: handleSubmitBid,
        updateBid: handleUpdateBid,
        withdrawBid: handleWithdrawBid
    };
};
