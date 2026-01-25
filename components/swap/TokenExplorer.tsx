'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { useTradeSelection } from '@/lib/store/useTradeSelection';
import { buildZenithTokenList, ZenithToken } from '@/lib/zenith';
import { fetchWalletBalances, WalletBalance } from '@/lib/wallet/balance';

// Helper for formatting large numbers
function formatMetric(value: number): string {
    if (!value) return '0';
    if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
    return `$${value.toFixed(0)}`;
}

// Dumb & Clean Row Component
function TokenRow({ token, onClick, isSelected }: { token: ZenithToken & { isVerified?: boolean; isLowLiq?: boolean; hasLogo?: boolean; balance?: number }; onClick: () => void; isSelected: boolean }) {
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
                        {token.balance && token.balance > 0 ? (
                            <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-mono border border-emerald-500/20">
                                {token.balance < 0.001 ? '<0.001' : token.balance.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                            </span>
                        ) : token.isVerified && (
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
    const [balances, setBalances] = useState<Map<string, number>>(new Map());
    const [loading, setLoading] = useState(true);
    const parentRef = useRef<HTMLDivElement>(null);

    const { selectedToken, setSelectedToken } = useTradeSelection();
    const { connection } = useConnection();
    const { publicKey } = useWallet();

    // 1. Fetch Token List
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

    // 2. Fetch Wallet Balances
    useEffect(() => {
        if (!publicKey) {
            setBalances(new Map());
            return;
        }

        fetchWalletBalances(connection, publicKey).then(walletBalances => {
            const map = new Map<string, number>();
            walletBalances.forEach(b => map.set(b.mint, b.amount));
            setBalances(map);
        });
    }, [publicKey, connection]);

    // 3. Prepare Enriched List (SAFE RENDER PATTERN)
    // Step 1: Token sanitizer
    function sanitizeToken(t: any) {
        if (!t || !(t.mint || t.address)) return null;
        const address = t.mint || t.address;
        return {
            ...t,
            address,
            mint: address,
            symbol: t.symbol || 'UNKNOWN',
            name: t.name || t.symbol || address.slice(0, 6),
            logoURI: t.logoURI && t.logoURI.length > 0 && t.logoURI.startsWith('http') ? t.logoURI : '/token-placeholder.svg',
            priceUsd: Number(t.priceUsd) || 0,
            liquidityUsd: typeof t.liquidityUsd === 'number' ? t.liquidityUsd : null,
            volume24hUsd: typeof t.volume24hUsd === 'number' ? t.volume24hUsd : null,
            isVerified: ['SOL', 'USDC', 'JUP', 'RAY', 'BONK', 'WIF'].includes(t.symbol),
            isLowLiq: (Number(t.liquidityUsd) || 0) < 10000,
            hasLogo: !!t.logoURI && !t.logoURI.includes('unknown'),
            balance: balances.get(address) || 0,
        };
    }
    const safeTokens = useMemo(() => {
        if (!Array.isArray(tokens)) return [];
        return tokens.map(sanitizeToken).filter(Boolean).sort((a, b) => {
            if (b.balance > 0 && a.balance === 0) return 1;
            if (a.balance > 0 && b.balance === 0) return -1;
            return 0;
        });
    }, [tokens, balances]);

    // 4. Virtualizer Setup uses safeTokens
    const rowVirtualizer = useVirtualizer({
        count: safeTokens.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 64,
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
                        {safeTokens.length} Verified Assets
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
                                const token = safeTokens[virtualRow.index];
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
                                            onClick={() => setSelectedToken(token)}
                                            isSelected={selectedToken?.address === token.address}
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
