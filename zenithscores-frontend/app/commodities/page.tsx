'use client';

import { Suspense } from 'react';
import PredictiveSearch from '@/components/PredictiveSearch';
import CommoditiesScreener from '@/components/CommoditiesScreener';

export default function CommoditiesPortal() {
    return (
        <div className="theme-commodities min-h-screen bg-gradient-to-br from-[#0a0a12] via-[#12121a] to-[#1a1a25] text-white">
            {/* Sub-Header */}
            <div className="border-b border-white/10 bg-[#12121a]/80 backdrop-blur-xl shadow-lg sticky top-16 z-20">
                <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                            🛢️ Commodities <span className="text-xs px-2 py-0.5 bg-orange-500/20 text-orange-400 rounded-full font-medium">Real-Time</span>
                        </h1>
                        <p className="text-sm text-gray-400">Track oil, metals, and agricultural commodities with Zenith Scores.</p>
                    </div>
                </div>
            </div>

            <main className="container mx-auto px-6 py-8">
                {/* Search Bar */}
                <div className="mb-8">
                    <Suspense fallback={<div className="w-full max-w-md mx-auto h-12 bg-white/5 rounded-lg animate-pulse" />}>
                        <PredictiveSearch mode="all" behavior="navigate" className="w-full max-w-md mx-auto" />
                    </Suspense>
                </div>

                {/* Commodities Screener */}
                <CommoditiesScreener />
            </main>

            {/* Footer */}
            <div className="py-8 text-center text-gray-500 text-xs border-t border-white/5 mt-12">
                Commodity prices updated daily. Data provided by Alpha Vantage.
            </div>
        </div>
    );
}
