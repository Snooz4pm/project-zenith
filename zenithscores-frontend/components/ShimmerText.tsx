'use client';

import React, { ReactNode } from 'react';

interface ShimmerTextProps {
    children: ReactNode;
    className?: string;
    colors?: string[];
    speed?: number;
    glow?: boolean;
    as?: React.ElementType;
}

/**
 * Animated gradient text with shimmer effect
 */
export function ShimmerText({
    children,
    className = '',
    colors = ['#00f0ff', '#a855f7', '#f72585', '#a855f7', '#00f0ff'],
    speed = 3,
    glow = true,
    as: Component = 'span',
}: ShimmerTextProps) {
    const gradientColors = colors.join(', ');

    return (
        <Component
            className={`inline-block ${className}`}
            style={{
                background: `linear-gradient(90deg, ${gradientColors})`,
                backgroundSize: '200% auto',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                animation: `shimmer ${speed}s linear infinite`,
                textShadow: glow ? `0 0 30px ${colors[0]}40` : 'none',
            }}
        >
            {children}
        </Component>
    );
}

export default ShimmerText;
