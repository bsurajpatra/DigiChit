import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Loader } from '../ui/Loader';

interface ProtectedRouteProps {
    allowedRoles?: ('USER' | 'ORGANIZER' | 'ADMIN')[];
    unauthorizedRedirect?: string;
}

/**
 * Unified Route Guard
 * Handles:
 * 1. Authentication Check (presence of user)
 * 2. Role Authorization (if allowedRoles provided)
 * 3. Loading State
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
    allowedRoles, 
    unauthorizedRedirect = '/dashboard' 
}) => {
    const { user, isLoading } = useAuth();
    const location = useLocation();

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <Loader size="lg" />
            </div>
        );
    }

    if (!user) {
        // Preserve intended destination for post-login redirect
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        // Logged in but not authorized for this specific role
        return <Navigate to={unauthorizedRedirect} replace />;
    }

    if (user.accountStatus === 'SUSPENDED') {
        // Handle suspended accounts
        return <Navigate to="/support" state={{ error: 'Your account has been suspended. Please contact support.' }} replace />;
    }

    return <Outlet />;
};
