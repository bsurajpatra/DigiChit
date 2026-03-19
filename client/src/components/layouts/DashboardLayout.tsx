import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { Sidebar } from '../navigation/Sidebar';

export const DashboardLayout = () => {
    const [isMobileOpen, setMobileOpen] = useState(false);

    return (
        <div className="h-screen bg-slate-50 flex flex-col md:flex-row overflow-hidden w-full">
            {/* Dynamic Sidebar handles both Desktop and Mobile overlay internally */}
            <Sidebar isMobileOpen={isMobileOpen} setMobileOpen={setMobileOpen} />

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
