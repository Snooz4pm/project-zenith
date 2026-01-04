"use client";

import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { DiscoveredToken } from '@/lib/discovery/types';

interface ArenaTokenCardProps {
  token: DiscoveredToken;
  badges?: string[];
  onClick: (token: DiscoveredToken) => void;
}

export function ArenaTokenCard({ token, badges, onClick }: ArenaTokenCardProps) {
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for lazy price loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
          }
        });
      },
      { rootMargin: '200px' }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Lazy price fetch (only when visible)
  const { data: priceData } = useQuery({
    queryKey: ['price', token.chainType, token.address],
    queryFn: async () => {
      const endpoint = token.chainType === 'SOLANA'
        ? '/api/arena/solana/price'
        : '/api/arena/evm/price';

      const body = token.chainType === 'SOLANA'
        ? {
          inputMint: 'So11111111111111111111111111111111111111112', // SOL
          outputMint: token.address,
        }
        : {
          sellToken: 'ETH',
          buyToken: token.address,
        };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) return { price: null };
      return await res.json();
    },
    enabled: isVisible,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });

  const price = priceData?.price;

  return (
    <div
      ref={cardRef}
      onClick={() => onClick(token)}
      className="p-3 bg-[#111116] border border-white/5 rounded-xl hover:border-white/20 transition-colors cursor-pointer group flex flex-col h-full"
    >
      <div className="flex items-center gap-2 mb-2">
        {token.logoURI ? (
          <img
            src={token.logoURI}
            alt={token.symbol}
            className="w-8 h-8 rounded-full bg-zinc-800 object-cover"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center text-xs font-bold text-white/50">
            {token.symbol?.[0] || '?'}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm truncate text-zinc-200 group-hover:text-white transition-colors">
            {token.symbol || 'UNKNOWN'}
          </div>
          <div className="text-[10px] text-zinc-600 truncate">{token.name || 'Unknown'}</div>
        </div>
      </div>

      {/* Badges (Zenith Visual Emphasis) */}
      {badges && badges.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {badges.map(b => (
            <span key={b} className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase tracking-wide">
              {b}
            </span>
          ))}
        </div>
      )}

      <div className="flex justify-between text-[10px] text-zinc-500 mt-auto">
        <span>
          {price !== undefined && price !== null
            ? `$${price < 0.01 ? price.toExponential(2) : price.toFixed(4)}`
            : '—'}
        </span>
        <span className="text-zinc-600 font-medium">
          {token.liquidityUsd ? `$${(token.liquidityUsd / 1000).toFixed(0)}K` : '0 Liq'}
        </span>
      </div>
    </div>
  );
}
