import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
    isLoading?: boolean;
    fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
    children,
    variant = 'primary',
    isLoading = false,
    fullWidth = false,
    className = '',
    disabled,
    ...props
}) => {
    const baseStyles = 'inline-flex items-center justify-center font-semibold transition-all rounded-lg text-sm';
    const widthStyles = fullWidth ? 'w-full' : '';
    const stateStyles = disabled || isLoading ? 'opacity-50 cursor-not-allowed' : 'active:scale-[0.98]';

    const variants = {
        primary: 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm shadow-emerald-200',
        secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200',
        outline: 'border border-slate-200 bg-transparent text-slate-700 hover:bg-slate-50',
        ghost: 'bg-transparent text-slate-600 hover:bg-slate-100',
        danger: 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-100'
    };

    const sizeStyles = 'px-5 py-2.5';

    return (
        <button
            className={`${baseStyles} ${widthStyles} ${variants[variant]} ${sizeStyles} ${stateStyles} ${className}`}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading && (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            )}
            {children}
        </button>
    );
};
