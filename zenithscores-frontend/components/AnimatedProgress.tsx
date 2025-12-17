'use client';

import React from 'react';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

interface AnimatedProgressProps {
    value: number;
    max?: number;
    height?: number;
    className?: string;
    gradientFrom?: string;
    gradientTo?: string;
    showGlow?: boolean;
    animated?: boolean;
    label?: string;
    showValue?: boolean;
}

/**
 * Animated progress bar with gradient fill and glow
 */
export function AnimatedProgress({
    value,
    max = 100,
    height = 12,
    className = '',
    gradientFrom = '#00f0ff',
    gradientTo = '#10b981',
    showGlow = true,
    animated = true,
    label,
    showValue = false,
}: AnimatedProgressProps) {
    const ref = useRef<HTMLDivElement>(null);
    const isInView = useInView(ref, { once: true, margin: '-50px' });
    const percentage = Math.min((value / max) * 100, 100);

    return (
        <div ref={ref} className={`w-full ${className}`}>
            {(label || showValue) && (
                <div className="flex justify-between items-center mb-2 text-sm">
                    {label && <span className="text-gray-400">{label}</span>}
                    {showValue && (
                        <span className="text-white font-mono">
                            {value.toFixed(0)}
                            <span className="text-gray-500">/{max}</span>
                        </span>
                    )}
                </div>
            )}

            <div
                className="relative w-full rounded-full overflow-hidden bg-gray-800/50"
                style={{ height }}
            >
                {/* Background track */}
                <div className="absolute inset-0 bg-gradient-to-r from-gray-800 to-gray-900" />

                {/* Animated fill */}
                <motion.div
                    className="absolute inset-y-0 left-0 rounded-full"
                    style={{
                        background: `linear-gradient(90deg, ${gradientFrom}, ${gradientTo})`,
                        boxShadow: showGlow
                            ? `0 0 20px ${gradientFrom}60, 0 0 40px ${gradientFrom}30`
                            : 'none',
                    }}
                    initial={{ width: 0 }}
                    animate={isInView && animated ? { width: `${percentage}%` } : { width: `${percentage}%` }}
                    transition={{
                        duration: animated ? 1.5 : 0,
                        ease: [0.34, 1.56, 0.64, 1],
                        delay: 0.2,
                    }}
                >
                    {/* Shimmer overlay */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                </motion.div>

                {/* Tick marks */}
                <div className="absolute inset-0 flex justify-between px-1 pointer-events-none">
                    {[...Array(5)].map((_, i) => (
                        <div
                            key={i}
                            className="w-px h-full bg-white/5"
                            style={{ marginLeft: i === 0 ? 0 : undefined }}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}

export default AnimatedProgress;
