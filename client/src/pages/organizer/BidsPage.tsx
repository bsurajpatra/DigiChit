import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useBids } from '../../hooks/useBids';
import * as auctionApi from '../../api/auction.api';
import api from '../../api/axios';
import type { Auction } from '../../types/auction';
import type { Bid } from '../../types/bid';
import { AuctionStatusBadge } from '../../components/auctions/AuctionStatusBadge';
import { CountdownTimer } from '../../components/auctions/CountdownTimer';
import { WinnerBanner } from '../../components/auctions/WinnerBanner';
import { BidForm } from '../../components/bids/BidForm';
import { BidCard } from '../../components/bids/BidCard';
import { BidTable } from '../../components/bids/BidTable';
import { BidHistory } from '../../components/bids/BidHistory';
import { BidConfirmationModal } from '../../components/bids/BidConfirmationModal';
import { LoadingSkeleton } from '../../components/cycles/LoadingSkeleton';
import { ArrowLeft, Hammer, RefreshCw, ShieldCheck, AlertCircle, Info } from 'lucide-react';

export const BidsPage = () => {
    const { auctionId } = useParams<{ auctionId: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();

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
        pendingInput?: any;
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

    const isOrganizer = user?.id === auction?.organizerId || (groupObj && user?.id === (groupObj as any).organizerId);

    // Check if the current user is an active member in groupMembers
    const isMember = groupMembers.some((m) => {
        const uId = typeof m.userId === 'object' ? m.userId._id : m.userId;
        return uId === user?.id && ['APPROVED', 'ACTIVE_MEMBER'].includes(m.status);
    });

    // Handlers
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
        return <LoadingSkeleton />;
    }

    if (!auction) {
        return (
            <div className="p-8 text-center bg-white rounded-3xl border border-slate-200">
                <h3 className="text-lg font-bold text-slate-900">Auction Not Found</h3>
                <button onClick={() => navigate(-1)} className="mt-4 px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl">
                    Go Back
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-12">
            {/* Back Nav */}
            <button
                onClick={() => navigate(-1)}
                className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition cursor-pointer"
            >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Auction Details</span>
            </button>

            {bidsError && (
                <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-2xl">
                    {bidsError}
                </div>
            )}

            {/* Header Card */}
            <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200/80 shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-black text-xl shadow-md shadow-amber-500/30 shrink-0">
                            <Hammer className="w-7 h-7" />
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-2xl font-black text-slate-900">Auction #{auction.auctionNumber} Bidding Room</h1>
                                <AuctionStatusBadge status={auction.status} size="md" />
                            </div>
                            <p className="text-xs text-slate-500 mt-1">
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

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Member Bidding Card & Form or Organizer View */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Check if User is Member or Organizer */}
                    {isMember ? (
                        /* Member Mode */
                        myActiveBid && !editingBid ? (
                            <BidCard
                                bid={myActiveBid}
                                isAuctionOpen={isAuctionOpen}
                                onEdit={(b) => setEditingBid(b)}
                                onWithdraw={(bidId) => setConfirmModal({ isOpen: true, type: 'withdraw', bidId })}
                            />
                        ) : (
                            <BidForm
                                auctionId={auction._id}
                                auctionStatus={auction.status}
                                minBidPercentage={auction.minimumBidPercentage}
                                maxBidPercentage={auction.maximumBidPercentage}
                                monthlyContribution={monthlyContribution}
                                totalMembers={totalMembers}
                                existingBid={editingBid || myActiveBid}
                                isLoading={!!actionLoading}
                                onSubmitBid={handleFormSubmit}
                                onCancelEdit={editingBid ? () => setEditingBid(null) : undefined}
                            />
                        )
                    ) : isOrganizer ? (
                        /* Organizer Mode Notice */
                        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
                            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center font-black">
                                    <ShieldCheck className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-slate-900">Auction Leader View</h3>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-600">
                                        ORGANIZER MODE
                                    </span>
                                </div>
                            </div>

                            <p className="text-xs text-slate-600 leading-relaxed">
                                You are conducting this auction as the <strong>Chit Group Organizer</strong>. As non-bidding management, you monitor live member bids via the <strong>Submitted Bids Log</strong> on the right.
                            </p>

                            <div className="p-3 bg-amber-50 border border-amber-200/80 rounded-2xl text-xs text-amber-800 space-y-1">
                                <span className="font-bold block flex items-center gap-1">
                                    <Info className="w-3.5 h-3.5 text-amber-600" />
                                    Organizer Note:
                                </span>
                                <p className="text-[11px] text-amber-700">
                                    If you also wish to participate as a bidding member in this chit group, enroll yourself as a member in the group details page.
                                </p>
                            </div>
                        </div>
                    ) : (
                        /* Non-Member User Access Notice */
                        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
                            <div className="flex items-center gap-2 text-rose-600 font-bold text-sm">
                                <AlertCircle className="w-5 h-5" />
                                <span>Bidding Restricted</span>
                            </div>
                            <p className="text-xs text-slate-600">
                                You must be an approved active member of this Chit Group to submit auction bids.
                            </p>
                        </div>
                    )}

                    {/* Member History */}
                    {isMember && (
                        <BidHistory bids={bids.filter((b) => {
                            const uId = typeof b.userId === 'object' ? b.userId._id : b.userId;
                            return uId === user?.id;
                        })} />
                    )}
                </div>

                {/* Right Column: Submitted Bids Table for Organizers/Admins or Members */}
                <div className="lg:col-span-2">
                    <BidTable bids={bids} auctionNumber={auction.auctionNumber} isLoading={bidsLoading} />
                </div>
            </div>

            {/* Confirmation Dialog */}
            <BidConfirmationModal
                isOpen={confirmModal.isOpen}
                type={confirmModal.type}
                bidPercentage={confirmModal.bidPercentage}
                bidAmount={confirmModal.bidAmount}
                isLoading={!!actionLoading}
                onConfirm={handleWithdrawConfirm}
                onCancel={() => setConfirmModal({ isOpen: false, type: null })}
            />
        </div>
    );
};
