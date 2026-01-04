"use client";

import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';

interface Token {
  chain: string;
  chainType: string;
  address: string;
  symbol: string;
  name: string;
  logoURI?: string;
  liquidityUsd?: number;
  volume24hUsd?: number;
  source?: string;
}

interface ArenaTokenCardProps {
  token: Token;
  onClick: (token: Token) => void;
}

export function ArenaTokenCard({ token, onClick }: ArenaTokenCardProps) {
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
      className="p-3 bg-[#111116] border border-white/5 rounded-xl hover:border-white/20 transition-colors cursor-pointer"
    >
      <div className="flex items-center gap-2 mb-2">
        {token.logoURI ? (
          <img
            src={token.logoURI}
            alt=""
            className="w-8 h-8 rounded-full"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center text-xs font-bold">
            {token.symbol?.[0] || '?'}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm truncate">{token.symbol || 'UNKNOWN'}</div>
          <div className="text-[10px] text-zinc-600 truncate">{token.name || 'Unknown'}</div>
        </div>
      </div>
      <div className="flex justify-between text-[10px] text-zinc-500">
        <span>
          {price !== undefined && price !== null
            ? `$${price < 0.01 ? price.toExponential(2) : price.toFixed(4)}`
            : '—'}
        </span>
        <span className="text-zinc-600">
          {token.liquidityUsd ? `$${(token.liquidityUsd / 1000).toFixed(0)}K` : ''}
        </span>
      </div>
    </div>
  );
}
