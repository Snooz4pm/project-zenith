'use client';

import React, { useRef, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { useMagnetic } from '@/lib/useMagnetic';

interface MagneticButtonProps {
    children: ReactNode;
    className?: string;
    onClick?: () => void;
    variant?: 'primary' | 'secondary' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    glowColor?: string;
    disabled?: boolean;
    magneticStrength?: number;
}

/**
 * Magnetic button that follows cursor with ripple and glow effects
 */
export function MagneticButton({
    children,
    className = '',
    onClick,
    variant = 'primary',
    size = 'md',
    glowColor,
    disabled = false,
    magneticStrength = 0.3,
}: MagneticButtonProps) {
    const ref = useRef<HTMLButtonElement>(null);
    const magnetic = useMagnetic(ref, { strength: magneticStrength });
    const [ripple, setRipple] = React.useState<{ x: number; y: number } | null>(null);

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        if (disabled) return;

        // Create ripple effect
        const rect = e.currentTarget.getBoundingClientRect();
        setRipple({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        });

        setTimeout(() => setRipple(null), 600);

        onClick?.();
    };

    const baseStyles = `
    relative overflow-hidden font-bold rounded-xl
    transition-all duration-300 ease-out
    disabled:opacity-50 disabled:cursor-not-allowed
    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black
  `;

    const sizeStyles = {
        sm: 'px-4 py-2 text-sm',
        md: 'px-6 py-3 text-base',
        lg: 'px-8 py-4 text-lg',
    };

    const variantStyles = {
        primary: `
      bg-gradient-to-r from-[#00f0ff] to-[#a855f7]
      text-black hover:shadow-[0_8px_30px_rgba(0,240,255,0.5)]
      focus:ring-[#00f0ff]
    `,
        secondary: `
      bg-white/10 backdrop-blur-md border border-white/20
      text-white hover:bg-white/20 hover:border-white/30
      hover:shadow-[0_8px_30px_rgba(255,255,255,0.1)]
      focus:ring-white/50
    `,
        ghost: `
      bg-transparent text-white
      hover:bg-white/5
      focus:ring-white/30
    `,
    };

    const defaultGlow = {
        primary: 'rgba(0, 240, 255, 0.4)',
        secondary: 'rgba(255, 255, 255, 0.2)',
        ghost: 'rgba(255, 255, 255, 0.1)',
    };

    const glowStyle = glowColor || defaultGlow[variant];

    return (
        <motion.button
            ref={ref}
            onClick={handleClick}
            disabled={disabled}
            className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
            style={magnetic.style}
            onMouseMove={magnetic.onMouseMove}
            onMouseLeave={magnetic.onMouseLeave}
            whileHover={{ scale: disabled ? 1 : 1.05, y: disabled ? 0 : -2 }}
            whileTap={{ scale: disabled ? 1 : 0.98 }}
        >
            {/* Glow effect */}
            <div
                className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-xl"
                style={{
                    boxShadow: `0 0 30px ${glowStyle}`,
                }}
            />

            {/* Ripple effect */}
            {ripple && (
                <span
                    className="absolute w-2 h-2 rounded-full bg-white/40 animate-[ripple_0.6s_ease-out]"
                    style={{
                        left: ripple.x,
                        top: ripple.y,
                        transform: 'translate(-50%, -50%)',
                    }}
                />
            )}

            {/* Content */}
            <span className="relative z-10 flex items-center justify-center gap-2">
                {children}
            </span>

            {/* Shine effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] hover:translate-x-[100%] transition-transform duration-700 pointer-events-none" />
        </motion.button>
    );
}

export default MagneticButton;
