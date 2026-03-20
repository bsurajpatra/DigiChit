import { Card } from '../../components/ui/Card';
import { useAuth } from '../../hooks/useAuth';
import { Clock, Users, ArrowUpRight } from 'lucide-react';

export const Dashboard = () => {
    const { user } = useAuth();

    return (
        <div className="space-y-6">
            <div className="shrink-0 flex items-center justify-between bg-white/40 backdrop-blur-md p-6 rounded-[2.5rem] border border-white/40 shadow-xl shadow-slate-100 mb-8">
                <div>
                    <h1 className="text-3xl font-medium text-slate-900 tracking-tight uppercase leading-none">Hello, {user?.name.split(' ')[0]} 👋</h1>
                    <p className="text-xs font-medium text-slate-400 mt-2 uppercase tracking-widest">Workspace Insights & Financial Health</p>
                </div>
                <div className="hidden sm:flex items-center gap-3 px-5 py-2.5 bg-transparent">
                    <div className="w-8 h-8 bg-emerald-100 text-black rounded-lg flex items-center justify-center font-black text-sm">
                        <Clock className="w-4 h-4 text-emerald-600" />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card className="!p-6">
                    <div className="text-slate-500 text-sm font-semibold mb-2 flex items-center justify-between">
                        Upcoming Chit
                        <Clock className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div className="text-2xl font-bold text-slate-900">₹25,000</div>
                    <div className="text-xs text-slate-500 mt-2">Due in 5 days</div>
                </Card>
                
                <Card className="!p-6">
                    <div className="text-slate-500 text-sm font-semibold mb-2 flex items-center justify-between">
                        Active Groups
                        <Users className="w-4 h-4 text-green-500" />
                    </div>
                    <div className="text-2xl font-bold text-slate-900">2</div>
                    <div className="text-xs text-slate-500 mt-2">1 organizer, 1 member</div>
                </Card>

                <Card className="!p-6">
                    <div className="text-slate-500 text-sm font-semibold mb-2 flex items-center justify-between">
                        Total Dividend
                        <ArrowUpRight className="w-4 h-4 text-purple-500" />
                    </div>
                    <div className="text-2xl font-bold text-slate-900">₹4,200</div>
                    <div className="text-xs text-slate-500 mt-2">Lifetime earnings</div>
                </Card>
            </div>

            <Card>
                <div className="text-center py-16 text-slate-500">
                    <p className="font-semibold text-lg mb-2 text-slate-700">Chit Groups Coming Soon!</p>
                    <p>The Chit Group features are under active development. You'll be able to join auctions here shortly.</p>
                </div>
            </Card>
        </div>
    );
};
