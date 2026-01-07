'use client';

import { useMemo } from 'react';

export function Sparkline({ data, className }: { data: number[]; className?: string }) {
    const path = useMemo(() => {
        if (!data || data.length < 2) return '';

        const min = Math.min(...data);
        const max = Math.max(...data);
        const range = max - min || 1;

        return data.map((v, i) => {
            const x = (i / (data.length - 1)) * 100;
            const y = 100 - ((v - min) / range) * 100;
            return `${x},${y}`;
        }).join(' ');
    }, [data]);

    if (!data || data.length < 2) return null;

    return (
        <svg viewBox="0 0 100 100" className={className} preserveAspectRatio="none">
            <polyline
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                points={path}
                vectorEffect="non-scaling-stroke"
            />
        </svg>
    );
}
