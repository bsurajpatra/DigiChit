import { Card } from '../../components/ui/Card';
import { useAuth } from '../../hooks/useAuth';
import { Clock, Users, ArrowUpRight } from 'lucide-react';

export const Dashboard = () => {
    const { user } = useAuth();

    return (
        <div className="h-full flex flex-col gap-4 animate-in fade-in duration-500">
            {/* Reduced Header */}
            <div className="flex items-center justify-between bg-white/50 backdrop-blur-md px-6 py-4 rounded-3xl border border-white/40 shadow-lg shadow-slate-100/50">
                <div>
                    <h1 className="text-xl font-bold text-slate-900 tracking-tight uppercase leading-tight">Hello, {user?.name.split(' ')[0]} 👋</h1>
                    <p className="text-[9px] font-bold text-slate-400 mt-0.5 uppercase tracking-widest leading-none">Workspace Insights & Financial Health</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-slate-50/50 rounded-2xl border border-slate-100">
                    <div className="w-6 h-6 bg-emerald-100 text-emerald-800 rounded-lg flex items-center justify-center font-black text-xs">
                        <Clock className="w-4 h-4" />
                    </div>
                    <span className="font-black text-slate-600 uppercase tracking-widest text-[9px]">Live Data</span>
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="!p-5 rounded-3xl border-slate-100/60 shadow-sm hover:shadow-md transition-shadow">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center justify-between">
                        Upcoming Chit
                        <Clock className="w-3.5 h-3.5 text-emerald-600" />
                    </div>
                    <div className="text-2xl font-black text-slate-900 tracking-tight">₹25,000</div>
                    <div className="mt-2 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Due in 5 days</p>
                    </div>
                </Card>
                
                <Card className="!p-5 rounded-3xl border-slate-100/60 shadow-sm hover:shadow-md transition-shadow">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center justify-between">
                        Active Groups
                        <Users className="w-3.5 h-3.5 text-blue-500" />
                    </div>
                    <div className="text-2xl font-black text-slate-900 tracking-tight">2</div>
                    <div className="mt-2 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">1 host, 1 member</p>
                    </div>
                </Card>

                <Card className="!p-5 rounded-3xl border-slate-100/60 shadow-sm hover:shadow-md transition-shadow">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center justify-between">
                        Total Dividend
                        <ArrowUpRight className="w-3.5 h-3.5 text-purple-500" />
                    </div>
                    <div className="text-2xl font-black text-slate-900 tracking-tight">₹4,200</div>
                    <div className="mt-2 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Lifetime Pulse</p>
                    </div>
                </Card>
            </div>

            {/* Main Area */}
            <div className="flex-1 bg-white/60 backdrop-blur-sm border border-white/60 rounded-3xl overflow-hidden shadow-xl shadow-slate-100/50 flex flex-col items-center justify-center p-8 text-center min-h-[300px]">
                <div className="w-20 h-20 bg-slate-50 rounded-2xl flex items-center justify-center mb-6 shadow-inner group">
                    <Users className="w-8 h-8 text-slate-200 group-hover:text-emerald-300 transition-all duration-700" />
                </div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight uppercase mb-2">Chit Groups Coming Soon</h2>
                <p className="text-[10px] font-bold text-slate-400 max-w-[280px] mx-auto uppercase tracking-widest leading-relaxed">
                    Financial circle synchronization is under active development. You'll be able to join auctions and manage funds here shortly.
                </p>
                <div className="mt-8 h-1 w-24 bg-slate-50 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 w-1/3 animate-[progress_3s_infinite_linear]"></div>
                </div>
            </div>

            <style>{`
                @keyframes progress {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(300%); }
                }
            `}</style>
        </div>
    );
};
