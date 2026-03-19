import React, { forwardRef } from 'react';

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    error?: string;
    icon?: React.ReactNode;
}

export const InputField = forwardRef<HTMLInputElement, InputFieldProps>(
    ({ label, error, icon, className = '', ...props }, ref) => {
        return (
            <div className="space-y-1.5 w-full">
                <label className="block text-sm font-semibold text-slate-700">
                    {label}
                </label>
                <div className="relative group">
                    {icon && (
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-emerald-600 transition-colors">
                            {icon}
                        </div>
                    )}
                    <input
                        ref={ref}
                        className={`w-full ${icon ? 'pl-10' : 'pl-4'} pr-4 py-2.5 bg-white border rounded-lg outline-none transition-all text-sm
                            ${error 
                                ? 'border-red-300 focus:ring-4 focus:ring-red-50 focus:border-red-500' 
                                : 'border-slate-200 focus:ring-4 focus:ring-emerald-500 focus:border-emerald-500 hover:border-slate-300'
                            }
                            disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed
                            ${className}
                        `}
                        {...props}
                    />
                </div>
                {error && (
                    <p className="text-sm text-red-600 mt-1">{error}</p>
                )}
            </div>
        );
    }
);

InputField.displayName = 'InputField';
