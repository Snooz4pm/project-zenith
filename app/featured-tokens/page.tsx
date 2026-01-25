"use client";
import { useEffect, useState } from 'react';
import { TokenGrid } from '@/components/discover/TokenGrid';

export default function FeaturedTokensPage() {
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchTokens() {
      setLoading(true);
      try {
        const res = await fetch('/api/tokens/featured');
        const data = await res.json();
        setTokens(data.tokens || []);
      } catch (err) {
        setError('Failed to load tokens');
      } finally {
        setLoading(false);
      }
    }
    fetchTokens();
  }, []);

  if (loading) return <div className="text-center py-20 text-zinc-500">Loading tokens...</div>;
  if (error) return <div className="text-center py-20 text-red-500">{error}</div>;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-white mb-6">Featured Tokens</h1>
      <TokenGrid tokens={tokens} />
    </div>
  );
}
