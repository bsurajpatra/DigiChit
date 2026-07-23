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

    const menuItems = getSidebarMenu(user.role, user.organizerStatus, user.kycStatus);

    const [expandedApps, setExpandedApps] = useState<string[]>(['Chits']); // default expanded
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    
    const navItemStyles = (path: string, hasSubItems?: boolean) => {
        const isActive = location.pathname === path;
        return `
            flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all duration-200 text-sm
            ${isActive 
                ? 'text-slate-900 bg-slate-100' 
                : hasSubItems
                    ? 'text-slate-900 border-none outline-none hover:bg-slate-50'
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
        setShowLogoutModal(true);
    };

    const handleLogoutConfirm = () => {
        setShowLogoutModal(false);
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
                w-64 md:w-64 bg-white border-r border-slate-200 shadow-sm flex flex-col shrink-0
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
                                                            flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all
                                                            ${location.pathname === sub.path 
                                                                ? 'text-slate-900 bg-slate-100' 
                                                                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
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
                <div className="p-4 border-t border-slate-100 bg-white relative">
                    <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 hover:text-red-700 rounded-xl font-bold transition-all duration-300"
                    >
                        <LogOut className="w-5 h-5 shrink-0" />
                        <span className="truncate">Sign Out</span>
                    </button>

                    {/* Popover positioned directly above the button */}
                    <AnimatePresence>
                        {showLogoutModal && (
                            <>
                                {/* Click outside overlay */}
                                <div 
                                    className="fixed inset-0 z-40 bg-black/10 backdrop-blur-[1px]"
                                    onClick={() => setShowLogoutModal(false)}
                                />

                                <motion.div 
                                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                                    transition={{ duration: 0.15, ease: 'easeOut' }}
                                    className="absolute bottom-full left-4 right-4 mb-2 z-50 bg-white rounded-2xl shadow-xl border border-slate-100 p-4 flex flex-col items-center text-center gap-3"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center text-red-600 shrink-0">
                                        <LogOut className="w-5 h-5" />
                                    </div>

                                    <div>
                                        <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Sign Out</h3>
                                        <p className="text-[11px] text-slate-500 font-medium mt-0.5 leading-snug">
                                            Log out of your session?
                                        </p>
                                    </div>

                                    <div className="flex gap-2 w-full pt-1">
                                        <button
                                            type="button"
                                            onClick={() => setShowLogoutModal(false)}
                                            className="flex-1 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold uppercase tracking-widest text-[9px] hover:bg-slate-200 transition"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleLogoutConfirm}
                                            className="flex-1 py-2 bg-red-600 text-white rounded-xl font-bold uppercase tracking-widest text-[9px] hover:bg-red-700 transition shadow-sm shadow-red-200 flex items-center justify-center gap-1 active:scale-95"
                                        >
                                            <LogOut className="w-3 h-3" />
                                            Sign Out
                                        </button>
                                    </div>
                                </motion.div>
                            </>
                        )}
                    </AnimatePresence>
                </div>
            </aside>
        </>
    );
};
