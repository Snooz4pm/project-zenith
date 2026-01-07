"use client";

import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { DiscoveredToken } from '@/lib/discovery/types';

interface SwapTokenCardProps {
  token: DiscoveredToken;
  badges?: string[];
  onClick: (token: DiscoveredToken) => void;
}

export function SwapTokenCard({ token, badges, onClick }: SwapTokenCardProps) {
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
      const endpoint = '/api/arena/solana/price';

      const body = {
        inputMint: 'So11111111111111111111111111111111111111112', // SOL
        outputMint: token.address,
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
      className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl hover:border-emerald-500/30 transition-all cursor-pointer group"
    >
      <div className="flex items-center gap-3 mb-3">
        {token.logoURI ? (
          <img
            src={token.logoURI}
            alt={token.symbol}
            className="w-10 h-10 rounded-full bg-zinc-800 object-cover"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center text-sm font-bold text-white/50">
            {token.symbol?.[0] || '?'}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-white truncate group-hover:text-emerald-400 transition-colors">
            {token.symbol || 'UNKNOWN'}
          </div>
          <div className="text-xs text-zinc-500 truncate">{token.name || 'Unknown'}</div>
        </div>
      </div>

      {/* Badges */}
      {badges && badges.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {badges.map(b => (
            <span key={b} className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-wide">
              {b}
            </span>
          ))}
        </div>
      )}

      <div className="flex justify-between text-xs text-zinc-500">
        <span>
          {price !== undefined && price !== null
            ? `$${price < 0.01 ? price.toExponential(2) : price.toFixed(4)}`
            : '—'}
        </span>
        <span className="text-zinc-600">
          {token.liquidityUsd ? `$${(token.liquidityUsd / 1000).toFixed(0)}K liq` : '—'}
        </span>
      </div>
    </div>
  );
}
