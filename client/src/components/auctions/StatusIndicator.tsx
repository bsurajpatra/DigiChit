interface StatusIndicatorProps {
    status: 'OPEN' | 'SCHEDULED' | 'CLOSED' | 'WINNER_DECLARED' | 'CANCELLED';
    size?: 'sm' | 'md' | 'lg';
}

export const StatusIndicator = ({ status, size = 'md' }: StatusIndicatorProps) => {
    const sizeMap = {
        sm: 'w-2 h-2',
        md: 'w-2.5 h-2.5',
        lg: 'w-3.5 h-3.5'
    };

    if (status === 'OPEN') {
        return (
            <span className="relative flex items-center justify-center">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 ${sizeMap[size]}`}></span>
                <span className={`relative inline-flex rounded-full bg-emerald-500 ${sizeMap[size]}`}></span>
            </span>
        );
    }

    if (status === 'SCHEDULED') {
        return <span className={`inline-flex rounded-full bg-amber-500 ${sizeMap[size]}`}></span>;
    }

    if (status === 'WINNER_DECLARED') {
        return <span className={`inline-flex rounded-full bg-purple-500 ${sizeMap[size]}`}></span>;
    }

    if (status === 'CLOSED') {
        return <span className={`inline-flex rounded-full bg-indigo-500 ${sizeMap[size]}`}></span>;
    }

    return <span className={`inline-flex rounded-full bg-slate-400 ${sizeMap[size]}`}></span>;
};
