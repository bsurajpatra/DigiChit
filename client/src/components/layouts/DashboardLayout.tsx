import React from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { LogOut, Home, Key, UserCheck } from 'lucide-react';
import logo from '../../assets/logo.png';

export const DashboardLayout = () => {
    const { logout, user } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
            {/* Sidebar */}
            <aside className="w-full md:w-64 bg-white border-r border-slate-200 shadow-sm flex flex-col">
                <div className="p-6 border-b border-slate-100 flex items-center gap-3">
                    <img src={logo} alt="DigiChit Logo" className="w-8 h-8 object-contain" />
                    <span className="text-xl font-bold tracking-tight text-slate-900">DigiChit</span>
                </div>

                <nav className="p-4 flex-1 space-y-1">
                    <Link to="/dashboard" className="flex items-center gap-3 px-4 py-3 text-slate-700 bg-blue-50 text-blue-700 rounded-lg font-medium transition-colors">
                        <Home className="w-5 h-5" />
                        Dashboard
                    </Link>
                    
                    {user?.role === 'ADMIN' && (
                        <Link to="/admin/kyc" className="flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-slate-50 rounded-lg font-medium transition-colors">
                            <UserCheck className="w-5 h-5" />
                            KYC Approvals
                        </Link>
                    )}
                </nav>

                <div className="p-4 border-t border-slate-100">
                    <div className="px-4 py-3 mb-4 rounded-lg bg-slate-50 border border-slate-100">
                        <p className="text-sm font-bold text-slate-800">{user?.name}</p>
                        <p className="text-xs text-slate-500 font-medium truncate">{user?.email}</p>
                    </div>

                    <button 
                        onClick={handleLogout}
                        className="flex w-full items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg font-medium transition-colors"
                    >
                        <LogOut className="w-5 h-5" />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-6 md:p-8 md:max-w-4xl max-w-full">
                <Outlet />
            </main>
        </div>
    );
};
