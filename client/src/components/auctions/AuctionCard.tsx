import type { Auction } from '../../types/auction';
import { AuctionStatusBadge } from './AuctionStatusBadge';
import { CountdownTimer } from './CountdownTimer';
import { WinnerBanner } from './WinnerBanner';
import { AuctionTimeline } from './AuctionTimeline';
import { Hammer, ArrowRight, XCircle, Edit3, Loader2 } from 'lucide-react';

interface AuctionCardProps {
    auction: Auction;
    isOrganizer?: boolean;
    isAdmin?: boolean;
    actionLoading?: string | null;
    onStart?: (auctionId: string) => void;
    onCloseAuction?: (auctionId: string) => void;
    onDeclareWinner?: (auctionId: string) => void;
    onCancel?: (auctionId: string) => void;
    onEdit?: (auction: Auction) => void;
    onViewDetails?: (auctionId: string) => void;
    onViewBids?: (auctionId: string) => void;
}

export const AuctionCard = ({
    auction,
    isOrganizer = false,
    isAdmin = false,
    actionLoading,
    onStart,
    onCloseAuction,
    onDeclareWinner,
    onCancel,
    onEdit,
    onViewDetails,
    onViewBids
}: AuctionCardProps) => {
    const cycleNum = typeof auction.cycleId === 'object' ? auction.cycleId.cycleNumber : auction.auctionNumber;
    const isWinnerDeclared = auction.status === 'WINNER_DECLARED' || !!auction.winningMembershipId;

    const isStarting = actionLoading === `status-OPEN-${auction._id}`;
    const isClosing = actionLoading === `status-CLOSED-${auction._id}`;
    const isCancelling = actionLoading === `status-CANCELLED-${auction._id}`;

    return (
        <div className="bg-white rounded-2xl border-none p-6 flex flex-col justify-between relative shadow-none hover:shadow-xs transition-all space-y-4">
            <div>
                {/* Auction Header & Status */}
                <div className="flex items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-900 text-emerald-400 flex items-center justify-center font-bold shrink-0">
                            <Hammer className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-slate-900 leading-snug">Auction #{cycleNum}</h3>
                            <p className="text-[11px] font-medium text-slate-400">Monthly Member Auction</p>
                        </div>
                    </div>

                    <AuctionStatusBadge status={auction.status} size="sm" />
                </div>

                {/* Countdown Timer for OPEN or SCHEDULED auctions */}
                {auction.status === 'SCHEDULED' && (
                    <div className="mb-4">
                        <CountdownTimer targetDate={auction.scheduledStartTime} label="Auction Starts In" />
                    </div>
                )}

                {auction.status === 'OPEN' && auction.scheduledEndTime && (
                    <div className="mb-4">
                        <CountdownTimer targetDate={auction.scheduledEndTime} label="Auction Closing In" />
                    </div>
                )}

                {/* Winner Banner if Declared */}
                {isWinnerDeclared && (
                    <div className="mb-4">
                        <WinnerBanner
                            winner={auction.winningMembershipId || null}
                            winningBidPercentage={auction.minimumBidPercentage}
                            remarks={auction.remarks}
                        />
                    </div>
                )}

                {/* Bid Limits Info */}
                <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border-none text-xs mb-4">
                    <div>
                        <span className="text-slate-400 font-bold block text-[10px] uppercase">Min Bid Limit</span>
                        <span className="font-bold text-slate-900">{auction.minimumBidPercentage}%</span>
                    </div>
                    <div>
                        <span className="text-slate-400 font-bold block text-[10px] uppercase">Max Bid Limit</span>
                        <span className="font-bold text-slate-900">{auction.maximumBidPercentage}%</span>
                    </div>
                </div>

                {/* Timeline info */}
                <AuctionTimeline auction={auction} />
            </div>

            {/* Action Bar */}
            <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 mt-4">
                <div className="flex items-center gap-2">
                    {onViewBids && (
                        <button
                            onClick={() => onViewBids(auction._id)}
                            className="px-3.5 py-2 bg-slate-900 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition cursor-pointer inline-flex items-center gap-1.5"
                        >
                            <Hammer className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Bidding Room</span>
                        </button>
                    )}

                    {onViewDetails && (
                        <button
                            onClick={() => onViewDetails(auction._id)}
                            className="px-3 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 inline-flex items-center gap-1 transition cursor-pointer"
                        >
                            <span>Details</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>

                {(isOrganizer || isAdmin) && (
                    <div className="flex items-center gap-2 ml-auto">
                        {auction.status === 'SCHEDULED' && (
                            <>
                                {onEdit && (
                                    <button
                                        onClick={() => onEdit(auction)}
                                        className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                                        title="Edit Schedule"
                                    >
                                        <Edit3 className="w-4 h-4" />
                                    </button>
                                )}
                                {onStart && (
                                    <button
                                        onClick={() => onStart(auction._id)}
                                        disabled={!!actionLoading}
                                        className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5"
                                    >
                                        {isStarting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                        <span>Start Auction</span>
                                    </button>
                                )}
                            </>
                        )}

                        {auction.status === 'OPEN' && (
                            <>
                                {onCloseAuction && (
                                    <button
                                        onClick={() => onCloseAuction(auction._id)}
                                        disabled={!!actionLoading}
                                        className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5"
                                    >
                                        {isClosing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                        <span>Close Bidding</span>
                                    </button>
                                )}
                                {onDeclareWinner && (
                                    <button
                                        onClick={() => onDeclareWinner(auction._id)}
                                        className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition cursor-pointer inline-flex items-center gap-1.5"
                                    >
                                        <span>Declare Winner</span>
                                    </button>
                                )}
                            </>
                        )}

                        {(auction.status === 'SCHEDULED' || auction.status === 'OPEN') && onCancel && (
                            <button
                                onClick={() => onCancel(auction._id)}
                                disabled={!!actionLoading}
                                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer disabled:opacity-50"
                                title="Cancel Auction"
                            >
                                {isCancelling ? <Loader2 className="w-4 h-4 animate-spin text-rose-600" /> : <XCircle className="w-4 h-4" />}
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
