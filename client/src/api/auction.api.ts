import api from './axios';
import type { Auction, AuctionStatus, CreateAuctionInput, UpdateAuctionInput, DeclareAuctionWinnerInput } from '../types/auction';

export const fetchAuctionsByGroup = async (groupId: string, status?: AuctionStatus): Promise<Auction[]> => {
    const res = await api.get(`/auctions/group/${groupId}`, {
        params: status ? { status } : {}
    });
    return res.data.data.auctions;
};

export const fetchAuctionByCycle = async (cycleId: string): Promise<Auction> => {
    const res = await api.get(`/auctions/cycle/${cycleId}`);
    return res.data.data.auction;
};

export const fetchAuctionDetails = async (auctionId: string): Promise<Auction> => {
    const res = await api.get(`/auctions/${auctionId}`);
    return res.data.data.auction;
};

export const createAuction = async (input: CreateAuctionInput): Promise<Auction> => {
    const res = await api.post('/auctions', input);
    return res.data.data.auction;
};

export const updateAuction = async (auctionId: string, input: UpdateAuctionInput): Promise<Auction> => {
    const res = await api.put(`/auctions/${auctionId}`, input);
    return res.data.data.auction;
};

export const updateAuctionStatus = async (auctionId: string, status: AuctionStatus, remarks?: string): Promise<Auction> => {
    const res = await api.patch(`/auctions/${auctionId}/status`, { status, remarks });
    return res.data.data.auction;
};

export const declareAuctionWinner = async (auctionId: string, input: DeclareAuctionWinnerInput): Promise<Auction> => {
    const res = await api.patch(`/auctions/${auctionId}/declare-winner`, input);
    return res.data.data.auction;
};

export const deleteAuction = async (auctionId: string): Promise<{ success: boolean; message: string }> => {
    const res = await api.delete(`/auctions/${auctionId}`);
    return res.data;
};
