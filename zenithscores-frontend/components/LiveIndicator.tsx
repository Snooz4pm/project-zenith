'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface LiveIndicatorProps {
    status?: 'live' | 'offline' | 'warning';
    showLabel?: boolean;
    label?: string;
    className?: string;
    size?: 'sm' | 'md' | 'lg';
    pulse?: boolean;
}

/**
 * Pulsing live indicator with status colors
 */
export function LiveIndicator({
    status = 'live',
    showLabel = true,
    label,
    className = '',
    size = 'md',
    pulse = true,
}: LiveIndicatorProps) {
    const statusColors = {
        live: {
            dot: '#10b981',
            glow: 'rgba(16, 185, 129, 0.5)',
            text: 'text-green-400',
        },
        offline: {
            dot: '#6b7280',
            glow: 'rgba(107, 114, 128, 0.3)',
            text: 'text-gray-400',
        },
        warning: {
            dot: '#f59e0b',
            glow: 'rgba(245, 158, 11, 0.5)',
            text: 'text-amber-400',
        },
    };

    const sizeStyles = {
        sm: { dot: 6, text: 'text-[10px]' },
        md: { dot: 8, text: 'text-xs' },
        lg: { dot: 10, text: 'text-sm' },
    };

    const colors = statusColors[status];
    const sizeConfig = sizeStyles[size];

    const defaultLabels = {
        live: 'LIVE',
        offline: 'OFFLINE',
        warning: 'UPDATING',
    };

    return (
        <div className={`flex items-center gap-2 ${className}`}>
            <div className="relative">
                {/* Glow ring */}
                {pulse && status === 'live' && (
                    <motion.div
                        className="absolute inset-0 rounded-full"
                        style={{
                            width: sizeConfig.dot,
                            height: sizeConfig.dot,
                            backgroundColor: colors.glow,
                        }}
                        animate={{
                            scale: [1, 1.8, 1],
                            opacity: [0.5, 0, 0.5],
                        }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: 'easeInOut',
                        }}
                    />
                )}

                {/* Core dot */}
                <motion.div
                    className="rounded-full relative z-10"
                    style={{
                        width: sizeConfig.dot,
                        height: sizeConfig.dot,
                        backgroundColor: colors.dot,
                        boxShadow: `0 0 10px ${colors.glow}`,
                    }}
                    animate={
                        pulse && status === 'live'
                            ? {
                                scale: [1, 1.1, 1],
                            }
                            : {}
                    }
                    transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: 'easeInOut',
                    }}
                />
            </div>

            {showLabel && (
                <span
                    className={`font-mono font-bold uppercase tracking-wider ${sizeConfig.text} ${colors.text}`}
                >
                    {label || defaultLabels[status]}
                </span>
            )}
        </div>
    );
}

export default LiveIndicator;
