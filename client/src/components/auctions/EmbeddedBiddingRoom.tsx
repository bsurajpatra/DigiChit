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
import { ArrowLeft, Hammer, RefreshCw, Info, Wifi, TrendingUp, Trophy, Sparkles } from 'lucide-react';
import { formatCurrency } from '../../utils/currency';

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
    const currency = (groupObj as any)?.financialConfig?.currency || 'INR';

    const currentUserId = user?.id || (user as any)?._id;
    const isMember = groupMembers.some((m) => {
        const uId = typeof m.userId === 'object' ? (m.userId?._id || (m.userId as any)?.id) : m.userId;
        return String(uId) === String(currentUserId) && ['APPROVED', 'ACTIVE_MEMBER', 'ACTIVE'].includes(m.status);
    });

    // Calculate current highest discount bid
    const validBids = bids.filter(b => b.status === 'SUBMITTED' || b.status === 'VALID' || b.status === 'WINNING');
    const highestBidPercentage = validBids.length > 0 ? Math.max(...validBids.map(b => b.bidPercentage)) : undefined;

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
            {/* Top Navigation & Status Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <button
                    onClick={onBack}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-xs active:scale-95"
                >
                    <ArrowLeft className="w-4 h-4 text-emerald-400" />
                    <span>{backLabel}</span>
                </button>

                {/* Pulsing Connection Dot & Real-Time Sync Indicator */}
                <div className="flex items-center gap-3">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200/80 rounded-full text-xs font-bold shadow-2xs">
                        <span className="flex h-2 w-2 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600" />
                        </span>
                        <span>Live Auction Room Connected</span>
                    </div>

                    <button
                        onClick={refetchBids}
                        disabled={bidsLoading}
                        className="p-2 bg-white hover:bg-slate-100 text-slate-600 border border-slate-200/80 rounded-xl transition cursor-pointer disabled:opacity-50 shadow-2xs"
                        title="Refresh Live Bids"
                    >
                        <RefreshCw className={`w-4 h-4 text-emerald-600 ${bidsLoading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {bidsError && (
                <div className="p-4 bg-rose-50 text-rose-700 text-xs font-bold rounded-xl border border-rose-200/60">
                    {bidsError}
                </div>
            )}

            {/* Header Card */}
            <div className="bg-white p-6 rounded-2xl border-none shadow-none">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-slate-900 text-emerald-400 flex items-center justify-center font-black text-lg shrink-0 shadow-xs">
                            <Hammer className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h2 className="text-xl font-black text-slate-900 tracking-tight">
                                    Month #{auction.auctionNumber} Live Bidding Room
                                </h2>
                                <AuctionStatusBadge status={auction.status} size="sm" />
                            </div>
                            <p className="text-xs text-slate-400 font-medium mt-0.5">
                                {groupObj?.name ? `Circle: ${groupObj.name}` : 'Live Member Bidding System'} • Total Pool: <strong className="text-slate-900 font-bold">{formatCurrency(monthlyContribution * totalMembers, currency)}</strong>
                            </p>
                        </div>
                    </div>

                    {/* Quick Stats Pills */}
                    <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
                        <span className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-xl">
                            Allowed Range: {auction.minimumBidPercentage}% — {auction.maximumBidPercentage}%
                        </span>
                        {highestBidPercentage !== undefined && (
                            <span className="px-3 py-1.5 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200/60">
                                Current Best Discount: <strong className="text-emerald-950 font-black">{highestBidPercentage}%</strong>
                            </span>
                        )}
                    </div>
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
                    currency={currency}
                />
            )}

            {/* Main Bidding Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left Column: Member Bidding Card & Form (5 cols) */}
                <div className="lg:col-span-5 space-y-6">
                    {isMember ? (
                        myActiveBid && !editingBid ? (
                            <BidCard
                                bid={myActiveBid}
                                isAuctionOpen={isAuctionOpen}
                                currency={currency}
                                onEdit={() => setEditingBid(myActiveBid)}
                                onWithdraw={(id) => setConfirmModal({ isOpen: true, type: 'withdraw', bidId: id, bidPercentage: myActiveBid.bidPercentage, bidAmount: myActiveBid.bidAmount })}
                            />
                        ) : (
                            <BidForm
                                auctionId={auction._id}
                                auctionStatus={auction.status}
                                monthlyContribution={monthlyContribution}
                                totalMembers={totalMembers}
                                minBidPercentage={auction.minimumBidPercentage}
                                maxBidPercentage={auction.maximumBidPercentage}
                                currentBestBidPercentage={highestBidPercentage}
                                currency={currency}
                                existingBid={editingBid}
                                isLoading={!!actionLoading}
                                onSubmitBid={handleFormSubmit}
                                onCancelEdit={editingBid ? () => setEditingBid(null) : undefined}
                            />
                        )
                    ) : (
                        <div className="p-6 bg-white rounded-2xl border-none text-xs text-slate-500 font-medium space-y-2">
                            <div className="flex items-center gap-2 text-slate-900 font-bold">
                                <Info className="w-4 h-4 text-emerald-600" />
                                <span>Observer Mode</span>
                            </div>
                            <p className="leading-relaxed">You are viewing this bidding room in observer mode. Only active enrolled circle members can submit bids.</p>
                        </div>
                    )}
                </div>

                {/* Right Column: Live Bids Table (7 cols) */}
                <div className="lg:col-span-7">
                    <BidTable
                        bids={bids}
                        auctionNumber={auction.auctionNumber}
                        currency={currency}
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
