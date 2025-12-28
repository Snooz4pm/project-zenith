'use client';

import { Globe } from 'lucide-react';
import { useLivePrice } from '@/lib/market/live';
import MarketCard, { type Regime } from '@/components/market/MarketCard';

// ALL FOREX PAIRS - Finnhub
const ALL_FOREX = [
    'EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF', 'AUD/USD', 'USD/CAD', 'NZD/USD',
    'EUR/GBP', 'EUR/JPY', 'GBP/JPY', 'AUD/JPY', 'EUR/CHF',
];

// Simple regime derivation (4 states)
function deriveSimpleRegime(changePct: number): Regime {
    if (changePct >= 2) return 'trending';
    if (changePct <= -2) return 'breakdown';
    if (Math.abs(changePct) < 0.5) return 'ranging';
    return 'uncertain';
}

// Simple confidence score
function deriveSimpleConfidence(changePct: number): number {
    const abs = Math.abs(changePct);
    if (abs >= 5) return 95;
    if (abs >= 3) return 85;
    if (abs >= 2) return 75;
    if (abs >= 1) return 65;
    if (abs >= 0.5) return 55;
    return 45;
}

// Generate simple candle data from price
function generateSimpleCandles(price: number, changePct: number): Array<{ close: number }> {
    const points = 60;
    const startPrice = price / (1 + changePct / 100);
    return Array.from({ length: points }, (_, i) => ({
        close: startPrice + (price - startPrice) * (i / (points - 1))
    }));
}

function ForexCard({ symbol }: { symbol: string }) {
    const data = useLivePrice({ symbol, assetType: 'forex', enabled: true });

    if (data.isLoading) {
        return (
            <div className="relative bg-zinc-900/80 backdrop-blur rounded-xl border border-zinc-800/50 p-5 animate-pulse">
                <div className="h-5 bg-zinc-800 rounded w-20 mb-2" />
                <div className="h-16 bg-zinc-800 rounded w-full mb-2" />
                <div className="h-6 bg-zinc-800 rounded w-28" />
            </div>
        );
    }

    if (data.status === 'DISCONNECTED' && data.price === 0) {
        return (
            <div className="relative bg-zinc-900/80 backdrop-blur rounded-xl border border-red-900/30 p-5">
                <div className="text-sm font-bold text-zinc-400">{symbol}</div>
                <div className="text-xs text-red-400 mt-2">No data available</div>
            </div>
        );
    }

    const changePct = data.previousClose > 0
        ? ((data.price - data.previousClose) / data.previousClose) * 100
        : 0;
    const regime = deriveSimpleRegime(changePct);
    const confidence = deriveSimpleConfidence(changePct);
    const candles = generateSimpleCandles(data.price, changePct);

    return (
        <MarketCard
            symbol={symbol}
            name={symbol}
            price={data.price}
            changePct={changePct}
            confidence={confidence}
            regime={regime}
            candles={candles}
            assetType="forex"
        />
    );
}

export default function ForexPage() {
    return (
        <div className="min-h-screen bg-[#0a0a12] text-white pt-20 md:pt-24">
            <main className="container mx-auto px-6 py-8">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold flex items-center gap-3 mb-2">
                        <Globe className="text-amber-400" />
                        Forex
                    </h1>
                    <p className="text-zinc-400 text-sm">
                        {ALL_FOREX.length} currency pairs • Live rates from Finnhub
                    </p>
                </div>

                {/* 2-Column Premium Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {ALL_FOREX.map((symbol) => (
                        <ForexCard key={symbol} symbol={symbol} />
                    ))}
                </div>
            </main>
        </div>
    );
}
