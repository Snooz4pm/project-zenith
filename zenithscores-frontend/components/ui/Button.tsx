import { ButtonHTMLAttributes, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    children: ReactNode;
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
    isLoading?: boolean;
}

export function Button({
    children,
    variant = 'primary',
    isLoading = false,
    className = "",
    disabled,
    ...props
}: ButtonProps) {
    const baseStyles = "px-4 py-2 rounded-lg font-medium transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100";

    const variants = {
        primary: "bg-[var(--accent-mint)] text-black hover:bg-[#1eefa4]",
        secondary: "bg-white/10 text-white hover:bg-white/20",
        danger: "bg-[var(--accent-danger)]/10 text-[var(--accent-danger)] hover:bg-[var(--accent-danger)]/20",
        ghost: "text-zinc-400 hover:text-white hover:bg-white/5"
    };

    return (
        <button
            className={`${baseStyles} ${variants[variant]} ${className}`}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            {children}
        </button>
    );
}
