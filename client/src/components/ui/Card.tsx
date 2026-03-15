import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ children, className = '', ...props }) => {
    return (
        <div 
            className={`rounded-2xl border border-slate-100 shadow-sm p-6 md:p-8 ${!className.includes('bg-') ? 'bg-white' : ''} ${className}`}
            {...props}
        >
            {children}
        </div>
    );
};
