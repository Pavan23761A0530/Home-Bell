import React, { forwardRef } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const Input = forwardRef(({
    label,
    error,
    className,
    icon: Icon,
    type = 'text',
    ...props
}, ref) => {
    return (
        <div className="w-full">
            {label && (
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                    {label}
                </label>
            )}
            <div className="relative">
                {Icon && (
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Icon className="h-5 w-5 text-neutral-400" />
                    </div>
                )}
                <input
                    ref={ref}
                    type={type}
                    className={twMerge(
                        clsx(
                            'block w-full rounded-lg shadow-sm transition-colors',
                            Icon && 'pl-10',
                            error && 'border-error-300 focus:border-error-500 focus:ring-error-500',
                            className
                        )
                    )}
                    style={{ backgroundColor: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text)' }}
                    {...props}
                />
            </div>
            {error && (
                <p className="mt-1 text-sm text-error-500">{error}</p>
            )}
        </div>
    );
});

Input.displayName = 'Input';

export default Input;
