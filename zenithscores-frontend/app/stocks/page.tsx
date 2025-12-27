'use client';

import { LayoutGrid, Building2 } from 'lucide-react';
import { useLivePrice } from '@/lib/market/live';
import LivePriceIndicator from '@/components/market/LivePriceIndicator';

// ALL 50 US STOCKS - Finnhub free tier
const ALL_STOCKS = [
    'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'NVDA', 'AMD', 'INTC', 'CRM', 'ORCL',
    'ADBE', 'CSCO', 'QCOM', 'TXN', 'AVGO', 'IBM', 'NOW',
    'JPM', 'BAC', 'WFC', 'GS', 'MS', 'BLK', 'C', 'AXP', 'V', 'MA',
    'JNJ', 'UNH', 'PFE', 'MRK', 'ABBV', 'LLY', 'TMO', 'ABT',
    'TSLA', 'HD', 'NKE', 'MCD', 'SBUX', 'DIS', 'NFLX', 'COST', 'WMT', 'TGT',
    'BA', 'CAT', 'GE', 'XOM', 'CVX',
];

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

export default function StocksPage() {
    return (
        <div className="min-h-screen bg-[#0a0a12] text-white pt-20 md:pt-24">
            <main className="container mx-auto px-6 py-8">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold flex items-center gap-3 mb-2">
                        <Building2 className="text-blue-400" />
                        Stocks
                    </h1>
                    <p className="text-zinc-400 text-sm">
                        {ALL_STOCKS.length} US stocks • Live prices from Finnhub
                    </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                    {ALL_STOCKS.map((symbol) => (
                        <StockCard key={symbol} symbol={symbol} />
                    ))}
                </div>
            </main>
        </div>
    );
}
