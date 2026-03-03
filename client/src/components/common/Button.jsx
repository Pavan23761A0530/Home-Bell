import React from 'react';
import { Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const Button = ({
    children,
    variant = 'primary',
    size = 'md',
    isLoading = false,
    icon: Icon,
    className,
    disabled,
    ...props
}) => {
    const baseStyles = 'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none transform hover:-translate-y-0.5 hover:shadow-md active:translate-y-0';

    const sizes = {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2 text-base',
        lg: 'px-6 py-3 text-lg',
    };

    const styleByVariant = (v) => {
        if (v === 'primary') return { background: 'var(--primary)', color: 'var(--primary-contrast)', border: '1px solid var(--primary)' };
        if (v === 'secondary') return { background: 'var(--card-bg)', color: 'var(--text)', border: '1px solid var(--card-border)' };
        if (v === 'outline') return { background: 'transparent', color: 'var(--primary)', border: '2px solid var(--primary)' };
        if (v === 'ghost') return { background: 'transparent', color: 'var(--text-muted)', border: 'none' };
        if (v === 'danger') return { background: '#ef4444', color: '#ffffff', border: '1px solid #ef4444' };
        return {};
    };

    return (
        <button
            className={twMerge(
                clsx(
                    baseStyles,
                    sizes[size],
                    isLoading && 'cursor-wait',
                    className
                )
            )}
            style={{ ...styleByVariant(variant), transition: 'background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease' }}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {!isLoading && Icon && <Icon className="w-4 h-4 mr-2" />}
            {children}
        </button>
    );
};

export default Button;
