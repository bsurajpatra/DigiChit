import React from 'react';
import { Card } from '../../components/ui/Card';
import { useAuth } from '../../hooks/useAuth';
import { Clock, Users, ArrowUpRight } from 'lucide-react';

export const Dashboard = () => {
    const { user } = useAuth();

    return (
        <div className="space-y-6">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900 mb-2">Hello, {user?.name.split(' ')[0]} 👋</h1>
                <p className="text-slate-500">Welcome to your DigiChit dashboard. Your wallet looks healthy.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card className="!p-6">
                    <div className="text-slate-500 text-sm font-semibold mb-2 flex items-center justify-between">
                        Upcoming Chit
                        <Clock className="w-4 h-4 text-blue-500" />
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
