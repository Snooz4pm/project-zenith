
import { useEffect, useState } from 'react';
import { SimpleTokenGrid } from '@/components/swap/SimpleTokenGrid';

type Token = {
  symbol: string;
  name: string;
  mint: string;
  logoURI?: string;
};

export default function SwapTokenGrid() {
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
        console.log('TOKENS PAYLOAD:', data);
        console.log('Normalized tokens:', normalized.length);
        setTokens(normalized);
      } catch (err) {
        console.error(err);
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
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h2 className="text-xl font-bold text-white mb-4">
        Select a Token ({tokens.length})
      </h2>
      <SimpleTokenGrid
        tokens={tokens}
        onSelect={(t) => console.log('Selected:', t)}
      />
    </div>
  );
}
