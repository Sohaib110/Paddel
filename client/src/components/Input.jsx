import React from 'react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

const Input = ({ label, error, className, ...props }) => {
    return (
        <div className="flex flex-col gap-1.5 w-full">
            {label && <label className="text-sm font-semibold text-text-secondary">{label}</label>}
            <input
                className={twMerge(clsx(
                    'px-4 py-2.5 bg-white border border-light-border rounded-xl text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-padel-green focus:border-padel-green transition-all shadow-sm',
                    error && 'border-red-500 focus:ring-red-500 focus:border-red-500',
                    className
                ))}
                {...props}
            />
            {error && <span className="text-xs text-red-600 font-medium">{error}</span>}
        </div>
    );
};

export default Input;
