"use client";

import { useState, useEffect, useCallback } from 'react';
import type { Token } from '@/types/token';
import { Search, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_JUPITER_PROXY_URL || 'https://jupiter-proxy-production.up.railway.app';
const TOKENS_PER_PAGE = 30;

type Props = {
    onSelect: (token: Token) => void;
};

// Token Card Component
function TokenCard({ token, onSelect }: { token: Token; onSelect: (t: Token) => void }) {
    return (
        <button
            onClick={() => onSelect(token)}
            className="flex items-center gap-3 p-4 rounded-xl bg-zinc-900/50 hover:bg-zinc-800/80 border border-white/5 hover:border-emerald-500/30 transition-all text-left group"
        >
            {token.logoURI ? (
                <img
                    src={token.logoURI}
                    alt={token.symbol}
                    className="w-10 h-10 rounded-full bg-zinc-800 object-cover group-hover:ring-2 ring-emerald-500/30 transition-all"
                    onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png';
                    }}
                />
            ) : (
                <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-white font-bold">
                    {token.symbol?.[0] || '?'}
                </div>
            )}
            <div className="min-w-0 flex-1">
                <div className="text-white font-semibold truncate">{token.symbol}</div>
                <div className="text-zinc-500 text-sm truncate">{token.name}</div>
            </div>
        </button>
    );
}

export default function SwapTokenGrid({ onSelect }: Props) {
    // Featured tokens (100)
    const [featuredTokens, setFeaturedTokens] = useState<Token[]>([]);
    const [loadingFeatured, setLoadingFeatured] = useState(true);

    // Search state
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Token[]>([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [isSearching, setIsSearching] = useState(false);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);

    // Load featured tokens on mount
    useEffect(() => {
        const loadFeatured = async () => {
            try {
                const res = await fetch(`${API_BASE}/api/token/featured`);
                const data = await res.json();
                if (data.tokens && Array.isArray(data.tokens)) {
                    // Map to Token type
                    const mapped: Token[] = data.tokens.map((t: any) => ({
                        symbol: t.symbol,
                        name: t.name,
                        address: t.address || t.mint,
                        mint: t.mint || t.address,
                        logoURI: t.logoURI,
                        decimals: t.decimals,
                    }));
                    setFeaturedTokens(mapped);
                }
            } catch (err) {
                console.error('Failed to load featured tokens:', err);
            } finally {
                setLoadingFeatured(false);
            }
        };
        loadFeatured();
    }, []);

    // Search the token universe
    const searchTokens = useCallback(async (query: string) => {
        if (!query.trim()) {
            setSearchResults([]);
            setIsSearching(false);
            return;
        }

        setSearchLoading(true);
        setIsSearching(true);

        try {
            // Search API - get first 100 matches
            const res = await fetch(`${API_BASE}/tokens?search=${encodeURIComponent(query)}&limit=100`);
            const data = await res.json();

            if (data.tokens && Array.isArray(data.tokens)) {
                const mapped: Token[] = data.tokens.map((t: any) => ({
                    symbol: t.symbol,
                    name: t.name,
                    address: t.address || t.mint,
                    mint: t.mint || t.address,
                    logoURI: t.logoURI,
                    decimals: t.decimals,
                }));
                setSearchResults(mapped);
            } else {
                setSearchResults([]);
            }
        } catch (err) {
            console.error('Search failed:', err);
            setSearchResults([]);
        } finally {
            setSearchLoading(false);
        }
    }, []);

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            searchTokens(searchQuery);
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery, searchTokens]);

    // Reset page when search changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery]);

    // Get display tokens (search results or featured)
    const displayTokens = isSearching ? searchResults : featuredTokens;
    const totalTokens = displayTokens.length;
    const totalPages = Math.ceil(totalTokens / TOKENS_PER_PAGE);

    // Paginate
    const startIndex = (currentPage - 1) * TOKENS_PER_PAGE;
    const endIndex = startIndex + TOKENS_PER_PAGE;
    const currentTokens = displayTokens.slice(startIndex, endIndex);

    const goToPage = (page: number) => {
        setCurrentPage(Math.max(1, Math.min(page, totalPages)));
    };

    return (
        <div className="space-y-4">
            {/* Header with search */}
            <div className="flex items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input
                        type="text"
                        placeholder="Search by name or address..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-zinc-900/50 border border-white/10 rounded-xl text-white text-sm placeholder-zinc-500 outline-none focus:border-emerald-500/50 transition-all"
                    />
                    {searchLoading && (
                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 animate-spin" />
                    )}
                </div>

                {/* Pagination Info */}
                <div className="text-sm text-zinc-400">
                    Showing {startIndex + 1}-{Math.min(endIndex, totalTokens)} of {totalTokens.toLocaleString()} tokens
                </div>

                {/* Page Navigation */}
                {totalPages > 1 && (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => goToPage(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="p-2 rounded-lg bg-zinc-900/50 hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4 text-white" />
                        </button>
                        <span className="text-sm text-zinc-400 font-mono min-w-[80px] text-center">
                            Page {currentPage} / {totalPages}
                        </span>
                        <button
                            onClick={() => goToPage(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="p-2 rounded-lg bg-zinc-900/50 hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronRight className="w-4 h-4 text-white" />
                        </button>
                    </div>
                )}
            </div>

            {/* Loading State */}
            {loadingFeatured && !isSearching ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                </div>
            ) : currentTokens.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
                    <p className="text-lg mb-2">No tokens found</p>
                    <p className="text-sm">Try a different search term</p>
                </div>
            ) : (
                /* Token Grid - 3 columns */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {currentTokens.map((token) => (
                        <TokenCard
                            key={token.address || token.mint}
                            token={token}
                            onSelect={onSelect}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
