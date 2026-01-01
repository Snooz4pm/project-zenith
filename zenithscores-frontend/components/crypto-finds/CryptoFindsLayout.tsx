'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import FindsSidebar from './FindsSidebar';
import MarketTerminal from './MarketTerminal';
import MarketStatsPanel from './MarketStatsPanel';
import { getCryptoFindsFeed, getPairDetails } from '@/lib/actions/crypto-finds';
import type { CryptoFindsPair } from './types';

export default function CryptoFindsLayout() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [pairs, setPairs] = useState<CryptoFindsPair[]>([]);
    const [selectedPair, setSelectedPair] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Default: ETH + ARB + BASE, relaxed thresholds
    const [filters, setFilters] = useState<{
        chains: ('ethereum' | 'arbitrum' | 'base')[];
        minLiquidity: number;
        minVolume24h: number;
    }>({
        chains: ['ethereum', 'arbitrum', 'base'],
        minLiquidity: 10_000,
        minVolume24h: 5_000
    });

    // Load feed
    useEffect(() => {
        async function loadFeed() {
            setLoading(true);
            const result = await getCryptoFindsFeed(filters);
            if (result.success) {
                setPairs(result.pairs);
                // Auto-select first pair if none selected
                const pairParam = searchParams.get('pair');
                if (!selectedPair && result.pairs.length > 0) {
                    const defaultPair = pairParam
                        ? result.pairs.find(p => p.pairAddress === pairParam) || result.pairs[0]
                        : result.pairs[0];
                    loadPairDetails(defaultPair.pairAddress, defaultPair.chainId);
                }
            }
            setLoading(false);
        }
        loadFeed();
    }, [filters]);

    // Load pair from URL
    useEffect(() => {
        const pairParam = searchParams.get('pair');
        if (pairParam && (!selectedPair || selectedPair.pairAddress !== pairParam)) {
            loadPairDetails(pairParam);
        }
    }, [searchParams]);

    async function loadPairDetails(pairAddress: string, chainId?: string) {
        const result = await getPairDetails(pairAddress, chainId);
        if (result.success && result.pair) {
            setSelectedPair(result.pair);
            router.replace(`/markets/crypto-finds?pair=${pairAddress}`, { scroll: false });
        }
    }

    function handlePairSelect(pair: CryptoFindsPair) {
        loadPairDetails(pair.pairAddress, pair.chainId);
    }

    return (
        <div className="h-[calc(100vh-80px)] flex bg-[#0a0a0d] overflow-hidden">
            {/* LEFT SIDEBAR - Discovery Feed (Hidden on mobile) */}
            <div className="hidden lg:flex lg:w-[280px] flex-shrink-0 border-r border-white/[0.06] overflow-hidden flex-col">
                <FindsSidebar
                    pairs={pairs}
                    selectedPairAddress={selectedPair?.pairAddress}
                    onSelect={handlePairSelect}
                    loading={loading}
                    filters={filters}
                    onFiltersChange={setFilters}
                />
            </div>

            {/* MAIN PANEL - Terminal */}
            <div className="flex-1 min-w-0 overflow-hidden">
                <MarketTerminal pair={selectedPair} />
            </div>

            {/* RIGHT PANEL - Stats */}
            <div className="hidden xl:block w-[280px] flex-shrink-0 border-l border-white/[0.06] overflow-y-auto">
                <MarketStatsPanel pair={selectedPair} />
            </div>
        </div>
    );
}
