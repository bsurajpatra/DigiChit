import { PlusCircle, RefreshCw, Sparkles } from 'lucide-react';

interface CycleHeaderProps {
    groupName?: string;
    isOrganizer?: boolean;
    isAdmin?: boolean;
    activeTab?: 'ALL' | 'ACTIVE' | 'UPCOMING' | 'COMPLETED';
    onTabChange?: (tab: 'ALL' | 'ACTIVE' | 'UPCOMING' | 'COMPLETED') => void;
    onCreateCycle?: () => void;
    onRefresh?: () => void;
    isLoading?: boolean;
}

export const CycleHeader = ({
    groupName,
    isOrganizer = false,
    isAdmin = false,
    activeTab = 'ALL',
    onTabChange,
    onCreateCycle,
    onRefresh,
    isLoading = false
}: CycleHeaderProps) => {
    return (
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs mb-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>ChitCycle Operations</span>
                    </div>
                    <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
                        {groupName ? `${groupName} — Monthly Cycles` : 'Monthly Chit Cycles'}
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                        Manage cycle schedules, active auctions, winner declarations, and operational status.
                    </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                    {onRefresh && (
                        <button
                            onClick={onRefresh}
                            disabled={isLoading}
                            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition active:scale-95 cursor-pointer disabled:opacity-50"
                            title="Refresh Cycles"
                        >
                            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                        </button>
                    )}

                    {(isOrganizer || isAdmin) && onCreateCycle && (
                        <button
                            onClick={onCreateCycle}
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition shadow-md shadow-emerald-600/20 active:scale-95 cursor-pointer"
                        >
                            <PlusCircle className="w-4 h-4" />
                            <span>Create Next Cycle</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Filter Tabs */}
            {onTabChange && (
                <div className="flex items-center gap-2 mt-6 pt-4 border-t border-slate-100 overflow-x-auto">
                    {(['ALL', 'ACTIVE', 'UPCOMING', 'COMPLETED'] as const).map((tab) => (
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
                            {tab === 'ALL' ? 'All Cycles' : tab}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};
