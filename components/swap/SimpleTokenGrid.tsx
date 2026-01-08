'use client'

import { useState, useMemo } from 'react';
import { ZenithToken } from "@/lib/zenith";
import { ChevronLeft, ChevronRight, Search, X } from 'lucide-react';

// 8 rows × 3 columns = 24 tokens per page
const TOKENS_PER_PAGE = 24;

export function SimpleTokenGrid({
    tokens,
    onSelect,
}: {
    tokens: ZenithToken[]
    onSelect: (t: ZenithToken) => void
}) {
    const [currentPage, setCurrentPage] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');

    if (!Array.isArray(tokens)) return null;

    // Filter tokens based on search query (symbol, name, or mint address)
    const filteredTokens = useMemo(() => {
        if (!searchQuery.trim()) return tokens;

        const query = searchQuery.toLowerCase().trim();

        // Check if it's a full Solana address (base58, 32-44 chars)
        const isAddress = query.length >= 32 && /^[1-9A-HJ-NP-Za-km-z]+$/.test(query);

        return tokens.filter(t => {
            // Exact address match
            if (isAddress && t.mint.toLowerCase() === query) return true;
            // Partial address match
            if (t.mint.toLowerCase().includes(query)) return true;
            // Symbol match
            if (t.symbol.toLowerCase().includes(query)) return true;
            // Name match
            if (t.name?.toLowerCase().includes(query)) return true;
            return false;
        });
    }, [tokens, searchQuery]);

    const totalPages = Math.ceil(filteredTokens.length / TOKENS_PER_PAGE);
    const startIndex = currentPage * TOKENS_PER_PAGE;
    const endIndex = startIndex + TOKENS_PER_PAGE;
    const currentTokens = filteredTokens.slice(startIndex, endIndex);

    // Reset to first page when search changes
    const handleSearchChange = (value: string) => {
        setSearchQuery(value);
        setCurrentPage(0);
    };

    const goToNextPage = () => {
        if (currentPage < totalPages - 1) {
            setCurrentPage(prev => prev + 1);
        }
    };

    const goToPrevPage = () => {
        if (currentPage > 0) {
            setCurrentPage(prev => prev - 1);
        }
    };

    return (
        <div className="space-y-4">
            {/* Search Bar */}
            <div className="px-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input
                        type="text"
                        placeholder="Search by name, symbol, or paste address..."
                        value={searchQuery}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        className="w-full pl-10 pr-10 py-3 bg-zinc-900/50 border border-white/10 rounded-xl text-white text-sm placeholder-zinc-500 outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => handleSearchChange('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded-full transition-colors"
                        >
                            <X className="w-4 h-4 text-zinc-400" />
                        </button>
                    )}
                </div>
            </div>

            {/* Header with pagination info */}
            <div className="flex items-center justify-between px-4">
                <div className="text-sm text-zinc-400">
                    {searchQuery ? (
                        <>Found {filteredTokens.length} token{filteredTokens.length !== 1 ? 's' : ''}</>
                    ) : (
                        <>Showing {startIndex + 1}-{Math.min(endIndex, filteredTokens.length)} of {filteredTokens.length} tokens</>
                    )}
                </div>
                {totalPages > 1 && (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={goToPrevPage}
                            disabled={currentPage === 0}
                            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            aria-label="Previous page"
                        >
                            <ChevronLeft className="w-4 h-4 text-white" />
                        </button>
                        <span className="text-sm text-zinc-400 font-mono min-w-[80px] text-center">
                            Page {currentPage + 1} / {totalPages}
                        </span>
                        <button
                            onClick={goToNextPage}
                            disabled={currentPage === totalPages - 1}
                            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            aria-label="Next page"
                        >
                            <ChevronRight className="w-4 h-4 text-white" />
                        </button>
                    </div>
                )}
            </div>

            {/* Token Grid - 3 columns × 8 rows */}
            <div className="grid grid-cols-3 gap-3 p-4">
                {currentTokens.length === 0 ? (
                    <div className="col-span-3 py-12 text-center text-zinc-500">
                        <p className="text-lg mb-2">No tokens found</p>
                        <p className="text-sm">Try a different search or paste a token address</p>
                    </div>
                ) : (
                    currentTokens.map(t => {
                        if (!t.mint || !t.symbol) return null;

                        return (
                            <button
                                key={t.mint}
                                onClick={() => onSelect(t)}
                                className="flex items-center gap-3 p-3 rounded-xl bg-[#0B0E15] hover:bg-white/10 transition-all border border-white/5 text-left hover:border-emerald-500/30 active:scale-[0.98] group"
                            >
                                <img
                                    src={t.logoURI || 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png'}
                                    onError={(e) => {
                                        (e.currentTarget as HTMLImageElement).src = 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png'
                                    }}
                                    className="w-8 h-8 rounded-full bg-zinc-800 object-cover group-hover:ring-2 ring-emerald-500/20 transition-all"
                                    alt={t.symbol}
                                />
                                <div className="min-w-0 flex-1">
                                    <div className="text-sm font-bold text-white truncate">{t.symbol}</div>
                                    <div className="text-xs text-zinc-500 truncate">{t.name}</div>
                                </div>
                            </button>
                        )
                    })
                )}
            </div>
        </div>
    )
}

