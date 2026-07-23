import type { Bid } from '../../types/bid';
import { BidStatusBadge } from './BidStatusBadge';
import { History, Trophy } from 'lucide-react';
import { format } from 'date-fns';

interface BidHistoryProps {
    bids: Bid[];
    isLoading?: boolean;
}

export const BidHistory = ({ bids, isLoading: _isLoading = false }: BidHistoryProps) => {
    if (bids.length === 0) {
        return (
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 text-center text-slate-400 text-xs">
                <History className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                <p>No past bidding history recorded.</p>
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <History className="w-4 h-4 text-amber-500" />
                <span>Your Bidding History</span>
            </h3>

            <div className="space-y-3">
                {bids.map((bid) => {
                    const cycleNum = typeof bid.cycleId === 'object' ? bid.cycleId.cycleNumber : 1;
                    const isWinning = bid.isWinningBid || bid.status === 'WINNING';

                    return (
                        <div
                            key={bid._id}
                            className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 text-xs transition ${
                                isWinning
                                    ? 'bg-amber-50/60 border-amber-200'
                                    : 'bg-slate-50 border-slate-100'
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                                    isWinning ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-700'
                                }`}>
                                    {isWinning ? <Trophy className="w-4 h-4" /> : `#${cycleNum}`}
                                </div>
                                <div>
                                    <span className="font-bold text-slate-900 block">Cycle #{cycleNum} Bid</span>
                                    <span className="text-[10px] text-slate-400 block">
                                        {format(new Date(bid.submittedAt || bid.createdAt), 'PP')}
                                    </span>
                                </div>
                            </div>

                            <div className="text-right">
                                <span className="font-black text-slate-900 text-xs block">{bid.bidPercentage}% (₹{bid.bidAmount})</span>
                                <div className="mt-0.5">
                                    <BidStatusBadge status={bid.status} isWinning={isWinning} size="sm" />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
