import React from 'react';
import { 
    Zap, CreditCard, Hammer, Trophy, Unlock, CheckCircle2, Clock, 
    Share2, AlertCircle, ArrowRight, Wallet, Sparkles, ChevronRight, Play, Check
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { formatCurrency } from '../../utils/currency';
import type { ChitCycle } from '../../types/chitCycle';
import type { Auction } from '../../types/auction';
import type { Installment } from '../../types/installment';
import type { ChitTab } from '../../context/ChitSidebarContext';

interface SmartActionCardProps {
    group: any;
    user: any;
    myMembership: any;
    isOrganizer: boolean;
    isMyMembershipActive: boolean;
    isMyMembershipRequested: boolean;
    cycles: ChitCycle[];
    auctions: Auction[];
    installments: Installment[];
    liveAuction: Auction | null;
    onPayDue: (installment: Installment) => void;
    onEnterBiddingRoom: (auctionId: string) => void;
    onStartCycle: (cycleId: string, cycleNumber: number) => void;
    onRecordWinner: (cycleId: string, cycleNumber: number) => void;
    onOpenCollections: (cycleId: string, cycleNumber: number) => void;
    onNavigateTab: (tab: ChitTab) => void;
    onCopyShareLink: () => void;
}

export const SmartActionCard: React.FC<SmartActionCardProps> = ({
    group,
    user,
    myMembership,
    isOrganizer,
    isMyMembershipActive,
    isMyMembershipRequested,
    cycles,
    auctions,
    installments,
    liveAuction,
    onPayDue,
    onEnterBiddingRoom,
    onStartCycle,
    onRecordWinner,
    onOpenCollections,
    onNavigateTab,
    onCopyShareLink
}) => {
    const currency = group?.financialConfig?.currency || 'INR';
    const currentUserIdStr = (user?.id || user?._id)?.toString();

    // Active or latest cycle
    const activeCycle = cycles.find(c => c.status === 'ACTIVE') || (cycles.length > 0 ? cycles[cycles.length - 1] : null);
    
    // Check if live auction is in progress
    const activeAuction = liveAuction || auctions.find(a => a.status === 'OPEN');
    
    // Check current member's installments
    const myInstallments = installments.filter(inst => {
        const uId = (typeof inst.userId === 'object' ? (inst.userId?._id || (inst.userId as any)?.id) : inst.userId)?.toString();
        return uId === currentUserIdStr;
    });

    // Find unpaid installment for an OPEN collection cycle
    const unpaidOpenInstallment = myInstallments.find(inst => {
        const isUnpaid = (inst.paymentStatus || inst.status) !== 'PAID';
        const cycleObj = typeof inst.cycleId === 'object' ? inst.cycleId : cycles.find(c => c._id === inst.cycleId);
        const colStatus = (cycleObj as any)?.paymentCollection?.status || (cycleObj as any)?.paymentCollectionStatus;
        return isUnpaid && colStatus === 'OPEN';
    });

    // Check if current user won the active or latest cycle
    const isCurrentUserWinner = Boolean(
        activeCycle && myMembership && activeCycle.winnerMembershipId && (
            (typeof activeCycle.winnerMembershipId === 'object' 
                ? (activeCycle.winnerMembershipId._id || (activeCycle.winnerMembershipId as any).id) 
                : activeCycle.winnerMembershipId)?.toString() === myMembership._id?.toString()
        )
    );

    // Check if user has already paid the active cycle installment
    const activeCycleInstallment = myInstallments.find(inst => {
        const cId = (typeof inst.cycleId === 'object' ? (inst.cycleId?._id || (inst.cycleId as any)?.id) : inst.cycleId)?.toString();
        return activeCycle && cId === activeCycle._id?.toString();
    });
    const isCurrentCyclePaid = activeCycleInstallment && (activeCycleInstallment.paymentStatus || activeCycleInstallment.status) === 'PAID';

    // ─────────────────────────────────────────────────────────────────────────
    // 1. LIVE AUCTION IN PROGRESS (Highest Priority for all participants)
    // ─────────────────────────────────────────────────────────────────────────
    if (activeAuction && activeAuction.status === 'OPEN') {
        const minPercent = activeAuction.minimumBidPercentage || 5;
        const maxPercent = activeAuction.maximumBidPercentage || 30;
        const totalPot = group.monthlyContribution * group.totalMembers;
        const estimatedTakeHome = totalPot - (totalPot * (minPercent / 100));

        return (
            <div className="bg-slate-900 text-white p-6 rounded-2xl border-none shadow-none flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-800 text-emerald-400 flex items-center justify-center font-bold shrink-0">
                        <Hammer className="w-5 h-5 animate-bounce" />
                    </div>
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <span className="flex h-2 w-2 relative">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                            </span>
                            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                Live Auction • Month #{activeAuction.auctionNumber || activeCycle?.cycleNumber || 1}
                            </span>
                        </div>

                        <h3 className="text-lg font-black text-white tracking-tight">
                            ⚡ Bidding is Live — Enter Room to Claim This Month's Pot
                        </h3>

                        <p className="text-xs text-slate-400 font-medium leading-relaxed">
                            Bidding is open between <strong className="text-emerald-400 font-bold">{minPercent}%</strong> and <strong className="text-emerald-400 font-bold">{maxPercent}%</strong>. Lowest discount bid claims estimated pot of <strong className="text-white font-bold">{formatCurrency(estimatedTakeHome, currency)}</strong>.
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 shrink-0">
                    <button
                        onClick={() => onEnterBiddingRoom(activeAuction._id)}
                        className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition cursor-pointer flex items-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95"
                    >
                        <Hammer className="w-4 h-4" />
                        <span>Enter Live Bidding Room</span>
                        <ArrowRight className="w-4 h-4 ml-0.5" />
                    </button>
                </div>
            </div>
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 2. MEMBER HAS PENDING/OVERDUE CONTRIBUTION (Collections Open)
    // ─────────────────────────────────────────────────────────────────────────
    if (unpaidOpenInstallment) {
        const netPayable = (unpaidOpenInstallment.amount || 0) + (unpaidOpenInstallment.lateFee || 0) - (unpaidOpenInstallment.paidAmount || 0);
        const dueDate = unpaidOpenInstallment.dueDate ? new Date(unpaidOpenInstallment.dueDate) : null;
        const daysLeft = dueDate ? differenceInDays(dueDate, new Date()) : null;
        const isOverdue = daysLeft !== null && daysLeft < 0;

        return (
            <div className="bg-slate-900 text-white p-6 rounded-2xl border-none shadow-none flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-800 text-amber-400 flex items-center justify-center font-bold shrink-0">
                        <CreditCard className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                Action Required • Month #{unpaidOpenInstallment.installmentNumber}
                            </span>
                            {isOverdue ? (
                                <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black bg-rose-500/20 text-rose-300 border border-rose-500/30">
                                    Overdue by {Math.abs(daysLeft!)} days
                                </span>
                            ) : daysLeft !== null ? (
                                <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                    {daysLeft === 0 ? 'Due Today' : `${daysLeft} days remaining`}
                                </span>
                            ) : null}
                        </div>

                        <h3 className="text-lg font-black text-white tracking-tight">
                            Monthly Contribution of {formatCurrency(netPayable, currency)} is Due
                        </h3>

                        <p className="text-xs text-slate-400 font-medium leading-relaxed">
                            Collections for Month #{unpaidOpenInstallment.installmentNumber} are actively open. Complete payment before {dueDate ? format(dueDate, 'MMM dd, yyyy') : 'the due date'} to avoid late penalties.
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 shrink-0">
                    <button
                        onClick={() => onPayDue(unpaidOpenInstallment)}
                        className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition cursor-pointer flex items-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95"
                    >
                        <CreditCard className="w-4 h-4" />
                        <span>Pay Monthly Due ({formatCurrency(netPayable, currency)})</span>
                        <ArrowRight className="w-4 h-4 ml-0.5" />
                    </button>
                </div>
            </div>
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 3. SUBSCRIBER WON THE AUCTION FOR THIS CYCLE
    // ─────────────────────────────────────────────────────────────────────────
    if (isCurrentUserWinner && activeCycle) {
        const prizeAmount = activeCycle.prizeAmount || 0;
        const colStatus = activeCycle.paymentCollection?.status || 'NOT_STARTED';

        return (
            <div className="bg-amber-50/90 border border-amber-200/80 p-5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs">
                <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-black shrink-0 shadow-xs">
                        <Trophy className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h4 className="text-xs font-black text-amber-950 uppercase tracking-wider">
                                Month #{activeCycle.cycleNumber} Auction Winner
                            </h4>
                            <span className="px-2 py-0.5 bg-amber-200 text-amber-900 text-[10px] font-black rounded-md">
                                WINNER
                            </span>
                        </div>
                        <p className="text-xs text-amber-800 font-medium mt-0.5">
                            Winning Discount Bid: <strong className="font-bold">{activeCycle.winningBidPercentage}%</strong>. Your net take-home prize is <strong className="font-bold">{formatCurrency(prizeAmount, currency)}</strong>. Collections: <strong className="font-bold">{colStatus}</strong>.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <button
                        onClick={() => onNavigateTab('INSTALLMENTS')}
                        className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-xs active:scale-95"
                    >
                        <Trophy className="w-3.5 h-3.5" />
                        <span>View Prize & Dues</span>
                    </button>
                </div>
            </div>
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 4. ORGANIZER ACTION REQUIRED
    // ─────────────────────────────────────────────────────────────────────────
    if (isOrganizer && activeCycle) {
        const colStatus = activeCycle.paymentCollection?.status || 'NOT_STARTED';

        // 4A. Winner Declared, but Collections NOT OPEN
        if (activeCycle.winnerMembershipId && colStatus === 'NOT_STARTED') {
            return (
                <div className="bg-slate-900 text-white p-6 rounded-2xl border-none shadow-none flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-800 text-emerald-400 flex items-center justify-center font-bold shrink-0">
                            <Unlock className="w-5 h-5" />
                        </div>
                        <div className="space-y-1">
                            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                Organizer Action Required • Month #{activeCycle.cycleNumber}
                            </span>

                            <h3 className="text-lg font-black text-white tracking-tight">
                                Winner Recorded — Open Collections for Members
                            </h3>

                            <p className="text-xs text-slate-400 font-medium leading-relaxed">
                                The auction winner has been recorded. Open payment collections so subscribers can view their monthly dues and submit payments online.
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 shrink-0">
                        <button
                            onClick={() => onOpenCollections(activeCycle._id, activeCycle.cycleNumber)}
                            className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition cursor-pointer flex items-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95"
                        >
                            <Unlock className="w-4 h-4" />
                            <span>Open Collections Now</span>
                        </button>
                    </div>
                </div>
            );
        }

        // 4B. Cycle is UPCOMING and ready to start
        if (activeCycle.status === 'UPCOMING') {
            return (
                <div className="bg-slate-900 text-white p-6 rounded-2xl border-none shadow-none flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-800 text-sky-400 flex items-center justify-center font-bold shrink-0">
                            <Play className="w-5 h-5" />
                        </div>
                        <div className="space-y-1">
                            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-sky-500/20 text-sky-400 border border-sky-500/30">
                                Organizer Action Required • Month #{activeCycle.cycleNumber}
                            </span>

                            <h3 className="text-lg font-black text-white tracking-tight">
                                Ready to Launch Cycle #{activeCycle.cycleNumber}
                            </h3>

                            <p className="text-xs text-slate-400 font-medium leading-relaxed">
                                Starting this cycle will activate it, initialize monthly contribution dues, and open auction bidding for all enrolled members.
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 shrink-0">
                        <button
                            onClick={() => onStartCycle(activeCycle._id, activeCycle.cycleNumber)}
                            className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition cursor-pointer flex items-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95"
                        >
                            <Play className="w-4 h-4" />
                            <span>Start Cycle #{activeCycle.cycleNumber}</span>
                        </button>
                    </div>
                </div>
            );
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 5. MEMBER HAS PAID FOR CURRENT CYCLE (All Caught Up)
    // ─────────────────────────────────────────────────────────────────────────
    if (isCurrentCyclePaid && activeCycle) {
        return (
            <div className="bg-emerald-50/80 border border-emerald-200/80 p-5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs">
                <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black shrink-0 shadow-xs">
                        <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h4 className="text-xs font-black text-emerald-950 uppercase tracking-wider">
                                All Caught Up for Month #{activeCycle.cycleNumber}
                            </h4>
                            <span className="px-2 py-0.5 bg-emerald-200 text-emerald-900 text-[10px] font-black rounded-md">
                                PAID
                            </span>
                        </div>
                        <p className="text-xs text-emerald-800 font-medium mt-0.5">
                            Your monthly contribution of {formatCurrency(group.monthlyContribution, currency)} has been verified and settled.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <button
                        onClick={() => onNavigateTab('INSTALLMENTS')}
                        className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-xs active:scale-95"
                    >
                        <Wallet className="w-3.5 h-3.5" />
                        <span>View Contributions</span>
                    </button>
                </div>
            </div>
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 6. DEFAULT / CIRCLE FORMATION STAGE
    // ─────────────────────────────────────────────────────────────────────────
    if (group.status === 'UPCOMING' || group.status === 'PENDING_START' || group.currentMemberCount < group.totalMembers) {
        return (
            <div className="bg-slate-900 text-white p-6 rounded-2xl border-none shadow-none flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-800 text-emerald-400 flex items-center justify-center font-bold shrink-0">
                        <Share2 className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                        <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            Circle Enrolling • {group.currentMemberCount}/{group.totalMembers} Members
                        </span>

                        <h3 className="text-lg font-black text-white tracking-tight">
                            Circle Formation in Progress
                        </h3>

                        <p className="text-xs text-slate-400 font-medium leading-relaxed">
                            {group.currentMemberCount < group.totalMembers
                                ? `Waiting for ${group.totalMembers - group.currentMemberCount} more subscriber(s) to fill quota before launching Month #1.`
                                : 'Circle is full! The organizer will launch Month #1 shortly.'}
                        </p>
                    </div>
                </div>

                {isOrganizer && (
                    <button
                        onClick={onCopyShareLink}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 cursor-pointer shrink-0 shadow-sm active:scale-95"
                    >
                        <Share2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Share Circle Link</span>
                    </button>
                )}
            </div>
        );
    }

    return null;
};
