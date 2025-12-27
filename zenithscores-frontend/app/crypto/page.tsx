'use client';

import { Coins } from 'lucide-react';
import { useCryptoLive } from '@/lib/market/crypto';
import CryptoPriceIndicator from '@/components/market/CryptoPriceIndicator';

// ALL MAJOR CRYPTO - Dexscreener
const ALL_CRYPTO = [
    'BTC', 'ETH', 'SOL', 'XRP', 'BNB', 'ADA', 'DOGE', 'AVAX', 'DOT', 'LINK',
    'MATIC', 'SHIB', 'TRX', 'UNI', 'LTC', 'ATOM', 'XLM', 'BCH', 'NEAR', 'APT',
    'ARB', 'OP', 'FIL', 'AAVE', 'MKR', 'PEPE', 'BONK', 'WIF', 'RENDER', 'INJ',
];

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

    if (data.status === 'DISCONNECTED' && !data.priceUsd) {
        return (
            <div className="bg-zinc-900/50 border border-red-900/30 rounded-xl p-4">
                <div className="text-sm font-medium text-zinc-400">{symbol}</div>
                <div className="text-xs text-red-400 mt-1">No data</div>
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

export default function CryptoPage() {
    return (
        <div className="min-h-screen bg-[#0a0a12] text-white pt-20 md:pt-24">
            <main className="container mx-auto px-6 py-8">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold flex items-center gap-3 mb-2">
                        <Coins className="text-orange-400" />
                        Crypto
                    </h1>
                    <p className="text-zinc-400 text-sm">
                        {ALL_CRYPTO.length} tokens • On-chain DEX prices from Dexscreener
                    </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                    {ALL_CRYPTO.map((symbol) => (
                        <CryptoCard key={symbol} symbol={symbol} />
                    ))}
                </div>
            </main>
        </div>
    );
}
