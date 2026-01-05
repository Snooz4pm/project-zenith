'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { getTokens } from '@/lib/api/backend';
import { Skeleton } from '@/components/ui/Skeleton';
import Link from 'next/link';

interface Token {
    address: string;
    symbol: string;
    name: string;
    logoURI?: string;
}

interface TokenGridProps {
    search: string;
}

export function TokenGrid({ search }: TokenGridProps) {
    const [tokens, setTokens] = useState<Token[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchTokens = async () => {
            try {
                const data = await getTokens();
                // Validation check for array
                if (Array.isArray(data)) {
                    setTokens(data);
                } else {
                    throw new Error('Invalid token list format');
                }
            } catch (err) {
                console.error('Failed to load tokens:', err);
                setError('Failed to load token list');
            } finally {
                setLoading(false);
            }
        };

        fetchTokens();
    }, []);

    const filteredTokens = tokens
        .filter(t =>
            t.symbol.toLowerCase().includes(search.toLowerCase()) ||
            t.name.toLowerCase().includes(search.toLowerCase()) ||
            t.address === search
        )
        .slice(0, 50); // Limit to 50 for performance

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                    <Skeleton key={i} className="h-24 w-full" />
                ))}
            </div>
        );
    }

    if (error) {
        return <div className="text-red-400">{error}</div>;
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTokens.map((token) => (
                <Link key={token.address} href={`/token/${token.address}`} className="block">
                    <Card className="hover:bg-white/5 transition-colors flex items-center gap-4 h-full">
                        {token.logoURI ? (
                            <img src={token.logoURI} alt={token.symbol} className="w-10 h-10 rounded-full" />
                        ) : (
                            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-xs">
                                {token.symbol.slice(0, 2)}
                            </div>
                        )}
                        <div>
                            <h3 className="font-bold text-white">{token.symbol}</h3>
                            <p className="text-xs text-zinc-500">{token.name}</p>
                        </div>
                    </Card>
                </Link>
            ))}
        </div>
    );
}
