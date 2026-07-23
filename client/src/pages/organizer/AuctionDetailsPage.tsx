import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import * as auctionApi from '../../api/auction.api';
import type { Auction } from '../../types/auction';
import { AuctionStatusBadge } from '../../components/auctions/AuctionStatusBadge';
import { CountdownTimer } from '../../components/auctions/CountdownTimer';
import { WinnerBanner } from '../../components/auctions/WinnerBanner';
import { AuctionTimeline } from '../../components/auctions/AuctionTimeline';
import { ConfirmationDialog } from '../../components/cycles/ConfirmationDialog';
import { LoadingSkeleton } from '../../components/cycles/LoadingSkeleton';
import {
    ArrowLeft, Hammer, PlayCircle, CheckCircle, XCircle
} from 'lucide-react';

export const AuctionDetailsPage = () => {
    const { auctionId } = useParams<{ auctionId: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [auction, setAuction] = useState<Auction | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        type: 'start' | 'close' | 'cancel' | null;
    }>({ isOpen: false, type: null });

    const loadAuction = async () => {
        if (!auctionId) return;
        setLoading(true);
        setError(null);
        try {
            const data = await auctionApi.fetchAuctionDetails(auctionId);
            setAuction(data);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to fetch auction details');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAuction();
    }, [auctionId]);

    const groupObj = typeof auction?.groupId === 'object' ? auction.groupId : null;
    const isOrganizer = user?.id === auction?.organizerId;
    const isAdmin = user?.role === 'ADMIN';

    const handleStart = async () => {
        if (!auctionId) return;
        setActionLoading(true);
        try {
            await auctionApi.updateAuctionStatus(auctionId, 'OPEN');
            await loadAuction();
            setConfirmModal({ isOpen: false, type: null });
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to start auction');
        } finally {
            setActionLoading(false);
        }
    };

    const handleClose = async () => {
        if (!auctionId) return;
        setActionLoading(true);
        try {
            await auctionApi.updateAuctionStatus(auctionId, 'CLOSED');
            await loadAuction();
            setConfirmModal({ isOpen: false, type: null });
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to close auction');
        } finally {
            setActionLoading(false);
        }
    };

    const handleCancel = async () => {
        if (!auctionId) return;
        setActionLoading(true);
        try {
            await auctionApi.updateAuctionStatus(auctionId, 'CANCELLED');
            await loadAuction();
            setConfirmModal({ isOpen: false, type: null });
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to cancel auction');
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) {
        return <LoadingSkeleton />;
    }

    if (!auction) {
        return (
            <div className="p-8 text-center bg-white rounded-3xl border border-slate-200">
                <h3 className="text-lg font-bold text-slate-900">Auction Not Found</h3>
                <button
                    onClick={() => navigate(-1)}
                    className="mt-4 px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl"
                >
                    Go Back
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-12">
            {/* Back Nav */}
            <button
                onClick={() => navigate(-1)}
                className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition cursor-pointer"
            >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
            </button>

            {error && (
                <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-2xl">
                    {error}
                </div>
            )}

            {/* Header Card */}
            <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200/80 shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black text-xl shadow-md shadow-emerald-600/30 shrink-0">
                            <Hammer className="w-7 h-7" />
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-2xl font-black text-slate-900">Auction #{auction.auctionNumber} Details</h1>
                                <AuctionStatusBadge status={auction.status} size="lg" />
                            </div>
                            <p className="text-xs text-slate-500 mt-1">
                                {groupObj?.name ? `Group: ${groupObj.name}` : 'Monthly Member Auction'}
                            </p>
                        </div>
                    </div>

                    {(isOrganizer || isAdmin) && (
                        <div className="flex items-center gap-2">
                            {auction.status === 'SCHEDULED' && (
                                <button
                                    onClick={() => setConfirmModal({ isOpen: true, type: 'start' })}
                                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
                                >
                                    <PlayCircle className="w-4 h-4" />
                                    <span>Start Auction</span>
                                </button>
                            )}

                            {auction.status === 'OPEN' && (
                                <button
                                    onClick={() => setConfirmModal({ isOpen: true, type: 'close' })}
                                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
                                >
                                    <CheckCircle className="w-4 h-4" />
                                    <span>Close Bidding</span>
                                </button>
                            )}

                            {auction.status !== 'WINNER_DECLARED' && auction.status !== 'CANCELLED' && (
                                <button
                                    onClick={() => setConfirmModal({ isOpen: true, type: 'cancel' })}
                                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                                    title="Cancel Auction"
                                >
                                    <XCircle className="w-5 h-5" />
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Live Countdown if SCHEDULED or OPEN */}
            {auction.status === 'SCHEDULED' && (
                <CountdownTimer targetDate={auction.scheduledStartTime} label="Auction Starts In" />
            )}

            {auction.status === 'OPEN' && auction.scheduledEndTime && (
                <CountdownTimer targetDate={auction.scheduledEndTime} label="Bidding Closes In" />
            )}

            {/* Grid Content */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                    {/* Winner Banner if Declared */}
                    {auction.winningMembershipId && (
                        <WinnerBanner
                            winner={auction.winningMembershipId}
                            winningBidPercentage={auction.minimumBidPercentage}
                            remarks={auction.remarks}
                        />
                    )}

                    {/* Timeline */}
                    <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
                        <AuctionTimeline auction={auction} />
                    </div>
                </div>

                {/* Right Column: Configuration & Bounds */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Bidding Rules & Limits</h3>

                        <div className="space-y-3 text-xs">
                            <div className="flex justify-between p-3 bg-slate-50 rounded-xl">
                                <span className="text-slate-500 font-medium">Minimum Bid Discount:</span>
                                <span className="font-bold text-slate-900">{auction.minimumBidPercentage}%</span>
                            </div>
                            <div className="flex justify-between p-3 bg-slate-50 rounded-xl">
                                <span className="text-slate-500 font-medium">Maximum Bid Discount:</span>
                                <span className="font-bold text-slate-900">{auction.maximumBidPercentage}%</span>
                            </div>
                        </div>
                    </div>

                    {auction.remarks && (
                        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-2">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Auction Remarks</h3>
                            <p className="text-xs text-slate-600 italic">"{auction.remarks}"</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Confirmation Dialogs */}
            <ConfirmationDialog
                isOpen={confirmModal.isOpen && confirmModal.type === 'start'}
                title={`Start Auction #${auction.auctionNumber}?`}
                description="Starting this auction will open live bidding for members."
                confirmLabel="Start Auction"
                confirmVariant="emerald"
                isLoading={actionLoading}
                onConfirm={handleStart}
                onCancel={() => setConfirmModal({ isOpen: false, type: null })}
            />

            <ConfirmationDialog
                isOpen={confirmModal.isOpen && confirmModal.type === 'close'}
                title={`Close Auction #${auction.auctionNumber}?`}
                description="Close bidding for this auction?"
                confirmLabel="Close Bidding"
                confirmVariant="indigo"
                isLoading={actionLoading}
                onConfirm={handleClose}
                onCancel={() => setConfirmModal({ isOpen: false, type: null })}
            />

            <ConfirmationDialog
                isOpen={confirmModal.isOpen && confirmModal.type === 'cancel'}
                title={`Cancel Auction #${auction.auctionNumber}?`}
                description="Are you sure you want to cancel this auction?"
                confirmLabel="Cancel Auction"
                confirmVariant="rose"
                isLoading={actionLoading}
                onConfirm={handleCancel}
                onCancel={() => setConfirmModal({ isOpen: false, type: null })}
            />
        </div>
    );
};
