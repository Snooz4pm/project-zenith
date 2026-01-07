'use client';

import { getMarketStatus, isCryptoOpen } from '@/lib/market-hours';

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
    const status = getMarketStatus(assetType);

    const sizeClasses = {
        sm: 'w-2 h-2 text-[9px]',
        md: 'w-2.5 h-2.5 text-[10px]',
        lg: 'w-3 h-3 text-xs',
    };

    // Map the actual status to our badge config
    const is247 = assetType === 'crypto';
    const isOpen = status.isOpen;

    const statusConfig = is247
        ? {
            color: '#10B981',
            bgColor: 'bg-emerald-500/10',
            textColor: 'text-emerald-400',
            label: '24/7',
        }
        : isOpen
            ? {
                color: '#10B981',
                bgColor: 'bg-green-500/10',
                textColor: 'text-green-400',
                label: 'OPEN',
            }
            : {
                color: '#EF4444',
                bgColor: 'bg-red-500/10',
                textColor: 'text-red-400',
                label: 'CLOSED',
            };

    return (
        <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md ${statusConfig.bgColor}`}>
            <div
                className={`rounded-full ${sizeClasses[size]} animate-pulse`}
                style={{ backgroundColor: statusConfig.color }}
            />
            {showLabel && (
                <span className={`font-bold uppercase tracking-wider ${statusConfig.textColor} ${sizeClasses[size]}`}>
                    {statusConfig.label}
                </span>
            )}
        </div>
    );
}

export default MarketStatusBadge;
