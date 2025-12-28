'use client';

import Link from 'next/link';
import { Coins } from 'lucide-react';
import { useCryptoLive } from '@/lib/market/crypto/useCryptoLive';
import CryptoPriceIndicator from '@/components/market/CryptoPriceIndicator';
import { SUPPORTED_CRYPTOS } from '@/lib/market/crypto-engine';

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
                <div className="text-xs text-red-400 mt-1">Unavailable</div>
            </div>
        );
    }

    return (
        <Link href={`/crypto/${symbol}`}>
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 hover:border-zinc-600 hover:bg-zinc-800/50 transition-all cursor-pointer">
                <CryptoPriceIndicator
                    symbol={data.symbol || symbol}
                    priceUsd={data.priceUsd || 0}
                    priceChange24h={data.priceChange24h || 0}
                    liquidityUsd={data.liquidityUsd || 0}
                    liquidityTier={data.liquidityTier || 'HIGH'}
                    volume24h={data.volume24h || 0}
                    txnsH1={data.txnsH1 || 0}
                    status={data.status}
                />
            </div>
        </Link>
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
                        {SUPPORTED_CRYPTOS.length} tokens • Live prices from Coinbase
                    </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                    {SUPPORTED_CRYPTOS.map((symbol) => (
                        <CryptoCard key={symbol} symbol={symbol} />
                    ))}
                </div>
            </main>
        </div>
    );
}
