'use client';

import { marketHours } from '@/lib/market-hours';

interface StatusBadgeProps {
    assetType: 'crypto' | 'forex' | 'stock';
    exchange?: 'NYSE' | 'NASDAQ';
    showLabel?: boolean;
    size?: 'sm' | 'md' | 'lg';
}

export function MarketStatusBadge({
    assetType,
    exchange = 'NYSE',
    showLabel = true,
    size = 'md'
}: StatusBadgeProps) {
    const status = marketHours.getMarketStatus(assetType, exchange);

    const sizeClasses = {
        sm: 'w-2 h-2 text-[9px]',
        md: 'w-2.5 h-2.5 text-[10px]',
        lg: 'w-3 h-3 text-xs',
    };

    const statusConfig = {
        '24_7': {
            color: '#10B981',
            bgColor: 'bg-emerald-500/10',
            textColor: 'text-emerald-400',
            label: '24/7',
        },
        'open': {
            color: '#10B981',
            bgColor: 'bg-green-500/10',
            textColor: 'text-green-400',
            label: 'OPEN',
        },
        'closed': {
            color: '#EF4444',
            bgColor: 'bg-red-500/10',
            textColor: 'text-red-400',
            label: 'CLOSED',
        },
        'pre_market': {
            color: '#F59E0B',
            bgColor: 'bg-amber-500/10',
            textColor: 'text-amber-400',
            label: 'PRE-MKT',
        },
        'after_hours': {
            color: '#8B5CF6',
            bgColor: 'bg-purple-500/10',
            textColor: 'text-purple-400',
            label: 'AFTER-HRS',
        },
        'weekend': {
            color: '#6B7280',
            bgColor: 'bg-gray-500/10',
            textColor: 'text-gray-400',
            label: 'WEEKEND',
        },
    };

    const config = statusConfig[status.status];

    return (
        <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md ${config.bgColor}`}>
            <div
                className={`rounded-full ${sizeClasses[size]} animate-pulse`}
                style={{ backgroundColor: config.color }}
            />
            {showLabel && (
                <span className={`font-bold uppercase tracking-wider ${config.textColor} ${sizeClasses[size]}`}>
                    {config.label}
                </span>
            )}
        </div>
    );
}

export default MarketStatusBadge;
