import React from 'react';
import { Loader2 } from 'lucide-react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

const Button = ({ children, variant = 'primary', size = 'md', className = '', isLoading, disabled, ...props }) => {
    const baseClasses = 'inline-flex items-center justify-center font-black uppercase tracking-tighter italic rounded-2xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95';

    const variants = {
        primary: 'bg-padel-green text-black hover:bg-black hover:text-padel-green shadow-lg shadow-padel-green/20 hover:shadow-black/20',
        secondary: 'bg-white border-2 border-light-border text-text-primary hover:border-padel-green hover:text-padel-green',
        danger: 'bg-rose-500 text-white hover:bg-rose-600 shadow-lg shadow-rose-500/20',
        outline: 'bg-transparent border-2 border-text-primary text-text-primary hover:bg-text-primary hover:text-white',
        ghost: 'bg-transparent text-text-tertiary hover:bg-light-surface hover:text-text-primary'
    };

    const sizes = {
        xs: 'px-3 py-1.5 text-[10px] tracking-widest',
        sm: 'px-4 py-2 text-xs tracking-wider',
        md: 'px-6 py-3 text-sm tracking-wide',
        lg: 'px-8 py-4 text-base tracking-normal',
        xl: 'px-10 py-5 text-lg font-black'
    };

    return (
        <button
            className={twMerge(clsx(baseClasses, variants[variant], sizes[size], className))}
            disabled={isLoading || disabled}
            {...props}
        >
            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {children}
        </button>
    );
};

export default Button;
