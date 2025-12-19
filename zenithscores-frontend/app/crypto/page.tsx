'use client';

import dynamic from 'next/dynamic';

// Fully client-only imports - NO SSR, NO Suspense blocking
const CryptoTicker = dynamic(() => import('@/components/CryptoTicker'), { ssr: false });
const PredictiveSearch = dynamic(() => import('@/components/PredictiveSearch'), { ssr: false });
const CryptoDashboard = dynamic(() => import('@/components/CryptoDashboard'), { ssr: false });

export default function CryptoPortal() {
    return (
        <div className="min-h-screen bg-black text-white">
            {/* Top Bar Ticker */}
            <CryptoTicker />

            {/* Sub-Header / Portal Theme */}
            <div className="border-b border-gray-800 bg-black/50 backdrop-blur-sm">
                <div className="container mx-auto px-6 py-8">
                    <h1 className="text-3xl font-bold text-white mb-2">
                        Live Crypto Intelligence
                    </h1>
                    <p className="text-gray-400">Scores, Signals, and Momentum.</p>
                </div>
            </div>

            <main className="container mx-auto px-6 py-8">
                <div className="mb-8">
                    <PredictiveSearch mode="crypto" behavior="filter" className="w-full max-w-xl mx-auto" />
                </div>
                <CryptoDashboard />
            </main>

            {/* Short Footer */}
            <div className="py-8 text-center text-gray-600 text-xs border-t border-gray-900 mt-12 bg-black">
                Note: Crypto markets are highly volatile. Zenith Scores are for informational purposes only.
            </div>
        </div>
    );
}
