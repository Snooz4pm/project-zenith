/**
 * RAW Charts Page - ALL CHARTS MODE
 * 
 * NO ALGORITHM. Just real prices from providers.
 * - Stocks → Finnhub (50 stocks, free tier)
 * - Forex → Finnhub
 * - Crypto → Dexscreener
 */

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart3, Building2, Globe, Coins, type LucideIcon } from 'lucide-react';

// LIVE hooks - provider-specific
import { useLivePrice } from '@/lib/market/live';
import { useCryptoLive } from '@/lib/market/crypto';

// Components
import LivePriceIndicator from '@/components/market/LivePriceIndicator';
import CryptoPriceIndicator from '@/components/market/CryptoPriceIndicator';

type AssetTab = 'stocks' | 'forex' | 'crypto';

const TABS: { id: AssetTab; label: string; icon: LucideIcon }[] = [
    { id: 'stocks', label: 'Stocks', icon: Building2 },
    { id: 'forex', label: 'Forex', icon: Globe },
    { id: 'crypto', label: 'Crypto', icon: Coins },
];

// ===== FULL SYMBOL LISTS =====
// Finnhub free tier: 50 US stocks, 60 calls/min
const ALL_STOCKS = [
    // Tech - 17
    'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'NVDA', 'AMD', 'INTC', 'CRM', 'ORCL',
    'ADBE', 'CSCO', 'QCOM', 'TXN', 'AVGO', 'IBM', 'NOW',
    // Financial - 10
    'JPM', 'BAC', 'WFC', 'GS', 'MS', 'BLK', 'C', 'AXP', 'V', 'MA',
    // Healthcare - 8
    'JNJ', 'UNH', 'PFE', 'MRK', 'ABBV', 'LLY', 'TMO', 'ABT',
    // Consumer - 10
    'TSLA', 'HD', 'NKE', 'MCD', 'SBUX', 'DIS', 'NFLX', 'COST', 'WMT', 'TGT',
    // Industrial/Energy - 5
    'BA', 'CAT', 'GE', 'XOM', 'CVX',
];

const ALL_FOREX = [
    'EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF', 'AUD/USD', 'USD/CAD', 'NZD/USD',
    'EUR/GBP', 'EUR/JPY', 'GBP/JPY', 'AUD/JPY', 'EUR/CHF',
];

const ALL_CRYPTO = [
    // Top by market cap - major tokens on Dexscreener
    'BTC', 'ETH', 'SOL', 'XRP', 'BNB', 'ADA', 'DOGE', 'AVAX', 'DOT', 'LINK',
    'MATIC', 'SHIB', 'TRX', 'UNI', 'LTC', 'ATOM', 'XLM', 'BCH', 'NEAR', 'APT',
    'ARB', 'OP', 'FIL', 'AAVE', 'MKR', 'PEPE', 'BONK', 'WIF', 'RENDER', 'INJ',
];

// ===== PRICE CARDS =====

function StockCard({ symbol }: { symbol: string }) {
    const data = useLivePrice({ symbol, assetType: 'stock', enabled: true });

    if (data.isLoading) {
        return (
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 animate-pulse">
                <div className="h-5 bg-zinc-800 rounded w-14 mb-2" />
                <div className="h-7 bg-zinc-800 rounded w-20" />
            </div>
        );
    }

    return (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition-colors">
            <LivePriceIndicator
                symbol={symbol}
                price={data.price}
                previousClose={data.previousClose}
                status={data.status}
                delaySeconds={Math.round(data.latencyMs / 1000)}
            />
        </div>
    );
}

function ForexCard({ symbol }: { symbol: string }) {
    const data = useLivePrice({ symbol, assetType: 'forex', enabled: true });

    if (data.isLoading) {
        return (
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 animate-pulse">
                <div className="h-5 bg-zinc-800 rounded w-16 mb-2" />
                <div className="h-7 bg-zinc-800 rounded w-24" />
            </div>
        );
    }

    return (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition-colors">
            <LivePriceIndicator
                symbol={symbol}
                price={data.price}
                previousClose={data.previousClose}
                status={data.status}
                delaySeconds={Math.round(data.latencyMs / 1000)}
            />
        </div>
    );
}

