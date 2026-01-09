'use client';

import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { X, ExternalLink, TrendingUp, TrendingDown } from 'lucide-react';

interface MarketData {
  pair: string;
  price: number;
  change24h: number;
  volume24h: number;
  liquidity: number;
  fdv: number;
  baseSymbol: string;
}

// Jupiter Perps base URL
const JUPITER_PERPS_URL = 'https://jup.ag/perpetuals';

export default function TerminalPage() {
  const { publicKey, connected } = useWallet();
  const { setVisible } = useWalletModal();
  const [markets, setMarkets] = useState<MarketData[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMarket, setSelectedMarket] = useState<MarketData | null>(null);
  const [tradeDirection, setTradeDirection] = useState<'long' | 'short'>('long');

  useEffect(() => {
    fetchMarkets();
  }, []);

  const fetchMarkets = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/terminal/markets');
      const data = await response.json();
      setMarkets(data.markets || []);
    } catch (error) {
      console.error('[Terminal] Failed to fetch markets:', error);
      // Fallback markets for perps
      setMarkets([
        { pair: 'SOL/USD', price: 185.50, change24h: 3.2, volume24h: 450000000, liquidity: 120000000, fdv: 80000000000, baseSymbol: 'SOL' },
        { pair: 'ETH/USD', price: 3350.00, change24h: 1.8, volume24h: 890000000, liquidity: 350000000, fdv: 400000000000, baseSymbol: 'ETH' },
        { pair: 'BTC/USD', price: 97500.00, change24h: -0.5, volume24h: 2100000000, liquidity: 500000000, fdv: 1900000000000, baseSymbol: 'BTC' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const openPerpTrade = (market: MarketData, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!connected) {
      setVisible(true);
      return;
    }
    setSelectedMarket(market);
  };

  const openExternalPerp = (direction: 'long' | 'short') => {
    if (!selectedMarket) return;
    // Open Jupiter Perps with the selected market
    const url = `${JUPITER_PERPS_URL}/${selectedMarket.baseSymbol}-PERP?direction=${direction}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    setSelectedMarket(null);
  };

  return (
    <div className="min-h-screen bg-[var(--void)] text-[var(--text-primary)] pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            <h1 className="text-3xl font-bold text-white font-mono tracking-tight">TRADING TERMINAL</h1>
          </div>
          <p className="text-zinc-400 text-sm font-mono ml-5">
            &gt; High-frequency market data • <span className="text-emerald-400">Real-time signals</span><br />
            &gt; Perpetual futures via <span className="text-cyan-400">Jupiter Perps</span> • Up to 100x leverage
          </p>
        </div>

        {/* Connection Status */}
        {!connected && (
          <div className="mb-6 p-4 bg-zinc-900/50 rounded border border-zinc-800 text-center backdrop-blur-sm">
            <div className="mb-3 text-zinc-500 font-mono text-sm">
              &gt; WALLET CONNECTION REQUIRED FOR TRADING
            </div>
            <button
              onClick={() => setVisible(true)}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-mono font-medium transition-all hover:shadow-lg hover:shadow-emerald-900/50"
            >
              [ CONNECT WALLET ]
            </button>
          </div>
        )}

        {/* Market Scanner */}
        {loading ? (
          <div className="relative p-8 bg-zinc-900/50 rounded border border-emerald-500/30 backdrop-blur-sm overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 via-transparent to-transparent animate-pulse" />
            <div className="relative z-10 text-center space-y-4">
              <div className="flex items-center justify-center gap-3 mb-6">
                <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse" />
                <div className="text-emerald-400 font-mono text-lg font-bold tracking-wider">
                  SCANNING MARKETS
                </div>
                <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse" />
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Market Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {markets.map((market, i) => (
                <div
                  key={i}
                  className="bg-zinc-900/50 p-5 rounded border border-zinc-800 hover:border-emerald-500/30 transition-all backdrop-blur-sm"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                      <h3 className="font-mono font-bold text-white">{market.pair}</h3>
                      <span className="text-xs bg-cyan-500/20 text-cyan-400 px-1.5 py-0.5 rounded">PERP</span>
                    </div>
                    <span className={`font-mono text-sm ${market.change24h >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {market.change24h >= 0 ? '+' : ''}{market.change24h.toFixed(2)}%
                    </span>
                  </div>

                  <div className="space-y-2 font-mono text-xs">
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Price</span>
                      <span className="text-white">${market.price.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Volume 24h</span>
                      <span className="text-white">${(market.volume24h / 1000000).toFixed(2)}M</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Liquidity</span>
                      <span className="text-white">${(market.liquidity / 1000000).toFixed(2)}M</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-zinc-800 grid grid-cols-2 gap-2">
                    <button
                      onClick={(e) => openPerpTrade(market, e)}
                      className="py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 rounded font-mono text-sm border border-emerald-500/30 hover:border-emerald-500/50 transition-all flex items-center justify-center gap-1"
                    >
                      <TrendingUp className="w-3 h-3" />
                      LONG
                    </button>
                    <button
                      onClick={(e) => { setTradeDirection('short'); openPerpTrade(market, e); }}
                      className="py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded font-mono text-sm border border-red-500/30 hover:border-red-500/50 transition-all flex items-center justify-center gap-1"
                    >
                      <TrendingDown className="w-3 h-3" />
                      SHORT
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Perp Info */}
            <div className="bg-zinc-900/30 rounded border border-cyan-500/30 backdrop-blur-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse" />
                <h3 className="font-mono font-bold text-white">[ PERPETUAL TRADING ]</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-sm text-zinc-400">
                <div>
                  <div className="text-emerald-400 mb-1">&gt; Up to 100x Leverage</div>
                  <div className="text-xs">Trade with amplified positions</div>
                </div>
                <div>
                  <div className="text-cyan-400 mb-1">&gt; Zero Price Impact</div>
                  <div className="text-xs">Oracle-based pricing</div>
                </div>
                <div>
                  <div className="text-orange-400 mb-1">&gt; Low Fees</div>
                  <div className="text-xs">0.06% open/close, dynamic borrow</div>
                </div>
              </div>
            </div>
          </>
        )}

        <div className="text-center text-xs text-zinc-500 mt-8 font-mono">
          &gt; Market data powered by <strong className="text-emerald-400">Solana RPC</strong><br />
          &gt; Perpetual trading via <strong className="text-cyan-400">Jupiter Perps</strong>
        </div>
      </div>

      {/* Trade Modal - Embedded */}
      {selectedMarket && (
        <div className="fixed inset-0 bg-black/95 z-50 flex flex-col">
          {/* Header Bar */}
          <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-bold text-white font-mono">
                {selectedMarket.pair}
              </h2>
              <span className="text-xs bg-cyan-500/20 text-cyan-400 px-2 py-1 rounded">PERP</span>
              <span className={`text-sm font-mono ${selectedMarket.change24h >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                ${selectedMarket.price.toLocaleString()} ({selectedMarket.change24h >= 0 ? '+' : ''}{selectedMarket.change24h.toFixed(2)}%)
              </span>
            </div>
            <button
              onClick={() => setSelectedMarket(null)}
              className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-zinc-400 hover:text-white" />
            </button>
          </div>

          {/* Embedded Trading Interface */}
          <div className="flex-1 relative">
            <iframe
              src={`https://jup.ag/perpetuals/${selectedMarket.baseSymbol}-PERP`}
              className="w-full h-full border-0"
              allow="clipboard-write; clipboard-read"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
              title={`Trade ${selectedMarket.pair}`}
            />

            {/* Loading overlay */}
            <div className="absolute inset-0 bg-zinc-900 flex flex-col items-center justify-center pointer-events-none opacity-0 animate-fade-out">
              <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-zinc-400 font-mono text-sm">Loading Jupiter Perps...</p>
            </div>
          </div>

          {/* Footer with info */}
          <div className="p-3 border-t border-zinc-800 bg-zinc-900 flex items-center justify-between text-xs text-zinc-500">
            <span>Trading powered by Jupiter Perps • Your keys, your assets</span>
            <div className="flex items-center gap-4">
              <a
                href={`https://jup.ag/perpetuals/${selectedMarket.baseSymbol}-PERP`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-zinc-400 hover:text-white transition-colors"
              >
                <ExternalLink className="w-3 h-3" />
                Open in new tab
              </a>
              <button
                onClick={() => setSelectedMarket(null)}
                className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

