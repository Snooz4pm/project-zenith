// PnL Calculations for Trading Arena

import { ArenaPosition, PositionWithPnL } from './types';

/**
 * Calculate unrealized PnL for a position
 */
export function calculateUnrealizedPnL(
    position: ArenaPosition,
    currentPrice: number
): { pnl: number; pnlPercent: number } {
    const { side, entryPrice, sizeUSD } = position;

    let pnlPercent: number;

    if (side === 'long') {
        // Long: profit when price goes up
        pnlPercent = ((currentPrice - entryPrice) / entryPrice) * 100;
    } else {
        // Short: profit when price goes down
        pnlPercent = ((entryPrice - currentPrice) / entryPrice) * 100;
    }

    const pnl = (pnlPercent / 100) * sizeUSD;

    return { pnl, pnlPercent };
}

/**
 * Calculate realized PnL when closing a position
 */
export function calculateRealizedPnL(
    position: ArenaPosition,
    exitPrice: number
): number {
    const { pnl } = calculateUnrealizedPnL(position, exitPrice);
    return pnl;
}

/**
 * Add PnL data to a position
 */
export function enrichPositionWithPnL(
    position: ArenaPosition,
    currentPrice: number
): PositionWithPnL {
    const { pnl, pnlPercent } = calculateUnrealizedPnL(position, currentPrice);

    return {
        ...position,
        currentPrice,
        unrealizedPnL: pnl,
        unrealizedPnLPercent: pnlPercent,
    };
}

/**
 * Format PnL for display
 */
export function formatPnL(pnl: number): string {
    const sign = pnl >= 0 ? '+' : '';
    return `${sign}$${Math.abs(pnl).toFixed(2)}`;
}

/**
 * Format PnL percentage for display
 */
export function formatPnLPercent(pnlPercent: number): string {
    const sign = pnlPercent >= 0 ? '+' : '';
    return `${sign}${pnlPercent.toFixed(2)}%`;
}

/**
 * Get PnL color class
 */
export function getPnLColor(pnl: number): string {
    if (pnl > 0) return 'text-emerald-500';
    if (pnl < 0) return 'text-red-500';
    return 'text-zinc-400';
}
