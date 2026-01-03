'use client';

import { useState } from 'react';
import { ArrowUp, ArrowDown, Loader2 } from 'lucide-react';
import { PositionSide, ArenaToken } from '@/lib/arena/types';

interface OrderPanelProps {
    selectedToken: ArenaToken | null;
    currentPrice: number;
    walletConnected: boolean;
    onExecuteTrade: (side: PositionSide, sizeUSD: number) => Promise<void>;
    isExecuting: boolean;
}

export default function OrderPanel({
    selectedToken,
    currentPrice,
    walletConnected,
    onExecuteTrade,
    isExecuting,
}: OrderPanelProps) {
    const [side, setSide] = useState<PositionSide>('long');
    const [sizeUSD, setSizeUSD] = useState<string>('100');
    const [leverage, setLeverage] = useState(1); // Visual only for MVP

    const handleExecute = async () => {
        const size = parseFloat(sizeUSD);
        if (isNaN(size) || size <= 0) return;
        await onExecuteTrade(side, size);
    };

    const estimatedTokens = currentPrice > 0 ? parseFloat(sizeUSD) / currentPrice : 0;

    return (
        <div className="bg-[#111116] border border-white/10 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Place Order</h3>

            {/* Long/Short Toggle */}
            <div className="grid grid-cols-2 gap-2 mb-6">
                <button
                    onClick={() => setSide('long')}
                    className={`flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-all ${side === 'long'
                            ? 'bg-emerald-500 text-black'
                            : 'bg-white/5 text-zinc-400 hover:bg-white/10'
                        }`}
                >
                    <ArrowUp size={18} />
                    Long
                </button>
                <button
                    onClick={() => setSide('short')}
                    className={`flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-all ${side === 'short'
                            ? 'bg-red-500 text-white'
                            : 'bg-white/5 text-zinc-400 hover:bg-white/10'
                        }`}
                >
                    <ArrowDown size={18} />
                    Short
                </button>
            </div>

            {/* Size Input */}
            <div className="mb-4">
                <label className="block text-sm text-zinc-500 mb-2">Size (USD)</label>
                <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">$</span>
                    <input
                        type="number"
                        value={sizeUSD}
                        onChange={(e) => setSizeUSD(e.target.value)}
                        className="w-full pl-8 pr-4 py-3 bg-[#0a0a0f] border border-white/10 rounded-lg text-white text-lg font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        placeholder="100"
                        min="1"
                    />
                </div>
                <div className="flex gap-2 mt-2">
                    {[25, 50, 100, 250, 500].map((amount) => (
                        <button
                            key={amount}
                            onClick={() => setSizeUSD(amount.toString())}
                            className="flex-1 py-1.5 text-xs bg-white/5 text-zinc-400 rounded hover:bg-white/10 transition-colors"
                        >
                            ${amount}
                        </button>
                    ))}
                </div>
            </div>

            {/* Leverage Slider (Visual only for MVP) */}
            <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                    <label className="text-sm text-zinc-500">Leverage</label>
                    <span className="text-sm text-white font-medium">{leverage}x</span>
                </div>
                <input
                    type="range"
                    min="1"
                    max="10"
                    value={leverage}
                    onChange={(e) => setLeverage(parseInt(e.target.value))}
                    className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
                <p className="text-xs text-zinc-600 mt-1">
                    ⚠️ Leverage is visual only in MVP. Trades execute at 1x.
                </p>
            </div>

            {/* Order Summary */}
            <div className="bg-[#0a0a0f] rounded-lg p-4 mb-4 space-y-2">
                <div className="flex justify-between text-sm">
                    <span className="text-zinc-500">Token</span>
                    <span className="text-white">{selectedToken?.symbol || 'Select token'}</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-zinc-500">Entry Price</span>
                    <span className="text-white">${currentPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-zinc-500">Est. Tokens</span>
                    <span className="text-white">{estimatedTokens.toFixed(6)}</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-zinc-500">Direction</span>
                    <span className={side === 'long' ? 'text-emerald-500' : 'text-red-500'}>
                        {side.toUpperCase()}
                    </span>
                </div>
            </div>

            {/* Execute Button */}
            <button
                onClick={handleExecute}
                disabled={!walletConnected || !selectedToken || isExecuting}
                className={`w-full py-4 rounded-lg font-bold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed ${side === 'long'
                        ? 'bg-emerald-500 hover:bg-emerald-400 text-black'
                        : 'bg-red-500 hover:bg-red-400 text-white'
                    }`}
            >
                {isExecuting ? (
                    <span className="flex items-center justify-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Executing...
                    </span>
                ) : !walletConnected ? (
                    'Connect Wallet'
                ) : !selectedToken ? (
                    'Select Token'
                ) : (
                    `${side === 'long' ? 'Long' : 'Short'} ${selectedToken.symbol}`
                )}
            </button>
        </div>
    );
}
