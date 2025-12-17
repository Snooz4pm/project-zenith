'use client';

import { Suspense } from 'react';
import PredictiveSearch from '@/components/PredictiveSearch';
import ForexScreener from '@/components/ForexScreener';

export default function ForexPortal() {
    return (
        <div className="theme-forex min-h-screen bg-[#0a0a12] text-white">
            {/* Sub-Header */}
            <div className="border-b border-white/10 bg-[#12121a] shadow-lg sticky top-16 z-20">
                <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                            🌍 Forex & Metals <span className="text-xs px-2 py-0.5 bg-cyan-500/20 text-cyan-400 rounded-full font-medium">Live</span>
                        </h1>
                        <p className="text-sm text-gray-400">Trade currency pairs and precious metals with AI-powered insights.</p>
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

                {/* Forex Screener */}
                <ForexScreener />
            </main>

            {/* Footer */}
            <div className="py-8 text-center text-gray-500 text-xs border-t border-white/5 mt-12">
                Forex rates updated every 15 minutes. Data provided by Alpha Vantage.
            </div>
        </div>
    );
}
