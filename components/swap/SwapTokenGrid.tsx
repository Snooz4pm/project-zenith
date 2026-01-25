import { useEffect, useState } from 'react';
import { SimpleTokenGrid } from '@/components/swap/SimpleTokenGrid';

export default function SwapTokenGrid() {
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
      <h2 className="text-xl font-bold text-white mb-4">Select a Token</h2>
      <SimpleTokenGrid tokens={tokens} onSelect={(t) => {}} />
    </div>
  );
}
