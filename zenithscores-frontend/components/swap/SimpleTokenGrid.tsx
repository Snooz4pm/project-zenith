'use client'

import { ZenithToken } from "@/lib/zenith";

export function SimpleTokenGrid({
    tokens,
    onSelect,
}: {
    tokens: ZenithToken[]
    onSelect: (t: ZenithToken) => void
}) {
    if (!Array.isArray(tokens)) return null

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-4">
            {tokens.map(t => {
                if (!t.mint || !t.symbol) return null

                return (
                    <button
                        key={t.mint}
                        onClick={() => onSelect(t)}
                        className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/5 text-left"
                    >
                        <img
                            src={t.logoURI || 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png'}
                            onError={(e) => {
                                (e.currentTarget as HTMLImageElement).src = 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png'
                            }}
                            className="w-8 h-8 rounded-full bg-zinc-800 object-cover"
                            alt={t.symbol}
                        />
                        <div className="min-w-0">
                            <div className="text-sm font-bold text-white truncate">{t.symbol}</div>
                            <div className="text-xs text-zinc-500 truncate">{t.name}</div>
                        </div>
                    </button>
                )
            })}
        </div>
    )
}
