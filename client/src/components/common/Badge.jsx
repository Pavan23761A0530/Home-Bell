import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const Badge = ({
    children,
    variant = 'neutral',
    className,
    ...props
}) => {
    const styleByVariant = (v) => {
        if (v === 'primary') return { backgroundColor: 'var(--card-bg)', color: 'var(--link)', border: '1px solid var(--link)' };
        if (v === 'neutral') return { backgroundColor: 'var(--card-bg)', color: 'var(--text-muted)', border: '1px solid var(--card-border)' };
        if (v === 'success') return { backgroundColor: '#0f766e', color: '#ecfeff', border: '1px solid #0f766e' };
        if (v === 'warning') return { backgroundColor: '#b45309', color: '#fffbeb', border: '1px solid #b45309' };
        if (v === 'error') return { backgroundColor: '#b91c1c', color: '#fee2e2', border: '1px solid #b91c1c' };
        return { backgroundColor: 'var(--card-bg)', color: 'var(--text)', border: '1px solid var(--card-border)' };
    };

    return (
        <span
            className={twMerge(
                clsx(
                    'inline-flex items-center rounded-md px-2 py-1 text-xs font-medium',
                    className
                )
            )}
            style={{ ...styleByVariant(variant), transition: 'background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease' }}
            {...props}
        >
            {children}
        </span>
    );
};

export default Badge;
