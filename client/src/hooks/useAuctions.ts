import { useState, useEffect, useCallback } from 'react';
import type { Auction, AuctionStatus, CreateAuctionInput, UpdateAuctionInput, DeclareAuctionWinnerInput } from '../types/auction';
import * as auctionApi from '../api/auction.api';

export const useAuctions = (groupId?: string) => {
    const [auctions, setAuctions] = useState<Auction[]>([]);
    const [liveAuction, setLiveAuction] = useState<Auction | null>(null);
    const [upcomingAuction, setUpcomingAuction] = useState<Auction | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const loadAuctions = useCallback(async () => {
        if (!groupId) return;
        setLoading(true);
        setError(null);
        try {
            const data = await auctionApi.fetchAuctionsByGroup(groupId);
            setAuctions(data);
            
            const live = data.find(a => a.status === 'OPEN') || null;
            const upcoming = data.find(a => a.status === 'SCHEDULED') || null;
            
            setLiveAuction(live);
            setUpcomingAuction(upcoming);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to load auctions');
        } finally {
            setLoading(false);
        }
    }, [groupId]);

    useEffect(() => {
        loadAuctions();
    }, [loadAuctions]);

    const handleCreateAuction = async (input: CreateAuctionInput) => {
        setActionLoading('create');
        setError(null);
        try {
            const newAuction = await auctionApi.createAuction(input);
            await loadAuctions();
            return newAuction;
        } catch (err: any) {
            const msg = err.response?.data?.message || 'Failed to schedule auction';
            setError(msg);
            throw new Error(msg);
        } finally {
            setActionLoading(null);
        }
    };

    const handleUpdateAuction = async (auctionId: string, input: UpdateAuctionInput) => {
        setActionLoading(`update-${auctionId}`);
        setError(null);
        try {
            const updated = await auctionApi.updateAuction(auctionId, input);
            await loadAuctions();
            return updated;
        } catch (err: any) {
            const msg = err.response?.data?.message || 'Failed to update auction';
            setError(msg);
            throw new Error(msg);
        } finally {
            setActionLoading(null);
        }
    };

    const handleUpdateStatus = async (auctionId: string, status: AuctionStatus, remarks?: string) => {
        setActionLoading(`status-${status}-${auctionId}`);
        setError(null);
        try {
            const updated = await auctionApi.updateAuctionStatus(auctionId, status, remarks);
            await loadAuctions();
            return updated;
        } catch (err: any) {
            const msg = err.response?.data?.message || `Failed to transition status to ${status}`;
            setError(msg);
            throw new Error(msg);
        } finally {
            setActionLoading(null);
        }
    };

    const handleDeclareWinner = async (auctionId: string, input: DeclareAuctionWinnerInput) => {
        setActionLoading(`winner-${auctionId}`);
        setError(null);
        try {
            const updated = await auctionApi.declareAuctionWinner(auctionId, input);
            await loadAuctions();
            return updated;
        } catch (err: any) {
            const msg = err.response?.data?.message || 'Failed to declare winner';
            setError(msg);
            throw new Error(msg);
        } finally {
            setActionLoading(null);
        }
    };

    const handleDeleteAuction = async (auctionId: string) => {
        setActionLoading(`delete-${auctionId}`);
        setError(null);
        try {
            const res = await auctionApi.deleteAuction(auctionId);
            await loadAuctions();
            return res;
        } catch (err: any) {
            const msg = err.response?.data?.message || 'Failed to delete auction';
            setError(msg);
            throw new Error(msg);
        } finally {
            setActionLoading(null);
        }
    };

    return {
        auctions,
        liveAuction,
        upcomingAuction,
        loading,
        actionLoading,
        error,
        refetch: loadAuctions,
        createAuction: handleCreateAuction,
        updateAuction: handleUpdateAuction,
        updateStatus: handleUpdateStatus,
        declareWinner: handleDeclareWinner,
        deleteAuction: handleDeleteAuction
    };
};
