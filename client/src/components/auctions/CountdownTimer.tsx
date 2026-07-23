import { useState, useEffect } from 'react';
import { Clock, AlertCircle } from 'lucide-react';

interface CountdownTimerProps {
    targetDate: string | Date;
    label?: string;
    onExpire?: () => void;
}

export const CountdownTimer = ({ targetDate, label = 'Starts In', onExpire }: CountdownTimerProps) => {
    const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number; isExpired: boolean }>({
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        isExpired: false
    });

    useEffect(() => {
        const calculateTimeLeft = () => {
            const difference = new Date(targetDate).getTime() - new Date().getTime();

            if (difference <= 0) {
                setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true });
                if (onExpire) onExpire();
                return;
            }

            const days = Math.floor(difference / (1000 * 60 * 60 * 24));
            const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
            const minutes = Math.floor((difference / 1000 / 60) % 60);
            const seconds = Math.floor((difference / 1000) % 60);

            setTimeLeft({ days, hours, minutes, seconds, isExpired: false });
        };

        calculateTimeLeft();
        const timer = setInterval(calculateTimeLeft, 1000);

        return () => clearInterval(timer);
    }, [targetDate, onExpire]);

    if (timeLeft.isExpired) {
        return (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Time Expired / In Progress</span>
            </div>
        );
    }

    return (
        <div className="bg-slate-900 text-white p-4 rounded-xl border-none shadow-none">
            <div className="flex items-center justify-between gap-2 mb-2.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-emerald-400" />
                    {label}
                </span>
            </div>

            <div className="grid grid-cols-4 gap-2 text-center">
                <div className="bg-slate-800 p-2 rounded-lg border-none">
                    <span className="text-base font-black text-white block leading-none">{timeLeft.days}</span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mt-1">Days</span>
                </div>
                <div className="bg-slate-800 p-2 rounded-lg border-none">
                    <span className="text-base font-black text-white block leading-none">{String(timeLeft.hours).padStart(2, '0')}</span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mt-1">Hrs</span>
                </div>
                <div className="bg-slate-800 p-2 rounded-lg border-none">
                    <span className="text-base font-black text-white block leading-none">{String(timeLeft.minutes).padStart(2, '0')}</span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mt-1">Min</span>
                </div>
                <div className="bg-slate-800 p-2 rounded-lg border-none">
                    <span className="text-base font-black text-emerald-400 block leading-none">{String(timeLeft.seconds).padStart(2, '0')}</span>
                    <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest block mt-1">Sec</span>
                </div>
            </div>
        </div>
    );
};
