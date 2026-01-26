"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { SimpleTokenGrid } from '@/components/swap/SimpleTokenGrid';
import type { Token } from '@/types/token';
import { localTokens } from './localTokens';
import { smartTokenSearch } from './smartTokenSearch';

type Props = {
  onSelect: (token: Token) => void;
};

export default function SwapTokenGrid({ onSelect }: Props) {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [searched, setSearched] = useState(false);

  // Only load tokens on search
  useEffect(() => {
    if (!query) {
      setTokens([]);
      setSearched(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    setSearched(true);
    const controller = new AbortController();
    const searchTokens = async () => {
      try {
        const res = await fetch(`/api/tokens/search?q=${encodeURIComponent(query)}`, { signal: controller.signal });
        const data = await res.json();
        if (Array.isArray(data.tokens) && data.tokens.length > 0) {
          setTokens(data.tokens);
        } else {
          // fallback to localTokens smart search
          setTokens(smartTokenSearch(query, localTokens));
        }
      } catch {
        setTokens(smartTokenSearch(query, localTokens));
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

  // No-op: search is handled above

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
          {searched ? `${tokens.length} results` : 'Type to search'}
        </span>
      </div>
      {loading ? (
        <div className="text-center py-20 text-zinc-500">Loading tokens...</div>
      ) : error && !tokens.length ? (
        <div className="text-center py-20 text-red-500">{error}</div>
      ) : !tokens.length && searched ? (
        <div className="text-center py-20 text-zinc-500">No tokens found</div>
      ) : (
        <SimpleTokenGrid tokens={tokens} onSelect={onSelect} />
      )}
    </div>
  );
}
