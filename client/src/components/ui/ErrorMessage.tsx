import React from 'react';
import { AlertCircle } from 'lucide-react';

interface ErrorMessageProps {
    message: string;
    className?: string;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, className = '' }) => {
    if (!message) return null;
    
    return (
        <div className={`flex items-start gap-2 p-3 bg-red-50 border border-red-100 text-red-700 rounded-lg text-sm ${className}`}>
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p className="font-medium whitespace-pre-wrap">{message}</p>
        </div>
    );
};
