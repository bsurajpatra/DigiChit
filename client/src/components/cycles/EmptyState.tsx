import { CalendarX, PlusCircle } from 'lucide-react';

interface EmptyStateProps {
    title?: string;
    description?: string;
    actionLabel?: string;
    onAction?: () => void;
}

export const EmptyState = ({
    title = 'No Chit Cycles Found',
    description = 'No cycles have been created for this chit group yet. Start by initializing the first cycle.',
    actionLabel,
    onAction
}: EmptyStateProps) => {
    return (
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl border border-slate-200/80 shadow-xs text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-900 text-emerald-400 flex items-center justify-center mb-4 shrink-0 shadow-md">
                <CalendarX className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">{title}</h3>
            <p className="text-sm text-slate-500 max-w-md mb-6">{description}</p>
            {actionLabel && onAction && (
                <button
                    onClick={onAction}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md shadow-emerald-600/20 active:scale-95 cursor-pointer"
                >
                    <PlusCircle className="w-4 h-4" />
                    <span>{actionLabel}</span>
                </button>
            )}
        </div>
    );
};
