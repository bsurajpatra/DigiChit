import type { Auction } from '../../types/auction';
import { Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface AuctionTimelineProps {
    auction: Auction;
}

export const AuctionTimeline = ({ auction }: AuctionTimelineProps) => {
    return (
        <div className="bg-slate-50 p-4 rounded-xl space-y-3 text-xs border-none">
            <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>Auction Schedule & Timeline</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="bg-white p-2.5 rounded-lg border-none shadow-none">
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Scheduled Start</span>
                    <span className="font-bold text-slate-900 mt-0.5 block">
                        {format(new Date(auction.scheduledStartTime), 'PPpp')}
                    </span>
                </div>

                <div className="bg-white p-2.5 rounded-lg border-none shadow-none">
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Actual Start</span>
                    <span className={`font-bold mt-0.5 block ${auction.actualStartTime ? 'text-emerald-600' : 'text-slate-400'}`}>
                        {auction.actualStartTime ? format(new Date(auction.actualStartTime), 'PPpp') : 'Not Started'}
                    </span>
                </div>

                {auction.scheduledEndTime && (
                    <div className="bg-white p-2.5 rounded-lg border-none shadow-none">
                        <span className="text-slate-400 text-[10px] uppercase font-bold block">Scheduled End</span>
                        <span className="font-bold text-slate-900 mt-0.5 block">
                            {format(new Date(auction.scheduledEndTime), 'PPpp')}
                        </span>
                    </div>
                )}

                {auction.actualEndTime && (
                    <div className="bg-white p-2.5 rounded-lg border-none shadow-none">
                        <span className="text-slate-400 text-[10px] uppercase font-bold block">Actual Closed</span>
                        <span className="font-bold text-slate-700 mt-0.5 block">
                            {format(new Date(auction.actualEndTime), 'PPpp')}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
};
