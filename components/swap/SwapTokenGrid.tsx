"use client";
import { useState, useEffect } from 'react';
import { SimpleTokenGrid } from '@/components/swap/SimpleTokenGrid';

type Token = {
  symbol: string;
  name: string;
  mint: string;
  logoURI?: string;
};

export default function SwapTokenGrid({ onSelectToken }: { onSelectToken: (token: any) => void }) {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTokens() {
      setLoading(true);
      try {
        const res = await fetch('/api/tokens/featured');
        if (!res.ok) throw new Error('API failed');
        const data = await res.json();
        // Normalize whatever the backend sends
        let normalized: Token[] = [];
        if (Array.isArray(data?.tokens)) {
          normalized = data.tokens;
        } else if (Array.isArray(data)) {
          normalized = data;
        } else if (data?.tokens && typeof data.tokens === 'object') {
          normalized = Object.values(data.tokens);
        }
        setTokens(normalized);
      } catch (err) {
        setError('Failed to load tokens');
      } finally {
        setLoading(false);
      }
    }
    fetchTokens();
  }, []);

  if (loading)
    return (
      <div className="text-center py-20 text-zinc-500">
        Loading tokens...
      </div>
    );

  if (error)
    return (
      <div className="text-center py-20 text-red-500">
        {error}
      </div>
    );

  if (!tokens.length)
    return (
      <div className="text-center py-20 text-zinc-500">
        No tokens found
      </div>
    );

  return (
    <SimpleTokenGrid
      tokens={tokens}
      onSelect={onSelectToken}
    />
  );
}
