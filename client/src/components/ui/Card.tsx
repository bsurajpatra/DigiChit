import React from 'react';

interface CardProps {
    children: React.ReactNode;
    className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = '' }) => {
    return (
        <div className={`bg-white rounded-2xl border border-slate-100 shadow-sm p-6 md:p-8 ${className}`}>
            {children}
        </div>
    );
};
