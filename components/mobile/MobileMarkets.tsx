'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { TrendingUp, TrendingDown, ChevronRight } from 'lucide-react';

type MarketTab = 'crypto' | 'stocks' | 'forex';

interface MarketAsset {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  marketCap?: string;
  href: string;
}

interface MobileMarketsProps {
  cryptoAssets: MarketAsset[];
  stockAssets: MarketAsset[];
  forexAssets: MarketAsset[];
}

export default function MobileMarkets({ cryptoAssets, stockAssets, forexAssets }: MobileMarketsProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<MarketTab>('crypto');

  const tabs: { id: MarketTab; label: string }[] = [
    { id: 'crypto', label: 'Crypto' },
    { id: 'stocks', label: 'Stocks' },
    { id: 'forex', label: 'Forex' },
  ];

  const getAssets = () => {
    switch (activeTab) {
      case 'crypto':
        return cryptoAssets;
      case 'stocks':
        return stockAssets;
      case 'forex':
        return forexAssets;
    }
  };

  const assets = getAssets();

  return (
    <div className="min-h-screen bg-[var(--void)] pb-20">
      {/* Header */}
      <div className="sticky top-16 z-20 bg-[var(--void)] border-b border-white/5">
        <div className="px-4 py-4">
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>
            Markets
          </h1>
        </div>

        {/* Segmented Control */}
        <div className="px-4 pb-4">
          <div className="relative flex items-center gap-1 bg-[rgba(255,255,255,0.02)] rounded-xl p-1 border border-white/5">
            {/* Active background */}
            <motion.div
              layoutId="activeTabBg"
              className="absolute h-[calc(100%-8px)] bg-[var(--accent-mint)] rounded-lg shadow-lg"
              style={{
                left: `${(tabs.findIndex(t => t.id === activeTab) * 100) / tabs.length}%`,
                width: `${100 / tabs.length}%`,
                margin: '4px',
              }}
              transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
            />

            {/* Tabs */}
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative z-10 flex-1 px-4 py-3 rounded-lg text-sm font-bold tracking-wide transition-colors touch-target ${
                  activeTab === tab.id ? 'text-black' : 'text-[var(--text-secondary)]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Asset List */}
      <div className="px-4 py-4 space-y-2">
        {assets.map((asset, index) => (
          <AssetRow key={asset.symbol} asset={asset} index={index} />
        ))}
      </div>
    </div>
  );
}

function AssetRow({ asset, index }: { asset: MarketAsset; index: number }) {
  const isPositive = asset.change24h >= 0;

  const formatCurrency = (value: number) => {
    if (value < 1) {
      return `$${value.toFixed(4)}`;
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
    >
      <Link href={asset.href}>
        <div className="group flex items-center justify-between p-4 bg-[rgba(255,255,255,0.02)] hover:bg-[rgba(255,255,255,0.04)] border border-white/5 rounded-2xl active:scale-[0.98] transition-all touch-target">
          {/* Left: Symbol & Name */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[var(--accent-mint)]/20 to-[var(--accent-cyan)]/20 flex items-center justify-center border border-white/10 flex-shrink-0">
              <span className="text-base font-bold text-white">{asset.symbol.charAt(0)}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-white text-base truncate" style={{ fontFamily: 'var(--font-display)' }}>
                {asset.symbol}
              </div>
              <div className="text-xs text-[var(--text-secondary)] truncate">{asset.name}</div>
            </div>
          </div>

          {/* Right: Price & Change */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="font-bold text-white text-base font-mono">{formatCurrency(asset.price)}</div>
              <div className={`text-sm font-bold font-mono flex items-center justify-end gap-1 ${
                isPositive ? 'text-[var(--accent-mint)]' : 'text-[var(--accent-danger)]'
              }`}>
                {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {isPositive ? '+' : ''}{asset.change24h.toFixed(2)}%
              </div>
            </div>
            <ChevronRight size={18} className="text-[var(--text-muted)] group-hover:text-white transition-colors" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