function CryptoCard({ symbol }: { symbol: string }) {
    const data = useCryptoLive({ symbol, enabled: true });

    if (data.isLoading) {
        return (
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 animate-pulse">
                <div className="h-5 bg-zinc-800 rounded w-12 mb-2" />
                <div className="h-7 bg-zinc-800 rounded w-20" />
            </div>
        );
    }

    return (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition-colors">
            <CryptoPriceIndicator
                symbol={data.symbol || symbol}
                priceUsd={data.priceUsd || 0}
                priceChange24h={data.priceChange24h || 0}
                liquidityUsd={data.liquidityUsd || 0}
                liquidityTier={data.liquidityTier || 'LOW'}
                volume24h={data.volume24h || 0}
                txnsH1={data.txnsH1 || 0}
                status={data.status}
            />
        </div>
    );
}

// ===== MAIN PAGE =====

export default function ChartsPage() {
    const [activeTab, setActiveTab] = useState<AssetTab>('stocks');

    const symbols = activeTab === 'stocks'
        ? ALL_STOCKS
        : activeTab === 'forex'
            ? ALL_FOREX
            : ALL_CRYPTO;

    return (
        <div className="min-h-screen bg-[#0a0a12] text-white pt-20 md:pt-24">
            <main className="container mx-auto px-6 py-8">
                {/* Header */}
                <div className="mb-6">
                    <div className="flex items-center gap-3 mb-2">
                        <BarChart3 className="text-blue-400" size={28} />
                        <h1 className="text-3xl font-bold">Market Data</h1>
                    </div>
                    <p className="text-zinc-400 text-sm">
                        Real prices from Finnhub (stocks/forex) and Dexscreener (crypto). No algorithm.
                    </p>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-6">
                    {TABS.map((tab) => {
                        const Icon = tab.icon;
                        const count = tab.id === 'stocks' ? ALL_STOCKS.length
                            : tab.id === 'forex' ? ALL_FOREX.length
                                : ALL_CRYPTO.length;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`
                  flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all
                  ${activeTab === tab.id
                                        ? 'bg-blue-500 text-white'
                                        : 'bg-zinc-800/50 text-zinc-400 hover:bg-zinc-700/50'
                                    }
                `}
                            >
                                <Icon size={16} />
                                {tab.label}
                                <span className="text-xs opacity-60">({count})</span>
                            </button>
                        );
                    })}
                </div>

                {/* Provider Badge */}
                <div className="mb-4 text-xs text-zinc-500">
                    {activeTab === 'stocks' && `Finnhub • ${ALL_STOCKS.length} stocks • Polling: 8s`}
                    {activeTab === 'forex' && `Finnhub • ${ALL_FOREX.length} pairs • Polling: 8s`}
                    {activeTab === 'crypto' && `Dexscreener • ${ALL_CRYPTO.length} tokens • Polling: 12s`}
                </div>

                {/* Grid */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                    >
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                            {symbols.map((symbol) => (
                                activeTab === 'stocks' ? (
                                    <StockCard key={symbol} symbol={symbol} />
                                ) : activeTab === 'forex' ? (
                                    <ForexCard key={symbol} symbol={symbol} />
                                ) : (
                                    <CryptoCard key={symbol} symbol={symbol} />
                                )
                            ))}
                        </div>
                    </motion.div>
                </AnimatePresence>

                {/* Footer */}
                <div className="mt-8 pt-4 border-t border-zinc-800 text-center text-xs text-zinc-600">
                    Prices displayed as received from providers. Stocks/Forex: Finnhub • Crypto: Dexscreener
                </div>
            </main>
        </div>
    );
}
