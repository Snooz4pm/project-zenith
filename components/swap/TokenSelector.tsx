'use client';

import { useState, useRef, useEffect, useMemo } from 'react';

// Step 1: Token sanitizer
function normalizeToken(t: any) {
    if (!t || !t.address) return null;
    return {
        address: t.address,
        symbol: typeof t.symbol === "string" && t.symbol.length > 0 ? t.symbol : "UNKNOWN",
        name: typeof t.name === "string" && t.name.length > 0 ? t.name : "Unnamed Token",
        logoURI: typeof t.logoURI === "string" ? t.logoURI : "/token-placeholder.svg",
        decimals: Number.isFinite(t.decimals) ? t.decimals : 9,
        liquidityUsd: typeof t.liquidityUsd === "number" ? t.liquidityUsd : null,
        volume24h: typeof t.volume24h === "number" ? t.volume24h : null,
        uiBalance: t.uiBalance,
        balanceBase: t.balanceBase,
        mint: t.mint,
    };
}
import TokenRow from './TokenRow';
import { ChevronDown, Search } from 'lucide-react';

export type SelectableToken = {
    address: string;
    symbol: string;
    name?: string;
    decimals: number;
    logoURI?: string;
    uiBalance?: number; // Optional for wallet tokens
    balanceBase?: bigint; // Base units (for WalletToken compatibility)
    liquidityUsd?: number;
    volume24h?: number;
    mint?: string;
};

interface TokenSelectorProps {
    tokens: SelectableToken[];
    selected: SelectableToken | null;
    onSelect: (token: SelectableToken) => void;
    label?: string;
    showBalance?: boolean;
}

export function TokenSelector({
    tokens,
    selected,
    onSelect,
    label = 'Select Token',
    showBalance = false,
}: TokenSelectorProps) {
    const [isOpen, setIsOpen] = useState(true);
    const [search, setSearch] = useState('');
    const [displayTokens, setDisplayTokens] = useState<SelectableToken[]>([]);
    const FAST_LIMIT = 1000;
    const MAX_RENDER = 1500;
    // Hydrate full set for search
    const [fullUniverse, setFullUniverse] = useState<SelectableToken[]>([]);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Freeze displayTokens snapshot from tokens
    useEffect(() => {
        if (Array.isArray(tokens) && tokens.length > 0) {
            // Sanitize all tokens first
            const safeTokens = tokens.map(normalizeToken).filter((t): t is SelectableToken => !!t && !!t.address && !!t.symbol);
            // Debug: log a broken token if any
            const broken = safeTokens.find(t => !t.symbol || !t.address);
            if (broken) console.warn('Broken token sample:', broken);
            // DEBUG: Show all tokens regardless of liquidity
            const fastTokens = safeTokens
                // .filter(t => t && (t.liquidityUsd ?? 0) > 5000)
                .sort((a, b) => ((b?.volume24h ?? 0) - (a?.volume24h ?? 0)))
                .slice(0, FAST_LIMIT);
            setDisplayTokens(fastTokens.filter(Boolean));
            setFullUniverse(safeTokens.filter(Boolean));
        }
    }, [tokens]);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [isOpen]);

    // Smart search switching
    const searchQuery = search.trim().toLowerCase();
    // Layer 2: Filter broken tokens before UI
    const cleanTokens = useMemo(() => {
        const base = searchQuery ? fullUniverse : displayTokens;
        if (!Array.isArray(base)) return [];
        return base
            .filter((t): t is SelectableToken => !!t && !!t.address && typeof t.address === 'string' && !!t.symbol && t.decimals !== undefined)
            .slice(0, MAX_RENDER);
    }, [searchQuery, displayTokens, fullUniverse]);

    const filteredTokens = useMemo(() => {
        if (!Array.isArray(cleanTokens)) return [];
        if (!searchQuery) {
            return cleanTokens;
        }
        return cleanTokens.filter(t =>
            t.symbol?.toLowerCase().includes(searchQuery) ||
            t.name?.toLowerCase().includes(searchQuery) ||
            t.address?.toLowerCase().includes(searchQuery) ||
            t.mint?.toLowerCase().includes(searchQuery)
        );
    }, [searchQuery, cleanTokens]);

    const handleSelect = (token: SelectableToken) => {
        onSelect(token);
        setIsOpen(false);
        setSearch('');
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Trigger Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-between w-full px-4 py-3 rounded-xl bg-zinc-900/50 border border-white/5 hover:bg-zinc-900/80 transition-colors"
            >
                <div className="flex items-center gap-3">
                    {selected ? (
                        <>
                            <img
                                src={selected.logoURI || 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png'}
                                className="w-6 h-6 rounded-full bg-zinc-800"
                                alt={selected.symbol}
                                onError={(e) => {
                                    (e.currentTarget as HTMLImageElement).src = 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png';
                                }}
                            />
                            <div className="text-left">
                                <div className="text-white font-bold text-sm">{selected.symbol}</div>
                                {showBalance && selected.uiBalance !== undefined && (
                                    <div className="text-xs text-zinc-500 font-mono">
                                        {selected.uiBalance.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <span className="text-zinc-500 text-sm">{label}</span>
                    )}
                </div>
                <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute z-50 mt-2 w-full max-h-[400px] rounded-xl border border-white/10 bg-zinc-900 shadow-2xl overflow-hidden">
                    {/* Search */}
                    <div className="p-3 border-b border-white/5">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                            <input
                                type="text"
                                placeholder="Search by name or address..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-zinc-800/50 border border-white/5 rounded-lg text-white text-sm placeholder-zinc-600 outline-none focus:border-emerald-500/30"
                                autoFocus
                            />
                        </div>
                    </div>

                    {/* Token List */}
                    <div className="overflow-y-auto max-h-[320px] scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
                        {!displayTokens.length ? (
                            <div className="p-8 text-center text-zinc-500 text-sm opacity-50">
                                Loading token universe...
                            </div>
                        ) : filteredTokens.length === 0 ? (
                            <div className="p-8 text-center text-zinc-500 text-sm">
                                No tokens found
                            </div>
                        ) : filteredTokens.map((token: SelectableToken, idx: number) => {
                            if (!token || !token.address) return null;
                            return (
                                <TokenRow
                                    key={token.address || idx}
                                    token={token}
                                    onSelect={handleSelect}
                                    showBalance={showBalance}
                                />
                            );
                        }).filter(Boolean)
                        }
                    </div>
                </div>
            )}
        </div>
    );
}
