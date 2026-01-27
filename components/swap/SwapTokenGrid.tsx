"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Token } from '@/types/token';
import { Search, ChevronLeft, ChevronRight, Loader2, X } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_JUPITER_PROXY_URL || 'https://jupiter-proxy-production.up.railway.app';
const TOKENS_PER_PAGE = 30;

type Props = {
    onSelect: (token: Token) => void;
};

// Highlight matching text
function HighlightMatch({ text, query }: { text: string; query: string }) {
    if (!query.trim() || !text) return <>{text}</>;
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return (
        <>
            {parts.map((part, i) =>
                regex.test(part) ? (
                    <span key={i} className="text-emerald-400 font-semibold">{part}</span>
                ) : (
                    <span key={i}>{part}</span>
                )
            )}
        </>
    );
}

// Token Card
function TokenCard({ token, onSelect, query }: { token: Token; onSelect: (t: Token) => void; query: string }) {
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
                <div className="text-white font-semibold truncate">
                    <HighlightMatch text={token.symbol} query={query} />
                </div>
                <div className="text-zinc-500 text-sm truncate">
                    <HighlightMatch text={token.name || ''} query={query} />
                </div>
            </div>
        </button>
    );
}

export default function SwapTokenGrid({ onSelect }: Props) {
    const [featuredTokens, setFeaturedTokens] = useState<Token[]>([]);
    const [loadingFeatured, setLoadingFeatured] = useState(true);

    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Token[]>([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);

    const [currentPage, setCurrentPage] = useState(1);

    const searchInputRef = useRef<HTMLInputElement>(null);
    const suggestionsRef = useRef<HTMLDivElement>(null);
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Load featured tokens on mount
    useEffect(() => {
        const loadFeatured = async () => {
            try {
                console.log('[SwapTokenGrid] Loading featured tokens...');
                const res = await fetch(`${API_BASE}/api/tokens/featured`);
                const data = await res.json();
                console.log('[SwapTokenGrid] Featured response:', data.count, 'tokens');

                if (data.tokens && Array.isArray(data.tokens)) {
                    const mapped: Token[] = data.tokens.map((t: any) => ({
                        symbol: t.symbol || '',
                        name: t.name || '',
                        address: t.address || t.mint || '',
                        mint: t.mint || t.address || '',
                        logoURI: t.logoURI || '',
                        decimals: t.decimals || 9,
                    }));
                    setFeaturedTokens(mapped);
                }
            } catch (err) {
                console.error('[SwapTokenGrid] Failed to load featured tokens:', err);
            } finally {
                setLoadingFeatured(false);
            }
        };
        loadFeatured();
    }, []);

    // Search function - always use API
    const performSearch = useCallback(async (query: string) => {
        if (!query.trim()) {
            setSearchResults([]);
            return;
        }

        // Quick local filter from featured (instant)
        const q = query.toLowerCase().trim();
        const localMatches = featuredTokens.filter(t =>
            t.symbol?.toLowerCase().includes(q) ||
            t.name?.toLowerCase().includes(q) ||
            t.address?.toLowerCase() === q
        );

        // Show local matches immediately
        if (localMatches.length > 0) {
            setSearchResults(localMatches);
        }

        // Always call API for full universe search
        if (query.length >= 2) {
            setSearchLoading(true);
            try {
                console.log('[SwapTokenGrid] Searching API for:', query);
                const res = await fetch(`${API_BASE}/api/tokens/search?q=${encodeURIComponent(query)}`);
                const data = await res.json();
                console.log('[SwapTokenGrid] Search results:', data.count);

                if (data.tokens && Array.isArray(data.tokens)) {
                    const mapped: Token[] = data.tokens.map((t: any) => ({
                        symbol: t.symbol || '',
                        name: t.name || '',
                        address: t.address || t.mint || '',
                        mint: t.mint || t.address || '',
                        logoURI: t.logoURI || '',
                        decimals: t.decimals || 9,
                    }));

                    // Merge: local matches first, then API results (deduped)
                    const localAddresses = new Set(localMatches.map(t => t.address));
                    const apiOnly = mapped.filter(t => !localAddresses.has(t.address));
                    setSearchResults([...localMatches, ...apiOnly].slice(0, 50));
                }
            } catch (err) {
                console.error('[SwapTokenGrid] API search failed:', err);
                // Keep local results on API failure
            } finally {
                setSearchLoading(false);
            }
        }
    }, [featuredTokens]);

    // Handle search input with debounce
    const handleSearchChange = useCallback((value: string) => {
        setSearchQuery(value);
        setCurrentPage(1);

        if (!value.trim()) {
            setSearchResults([]);
            setShowSuggestions(false);
            return;
        }

        setShowSuggestions(true);

        // Clear previous timeout
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        // Debounce API search
        searchTimeoutRef.current = setTimeout(() => {
            performSearch(value);
        }, 200);
    }, [performSearch]);

    // Close suggestions on click outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (
                suggestionsRef.current &&
                !suggestionsRef.current.contains(e.target as Node) &&
                searchInputRef.current &&
                !searchInputRef.current.contains(e.target as Node)
            ) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Handle token selection
    const handleSelect = useCallback((token: Token) => {
        onSelect(token);
        setSearchQuery('');
        setSearchResults([]);
        setShowSuggestions(false);
    }, [onSelect]);

    // Clear search
    const clearSearch = useCallback(() => {
        setSearchQuery('');
        setSearchResults([]);
        setShowSuggestions(false);
    }, []);

    // Determine what to display
    const isSearching = searchQuery.trim().length > 0;
    const displayTokens = isSearching ? searchResults : featuredTokens;
    const totalTokens = displayTokens.length;
    const totalPages = Math.ceil(totalTokens / TOKENS_PER_PAGE) || 1;

    const startIndex = (currentPage - 1) * TOKENS_PER_PAGE;
    const endIndex = startIndex + TOKENS_PER_PAGE;
    const currentTokens = displayTokens.slice(startIndex, endIndex);

    const suggestions = searchResults.slice(0, 5);

    return (
        <div className="space-y-4">
            {/* Search */}
            <div className="relative">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input
                        ref={searchInputRef}
                        type="text"
                        placeholder="Search 287K+ tokens by name, symbol, or address..."
                        value={searchQuery}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        onFocus={() => searchQuery && setShowSuggestions(true)}
                        className="w-full pl-10 pr-10 py-3 bg-zinc-900/50 border border-white/10 rounded-xl text-white placeholder-zinc-500 outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all"
                    />
                    {searchQuery && (
                        <button
                            onClick={clearSearch}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded-full"
                        >
                            <X className="w-4 h-4 text-zinc-400" />
                        </button>
                    )}
                    {searchLoading && (
                        <Loader2 className="absolute right-10 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500 animate-spin" />
                    )}
                </div>

                {/* Suggestions Dropdown */}
                {showSuggestions && suggestions.length > 0 && (
                    <div
                        ref={suggestionsRef}
                        className="absolute z-50 mt-2 w-full bg-zinc-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden"
                    >
                        <div className="p-2 border-b border-white/5">
                            <span className="text-xs text-zinc-500 px-2">Quick matches</span>
                        </div>
                        <div className="max-h-[300px] overflow-y-auto">
                            {suggestions.map((token) => (
                                <button
                                    key={token.address || token.mint}
                                    onClick={() => handleSelect(token)}
                                    className="flex items-center gap-3 w-full px-4 py-3 hover:bg-white/5 transition-colors text-left"
                                >
                                    {token.logoURI ? (
                                        <img
                                            src={token.logoURI}
                                            alt={token.symbol}
                                            className="w-8 h-8 rounded-full bg-zinc-800"
                                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                        />
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-white text-sm font-bold">
                                            {token.symbol?.[0]}
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <div className="text-white font-medium">
                                            <HighlightMatch text={token.symbol} query={searchQuery} />
                                        </div>
                                        <div className="text-zinc-500 text-sm truncate">
                                            <HighlightMatch text={token.name || ''} query={searchQuery} />
                                        </div>
                                    </div>
                                    <div className="text-zinc-600 text-xs font-mono">
                                        {token.address?.slice(0, 4)}...{token.address?.slice(-4)}
                                    </div>
                                </button>
                            ))}
                        </div>
                        {searchResults.length > 5 && (
                            <div className="p-2 border-t border-white/5 text-center">
                                <span className="text-xs text-zinc-500">
                                    +{searchResults.length - 5} more results below
                                </span>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Results Header */}
            <div className="flex items-center justify-between">
                <div className="text-sm text-zinc-400">
                    {isSearching ? (
                        searchResults.length > 0
                            ? `Found ${searchResults.length} token${searchResults.length !== 1 ? 's' : ''}`
                            : searchLoading ? 'Searching...' : 'No matches found'
                    ) : (
                        `${totalTokens} featured tokens`
                    )}
                </div>

                {totalPages > 1 && (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="p-2 rounded-lg bg-zinc-900/50 hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4 text-white" />
                        </button>
                        <span className="text-sm text-zinc-400 font-mono min-w-[60px] text-center">
                            {currentPage}/{totalPages}
                        </span>
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="p-2 rounded-lg bg-zinc-900/50 hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronRight className="w-4 h-4 text-white" />
                        </button>
                    </div>
                )}
            </div>

            {/* Token Grid */}
            {loadingFeatured && !isSearching ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                </div>
            ) : currentTokens.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
                    <p className="text-lg mb-2">{isSearching ? 'No tokens found' : 'Loading tokens...'}</p>
                    <p className="text-sm">Try a different search or paste a token address</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {currentTokens.map((token, idx) => (
                        <TokenCard
                            key={token.address || token.mint || idx}
                            token={token}
                            onSelect={handleSelect}
                            query={searchQuery}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
