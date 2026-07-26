import { useState } from 'react';
import { Outlet, useMatch } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { Sidebar } from '../navigation/Sidebar';
import { ChitDetailsSidebar } from '../navigation/ChitDetailsSidebar';
import { ChitSidebarProvider, useChitSidebar } from '../../context/ChitSidebarContext';

// Inner layout so it can consume the ChitSidebarContext
const LayoutInner = () => {
    const [isMobileOpen, setMobileOpen] = useState(false);
    const isChitDetails = useMatch('/chit-details/:id');
    const isChitAuctions = useMatch('/chits/:groupId/auctions');
    const isAuctionDetails = useMatch('/auctions/:auctionId');
    const isAuctionBids = useMatch('/auctions/:auctionId/bids');
    const isChitCycles = useMatch('/chits/:groupId/cycles');
    const isCycleDetails = useMatch('/cycles/:cycleId');
    const isChitInstallments = useMatch('/chits/:groupId/installments');

    const { group, activeTab, setActiveTab, pendingCount, isOrganizer, setHelpOpen } = useChitSidebar();

    const showChitDetailsSidebar = Boolean(
        group && (isChitDetails || isChitAuctions || isAuctionDetails || isAuctionBids || isChitCycles || isCycleDetails || isChitInstallments)
    );

    return (
        <div className="h-screen bg-slate-50 flex flex-col md:flex-row overflow-hidden w-full">
            {/* Show ChitDetailsSidebar when on Chit Details page, otherwise show Main Sidebar */}
            {showChitDetailsSidebar ? (
                <ChitDetailsSidebar
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    pendingCount={pendingCount}
                    group={group}
                    isOrganizer={isOrganizer}
                    onHelpOpen={() => setHelpOpen(true)}
                    isMobileOpen={isMobileOpen}
                    setMobileOpen={setMobileOpen}
                />
            ) : (
                <Sidebar isMobileOpen={isMobileOpen} setMobileOpen={setMobileOpen} />
            )}

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col w-full min-w-0 h-full overflow-hidden">
                {/* Mobile Header */}
                <header className="md:hidden flex items-center justify-between p-4 bg-white border-b border-slate-200 shadow-sm shrink-0">
                    <span className="text-xl font-bold tracking-tight text-slate-900">DigiChit</span>
                    <button
                        onClick={() => setMobileOpen(true)}
                        className="p-2 -mr-2 text-slate-500 hover:text-slate-800 focus:outline-none"
                    >
                        <Menu className="w-6 h-6" />
                    </button>
                </header>

                {/* Main page content scrolls independently inside this box */}
                <main className="flex-1 p-6 md:p-8 w-full overflow-y-auto overflow-x-hidden bg-slate-50">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export const DashboardLayout = () => (
    <ChitSidebarProvider>
        <LayoutInner />
    </ChitSidebarProvider>
);
