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
 * Skeleton loader with shimmer animation
 */
export function SkeletonLoader({
    variant = 'rectangle',
    width,
    height,
    className = '',
    lines = 1,
    animated = true,
}: SkeletonLoaderProps) {
    const baseStyles = `
    bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800
    bg-[length:200%_100%]
    ${animated ? 'animate-shimmer' : ''}
  `;

    const variantStyles = {
        text: 'h-4 rounded',
        circle: 'rounded-full aspect-square',
        rectangle: 'rounded-lg',
        card: 'rounded-2xl',
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
                            animationDelay: `${i * 0.1}s`,
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
                        <div className={`${baseStyles} rounded-full w-10 h-10`} />
                        <div className="flex-1 space-y-2">
                            <div className={`${baseStyles} rounded h-4 w-3/4`} />
                            <div className={`${baseStyles} rounded h-3 w-1/2`} />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className={`${baseStyles} rounded h-4 w-full`} />
                        <div className={`${baseStyles} rounded h-4 w-full`} />
                        <div className={`${baseStyles} rounded h-4 w-3/4`} />
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
