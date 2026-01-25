'use client';

import { Card } from '@/components/ui/card';
import Link from 'next/link';

interface Token {
    address: string;
    symbol: string;
    name: string;
    logoURI?: string;
}

interface TokenGridProps {
    tokens: Token[];
}

export function TokenGrid({ tokens }: TokenGridProps) {
    if (!tokens || tokens.length === 0) {
        return (
            <div className="text-center py-20">
                <p className="text-zinc-500">No tokens found.</p>
            </div>
        );
    }
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tokens.map((token) => (
                <div key={token.address} className="flex items-center gap-3 p-4 bg-zinc-900 rounded-lg border border-white/5">
                    <img
                        src={token.logoURI || '/token-placeholder.svg'}
                        className="w-8 h-8 rounded-full bg-zinc-800"
                        alt={token.symbol}
                        onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = '/token-placeholder.svg';
                        }}
                    />
                    <div className="text-left">
                        <div className="text-white font-medium text-sm">{token.symbol}</div>
                        <div className="text-xs text-zinc-500 truncate max-w-[200px]">{token.name}</div>
                    </div>
                </div>
            ))}
        </div>
    );
}
