'use client'

import { useState } from 'react';
import { ZenithToken } from "@/lib/zenith";
import { ChevronLeft, ChevronRight } from 'lucide-react';

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

    if (!Array.isArray(tokens)) return null;

    const totalPages = Math.ceil(tokens.length / TOKENS_PER_PAGE);
    const startIndex = currentPage * TOKENS_PER_PAGE;
    const endIndex = startIndex + TOKENS_PER_PAGE;
    const currentTokens = tokens.slice(startIndex, endIndex);

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
            {/* Header with pagination info */}
            <div className="flex items-center justify-between px-4">
                <div className="text-sm text-zinc-400">
                    Showing {startIndex + 1}-{Math.min(endIndex, tokens.length)} of {tokens.length} tokens
                </div>
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
            </div>

            {/* Token Grid - 3 columns × 8 rows */}
            <div className="grid grid-cols-3 gap-3 p-4">
                {currentTokens.map(t => {
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
                })}
            </div>
        </div>
    )
}
