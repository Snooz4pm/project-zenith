'use client';

import { useState, useMemo } from 'react';
import { Search, X } from 'lucide-react';

interface SearchableItem {
    symbol: string;
    name: string;
    [key: string]: any;
}

interface SearchFilterProps<T extends SearchableItem> {
    items: T[];
    onFilter: (filtered: T[]) => void;
    placeholder?: string;
    className?: string;
}

export default function SearchFilter<T extends SearchableItem>({
    items,
    onFilter,
    placeholder = "Search assets...",
    className = ""
}: SearchFilterProps<T>) {
    const [query, setQuery] = useState('');

    const handleSearch = (value: string) => {
        setQuery(value);

        if (!value.trim()) {
            onFilter(items);
            return;
        }

        const search = value.toLowerCase();
        const filtered = items.filter(item =>
            item.symbol.toLowerCase().includes(search) ||
            item.name.toLowerCase().includes(search)
        );
        onFilter(filtered);
    };

    const handleClear = () => {
        setQuery('');
        onFilter(items);
    };

    return (
        <div className={`relative ${className}`}>
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                <Search size={16} />
            </div>
            <input
                type="text"
                value={query}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder={placeholder}
                className="w-full pl-10 pr-10 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-cyan-500/50 focus:outline-none transition-colors"
            />
            {query && (
                <button
                    onClick={handleClear}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                >
                    <X size={16} />
                </button>
            )}
        </div>
    );
}

/**
 * Hook for filtering assets with search
 */
export function useAssetSearch<T extends SearchableItem>(items: T[]) {
    const [query, setQuery] = useState('');

    const filteredItems = useMemo(() => {
        if (!query.trim()) return items;

        const search = query.toLowerCase();
        return items.filter(item =>
            item.symbol.toLowerCase().includes(search) ||
            item.name.toLowerCase().includes(search)
        );
    }, [items, query]);

    return {
        query,
        setQuery,
        filteredItems,
        isFiltering: query.length > 0,
        resultCount: filteredItems.length
    };
}
