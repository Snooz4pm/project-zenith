'use client';

import React from 'react';

interface SkeletonLoaderProps {
    variant?: 'text' | 'circle' | 'rectangle' | 'card';
    width?: string | number;
    height?: string | number;
    className?: string;
    lines?: number;
    animated?: boolean;
}

/**
 * Vercel-inspired skeleton loader with subtle shimmer animation.
 * Uses dark theme consistent with the site.
 */
export function SkeletonLoader({
    variant = 'rectangle',
    width,
    height,
    className = '',
    lines = 1,
    animated = true,
}: SkeletonLoaderProps) {
    // Vercel-style: very subtle, dark backgrounds with minimal shimmer
    const baseStyles = `
    bg-white/5
    ${animated ? 'animate-pulse' : ''}
  `;

    const variantStyles = {
        text: 'h-4 rounded',
        circle: 'rounded-full aspect-square',
        rectangle: 'rounded-lg',
        card: 'rounded-xl border border-white/5',
    };

    const getWidth = () => {
        if (width) return typeof width === 'number' ? `${width}px` : width;
        if (variant === 'text') return '100%';
        if (variant === 'circle') return height || '48px';
        return '100%';
    };

    const getHeight = () => {
        if (height) return typeof height === 'number' ? `${height}px` : height;
        if (variant === 'text') return '16px';
        if (variant === 'circle') return width || '48px';
        if (variant === 'card') return '200px';
        return '48px';
    };

    if (variant === 'text' && lines > 1) {
        return (
            <div className={`space-y-2 ${className}`}>
                {[...Array(lines)].map((_, i) => (
                    <div
                        key={i}
                        className={`${baseStyles} ${variantStyles.text}`}
                        style={{
                            width: i === lines - 1 ? '75%' : '100%',
                            height: getHeight(),
                        }}
                    />
                ))}
            </div>
        );
    }

    if (variant === 'card') {
        return (
            <div
                className={`${baseStyles} ${variantStyles.card} ${className} p-6`}
                style={{ width: getWidth(), height: getHeight() }}
            >
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="bg-white/5 rounded-full w-10 h-10 animate-pulse" />
                        <div className="flex-1 space-y-2">
                            <div className="bg-white/5 rounded h-4 w-3/4 animate-pulse" />
                            <div className="bg-white/5 rounded h-3 w-1/2 animate-pulse" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="bg-white/5 rounded h-4 w-full animate-pulse" />
                        <div className="bg-white/5 rounded h-4 w-full animate-pulse" />
                        <div className="bg-white/5 rounded h-4 w-3/4 animate-pulse" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div
            className={`${baseStyles} ${variantStyles[variant]} ${className}`}
            style={{
                width: getWidth(),
                height: getHeight(),
            }}
        />
    );
}

export default SkeletonLoader;
