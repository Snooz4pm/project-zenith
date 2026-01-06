'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search } from 'lucide-react';

export type SelectableToken = {
    address: string;
    symbol: string;
    name?: string;
    decimals: number;
    logoURI?: string;
    uiBalance?: number; // Optional for wallet tokens
    balance?: number; // Raw balance in smallest units (for WalletToken compatibility)
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
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);

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

    const filteredTokens = tokens.filter(
        (t) =>
            t.symbol.toLowerCase().includes(search.toLowerCase()) ||
            t.name?.toLowerCase().includes(search.toLowerCase()) ||
            t.address.toLowerCase().includes(search.toLowerCase())
    );

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
                        {filteredTokens.length === 0 ? (
                            <div className="p-8 text-center text-zinc-500 text-sm">
                                No tokens found
                            </div>
                        ) : (
                            filteredTokens.map((token) => (
                                <button
                                    key={token.address}
                                    onClick={() => handleSelect(token)}
                                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0"
                                >
                                    <div className="flex items-center gap-3">
                                        <img
                                            src={token.logoURI || 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png'}
                                            className="w-8 h-8 rounded-full bg-zinc-800"
                                            alt={token.symbol}
                                            onError={(e) => {
                                                (e.currentTarget as HTMLImageElement).src = 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png';
                                            }}
                                        />
                                        <div className="text-left">
                                            <div className="text-white font-medium text-sm">{token.symbol}</div>
                                            <div className="text-xs text-zinc-500 truncate max-w-[200px]">{token.name}</div>
                                        </div>
                                    </div>
                                    {showBalance && token.uiBalance !== undefined && (
                                        <div className="text-right">
                                            <div className="text-white font-mono text-sm">
                                                {token.uiBalance.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                                            </div>
                                        </div>
                                    )}
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
