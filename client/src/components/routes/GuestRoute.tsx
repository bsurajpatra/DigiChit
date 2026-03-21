import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Loader } from '../ui/Loader';

/**
 * GuestRoute (Public Only Route)
 * Redirects authenticated users away from Login/Signup pages to the dashboard.
 */
export const GuestRoute: React.FC = () => {
    const { user, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <Loader size="lg" />
            </div>
        );
    }

    if (user) {
        if (user.role === 'ADMIN') {
            return <Navigate to="/admin/dashboard" replace />;
        }
        
        if (!user.emailVerified) {
            return <Navigate to="/verify-email-info" replace />;
        }

        if (user.kycStatus !== 'APPROVED') {
            return <Navigate to="/kyc/status" replace />;
        }

        return <Navigate to="/dashboard" replace />;
    }

    return <Outlet />;
};
