import api from './axios';
import type { Bid, SubmitBidInput, UpdateBidInput } from '../types/bid';

export const submitBid = async (input: SubmitBidInput): Promise<Bid> => {
    const res = await api.post('/bids', input);
    return res.data.data.bid;
};

export const fetchBidsByAuction = async (auctionId: string): Promise<Bid[]> => {
    const res = await api.get(`/bids/auction/${auctionId}`);
    return res.data.data.bids;
};

export const fetchBidsByMember = async (membershipId: string): Promise<Bid[]> => {
    const res = await api.get(`/bids/member/${membershipId}`);
    return res.data.data.bids;
};

export const fetchBidById = async (bidId: string): Promise<Bid> => {
    const res = await api.get(`/bids/${bidId}`);
    return res.data.data.bid;
};

export const updateBid = async (bidId: string, input: UpdateBidInput): Promise<Bid> => {
    const res = await api.patch(`/bids/${bidId}`, input);
    return res.data.data.bid;
};

export const withdrawBid = async (bidId: string): Promise<{ success: boolean; message: string }> => {
    const res = await api.delete(`/bids/${bidId}`);
    return res.data;
};
