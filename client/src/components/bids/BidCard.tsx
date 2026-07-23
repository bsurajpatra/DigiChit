import type { Bid } from '../../types/bid';
import { BidStatusBadge } from './BidStatusBadge';
import { Hammer, Edit3, Trash2, Trophy } from 'lucide-react';
import { format } from 'date-fns';

interface BidCardProps {
    bid: Bid;
    isAuctionOpen?: boolean;
    onEdit?: (bid: Bid) => void;
    onWithdraw?: (bidId: string) => void;
}

export const BidCard = ({
    bid,
    isAuctionOpen = false,
    onEdit,
    onWithdraw
}: BidCardProps) => {
    const isWinning = bid.isWinningBid || bid.status === 'WINNING';

    return (
        <div className={`
            bg-white p-6 rounded-3xl border transition-all duration-300 relative overflow-hidden shadow-xs hover:shadow-md
            ${isWinning
                ? 'border-amber-300 ring-2 ring-amber-400/20 bg-gradient-to-b from-amber-50/20 to-white'
                : 'border-slate-200/80 hover:border-slate-300'
            }
        `}>
            <div className="flex items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2.5">
                    <div className={`
                        w-10 h-10 rounded-2xl flex items-center justify-center font-black shrink-0
                        ${isWinning ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30' : 'bg-slate-100 text-slate-700'}
                    `}>
                        {isWinning ? <Trophy className="w-5 h-5" /> : <Hammer className="w-5 h-5" />}
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-slate-900">Your Submitted Bid</h4>
                        <p className="text-[11px] font-medium text-slate-400">
                            {format(new Date(bid.submittedAt || bid.createdAt), 'PPpp')}
                        </p>
                    </div>
                </div>

                <BidStatusBadge status={bid.status} isWinning={isWinning} size="sm" />
            </div>

            {/* Financial Details */}
            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-xs mb-4">
                <div>
                    <span className="text-slate-400 font-medium block text-[10px] uppercase">Bid Discount %</span>
                    <span className="text-base font-black text-slate-900">{bid.bidPercentage}%</span>
                </div>

                <div>
                    <span className="text-slate-400 font-medium block text-[10px] uppercase">Discount Amount (₹)</span>
                    <span className="text-base font-black text-emerald-600">
                        ₹{(bid.bidAmount || 0).toLocaleString('en-IN')}
                    </span>
                </div>
            </div>

            {bid.remarks && (
                <p className="text-xs text-slate-500 italic mb-4">"{bid.remarks}"</p>
            )}

            {/* Actions for member while auction is OPEN */}
            {isAuctionOpen && bid.status !== 'WITHDRAWN' && (onEdit || onWithdraw) && (
                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                    {onEdit && (
                        <button
                            onClick={() => onEdit(bid)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
                        >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Edit Bid</span>
                        </button>
                    )}

                    {onWithdraw && (
                        <button
                            onClick={() => onWithdraw(bid._id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold rounded-xl transition cursor-pointer"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Withdraw</span>
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};
