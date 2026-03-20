import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { LogOut, X, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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

    const [expandedApps, setExpandedApps] = useState<string[]>(['Chits']); // default expanded
    
    const navItemStyles = (path: string, hasSubItems?: boolean) => {
        const isActive = location.pathname === path;
        return `
            flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all duration-300
            ${isActive 
                ? 'text-emerald-600 bg-emerald-50 translate-x-1 outline-none' 
                : hasSubItems
                    ? 'text-slate-900 border-none outline-none'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
            }
        `;
    };

    const toggleExpand = (label: string) => {
        setExpandedApps(prev => 
            prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]
        );
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
                        <div key={item.label} className="space-y-1">
                            {item.subItems ? (
                                <>
                                    <button 
                                        onClick={() => toggleExpand(item.label)}
                                        className={`w-full ${navItemStyles(item.path, true)} justify-between cursor-pointer`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <item.icon className="w-5 h-5 shrink-0" />
                                            <span className="truncate">{item.label}</span>
                                        </div>
                                        <ChevronDown 
                                            className={`w-4 h-4 transition-transform duration-300 ${expandedApps.includes(item.label) ? 'rotate-180' : ''}`} 
                                        />
                                    </button>
                                    <AnimatePresence>
                                        {expandedApps.includes(item.label) && (
                                            <motion.div 
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="overflow-hidden pl-4 space-y-1"
                                            >
                                                {item.subItems.map(sub => (
                                                    <Link 
                                                        key={sub.label}
                                                        to={sub.path}
                                                        className={`
                                                            flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all
                                                            ${location.pathname === sub.path 
                                                                ? 'text-emerald-600 bg-emerald-50/50' 
                                                                : 'text-slate-400 hover:bg-slate-50 hover:text-slate-700'
                                                            }
                                                        `}
                                                        onClick={() => setMobileOpen(false)}
                                                    >
                                                        <sub.icon className="w-4 h-4 shrink-0" />
                                                        <span className="truncate">{sub.label}</span>
                                                    </Link>
                                                ))}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </>
                            ) : (
                                <Link 
                                    to={item.path} 
                                    className={navItemStyles(item.path)}
                                    onClick={() => setMobileOpen(false)}
                                >
                                    <item.icon className="w-5 h-5 shrink-0" />
                                    <span className="truncate">{item.label}</span>
                                </Link>
                            )}
                        </div>
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
