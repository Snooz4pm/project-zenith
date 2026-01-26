"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Fuse from 'fuse.js';
import type { Token } from '@/types/token';
import { Search, ChevronLeft, ChevronRight, Loader2, X } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_JUPITER_PROXY_URL || 'https://jupiter-proxy-production.up.railway.app';
const TOKENS_PER_PAGE = 30;

type Props = {
    onSelect: (token: Token) => void;
};

// Highlight matching text in search results
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

// Token Card Component with highlight
function TokenCard({
    token,
    onSelect,
    query
}: {
    token: Token;
    onSelect: (t: Token) => void;
    query: string;
}) {
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
                    <HighlightMatch text={token.name} query={query} />
                </div>
            </div>
        </button>
    );
}

// Quick suggestion pill
function SuggestionPill({ token, onSelect }: { token: Token; onSelect: (t: Token) => void }) {
    return (
        <button
            onClick={() => onSelect(token)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-800/80 hover:bg-zinc-700 border border-white/5 hover:border-emerald-500/30 transition-all text-sm"
        >
            {token.logoURI && (
                <img src={token.logoURI} alt={token.symbol} className="w-5 h-5 rounded-full" />
            )}
            <span className="text-white font-medium">{token.symbol}</span>
        </button>
    );
}

export default function SwapTokenGrid({ onSelect }: Props) {
    // Token universe for local search
    const [tokenUniverse, setTokenUniverse] = useState<Token[]>([]);
    const [featuredTokens, setFeaturedTokens] = useState<Token[]>([]);
    const [loadingFeatured, setLoadingFeatured] = useState(true);
    const [loadingUniverse, setLoadingUniverse] = useState(false);

    // Search state
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Token[]>([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);

    // Refs
    const searchInputRef = useRef<HTMLInputElement>(null);
    const suggestionsRef = useRef<HTMLDivElement>(null);

    // Fuse.js instance for fuzzy search
    const fuse = useMemo(() => {
        if (tokenUniverse.length === 0) return null;
        return new Fuse(tokenUniverse, {
            keys: [
                { name: 'symbol', weight: 0.7 },
                { name: 'name', weight: 0.3 },
                { name: 'address', weight: 0.1 }
            ],
            threshold: 0.3,
            includeScore: true,
            minMatchCharLength: 1,
        });
    }, [tokenUniverse]);

    // Load featured tokens on mount
    useEffect(() => {
        const loadFeatured = async () => {
            try {
                const res = await fetch(`${API_BASE}/api/tokens/featured`);
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
                    setFeaturedTokens(mapped);
                    // Also use as initial search universe
                    setTokenUniverse(mapped);
                }
            } catch (err) {
                console.error('Failed to load featured tokens:', err);
            } finally {
                setLoadingFeatured(false);
            }
        };
        loadFeatured();
    }, []);

    // Load full universe when user starts searching (lazy load)
    const loadFullUniverse = useCallback(async () => {
        if (tokenUniverse.length > 1000 || loadingUniverse) return;

        setLoadingUniverse(true);
        try {
            // Load first 5000 tokens for local search
            const res = await fetch(`${API_BASE}/tokens?limit=5000`);
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
                setTokenUniverse(mapped);
            }
        } catch (err) {
            console.error('Failed to load token universe:', err);
        } finally {
            setLoadingUniverse(false);
        }
    }, [tokenUniverse.length, loadingUniverse]);

    // Smart search function
    const smartSearch = useCallback((query: string): Token[] => {
        if (!query.trim()) return [];

        const q = query.toLowerCase().trim();

        // Check if it's a Solana address (32-44 chars, base58)
        const isAddress = q.length >= 32 && /^[1-9A-HJ-NP-Za-km-z]+$/.test(q);

        if (isAddress) {
            // Exact address match
            const exactMatch = tokenUniverse.find(t =>
                t.address?.toLowerCase() === q || t.mint?.toLowerCase() === q
            );
            return exactMatch ? [exactMatch] : [];
        }

        // Exact symbol match first (highest priority)
        const exactSymbol = tokenUniverse.filter(t =>
            t.symbol?.toLowerCase() === q
        );

        // Starts with query (high priority)
        const startsWithSymbol = tokenUniverse.filter(t =>
            t.symbol?.toLowerCase().startsWith(q) &&
            t.symbol?.toLowerCase() !== q
        );

        const startsWithName = tokenUniverse.filter(t =>
            t.name?.toLowerCase().startsWith(q) &&
            !t.symbol?.toLowerCase().startsWith(q)
        );

        // Fuzzy search for the rest
        let fuzzyResults: Token[] = [];
        if (fuse && q.length >= 2) {
            const fuseResults = fuse.search(q, { limit: 30 });
            fuzzyResults = fuseResults
                .filter(r => r.score !== undefined && r.score < 0.4)
                .map(r => r.item)
                .filter(t =>
                    !exactSymbol.includes(t) &&
                    !startsWithSymbol.includes(t) &&
                    !startsWithName.includes(t)
                );
        }

        // Combine and dedupe
        const combined = [
            ...exactSymbol,
            ...startsWithSymbol,
            ...startsWithName,
            ...fuzzyResults
        ];

        // Dedupe by address
        const seen = new Set<string>();
        return combined.filter(t => {
            const key = t.address || t.mint || '';
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        }).slice(0, 50);
    }, [tokenUniverse, fuse]);

    // Handle search input
    const handleSearchChange = useCallback((value: string) => {
        setSearchQuery(value);

        if (!value.trim()) {
            setIsSearching(false);
            setSearchResults([]);
            setShowSuggestions(false);
            return;
        }

        setIsSearching(true);
        setShowSuggestions(true);

        // Instant local search
        const localResults = smartSearch(value);
        setSearchResults(localResults);

        // Load full universe if needed
        if (value.length >= 2 && tokenUniverse.length < 1000) {
            loadFullUniverse();
        }
    }, [smartSearch, loadFullUniverse, tokenUniverse.length]);

    // API search for deeper results (when local doesn't find enough)
    useEffect(() => {
        if (!searchQuery.trim() || searchQuery.length < 2) return;

        // If local search found good results, skip API
        if (searchResults.length >= 5) return;

        const timer = setTimeout(async () => {
            setSearchLoading(true);
            try {
                const res = await fetch(`${API_BASE}/api/tokens/search?q=${encodeURIComponent(searchQuery)}`);
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

                    // Merge with local results (local first)
                    const localAddresses = new Set(searchResults.map(t => t.address || t.mint));
                    const newFromAPI = mapped.filter(t => !localAddresses.has(t.address || t.mint));

                    setSearchResults(prev => [...prev, ...newFromAPI].slice(0, 50));
                }
            } catch (err) {
                console.error('API search failed:', err);
            } finally {
                setSearchLoading(false);
            }
        }, 400);

        return () => clearTimeout(timer);
    }, [searchQuery, searchResults.length]);

    // Reset page when search changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery]);

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
        setIsSearching(false);
        setShowSuggestions(false);
    }, [onSelect]);

    // Get display tokens
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

    // Quick suggestions (top 5 matches)
    const suggestions = searchResults.slice(0, 5);

    return (
        <div className="space-y-4">
            {/* Search Section */}
            <div className="relative">
                <div className="flex items-center gap-4">
                    {/* Search Input */}
                    <div className="relative flex-1">
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
                                onClick={() => {
                                    setSearchQuery('');
                                    setIsSearching(false);
                                    setSearchResults([]);
                                }}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded-full"
                            >
                                <X className="w-4 h-4 text-zinc-400" />
                            </button>
                        )}
                        {(searchLoading || loadingUniverse) && (
                            <Loader2 className="absolute right-10 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500 animate-spin" />
                        )}
                    </div>
                </div>

                {/* Quick Suggestions Dropdown */}
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
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).style.display = 'none';
                                            }}
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
                                            <HighlightMatch text={token.name} query={searchQuery} />
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
                            : 'No matches found'
                    ) : (
                        `Showing ${startIndex + 1}-${Math.min(endIndex, totalTokens)} of ${totalTokens} featured tokens`
                    )}
                </div>

                {/* Pagination */}
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
                            {currentPage} / {totalPages}
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

            {/* Token Grid */}
            {loadingFeatured && !isSearching ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                </div>
            ) : currentTokens.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
                    <p className="text-lg mb-2">No tokens found</p>
                    <p className="text-sm">Try a different search term or paste a token address</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {currentTokens.map((token) => (
                        <TokenCard
                            key={token.address || token.mint}
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
