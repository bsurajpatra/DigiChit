import { Link, Outlet } from 'react-router-dom';
import logo from '../../assets/logo.png';

export const AuthLayout = () => {
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
            <header className="absolute top-0 w-full p-6 flex justify-between items-center z-10">
                <Link to="/" className="flex items-center gap-2">
                    <img src={logo} alt="DigiChit Logo" className="w-8 h-8 object-contain" />
                    <span className="text-xl font-bold tracking-tight text-slate-900">DigiChit</span>
                </Link>
            </header>
            <main className="flex-1 flex items-center justify-center p-6">
                <div className="w-full max-w-md">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};
