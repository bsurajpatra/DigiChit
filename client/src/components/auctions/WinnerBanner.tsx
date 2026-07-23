import type { WinnerMembership } from '../../types/auction';
import { Trophy, Sparkles } from 'lucide-react';

interface WinnerBannerProps {
    winner: WinnerMembership | string | null;
    winningBidPercentage?: number | null;
    winningBidAmount?: number | null;
    remarks?: string | null;
}

export const WinnerBanner = ({
    winner,
    winningBidPercentage,
    winningBidAmount,
    remarks
}: WinnerBannerProps) => {
    if (!winner) return null;

    const winnerName = typeof winner === 'object' && winner?.userId?.name ? winner.userId.name : 'Winner Member';
    const winnerEmail = typeof winner === 'object' && winner?.userId?.email ? winner.userId.email : null;

    return (
        <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-white p-5 rounded-3xl shadow-xl shadow-amber-500/20 relative overflow-hidden">
            <div className="absolute -right-6 -bottom-6 opacity-15 text-white pointer-events-none">
                <Trophy className="w-36 h-36" />
            </div>

            <div className="flex items-start gap-4 relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md text-white flex items-center justify-center font-black border border-white/30 shrink-0 shadow-inner">
                    <Trophy className="w-6 h-6 text-amber-100" />
                </div>

                <div className="flex-1">
                    <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-amber-200">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Winner Declared</span>
                    </div>

                    <h4 className="text-xl font-black text-white mt-0.5">{winnerName}</h4>
                    {winnerEmail && <p className="text-xs text-amber-100 font-medium">{winnerEmail}</p>}

                    <div className="mt-3 pt-3 border-t border-white/20 flex flex-wrap items-center gap-4 text-xs font-bold">
                        {winningBidAmount && (
                            <div className="bg-black/20 px-3 py-1.5 rounded-xl border border-white/20">
                                <span className="text-amber-200 text-[10px] uppercase block">Winning Bid</span>
                                <span className="text-sm font-black text-white">₹{winningBidAmount.toLocaleString('en-IN')}</span>
                            </div>
                        )}

                        {winningBidPercentage !== undefined && winningBidPercentage !== null && (
                            <div className="bg-black/20 px-3 py-1.5 rounded-xl border border-white/20">
                                <span className="text-amber-200 text-[10px] uppercase block">Bid Discount %</span>
                                <span className="text-sm font-black text-white">{winningBidPercentage}%</span>
                            </div>
                        )}
                    </div>

                    {remarks && (
                        <p className="mt-2 text-xs text-amber-100 italic">"{remarks}"</p>
                    )}
                </div>
            </div>
        </div>
    );
};
