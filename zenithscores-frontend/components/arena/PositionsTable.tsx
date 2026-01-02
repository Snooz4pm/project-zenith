'use client';

import { useState } from 'react';
import { X, TrendingUp, TrendingDown } from 'lucide-react';
import { PositionWithPnL } from '@/lib/arena/types';
import { formatPnL, formatPnLPercent, getPnLColor } from '@/lib/arena/pnl';

interface PositionsTableProps {
    positions: PositionWithPnL[];
    onClosePosition: (positionId: string, currentPrice: number) => Promise<void>;
    isClosing: string | null;
}

export default function PositionsTable({
    positions,
    onClosePosition,
    isClosing,
}: PositionsTableProps) {
    if (positions.length === 0) {
        return (
            <div className="bg-[#111116] border border-white/10 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Open Positions</h3>
                <div className="text-center py-8 text-zinc-500">
                    <p>No open positions</p>
                    <p className="text-sm mt-1">Execute a trade to see positions here</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-[#111116] border border-white/10 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Open Positions</h3>

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="text-xs text-zinc-500 border-b border-white/5">
                            <th className="text-left py-2">Token</th>
                            <th className="text-left py-2">Side</th>
                            <th className="text-right py-2">Size</th>
                            <th className="text-right py-2">Entry</th>
                            <th className="text-right py-2">Current</th>
                            <th className="text-right py-2">PnL</th>
                            <th className="text-right py-2"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {positions.map((position) => (
                            <tr key={position.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                <td className="py-3">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium text-white">{position.token}</span>
                                    </div>
                                </td>
                                <td className="py-3">
                                    <span className={`flex items-center gap-1 ${position.side === 'long' ? 'text-emerald-500' : 'text-red-500'}`}>
                                        {position.side === 'long' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                        {position.side.toUpperCase()}
                                    </span>
                                </td>
                                <td className="py-3 text-right text-white">
                                    ${position.sizeUSD.toFixed(2)}
                                </td>
                                <td className="py-3 text-right text-zinc-400">
                                    ${position.entryPrice.toFixed(2)}
                                </td>
                                <td className="py-3 text-right text-white">
                                    ${position.currentPrice.toFixed(2)}
                                </td>
                                <td className={`py-3 text-right font-medium ${getPnLColor(position.unrealizedPnL)}`}>
                                    <div>{formatPnL(position.unrealizedPnL)}</div>
                                    <div className="text-xs opacity-75">{formatPnLPercent(position.unrealizedPnLPercent)}</div>
                                </td>
                                <td className="py-3 text-right">
                                    <button
                                        onClick={() => onClosePosition(position.id, position.currentPrice)}
                                        disabled={isClosing === position.id}
                                        className="px-3 py-1.5 text-xs bg-white/5 text-zinc-400 rounded hover:bg-white/10 hover:text-white transition-colors disabled:opacity-50"
                                    >
                                        {isClosing === position.id ? 'Closing...' : 'Close'}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Total PnL */}
            <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center">
                <span className="text-zinc-500">Total Unrealized PnL</span>
                <span className={`text-lg font-bold ${getPnLColor(positions.reduce((sum, p) => sum + p.unrealizedPnL, 0))}`}>
                    {formatPnL(positions.reduce((sum, p) => sum + p.unrealizedPnL, 0))}
                </span>
            </div>
        </div>
    );
}
