import React, { createContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import api from '../api/axios';

export interface User {
    id: string;
    name: string;
    email: string;
    role: 'USER' | 'ORGANIZER' | 'ADMIN';
    emailVerified: boolean;
    kycStatus: 'NOT_SUBMITTED' | 'PENDING' | 'APPROVED' | 'REJECTED';
    organizerStatus: 'NOT_APPLIED' | 'PENDING' | 'APPROVED' | 'REJECTED';
    accountStatus: 'ACTIVE' | 'SUSPENDED' | 'INACTIVE';
    profilePictureUrl?: string;
    kycRejectedReason?: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    login: (token: string, user: User) => void;
    logout: () => void;
    updateUser: (user: Partial<User>) => void;
    refreshUser: () => Promise<User | null>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const refreshUser = useCallback(async (): Promise<User | null> => {
        const storedToken = localStorage.getItem('token');
        if (!storedToken) return null;
        try {
            const res = await api.get('/user/profile');
            if (res.data?.data?.user) {
                const latestUser = res.data.data.user;
                const normalizedUser: User = {
                    id: latestUser._id || latestUser.id,
                    name: latestUser.name,
                    email: latestUser.email,
                    role: latestUser.role,
                    emailVerified: latestUser.emailVerified,
                    kycStatus: latestUser.kycStatus,
                    organizerStatus: latestUser.organizerStatus,
                    accountStatus: latestUser.accountStatus,
                    profilePictureUrl: latestUser.profilePictureUrl,
                    kycRejectedReason: latestUser.kycRejectedReason
                };
                localStorage.setItem('user', JSON.stringify(normalizedUser));
                setUser(normalizedUser);
                return normalizedUser;
            }
        } catch (err) {
            console.error('Failed to refresh user profile:', err);
        }
        return null;
    }, []);

    useEffect(() => {
        const initializeAuth = async () => {
            const storedToken = localStorage.getItem('token');
            const storedUser = localStorage.getItem('user');

            if (storedToken && storedUser) {
                setToken(storedToken);
                setUser(JSON.parse(storedUser));

                // Background sync latest profile from server (KYC status, roles, etc)
                try {
                    const res = await api.get('/user/profile');
                    if (res.data?.data?.user) {
                        const latestUser = res.data.data.user;
                        const normalizedUser: User = {
                            id: latestUser._id || latestUser.id,
                            name: latestUser.name,
                            email: latestUser.email,
                            role: latestUser.role,
                            emailVerified: latestUser.emailVerified,
                            kycStatus: latestUser.kycStatus,
                            organizerStatus: latestUser.organizerStatus,
                            accountStatus: latestUser.accountStatus,
                            profilePictureUrl: latestUser.profilePictureUrl,
                            kycRejectedReason: latestUser.kycRejectedReason
                        };
                        localStorage.setItem('user', JSON.stringify(normalizedUser));
                        setUser(normalizedUser);
                    }
                } catch (err) {
                    console.warn('Background profile sync warning:', err);
                }
            }
            setIsLoading(false);
        };

        initializeAuth();
    }, []);

    const login = (newToken: string, newUser: User) => {
        localStorage.setItem('token', newToken);
        localStorage.setItem('user', JSON.stringify(newUser));
        setToken(newToken);
        setUser(newUser);
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
    };

    const updateUser = (updatedFields: Partial<User>) => {
        if (!user) return;
        const newUser = { ...user, ...updatedFields };
        localStorage.setItem('user', JSON.stringify(newUser));
        setUser(newUser);
    };

    return (
        <AuthContext.Provider value={{ user, token, isLoading, login, logout, updateUser, refreshUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = React.useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
