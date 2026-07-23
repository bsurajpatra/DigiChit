import { useState, useEffect } from 'react';
import { useBids } from '../../hooks/useBids';
import * as auctionApi from '../../api/auction.api';
import api from '../../api/axios';
import type { Auction } from '../../types/auction';
import type { Bid } from '../../types/bid';
import { AuctionStatusBadge } from './AuctionStatusBadge';
import { CountdownTimer } from './CountdownTimer';
import { WinnerBanner } from './WinnerBanner';
import { BidForm } from '../bids/BidForm';
import { BidCard } from '../bids/BidCard';
import { BidTable } from '../bids/BidTable';
import { BidConfirmationModal } from '../bids/BidConfirmationModal';
import { Loader } from '../ui/Loader';
import { ArrowLeft, Hammer, RefreshCw, Info } from 'lucide-react';

interface EmbeddedBiddingRoomProps {
    auctionId: string;
    user: any;
    onBack: () => void;
    backLabel?: string;
}

export const EmbeddedBiddingRoom = ({ auctionId, user, onBack, backLabel = 'Back to Auctions List' }: EmbeddedBiddingRoomProps) => {
    const [auction, setAuction] = useState<Auction | null>(null);
    const [groupMembers, setGroupMembers] = useState<any[]>([]);
    const [auctionLoading, setAuctionLoading] = useState(true);

    const [editingBid, setEditingBid] = useState<Bid | null>(null);
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        type: 'submit' | 'update' | 'withdraw' | null;
        bidPercentage?: number;
        bidAmount?: number;
        bidId?: string;
    }>({ isOpen: false, type: null });

    const {
        bids,
        myActiveBid,
        loading: bidsLoading,
        actionLoading,
        error: bidsError,
        refetch: refetchBids,
        submitBid,
        updateBid,
        withdrawBid
    } = useBids(auctionId, user?.id);

    useEffect(() => {
        if (!auctionId) return;
        const fetchAuctionAndMembers = async () => {
            try {
                const data = await auctionApi.fetchAuctionDetails(auctionId);
                setAuction(data);

                const grpId = typeof data.groupId === 'object' ? data.groupId._id : data.groupId;
                if (grpId) {
                    const groupRes = await api.get(`/chit-groups/details/${grpId}`);
                    setGroupMembers(groupRes.data.data.members || []);
                }
            } catch (err) {
                console.error('Failed to load auction details or members', err);
            } finally {
                setAuctionLoading(false);
            }
        };
        fetchAuctionAndMembers();
    }, [auctionId]);

    const isAuctionOpen = auction?.status === 'OPEN';
    const groupObj = typeof auction?.groupId === 'object' ? auction.groupId : null;
    const monthlyContribution = groupObj?.monthlyContribution || 10000;
    const totalMembers = groupObj?.totalMembers || 10;

    const isMember = groupMembers.some((m) => {
        const uId = typeof m.userId === 'object' ? m.userId._id : m.userId;
        return uId === user?.id && ['APPROVED', 'ACTIVE_MEMBER'].includes(m.status);
    });

    const handleFormSubmit = async (data: { bidPercentage: number; bidAmount: number; remarks?: string }) => {
        if (!auctionId) return;

        if (myActiveBid) {
            await updateBid(myActiveBid._id, {
                bidPercentage: data.bidPercentage,
                bidAmount: data.bidAmount,
                remarks: data.remarks
            });
            setEditingBid(null);
        } else {
            await submitBid({
                auctionId,
                bidPercentage: data.bidPercentage,
                bidAmount: data.bidAmount,
                remarks: data.remarks
            });
        }
    };

    const handleWithdrawConfirm = async () => {
        if (!confirmModal.bidId) return;
        await withdrawBid(confirmModal.bidId);
        setConfirmModal({ isOpen: false, type: null });
    };

    if (auctionLoading || bidsLoading) {
        return <div className="py-16 flex justify-center"><Loader size="md" /></div>;
    }

    if (!auction) {
        return (
            <div className="p-8 text-center bg-white rounded-2xl border-none">
                <h3 className="text-sm font-bold text-slate-900">Auction Not Found</h3>
                <button onClick={onBack} className="mt-4 px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl">
                    Back to Auctions List
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Back Nav Button */}
            <button
                onClick={onBack}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition cursor-pointer"
            >
                <ArrowLeft className="w-4 h-4 text-emerald-400" />
                <span>{backLabel}</span>
            </button>

            {bidsError && (
                <div className="p-4 bg-rose-50 text-rose-700 text-xs font-bold rounded-xl border-none">
                    {bidsError}
                </div>
            )}

            {/* Header Card */}
            <div className="bg-white p-6 rounded-2xl border-none shadow-none">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-slate-900 text-emerald-400 flex items-center justify-center font-black text-lg shrink-0">
                            <Hammer className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h2 className="text-xl font-black text-slate-900">Auction #{auction.auctionNumber} Bidding Room</h2>
                                <AuctionStatusBadge status={auction.status} size="sm" />
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5">
                                {groupObj?.name ? `Group: ${groupObj.name}` : 'Live Member Bidding System'}
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={refetchBids}
                        disabled={bidsLoading}
                        className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition cursor-pointer disabled:opacity-50"
                        title="Refresh Bids"
                    >
                        <RefreshCw className={`w-4 h-4 ${bidsLoading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Live Countdown if OPEN or SCHEDULED */}
            {auction.status === 'SCHEDULED' && (
                <CountdownTimer targetDate={auction.scheduledStartTime} label="Auction Starts In" />
            )}

            {auction.status === 'OPEN' && auction.scheduledEndTime && (
                <CountdownTimer targetDate={auction.scheduledEndTime} label="Bidding Closes In" />
            )}

            {/* Winner Banner if Declared */}
            {auction.winningMembershipId && (
                <WinnerBanner
                    winner={auction.winningMembershipId}
                    winningBidPercentage={auction.minimumBidPercentage}
                    remarks={auction.remarks}
                />
            )}

            {/* Main Bidding Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Left Column: Member Bidding Card & Form */}
                <div className="lg:col-span-1 space-y-6">
                    {isMember ? (
                        myActiveBid && !editingBid ? (
                            <BidCard
                                bid={myActiveBid}
                                isAuctionOpen={isAuctionOpen}
                                onEdit={() => setEditingBid(myActiveBid)}
                                onWithdraw={(id) => setConfirmModal({ isOpen: true, type: 'withdraw', bidId: id, bidPercentage: myActiveBid.bidPercentage, bidAmount: myActiveBid.bidAmount })}
                            />
                        ) : (
                            <div className="bg-white p-6 rounded-2xl border-none shadow-none space-y-4">
                                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                    <Hammer className="w-4 h-4 text-emerald-600" />
                                    <span>{editingBid ? 'Modify Your Bid' : 'Place Your Bid'}</span>
                                </h3>

                                <BidForm
                                    auctionId={auction._id}
                                    auctionStatus={auction.status}
                                    monthlyContribution={monthlyContribution}
                                    totalMembers={totalMembers}
                                    minBidPercentage={auction.minimumBidPercentage}
                                    maxBidPercentage={auction.maximumBidPercentage}
                                    existingBid={editingBid}
                                    isLoading={!!actionLoading}
                                    onSubmitBid={handleFormSubmit}
                                />
                            </div>
                        )
                    ) : (
                        <div className="p-5 bg-white rounded-2xl border-none text-xs text-slate-500 font-medium space-y-2">
                            <div className="flex items-center gap-2 text-slate-900 font-bold">
                                <Info className="w-4 h-4 text-emerald-600" />
                                <span>Observer Mode</span>
                            </div>
                            <p className="leading-relaxed">You are viewing this bidding room in observer mode. Only active circle members can submit bids.</p>
                        </div>
                    )}
                </div>

                {/* Right Column: Live Bids Table */}
                <div className="lg:col-span-3">
                    <BidTable
                        bids={bids}
                        auctionNumber={auction.auctionNumber}
                        isLoading={bidsLoading}
                    />
                </div>
            </div>

            {/* Confirm Withdraw Modal */}
            <BidConfirmationModal
                isOpen={confirmModal.isOpen}
                type={confirmModal.type || 'submit'}
                bidPercentage={confirmModal.bidPercentage || 0}
                bidAmount={confirmModal.bidAmount || 0}
                isLoading={!!actionLoading}
                onConfirm={handleWithdrawConfirm}
                onCancel={() => setConfirmModal({ isOpen: false, type: null })}
            />
        </div>
    );
};
