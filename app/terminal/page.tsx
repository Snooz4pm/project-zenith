'use client';

import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';

interface MarketData {
  pair: string;
  price: number;
  change24h: number;
  volume24h: number;
  liquidity: number;
  fdv: number;
}

export default function TerminalPage() {
  const { publicKey, connected } = useWallet();
  const { setVisible } = useWalletModal();
  const [markets, setMarkets] = useState<MarketData[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMarket, setSelectedMarket] = useState<string>('SOL/USDC');

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
    } finally {
      setLoading(false);
    }
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
            &gt; Perpetual opportunities • Advanced analytics
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

            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute w-full h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-scan" />
            </div>

            <div className="relative z-10 text-center space-y-4">
              <div className="flex items-center justify-center gap-3 mb-6">
                <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse" />
                <div className="text-emerald-400 font-mono text-lg font-bold tracking-wider">
                  SCANNING MARKETS
                </div>
                <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse" />
              </div>

              <div className="space-y-2 text-left max-w-md mx-auto font-mono text-xs text-zinc-400">
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400">&gt;</span> Analyzing market depth...
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400">&gt;</span> Calculating opportunities...
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400">&gt;</span> Detecting high-volume pairs...
                </div>
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
                  className="bg-zinc-900/50 p-5 rounded border border-zinc-800 hover:border-emerald-500/30 transition-all backdrop-blur-sm cursor-pointer"
                  onClick={() => setSelectedMarket(market.pair)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                      <h3 className="font-mono font-bold text-white">{market.pair}</h3>
                    </div>
                    <span className={`font-mono text-sm ${market.change24h >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {market.change24h >= 0 ? '+' : ''}{market.change24h.toFixed(2)}%
                    </span>
                  </div>

                  <div className="space-y-2 font-mono text-xs">
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Price</span>
                      <span className="text-white">${market.price.toFixed(2)}</span>
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

                  <div className="mt-4 pt-3 border-t border-zinc-800">
                    <button className="w-full py-2 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 rounded font-mono text-sm border border-emerald-500/30 hover:border-emerald-500/50 transition-all">
                      [ TRADE ]
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Coming Soon Features */}
            <div className="bg-zinc-900/30 rounded border border-zinc-700/50 backdrop-blur-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse" />
                <h3 className="font-mono font-bold text-white">[ COMING SOON ]</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-sm text-zinc-400">
                <div>
                  <div className="text-emerald-400 mb-1">&gt; Perpetual Futures</div>
                  <div className="text-xs">Leverage up to 50x on SOL pairs</div>
                </div>
                <div>
                  <div className="text-cyan-400 mb-1">&gt; Limit Orders</div>
                  <div className="text-xs">Advanced order types & execution</div>
                </div>
                <div>
                  <div className="text-orange-400 mb-1">&gt; Market Analytics</div>
                  <div className="text-xs">Real-time charts & indicators</div>
                </div>
              </div>
            </div>
          </>
        )}

        <div className="text-center text-xs text-zinc-500 mt-8 font-mono">
          &gt; Market data powered by <strong className="text-emerald-400">Solana RPC</strong><br />
          &gt; Trading powered by <strong className="text-emerald-400">Jupiter Aggregator</strong>
        </div>
      </div>
    </div>
  );
}
