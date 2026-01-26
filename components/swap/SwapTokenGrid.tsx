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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  // Load featured tokens on mount
  useEffect(() => {
    if (query.length >= 2) return; // Don't load featured if searching
    setLoading(true);
    setError(null);
    fetch('/api/tokens/featured')
      .then(res => res.json())
      .then(data => {
        let normalized: Token[] = [];
        if (Array.isArray(data?.tokens)) {
          normalized = data.tokens;
        } else if (Array.isArray(data)) {
          normalized = data;
        } else if (data?.tokens && typeof data.tokens === 'object') {
          normalized = Object.values(data.tokens);
        }
        setTokens(normalized);
      })
      .catch(() => setError('Failed to load tokens'))
      .finally(() => setLoading(false));
  }, [query.length < 2]);

  // Search when user types
  useEffect(() => {
    if (query.length < 2) return;
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    const searchTokens = async () => {
      try {
        const res = await fetch(`/api/tokens/search?q=${encodeURIComponent(query)}`, { signal: controller.signal });
        const data = await res.json();
        setTokens(Array.isArray(data.tokens) ? data.tokens : []);
      } catch {
        setError('Failed to search tokens');
      } finally {
        setLoading(false);
      }
    };
    const debounce = setTimeout(searchTokens, 250);
    return () => {
      clearTimeout(debounce);
      controller.abort();
    };
  }, [query]);

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <input
          className="w-full px-3 py-2 rounded-lg bg-zinc-900 text-zinc-100 border border-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search by name, symbol, or address..."
        />
        <span className="text-zinc-500 text-sm min-w-[120px] text-right">
          {query.length < 2
            ? `${tokens.length} featured tokens`
            : `${tokens.length} results`}
        </span>
      </div>
      {loading ? (
        <div className="text-center py-20 text-zinc-500">Loading tokens...</div>
      ) : error ? (
        <div className="text-center py-20 text-red-500">{error}</div>
      ) : !tokens.length ? (
        <div className="text-center py-20 text-zinc-500">No tokens found</div>
      ) : (
        <SimpleTokenGrid tokens={tokens} onSelect={onSelectToken} />
      )}
    </div>
  );
}
