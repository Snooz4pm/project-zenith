'use client';

import { ARENA_TOKENS, ArenaToken } from '@/lib/arena/types';

interface TokenSelectorProps {
    selectedToken: ArenaToken | null;
    onSelectToken: (token: ArenaToken) => void;
    prices: Record<string, number>;
}

export default function TokenSelector({
    selectedToken,
    onSelectToken,
    prices,
}: TokenSelectorProps) {
    return (
        <div className="bg-[#111116] border border-white/10 rounded-xl p-4">
            <h3 className="text-sm font-medium text-zinc-500 mb-3">Select Token</h3>
            <div className="grid grid-cols-5 gap-2">
                {ARENA_TOKENS.map((token) => (
                    <button
                        key={token.symbol}
                        onClick={() => onSelectToken(token)}
                        className={`flex flex-col items-center p-3 rounded-lg transition-all ${selectedToken?.symbol === token.symbol
                                ? 'bg-emerald-500/10 border border-emerald-500'
                                : 'bg-white/5 border border-transparent hover:bg-white/10'
                            }`}
                    >
                        <span className="text-lg font-bold text-white">{token.symbol}</span>
                        <span className="text-xs text-zinc-500">
                            ${prices[token.symbol]?.toFixed(2) || '—'}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
}
