import React from 'react';
import { twMerge } from 'tailwind-merge';

const Card = ({ children, className, ...props }) => {
    return (
        <div
            className={twMerge('rounded-xl shadow-card p-6', className)}
            style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)', color: 'var(--text)', transition: 'background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease' }}
            {...props}
        >
            {children}
        </div>
    );
};

export default Card;
