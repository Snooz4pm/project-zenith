'use client';

import { Suspense } from 'react';
import PredictiveSearch from '@/components/PredictiveSearch';
import StockMarket from '@/components/StockMarket';

export default function StockPortal() {
    return (
        <div className="min-h-screen bg-black text-white">
            {/* Sub-Header / Portal Theme */}
            <div className="border-b border-gray-800 bg-black/50 backdrop-blur-sm">
                <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                            🏢 Stock Market
                        </h1>
                        <p className="text-sm text-gray-400">Institutional-grade market signals</p>
                    </div>
                </div>
            </div>

            <main className="container mx-auto px-6 py-8">
                <div className="mb-8">
                    <Suspense fallback={<div className="w-full max-w-md mx-auto h-12 bg-white/5 rounded-lg animate-pulse" />}>
                        <PredictiveSearch mode="stock" behavior="filter" className="w-full max-w-md mx-auto" />
                    </Suspense>
                </div>
                <StockMarket />
            </main>

            {/* Short Footer */}
            <div className="py-8 text-center text-gray-600 text-xs">
                Quotes delayed by 15 minutes. Market data provided by Financial Modeling Prep.
            </div>
        </div>
    );
}
