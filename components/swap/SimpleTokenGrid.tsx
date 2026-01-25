'use client'

import React, { useState, useMemo, useCallback, useRef, useEffect, memo } from 'react';
import { FixedSizeGrid as Grid } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { ZenithToken } from "@/lib/zenith";
import { Search, X } from 'lucide-react';

// Grid configuration
const COLUMN_COUNT = 3;
const ROW_HEIGHT = 72;
const COLUMN_GAP = 12;
const ROW_GAP = 12;

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(timer);
    }, [value, delay]);

    return debouncedValue;
}

// Memoized Token Cell Component
const TokenCell = memo(function TokenCell({
    token,
    onSelect,
    style,
}: {
    token: ZenithToken;
    onSelect: (t: ZenithToken) => void;
    style: React.CSSProperties;
}) {
    if (!token || !(token.mint || token.address)) {
        return <div style={style} />;
    }
    const safeSymbol = token.symbol || 'UNKNOWN';
    const safeName = token.name || (token.mint || token.address || '').slice(0, 6);
    const safeLogo = token.logoURI || '/token-placeholder.svg';
    return (
        <div style={style}>
            <button
                onClick={() => onSelect(token)}
                className="flex items-center gap-3 p-3 rounded-xl bg-[#0B0E15] hover:bg-white/10 transition-all border border-white/5 text-left hover:border-emerald-500/30 active:scale-[0.98] group w-full h-full"
            >
                <img
                    src={safeLogo}
                    onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = '/token-placeholder.svg';
                    }}
                    className="w-8 h-8 rounded-full bg-zinc-800 object-cover group-hover:ring-2 ring-emerald-500/20 transition-all flex-shrink-0"
                    alt={safeSymbol}
                    loading="lazy"
                />
                <div className="min-w-0 flex-1">
                    <div className="text-sm font-bold text-white truncate">{safeSymbol}</div>
                    <div className="text-xs text-zinc-500 truncate">{safeName}</div>
                </div>
            </button>
        </div>
    );
});

// Grid Cell Renderer
interface CellRendererProps {
    columnIndex: number;
    rowIndex: number;
    style: React.CSSProperties;
    data: {
        tokens: ZenithToken[];
        columnCount: number;
        onSelect: (t: ZenithToken) => void;
    };
}

const CellRenderer = memo(function CellRenderer({ columnIndex, rowIndex, style, data }: CellRendererProps) {
    const { tokens, columnCount, onSelect } = data;
    const index = rowIndex * columnCount + columnIndex;
    const token = tokens[index];

    // Apply padding/gap to the cell
    const cellStyle: React.CSSProperties = {
        ...style,
        left: Number(style.left) + (columnIndex * COLUMN_GAP),
        top: Number(style.top) + (rowIndex * ROW_GAP),
        width: Number(style.width) - COLUMN_GAP,
        height: Number(style.height) - ROW_GAP,
    };

    if (!token) {
        return <div style={cellStyle} />;
    }

    return <TokenCell token={token} onSelect={onSelect} style={cellStyle} />;
});

export function SimpleTokenGrid({
    tokens,
    onSelect,
}: {
    tokens: ZenithToken[]
    onSelect: (t: ZenithToken) => void
}) {
    const [searchQuery, setSearchQuery] = useState('');
    const gridRef = useRef<Grid>(null);

    // Debounce search to avoid filtering on every keystroke
    const debouncedSearch = useDebounce(searchQuery, 200);

    // Memoized filtering - only runs when debounced search or tokens change
    const filteredTokens = useMemo(() => {
        if (!Array.isArray(tokens)) return [];
        if (!debouncedSearch.trim()) return tokens;

        const query = debouncedSearch.toLowerCase().trim();

        // Check if it's a full Solana address (base58, 32-44 chars)
        const isAddress = query.length >= 32 && /^[1-9A-HJ-NP-Za-km-z]+$/.test(query);

        return tokens.filter(t => {
            // Exact address match (prioritized)
            if (isAddress && t.mint.toLowerCase() === query) return true;
            // Partial address match (for pasted addresses)
            if (t.mint.toLowerCase().includes(query)) return true;
            // Symbol match (most common search)
            if (t.symbol.toLowerCase().includes(query)) return true;
            // Name match
            if (t.name?.toLowerCase().includes(query)) return true;
            return false;
        });
    }, [tokens, debouncedSearch]);

    // Reset scroll position when search changes
    useEffect(() => {
        if (gridRef.current) {
            gridRef.current.scrollTo({ scrollTop: 0, scrollLeft: 0 });
        }
    }, [debouncedSearch]);

    // Handle search change
    const handleSearchChange = useCallback((value: string) => {
        setSearchQuery(value);
    }, []);

    // Clear search
    const handleClearSearch = useCallback(() => {
        setSearchQuery('');
    }, []);

    // Stable onSelect callback
    const handleSelect = useCallback((t: ZenithToken) => {
        onSelect(t);
    }, [onSelect]);

    // Calculate row count
    const rowCount = Math.ceil(filteredTokens.length / COLUMN_COUNT);

    // Item data for virtualized grid
    const itemData = useMemo(() => ({
        tokens: filteredTokens,
        columnCount: COLUMN_COUNT,
        onSelect: handleSelect,
    }), [filteredTokens, handleSelect]);

    if (!Array.isArray(tokens)) return null;

    return (
        <div className="flex flex-col h-full">
            {/* Search Bar */}
            <div className="px-4 pb-4">
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
                            onClick={handleClearSearch}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded-full transition-colors"
                        >
                            <X className="w-4 h-4 text-zinc-400" />
                        </button>
                    )}
                </div>
            </div>

            {/* Stats Bar */}
            <div className="flex items-center justify-between px-4 pb-3 text-sm text-zinc-400">
                <span>
                    {debouncedSearch
                        ? `Found ${filteredTokens.length.toLocaleString()} token${filteredTokens.length !== 1 ? 's' : ''}`
                        : `${filteredTokens.length.toLocaleString()} tokens available`
                    }
                </span>
                {debouncedSearch !== searchQuery && (
                    <span className="text-xs text-zinc-600 animate-pulse">Searching...</span>
                )}
            </div>

            {/* Virtualized Grid */}
            <div className="flex-1 min-h-[500px] px-4">
                {filteredTokens.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-zinc-500">
                        <p className="text-lg mb-2">No tokens found</p>
                        <p className="text-sm">Try a different search or paste a token address</p>
                    </div>
                ) : (
                    <AutoSizer>
                        {({ height, width }) => {
                            // Calculate column width based on available space
                            const totalGapWidth = (COLUMN_COUNT - 1) * COLUMN_GAP;
                            const columnWidth = (width - totalGapWidth) / COLUMN_COUNT + COLUMN_GAP;

                            return (
                                <Grid
                                    ref={gridRef}
                                    className="scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent"
                                    columnCount={COLUMN_COUNT}
                                    columnWidth={columnWidth}
                                    height={height}
                                    rowCount={rowCount}
                                    rowHeight={ROW_HEIGHT + ROW_GAP}
                                    width={width}
                                    itemData={itemData}
                                    overscanRowCount={5}
                                >
                                    {CellRenderer}
                                </Grid>
                            );
                        }}
                    </AutoSizer>
                )}
            </div>
        </div>
    );
}
