'use client';

import { Globe } from 'lucide-react';
import { useLivePrice } from '@/lib/market/live';
import LivePriceIndicator from '@/components/market/LivePriceIndicator';

// ALL FOREX PAIRS - Finnhub
const ALL_FOREX = [
    'EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF', 'AUD/USD', 'USD/CAD', 'NZD/USD',
    'EUR/GBP', 'EUR/JPY', 'GBP/JPY', 'AUD/JPY', 'EUR/CHF',
];

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

    if (data.status === 'DISCONNECTED' && data.price === 0) {
        return (
            <div className="bg-zinc-900/50 border border-red-900/30 rounded-xl p-4">
                <div className="text-sm font-medium text-zinc-400">{symbol}</div>
                <div className="text-xs text-red-400 mt-1">No data</div>
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

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                    {ALL_FOREX.map((symbol) => (
                        <ForexCard key={symbol} symbol={symbol} />
                    ))}
                </div>
            </main>
        </div>
    );
}
