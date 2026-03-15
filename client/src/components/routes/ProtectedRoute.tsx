import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Loader } from '../ui/Loader';

export const ProtectedRoute = () => {
    const { user, isLoading } = useAuth();

    if (isLoading) {
        return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader size="lg" /></div>;
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
};
