'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useTradeSelection } from '@/lib/store/useTradeSelection';
import { buildZenithTokenList, ZenithToken } from '@/lib/zenith';

// Helper for formatting large numbers
function formatMetric(value: number): string {
    if (!value) return '0';
    if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
    return `$${value.toFixed(0)}`;
}

// Dumb & Clean Row Component
function TokenRow({ token, onClick, isSelected }: { token: ZenithToken & { isVerified?: boolean; isLowLiq?: boolean; hasLogo?: boolean }; onClick: () => void; isSelected: boolean }) {
    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors border-b border-white/5 ${isSelected ? 'bg-white/5' : ''}`}
        >
            <div className="flex items-center gap-4">
                {token.hasLogo ? (
                    <img
                        src={token.logoURI}
                        alt={token.symbol}
                        className="w-8 h-8 rounded-full bg-zinc-800 object-cover"
                        loading="lazy"
                    />
                ) : (
                    <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-[8px] text-zinc-500 border border-white/5">
                        ?
                    </div>
                )}

                <div className="text-left">
                    <div className="text-sm font-bold text-white flex items-center gap-2">
                        {token.symbol}
                        {token.isVerified && (
                            <span className="px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-[9px] font-bold border border-blue-500/20">
                                VERIFIED
                            </span>
                        )}
                        {/* Price Tag */}
                        {token.priceUsd > 0 && (
                            <span className="text-xs font-mono text-zinc-500 font-normal">
                                ${token.priceUsd < 0.01 ? token.priceUsd.toExponential(2) : token.priceUsd.toFixed(2)}
                            </span>
                        )}
                    </div>
                    <div className="text-[10px] text-zinc-500 truncate max-w-[120px] flex gap-2">
                        <span>{token.name}</span>
                        {!token.hasLogo && <span className="text-red-400">No Logo</span>}
                    </div>
                </div>
            </div>

            {/* Metrics (Right Side) */}
            <div className="flex items-center gap-4 text-right">
                <div className="hidden sm:block">
                    <div className="text-[10px] text-zinc-500 uppercase">Vol</div>
                    <div className="text-xs font-mono text-zinc-300">{formatMetric(token.volume24hUsd)}</div>
                </div>
                <div>
                    <div className="text-[10px] text-zinc-500 uppercase">Liq</div>
                    <div className="text-xs font-mono text-emerald-400 flex flex-col items-end">
                        {formatMetric(token.liquidityUsd)}
                        {token.isLowLiq && <span className="text-[9px] text-orange-400/80">LOW LIQ</span>}
                    </div>
                </div>
            </div>
        </button>
    );
}

export default function TokenExplorer() {
    const [tokens, setTokens] = useState<ZenithToken[]>([]);
    const [loading, setLoading] = useState(true);
    const parentRef = useRef<HTMLDivElement>(null);

    const { selectedToken, setSelectedToken } = useTradeSelection(); // Assumes store exports selectedToken too?
    // Checking store definition: export const useTradeSelection = create<TradeState>((set) => ({ selectedToken: null ... 
    // Yes it has selectedToken.

    useEffect(() => {
        buildZenithTokenList()
            .then(data => {
                setTokens(data);
                setLoading(false);
            })
            .catch(err => {
                console.error('Failed to load Zenith tokens', err);
                setLoading(false);
            });
    }, []);

    // 1. Prepare Enriched List (NO HIDING, JUST LABELING)
    const displayTokens = useMemo(() => {
        // We show everything the backend gives us (which is already verified/safe-ish)
        // We just add badges for clarity.
        return tokens.map(t => ({
            ...t,
            isVerified: ['SOL', 'USDC', 'JUP', 'RAY', 'BONK', 'WIF'].includes(t.symbol),
            isLowLiq: t.liquidityUsd < 10000,
            hasLogo: !!t.logoURI && t.logoURI.startsWith('http') && !t.logoURI.includes('unknown')
        }));
    }, [tokens]);

    // 2. Virtualizer Setup
    const rowVirtualizer = useVirtualizer({
        count: displayTokens.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 64, // Matches row height approx
        overscan: 10
    });

    return (
        <section className="h-[calc(100vh-140px)] flex flex-col">
            <header className="mb-4 flex items-center justify-between shrink-0 px-1">
                <div>
                    <h2 className="text-lg font-bold text-white tracking-tight">
                        Market
                    </h2>
                    <p className="text-xs text-zinc-500">
                        {displayTokens.length} Verified Assets
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400">LIVE</span>
                </div>
            </header>

            {/* List Container */}
            <div className="flex-1 rounded-xl border border-white/5 bg-[#0B0E15] overflow-hidden flex flex-col backdrop-blur-sm shadow-2xl">
                {/* Header Row */}
                <div className="flex items-center justify-between px-4 py-2 border-b border-white/5 bg-white/5 text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">
                    <span>Asset</span>
                    <span>Metrics</span>
                </div>

                {loading ? (
                    <div className="flex-1 flex items-center justify-center text-zinc-500 text-sm animate-pulse">
                        Loading market data...
                    </div>
                ) : (
                    <div
                        ref={parentRef}
                        className="flex-1 overflow-auto scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent"
                    >
                        <div
                            style={{
                                height: `${rowVirtualizer.getTotalSize()}px`,
                                width: '100%',
                                position: 'relative',
                            }}
                        >
                            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                                const token = displayTokens[virtualRow.index];
                                return (
                                    <div
                                        key={token.mint}
                                        style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            width: '100%',
                                            height: `${virtualRow.size}px`,
                                            transform: `translateY(${virtualRow.start}px)`,
                                        }}
                                    >
                                        <TokenRow
                                            token={token}
                                            onClick={() => setSelectedToken({
                                                address: token.mint,
                                                symbol: token.symbol,
                                                name: token.name,
                                                logoURI: token.logoURI,
                                                decimals: token.decimals
                                            })}
                                            isSelected={selectedToken?.address === token.mint}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}
