import { useAuth } from '../../hooks/useAuth';
import { Clock, Users, ArrowUpRight, LayoutDashboard, RefreshCw } from 'lucide-react';

export const Dashboard = () => {
    const { user } = useAuth();

    return (
        <div className="h-full flex flex-col gap-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
                        <LayoutDashboard className="w-4 h-4" />
                        <span>Workspace Insights & Financial Health</span>
                    </div>
                    <h1 className="text-xl font-black text-slate-900 tracking-tight">Hello, {user?.name.split(' ')[0]} 👋</h1>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center gap-2 px-3.5 py-1.5 bg-slate-100 text-slate-800 rounded-full text-xs font-bold border-none">
                        <Clock className="w-3.5 h-3.5 text-slate-900" />
                        <span>Live Data</span>
                    </div>
                    <button
                        onClick={() => window.location.reload()}
                        className="p-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition-all active:scale-95 cursor-pointer shadow-xs flex items-center justify-center"
                        title="Refresh Workspace"
                    >
                        <RefreshCw className="w-4 h-4 text-emerald-400" />
                    </button>
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl border-none shadow-none space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Upcoming Chit</span>
                        <div className="w-10 h-10 rounded-xl bg-slate-900 text-emerald-400 flex items-center justify-center font-bold shrink-0">
                            <Clock className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="text-2xl font-black text-slate-900 tracking-tight">₹25,000</div>
                    <div className="flex items-center gap-1.5 pt-1">
                        <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                        <p className="text-xs font-bold text-slate-500">Due in 5 days</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border-none shadow-none space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Groups</span>
                        <div className="w-10 h-10 rounded-xl bg-slate-900 text-sky-400 flex items-center justify-center font-bold shrink-0">
                            <Users className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="text-2xl font-black text-slate-900 tracking-tight">2</div>
                    <div className="flex items-center gap-1.5 pt-1">
                        <span className="w-2 h-2 rounded-full bg-sky-500 shrink-0" />
                        <p className="text-xs font-bold text-slate-500">1 host, 1 member</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border-none shadow-none space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Dividend</span>
                        <div className="w-10 h-10 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center font-bold shrink-0">
                            <ArrowUpRight className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="text-2xl font-black text-slate-900 tracking-tight">₹4,200</div>
                    <div className="flex items-center gap-1.5 pt-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                        <p className="text-xs font-bold text-slate-500">Lifetime Pulse</p>
                    </div>
                </div>
            </div>

            {/* Main Area */}
            <div className="flex-1 bg-white rounded-2xl border-none shadow-none flex flex-col items-center justify-center p-8 text-center min-h-[300px]">
                <div className="w-16 h-16 bg-slate-900 text-emerald-400 rounded-xl flex items-center justify-center mb-6 shrink-0 font-bold">
                    <Users className="w-8 h-8" />
                </div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight mb-2">Chit Groups Coming Soon</h2>
                <p className="text-xs font-medium text-slate-400 max-w-[280px] mx-auto leading-relaxed">
                    Financial circle synchronization is under active development. You'll be able to join auctions and manage funds here shortly.
                </p>
            </div>
        </div>
    );
};
