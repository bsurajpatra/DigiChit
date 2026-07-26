import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Layers, LayoutDashboard, Users, Calendar,
    Hammer, Coins, MessageSquare, X
} from 'lucide-react';
import type { ChitTab } from '../../context/ChitSidebarContext';

interface Group {
    _id: string;
    name: string;
    status: string;
    organizerId: { _id: string; name: string; email: string };
}

interface ChitDetailsSidebarProps {
    activeTab: ChitTab;
    setActiveTab: (tab: ChitTab) => void;
    pendingCount: number;
    group: Group | null;
    isOrganizer: boolean;
    onHelpOpen?: () => void;
    isMobileOpen?: boolean;
    setMobileOpen?: (val: boolean) => void;
}

export const ChitDetailsSidebar = ({
    activeTab,
    setActiveTab,
    pendingCount,
    group,
    isOrganizer,
    isMobileOpen = false,
    setMobileOpen,
}: ChitDetailsSidebarProps) => {
    const navigate = useNavigate();

    if (!group) return null;

    const handleAction = (callback: () => void) => {
        if (setMobileOpen) setMobileOpen(false);
        callback();
    };

    const handleTabClick = (tabKey: ChitTab) => {
        setActiveTab(tabKey);
        if (group) {
            navigate(`/chit-details/${group._id}?tab=${tabKey}`);
        }
    };

    const navBtn = (
        tabKey: ChitTab,
        icon: React.ReactNode,
        label: string,
        badge?: React.ReactNode,
    ) => {
        const isActive = activeTab === tabKey;
        return (
            <button
                onClick={() => handleAction(() => handleTabClick(tabKey))}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-bold transition-all duration-300 cursor-pointer text-sm ${
                    isActive
                        ? 'text-emerald-600 bg-emerald-50 translate-x-1'
                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`}
            >
                <div className="flex items-center gap-3">
                    {icon}
                    <span className="truncate">{label}</span>
                </div>
                {badge}
            </button>
        );
    };

    return (
        <>
            {/* Mobile Overlay */}
            {isMobileOpen && setMobileOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* Sidebar Drawer */}
            <aside className={`
                fixed md:static inset-y-0 left-0 z-50
                w-64 md:w-64 bg-white border-r border-slate-200 shadow-sm flex flex-col shrink-0
                transform transition-transform duration-300 ease-in-out
                ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            `}>
                {/* Header: Back + Chit Identity */}
                <div className="p-5 border-b border-slate-100 space-y-4">
                    <div className="flex items-center justify-between gap-2">
                        {/* Transparent Back Button with Bold Black Text */}
                        <button
                            onClick={() => handleAction(() => navigate(isOrganizer ? '/organizer/my-chits' : '/my-chits'))}
                            className="flex-1 flex items-center gap-2 px-3 py-2 bg-transparent hover:bg-slate-100 text-slate-900 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 cursor-pointer group"
                        >
                            <ArrowLeft className="w-4 h-4 text-slate-900 group-hover:-translate-x-1 transition-transform shrink-0" />
                            <span className="truncate font-black text-slate-900">Back to {isOrganizer ? 'Organized' : 'My Chits'}</span>
                        </button>

                        {setMobileOpen && (
                            <button
                                className="md:hidden text-slate-400 hover:text-slate-600 p-2 rounded-xl bg-slate-100"
                                onClick={() => setMobileOpen(false)}
                            >
                                <X className="w-5 h-5" />
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-900 text-emerald-400 flex items-center justify-center shrink-0">
                            <Layers className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-black text-slate-900 truncate uppercase tracking-tight leading-tight">
                                {group.name}
                            </p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                                    group.status === 'FORMING'
                                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                }`}>
                                    {group.status}
                                </span>
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                    #{group._id.slice(-6).toUpperCase()}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="p-4 flex-1 space-y-1 overflow-y-auto">
                    <p className="px-4 text-[9px] font-black uppercase tracking-widest text-slate-400 pb-2">
                        Circle Navigation
                    </p>

                    {navBtn(
                        'OVERVIEW',
                        <LayoutDashboard className={`w-5 h-5 shrink-0 ${activeTab === 'OVERVIEW' ? 'text-emerald-600' : 'text-slate-400'}`} />,
                        'Overview',
                    )}

                    {navBtn(
                        'MEMBERS',
                        <Users className={`w-5 h-5 shrink-0 ${activeTab === 'MEMBERS' ? 'text-emerald-600' : 'text-slate-400'}`} />,
                        'Members & Quota',
                        isOrganizer && pendingCount > 0 ? (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-500 text-white">
                                {pendingCount}
                            </span>
                        ) : undefined,
                    )}

                    {navBtn(
                        'CYCLES',
                        <Calendar className={`w-5 h-5 shrink-0 ${activeTab === 'CYCLES' ? 'text-emerald-600' : 'text-slate-400'}`} />,
                        'Cycles & Timeline',
                    )}

                    {navBtn(
                        'AUCTIONS',
                        <Hammer className={`w-5 h-5 shrink-0 ${activeTab === 'AUCTIONS' ? 'text-emerald-600' : 'text-slate-400'}`} />,
                        'Auctions & Bids',
                    )}

                    {navBtn(
                        'INSTALLMENTS',
                        <Coins className={`w-5 h-5 shrink-0 ${activeTab === 'INSTALLMENTS' ? 'text-emerald-600' : 'text-slate-400'}`} />,
                        'Installments & Dues',
                    )}

                    {navBtn(
                        'HELP',
                        <MessageSquare className={`w-5 h-5 shrink-0 ${activeTab === 'HELP' ? 'text-emerald-600' : 'text-slate-400'}`} />,
                        'Need Help?',
                    )}
                </nav>
            </aside>
        </>
    );
};
