'use client';

import { Suspense, useState } from 'react';
import PredictiveSearch from '@/components/PredictiveSearch';
import StockScreener from '@/components/StockScreener';
import SectorMatrix from '@/components/SectorMatrix';

export default function StockPortal() {
    const [selectedSector, setSelectedSector] = useState<string | null>(null);

    const handleSectorSelect = (sector: string) => {
        // Toggle sector selection
        setSelectedSector(prev => prev === sector ? null : sector);
    };

    return (
        <div className="theme-stock min-h-screen bg-[var(--background-dark)] text-[var(--foreground)]">
            {/* Sub-Header / Portal Theme */}
            <div className="border-b border-[var(--border-color)] bg-[var(--background-card)] shadow-sm sticky top-0 z-30">
                <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            🏢 Stock Market <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-medium">Equities</span>
                        </h1>
                        <p className="text-sm text-gray-500">Screen, analyze, and track stocks using live algorithm-driven scores.</p>
                    </div>
                </div>
            </div>

            <main className="container mx-auto px-6 py-8">
                {/* Search Bar - styled slightly lighter */}
                <div className="mb-8">
                    <Suspense fallback={<div className="w-full max-w-md mx-auto h-12 bg-gray-200 rounded-lg animate-pulse" />}>
                        <PredictiveSearch mode="stock" behavior="filter" className="w-full max-w-md mx-auto" />
                    </Suspense>
                </div>

                {/* Macro View - Sector Matrix */}
                <SectorMatrix onSelectSector={handleSectorSelect} />

                {/* Selected Sector Indicator */}
                {selectedSector && (
                    <div className="mb-4 flex items-center gap-2">
                        <span className="text-sm text-gray-600">Filtering by sector:</span>
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium flex items-center gap-2">
                            {selectedSector}
                            <button
                                onClick={() => setSelectedSector(null)}
                                className="ml-1 hover:text-blue-900"
                            >
                                ×
                            </button>
                        </span>
                    </div>
                )}

                {/* Main Screener */}
                <StockScreener initialSector={selectedSector} />
            </main>

            {/* Short Footer */}
            <div className="py-8 text-center text-gray-400 text-xs">
                Quotes delayed by 15 minutes. Market data provided by Financial Modeling Prep.
            </div>
        </div>
    );
}
