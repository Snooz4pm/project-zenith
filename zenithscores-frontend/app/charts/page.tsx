/**
 * RAW Charts Page
 * 
 * PURE MARKET DATA - No algorithm, no scores, no signals.
 * One question: "What is the market price right now?"
 * 
 * RULES:
 * - Stocks/Forex → Finnhub only
 * - Crypto → Dexscreener only
 * - No interpolation, no smoothing
 * - Honest labels only
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

// Sample symbols for display
const STOCK_SYMBOLS = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'TSLA'];
const FOREX_SYMBOLS = ['EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD'];
const CRYPTO_SYMBOLS = ['BTC', 'ETH', 'SOL', 'PEPE'];

/**
 * Stock Price Card - Uses Finnhub ONLY
 */
function StockCard({ symbol }: { symbol: string }) {
    const data = useLivePrice({ symbol, assetType: 'stock', enabled: true });

    if (data.isLoading) {
        return (
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 animate-pulse">
                <div className="h-6 bg-zinc-800 rounded w-16 mb-2" />
                <div className="h-8 bg-zinc-800 rounded w-24" />
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

/**
 * Forex Price Card - Uses Finnhub ONLY
 */
function ForexCard({ symbol }: { symbol: string }) {
    const data = useLivePrice({ symbol, assetType: 'forex', enabled: true });

    if (data.isLoading) {
        return (
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 animate-pulse">
                <div className="h-6 bg-zinc-800 rounded w-20 mb-2" />
                <div className="h-8 bg-zinc-800 rounded w-28" />
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

/**
 * Crypto Price Card - Uses Dexscreener ONLY
 */
function CryptoCard({ symbol }: { symbol: string }) {
    const data = useCryptoLive({ symbol, enabled: true });

    if (data.isLoading) {
        return (
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 animate-pulse">
                <div className="h-6 bg-zinc-800 rounded w-16 mb-2" />
                <div className="h-8 bg-zinc-800 rounded w-24" />
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

export default function RawChartsPage() {
    const [activeTab, setActiveTab] = useState<AssetTab>('stocks');

    return (
        <div className="min-h-screen bg-[#0a0a12] text-white pt-20 md:pt-24">
            <main className="container mx-auto px-6 py-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <BarChart3 className="text-blue-400" size={28} />
                        <h1 className="text-3xl font-bold text-white">Market Data</h1>
                    </div>
                    <p className="text-zinc-400">
                        Raw prices from data providers. No algorithm. No signals.
                    </p>
                </div>

                {/* Mode Badge */}
                <div className="mb-6">
                    <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 border border-blue-500/30 rounded-lg text-sm text-blue-400 font-medium">
                        <span className="w-2 h-2 bg-blue-400 rounded-full" />
                        RAW MODE — Provider-Native Prices
                    </span>
                </div>

                {/* Tab Navigation */}
                <div className="flex gap-2 mb-8">
                    {TABS.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`
                  flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm
                  transition-all duration-200
                  ${activeTab === tab.id
                                        ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                                        : 'bg-zinc-800/50 text-zinc-400 hover:bg-zinc-700/50 hover:text-white'
                                    }
                `}
                            >
                                <Icon size={16} />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* Provider Info */}
                <div className="mb-6 text-xs text-zinc-500">
                    {activeTab === 'stocks' && 'Data: Finnhub • Polling: 8 seconds'}
                    {activeTab === 'forex' && 'Data: Finnhub • Polling: 8 seconds'}
                    {activeTab === 'crypto' && 'Data: Dexscreener (On-Chain DEX) • Polling: 12 seconds'}
                </div>

                {/* Content */}
                <AnimatePresence mode="wait">
                    {activeTab === 'stocks' && (
                        <motion.div
                            key="stocks"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.2 }}
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {STOCK_SYMBOLS.map((symbol) => (
                                    <StockCard key={symbol} symbol={symbol} />
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'forex' && (
                        <motion.div
                            key="forex"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.2 }}
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {FOREX_SYMBOLS.map((symbol) => (
                                    <ForexCard key={symbol} symbol={symbol} />
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'crypto' && (
                        <motion.div
                            key="crypto"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.2 }}
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {CRYPTO_SYMBOLS.map((symbol) => (
                                    <CryptoCard key={symbol} symbol={symbol} />
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Footer Note */}
                <div className="mt-12 py-6 border-t border-zinc-800">
                    <div className="text-center space-y-2">
                        <p className="text-xs text-zinc-500">
                            Prices displayed as received from data providers. No aggregation or modification.
                        </p>
                        <p className="text-xs text-zinc-600">
                            Stocks & Forex: Finnhub • Crypto: Dexscreener On-Chain DEX
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
}
