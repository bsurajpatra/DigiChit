import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { LogOut, UserCheck } from 'lucide-react';
import logo from '../../assets/logo.png';

export const DashboardLayout = () => {
    const { logout, user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const isActive = (path: string) => location.pathname === path;

    const navItemStyles = (path: string) => `
        flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all duration-300
        ${isActive(path) 
            ? 'bg-blue-600 text-white shadow-lg shadow-blue-100 translate-x-1' 
            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}
    `;

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
            {/* Sidebar */}
            <aside className="w-full md:w-64 bg-white border-r border-slate-200 shadow-sm flex flex-col">
                <Link to={user?.role === 'ADMIN' ? "/admin/dashboard" : "/dashboard"} className="p-6 border-b border-slate-100 flex items-center gap-3 hover:bg-slate-50 transition-colors">
                    <img src={logo} alt="DigiChit Logo" className="w-8 h-8 object-contain" />
                    <span className="text-xl font-bold tracking-tight text-slate-900 leading-none">DigiChit</span>
                </Link>

                <nav className="p-4 flex-1 space-y-2">
                    {user?.role === 'ADMIN' && (
                        <Link to="/admin/kyc" className={navItemStyles('/admin/kyc')}>
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
            <main className="flex-1 p-6 md:p-8 w-full overflow-x-hidden">
                <Outlet />
            </main>
        </div>
    );
};
