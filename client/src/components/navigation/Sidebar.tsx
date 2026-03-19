import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { LogOut, X } from 'lucide-react';
import { getSidebarMenu, type MenuItem } from '../../utils/sidebarConfig';
import logo from '../../assets/logo.png';

interface SidebarProps {
    isMobileOpen: boolean;
    setMobileOpen: (val: boolean) => void;
}

export const Sidebar = ({ isMobileOpen, setMobileOpen }: SidebarProps) => {
    const { user, logout } = useAuth();
    const location = useLocation();

    if (!user) return null;

    const menuItems = getSidebarMenu(user.role, user.organizerStatus);

    const navItemStyles = (path: string) => {
        const isActive = location.pathname === path;
        return `
            flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all duration-300
            ${isActive 
                ? 'text-emerald-600 translate-x-1' 
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
            }
        `;
    };

    const handleLogout = () => {
        logout();
    };

    return (
        <>
            {/* Mobile Overlay */}
            {isMobileOpen && (
                <div 
                    className="fixed inset-0 bg-black/50 z-40 md:hidden" 
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* Sidebar drawer */}
            <aside className={`
                fixed md:static inset-y-0 left-0 z-50
                w-72 md:w-64 bg-white border-r border-slate-200 shadow-sm flex flex-col shrink-0
                transform transition-transform duration-300 ease-in-out
                ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            `}>
                {/* Logo Banner */}
                <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-white">
                    <Link
                        to={user.role === 'ADMIN' ? '/admin/dashboard' : '/dashboard'}
                        className="flex items-center gap-3 hover:bg-slate-50 transition-colors"
                        onClick={() => setMobileOpen(false)}
                    >
                        <img src={logo} alt="DigiChit Logo" className="w-8 h-8 object-contain" />
                        <span className="text-xl font-bold tracking-tight text-slate-900 leading-none">DigiChit</span>
                    </Link>
                    <button 
                        className="md:hidden text-slate-400 hover:text-slate-600"
                        onClick={() => setMobileOpen(false)}
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Navigation Links */}
                <nav className="p-4 flex-1 space-y-2 overflow-y-auto">
                    {menuItems.map((item: MenuItem) => (
                        <Link 
                            key={item.label} 
                            to={item.path} 
                            className={navItemStyles(item.path)}
                            onClick={() => setMobileOpen(false)}
                        >
                            <item.icon className="w-5 h-5 shrink-0" />
                            <span className="truncate">{item.label}</span>
                        </Link>
                    ))}
                </nav>

                {/* User Card */}
                <div className="p-4 border-t border-slate-100 bg-white">
                    <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 hover:text-red-700 rounded-xl font-bold transition-all duration-300"
                    >
                        <LogOut className="w-5 h-5 shrink-0" />
                        <span className="truncate">Sign Out</span>
                    </button>
                </div>
            </aside>
        </>
    );
};
