'use client';

import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface GlowingBorderProps {
    children: ReactNode;
    className?: string;
    colors?: string[];
    borderWidth?: number;
    animated?: boolean;
    animationDuration?: number;
    glowIntensity?: number;
}

/**
 * Wrapper that adds an animated glowing border
 */
export function GlowingBorder({
    children,
    className = '',
    colors = ['#00f0ff', '#a855f7', '#f72585', '#00f0ff'],
    borderWidth = 2,
    animated = true,
    animationDuration = 3,
    glowIntensity = 0.5,
}: GlowingBorderProps) {
    const gradientColors = colors.join(', ');

    return (
        <div className={`relative ${className}`}>
            {/* Animated glow border */}
            <motion.div
                className="absolute inset-0 rounded-[inherit] pointer-events-none"
                style={{
                    padding: borderWidth,
                    background: `linear-gradient(135deg, ${gradientColors})`,
                    backgroundSize: animated ? '300% 300%' : '100% 100%',
                    WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                    WebkitMaskComposite: 'xor',
                    maskComposite: 'exclude',
                    filter: `blur(0px) drop-shadow(0 0 ${10 * glowIntensity}px ${colors[0]})`,
                }}
                animate={
                    animated
                        ? {
                            backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
                        }
                        : {}
                }
                transition={{
                    duration: animationDuration,
                    repeat: Infinity,
                    ease: 'linear',
                }}
            />

            {/* Outer glow */}
            <div
                className="absolute inset-0 rounded-[inherit] pointer-events-none opacity-50 blur-sm"
                style={{
                    background: `linear-gradient(135deg, ${gradientColors})`,
                    backgroundSize: '300% 300%',
                    animation: animated ? `gradient-shift ${animationDuration}s ease infinite` : 'none',
                }}
            />

            {/* Content */}
            <div className="relative z-10 rounded-[inherit]">{children}</div>
        </div>
    );
}

export default GlowingBorder;
