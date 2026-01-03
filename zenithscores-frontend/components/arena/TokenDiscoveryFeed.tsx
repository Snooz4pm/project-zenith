'use client';

import { useState, useEffect } from 'react';
import { RefreshCw, ExternalLink, TrendingUp, Droplets, Clock, Zap, Shield } from 'lucide-react';
import { DiscoveredToken } from '@/lib/arena/discovery';
import { getFallbackLogo, getCategoryColor } from '@/lib/arena/token-metadata';

interface TokenDiscoveryFeedProps {
  onSelectToken: (token: DiscoveredToken) => void;
  selectedToken: DiscoveredToken | null;
}

export default function TokenDiscoveryFeed({ onSelectToken, selectedToken }: TokenDiscoveryFeedProps) {
  const [tokens, setTokens] = useState<DiscoveredToken[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchTokens = async () => {
    setIsLoading(true);
    try {
      console.log('[TokenDiscoveryFeed] Fetching tokens...');
      const response = await fetch('/api/arena/discovery');
      const data = await response.json();

      console.log('[TokenDiscoveryFeed] Response:', data);

      if (data.success) {
        setTokens(data.tokens);
        setLastUpdate(new Date());
        console.log(`[TokenDiscoveryFeed] Loaded ${data.tokens.length} tokens`);
      } else {
        console.error('[TokenDiscoveryFeed] API returned error:', data);
      }
    } catch (error) {
      console.error('[TokenDiscoveryFeed] Failed to fetch discovered tokens:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTokens();

    // Auto-refresh every 2 minutes
    const interval = setInterval(fetchTokens, 120000);
    return () => clearInterval(interval);
  }, []);

  const getChainColor = (chainId: string) => {
    const colors: Record<string, string> = {
      base: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      arbitrum: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20',
      ethereum: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
      optimism: 'bg-red-500/10 text-red-500 border-red-500/20',
      polygon: 'bg-violet-500/10 text-violet-500 border-violet-500/20',
    };

    return colors[chainId.toLowerCase()] || 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20';
  };

  const formatAge = (minutes: number): string => {
    if (minutes < 60) return `${minutes}m`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h`;
    return `${Math.floor(minutes / 1440)}d`;
  };

  if (isLoading && tokens.length === 0) {
    return (
      <div className="bg-[#111116] border border-white/10 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Early Discovery</h3>
          <RefreshCw className="w-4 h-4 text-zinc-500 animate-spin" />
        </div>
        <div className="text-center py-8 text-zinc-500">
          <p>Scanning chains for early opportunities...</p>
        </div>
      </div>
    );
  }

  if (tokens.length === 0) {
    return (
      <div className="bg-[#111116] border border-white/10 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Early Discovery</h3>
          <button
            onClick={fetchTokens}
            className="p-1.5 hover:bg-white/5 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4 text-zinc-500" />
          </button>
        </div>
        <div className="text-center py-8 text-zinc-500">
          <p className="mb-2">No tokens match criteria right now</p>
          <p className="text-xs">Discovery filters are strict by design</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#111116] border border-white/10 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-white/5 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Early Discovery</h3>
          <p className="text-xs text-zinc-500 mt-0.5">
            {tokens.length} token{tokens.length !== 1 ? 's' : ''} detected • {lastUpdate && `Updated ${formatAge(Math.floor((Date.now() - lastUpdate.getTime()) / 60000))} ago`}
          </p>
        </div>
        <button
          onClick={fetchTokens}
          disabled={isLoading}
          className="p-2 hover:bg-white/5 rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 text-zinc-400 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Token List */}
      <div className="divide-y divide-white/5 max-h-[600px] overflow-y-auto">
        {tokens.map((token) => (
          <button
            key={`${token.chainId}-${token.address}`}
            onClick={() => onSelectToken(token)}
            className={`w-full p-4 text-left hover:bg-white/5 transition-colors ${selectedToken?.address === token.address ? 'bg-emerald-500/10 border-l-2 border-emerald-500' : ''
              }`}
          >
            {/* Token Header */}
            <div className="flex items-start gap-3 mb-2">
              {/* Token Logo */}
              <img
                src={token.metadata.logo || getFallbackLogo(token.symbol, token.metadata.color)}
                alt={token.symbol}
                className="w-10 h-10 rounded-full bg-white/5 flex-shrink-0"
                onError={(e) => {
                  e.currentTarget.src = getFallbackLogo(token.symbol, token.metadata.color);
                }}
              />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h4 className="font-bold text-white">{token.symbol}</h4>

                  {/* Chain Badge */}
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${getChainColor(token.chainId)}`}>
                    {token.chainId.toUpperCase()}
                  </span>

                  {/* Category Badge */}
                  {token.metadata.category && (
                    <span
                      className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                      style={{
                        backgroundColor: `${getCategoryColor(token.metadata.category)}15`,
                        color: getCategoryColor(token.metadata.category),
                        border: `1px solid ${getCategoryColor(token.metadata.category)}40`,
                      }}
                    >
                      {token.metadata.category}
                    </span>
                  )}

                  {/* Verified Badge */}
                  {token.metadata.isVerified && (
                    <Shield size={12} className="text-blue-500" />
                  )}

                  {/* Scam Warning */}
                  {token.metadata.isScam && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-500/20 text-red-500 border border-red-500/40">
                      ⚠️ SCAM
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-500 truncate">{token.name}</p>
                {token.metadata.description && (
                  <p className="text-[10px] text-zinc-600 truncate mt-0.5">{token.metadata.description}</p>
                )}
              </div>

              {/* Price */}
              <div className="text-right flex-shrink-0">
                <div className="text-sm font-bold text-white">${token.priceUSD.toFixed(8)}</div>
                <div className="text-xs text-emerald-500">+{token.priceAction.toFixed(1)}%</div>
              </div>
            </div>

            {/* Reason */}
            <div className="bg-[#0a0a0f] rounded px-2 py-1.5 mb-2">
              <p className="text-[11px] text-zinc-400">{token.reason}</p>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-4 gap-2">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-[10px] text-zinc-500 mb-0.5">
                  <Clock size={10} />
                  Age
                </div>
                <div className="text-xs font-medium text-white">{formatAge(token.pairAge)}</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-[10px] text-zinc-500 mb-0.5">
                  <Droplets size={10} />
                  Liq
                </div>
                <div className="text-xs font-medium text-white">
                  ${token.liquidity > 1000 ? `${(token.liquidity / 1000).toFixed(0)}K` : token.liquidity.toFixed(0)}
                </div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-[10px] text-zinc-500 mb-0.5">
                  <Zap size={10} />
                  Vol
                </div>
                <div className="text-xs font-medium text-emerald-500">{token.volumeAccel.toFixed(1)}x</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-[10px] text-zinc-500 mb-0.5">
                  <TrendingUp size={10} />
                  Buys
                </div>
                <div className="text-xs font-medium text-emerald-500">{(token.buyDominance * 100).toFixed(0)}%</div>
              </div>
            </div>

            {/* Signals */}
            {token.signals.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {token.signals.map((signal, idx) => (
                  <span
                    key={idx}
                    className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-500 rounded text-[9px] font-medium"
                  >
                    {signal}
                  </span>
                ))}
              </div>
            )}

            {/* DexScreener Link */}
            <a
              href={token.dexScreenerUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 text-[10px] text-zinc-600 hover:text-zinc-400 mt-2 transition-colors"
            >
              View on DexScreener
              <ExternalLink size={10} />
            </a>
          </button>
        ))}
      </div>

      {/* Disclaimer */}
      <div className="p-3 bg-yellow-500/5 border-t border-yellow-500/20">
        <p className="text-[10px] text-yellow-500/80 text-center">
          ⚠️ Early activity does not guarantee continuation. High risk.
        </p>
      </div>
    </div>
  );
}
