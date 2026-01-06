'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/Skeleton';
import Link from 'next/link';

interface Token {
    address: string;
    symbol: string;
    name: string;
    logoURI?: string;
}

// Mock for skeleton
const getTokens = async (): Promise<Token[]> => [];

interface TokenGridProps {
    search: string;
}

export function TokenGrid({ search }: TokenGridProps) {
    const [tokens, setTokens] = useState<Token[]>([]);
    const [loading, setLoading] = useState(false); // No loading for empty mock
    const [error, setError] = useState<string | null>(null);

    // No fetch useEffect for now

    return (
        <>
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(6)].map((_, i) => (
                        <Skeleton key={i} className="h-24 w-full" />
                    ))}
                </div>
            ) : (
                <div className="text-center py-20">
                    <p className="text-zinc-500">Token discovery coming soon.</p>
                </div>
            )}
        </>
    );
}
