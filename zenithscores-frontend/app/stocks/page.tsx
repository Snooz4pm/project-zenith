'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';

// 🔧 NUCLEAR FIX: Client-only dynamic imports for smooth navigation
const PredictiveSearch = dynamic(() => import('@/components/PredictiveSearch'), { ssr: false });
const StockScreener = dynamic(() => import('@/components/StockScreener'), { ssr: false });
const SectorMatrix = dynamic(() => import('@/components/SectorMatrix'), { ssr: false });

export default function StockPortal() {
    const [selectedSector, setSelectedSector] = useState<string | null>(null);

    const handleSectorSelect = (sector: string) => {
        setSelectedSector(prev => prev === sector ? null : sector);
    };

    return (
        <div className="theme-stock min-h-screen bg-[var(--background-dark)] text-[var(--foreground)] pt-20 md:pt-24">
            <main className="container mx-auto px-6 py-8">
                {/* Search Bar */}
                <div className="mb-8">
                    <PredictiveSearch mode="stock" behavior="filter" className="w-full max-w-md mx-auto" />
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
