import { PlusCircle, RefreshCw, Hammer, Sparkles } from 'lucide-react';
import type { AuctionStatus } from '../../types/auction';

interface AuctionHeaderProps {
    groupName?: string;
    isOrganizer?: boolean;
    isAdmin?: boolean;
    activeTab?: 'ALL' | AuctionStatus;
    onTabChange?: (tab: 'ALL' | AuctionStatus) => void;
    onScheduleAuction?: () => void;
    onRefresh?: () => void;
    isLoading?: boolean;
}

export const AuctionHeader = ({
    groupName,
    isOrganizer = false,
    isAdmin = false,
    activeTab = 'ALL',
    onTabChange,
    onScheduleAuction,
    onRefresh,
    isLoading = false
}: AuctionHeaderProps) => {
    return (
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs mb-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 text-xs font-bold text-amber-600 uppercase tracking-wider mb-1">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Chit Fund Auctions</span>
                    </div>
                    <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                        <Hammer className="w-6 h-6 text-slate-800" />
                        <span>{groupName ? `${groupName} — Auctions` : 'Monthly Member Auctions'}</span>
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                        Monitor live bidding, auction schedules, countdown timers, and winner declarations.
                    </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                    {onRefresh && (
                        <button
                            onClick={onRefresh}
                            disabled={isLoading}
                            className="p-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition-all active:scale-95 cursor-pointer disabled:opacity-50 shadow-xs flex items-center justify-center shrink-0"
                            title="Refresh Auctions"
                        >
                            <RefreshCw className={`w-4 h-4 text-emerald-400 ${isLoading ? 'animate-spin' : ''}`} />
                        </button>
                    )}

                    {(isOrganizer || isAdmin) && onScheduleAuction && (
                        <button
                            onClick={onScheduleAuction}
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition shadow-md shadow-emerald-600/20 active:scale-95 cursor-pointer"
                        >
                            <PlusCircle className="w-4 h-4" />
                            <span>Schedule Auction</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Filter Tabs */}
            {onTabChange && (
                <div className="flex items-center gap-2 mt-6 pt-4 border-t border-slate-100 overflow-x-auto">
                    {(['ALL', 'OPEN', 'SCHEDULED', 'CLOSED', 'WINNER_DECLARED'] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => onTabChange(tab)}
                            className={`
                                px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap
                                ${activeTab === tab
                                    ? 'bg-slate-900 text-white shadow-xs'
                                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                                }
                            `}
                        >
                            {tab === 'ALL' ? 'All Auctions' : tab === 'OPEN' ? 'LIVE (OPEN)' : tab.replace('_', ' ')}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};
