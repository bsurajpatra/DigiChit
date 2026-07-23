export const LoadingSkeleton = () => {
    return (
        <div className="space-y-6 animate-pulse">
            {/* Stats skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-28 bg-slate-200/70 rounded-2xl"></div>
                ))}
            </div>

            {/* Header skeleton */}
            <div className="h-16 bg-slate-200/70 rounded-2xl w-full"></div>

            {/* Card skeletons */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-64 bg-slate-200/70 rounded-3xl"></div>
                ))}
            </div>
        </div>
    );
};
