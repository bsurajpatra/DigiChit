import { Layers } from 'lucide-react';

interface ChitSidebarSkeletonProps {
    isMobileOpen?: boolean;
    setMobileOpen?: (val: boolean) => void;
}

export const ChitSidebarSkeleton = ({
    isMobileOpen = false,
    setMobileOpen,
}: ChitSidebarSkeletonProps) => {
    return (
        <>
            {/* Mobile Overlay */}
            {isMobileOpen && setMobileOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* Sidebar Skeleton Drawer */}
            <aside className={`
                fixed md:static inset-y-0 left-0 z-50
                w-64 md:w-64 bg-white border-r border-slate-200 shadow-sm flex flex-col shrink-0
                transform transition-transform duration-300 ease-in-out
                ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            `}>
                {/* Header Skeleton */}
                <div className="p-5 border-b border-slate-100 space-y-4 animate-pulse">
                    {/* Back Button Skeleton */}
                    <div className="h-8 bg-slate-100 rounded-xl w-full" />

                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                            <Layers className="w-4 h-4 text-slate-300" />
                        </div>
                        <div className="flex-1 space-y-2">
                            <div className="h-4 bg-slate-200 rounded-md w-28" />
                            <div className="h-3 bg-slate-100 rounded-md w-16" />
                        </div>
                    </div>
                </div>

                {/* Nav Links Skeleton */}
                <nav className="p-4 flex-1 space-y-2 overflow-y-auto animate-pulse">
                    <div className="h-3 bg-slate-100 rounded-md w-24 mx-4 mb-3" />
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="h-11 bg-slate-50 border border-slate-100/80 rounded-xl w-full flex items-center px-4 gap-3">
                            <div className="w-5 h-5 bg-slate-200 rounded-md shrink-0" />
                            <div className="h-3.5 bg-slate-200 rounded-md w-28" />
                        </div>
                    ))}
                </nav>
            </aside>
        </>
    );
};
