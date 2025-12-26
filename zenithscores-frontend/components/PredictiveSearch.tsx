'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Search, TrendingUp, Building2, Ticket } from 'lucide-react'; // Icons
import { searchAssets, SearchResult } from '@/lib/search-index';

interface PredictiveSearchProps {
    mode: 'all' | 'crypto' | 'stock';
    behavior: 'navigate' | 'filter'; // navigate = go to asset page, filter = update url query
    placeholder?: string;
    className?: string; // For custom width/styling
}

export default function PredictiveSearch({ mode, behavior, placeholder, className }: PredictiveSearchProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const wrapperRef = useRef<HTMLDivElement>(null);

    const [query, setQuery] = useState(behavior === 'filter' ? (searchParams.get('query') || '') : '');
    const [suggestions, setSuggestions] = useState<SearchResult[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [focusedIndex, setFocusedIndex] = useState(-1);

    // Sync pending query with URL if in filter mode
    useEffect(() => {
        if (behavior === 'filter') {
            const current = searchParams.get('query') || '';
            if (current !== query) setQuery(current); // Only sync if changed externally to avoid loop
        }
    }, [searchParams, behavior]);

    // Search Logic with visual debounce
    useEffect(() => {
        const timer = setTimeout(async () => {
            // Only fetch suggestions if we have some input
            if (query.length > 0) {
                const results = await searchAssets(query, mode);
                setSuggestions(results);
                setIsOpen(results.length > 0);
            } else {
                setSuggestions([]);
                setIsOpen(false);
            }

            // If in filter mode, we also update the URL (debounced)
            if (behavior === 'filter' && query !== (searchParams.get('query') || '')) {
                const params = new URLSearchParams(searchParams.toString());
                if (query) {
                    params.set('query', query);
                } else {
                    params.delete('query');
                }
                router.replace(`${pathname}?${params.toString()}`);
            }

        }, 300);

        return () => clearTimeout(timer);
    }, [query, mode, behavior, router, pathname, searchParams]);


    // Click Outside Handlers
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (result: SearchResult) => {
        if (behavior === 'navigate') {
            router.push(result.url);
        } else {
            setQuery(result.symbol);
            setIsOpen(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setFocusedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : prev));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setFocusedIndex(prev => (prev > 0 ? prev - 1 : -1));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (focusedIndex >= 0 && suggestions[focusedIndex]) {
                handleSelect(suggestions[focusedIndex]);
            } else {
                // If simple enter press logic
                if (behavior === 'navigate') {
                    // If we have a top suggestion, use it
                    if (suggestions.length > 0) {
                        handleSelect(suggestions[0]);
                    } else {
                        // Fallback logic for direct navigation
                        const target = mode === 'stock' ? `/stocks/${query}` : `/crypto/${query}`;
                        router.push(target);
                    }
                } else {
                    // Filter mode handles update via useEffect Debounce, but we can force close
                    setIsOpen(false);
                }
            }
        } else if (e.key === 'Escape') {
            setIsOpen(false);
        }
    };

    return (
        <div ref={wrapperRef} className={`relative z-50 ${className || 'w-full max-w-md'}`}>
            <div className="relative group">
                <div className="absolute inset-0 bg-blue-500/20 rounded-lg blur opacity-75 group-hover:opacity-100 transition duration-200 pointer-events-none"></div>
                <div className="relative flex items-center bg-gray-900 border border-gray-700 rounded-lg focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all">
                    <span className="pl-4 text-gray-400">
                        <Search size={18} />
                    </span>
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value);
                            setIsOpen(true);
                        }}
                        onFocus={() => query.length > 0 && setIsOpen(true)}
                        onKeyDown={handleKeyDown}
                        placeholder={placeholder || "Search assets..."}
                        className="w-full bg-transparent border-none text-white placeholder-gray-500 px-4 py-3 focus:outline-none focus:ring-0 sm:text-sm font-sans"
                        autoComplete="off"
                    />
                    {query && (
                        <button
                            onClick={() => {
                                setQuery('');
                                setIsOpen(false);
                            }}
                            className="pr-4 text-gray-500 hover:text-white transition-colors"
                        >
                            ✕
                        </button>
                    )}
                </div>
            </div>

            {/* Dropdown Suggestions */}
            {isOpen && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-gray-900/95 backdrop-blur-xl border border-gray-700 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="max-h-80 overflow-y-auto custom-scrollbar">
                        {/* Header Label if needed */}
                        <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-black/20">
                            Suggestions
                        </div>
                        {suggestions.map((result, index) => (
                            <div
                                key={`${result.type}-${result.symbol}`}
                                onClick={() => handleSelect(result)}
                                className={`
                                    px-4 py-3 flex items-center justify-between cursor-pointer transition-colors border-b border-gray-800 last:border-none
                                    ${index === focusedIndex ? 'bg-blue-500/20' : 'hover:bg-white/5'}
                                `}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${result.type === 'CRYPTO' ? 'bg-orange-500/10 text-orange-500' : 'bg-blue-500/10 text-blue-500'}`}>
                                        {result.type === 'CRYPTO' ? <Ticket size={16} /> : <Building2 size={16} />}
                                    </div>
                                    <div>
                                        <div className="font-bold text-white flex items-center gap-2">
                                            {result.symbol}
                                            <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-gray-800 text-gray-400 border border-gray-700">
                                                {result.type === 'CRYPTO' ? 'Crypto' : 'Stock'}
                                            </span>
                                        </div>
                                        <div className="text-sm text-gray-400">{result.name}</div>
                                    </div>
                                </div>

                                {/* Score Badge */}
                                <div className="text-right">
                                    <div className={`text-lg font-mono font-bold ${result.score >= 70 ? 'text-green-400' :
                                        result.score >= 50 ? 'text-yellow-400' : 'text-red-400'
                                        }`}>
                                        {result.score}
                                    </div>
                                    <div className="text-[10px] text-gray-600 uppercase">Score</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// Helper CSS for scrollbar if not global
/* 
.custom-scrollbar::-webkit-scrollbar { width: 6px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #374151; border-radius: 3px; }
*/
