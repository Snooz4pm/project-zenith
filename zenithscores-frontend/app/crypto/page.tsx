'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// Lazy load heavy components for smooth navigation
const CryptoTicker = dynamic(() => import('@/components/CryptoTicker'), {
    loading: () => <div className="h-10 bg-gray-900 animate-pulse" />,
    ssr: false
});

const PredictiveSearch = dynamic(() => import('@/components/PredictiveSearch'), {
    loading: () => <div className="h-16 bg-gray-900 rounded-lg animate-pulse" />,
    ssr: false
});

const CryptoDashboard = dynamic(() => import('@/components/CryptoDashboard'), {
    loading: () => (
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="h-32 bg-gray-900/50 rounded-xl animate-pulse" />
                <div className="h-32 bg-gray-900/50 rounded-xl animate-pulse" />
                <div className="h-32 bg-gray-900/50 rounded-xl animate-pulse" />
            </div>
            <div className="h-96 bg-gray-900/50 rounded-xl animate-pulse" />
        </div>
    ),
    ssr: false
});

export default function CryptoPortal() {
    return (
        <div className="min-h-screen bg-black text-white">
            {/* Top Bar Ticker */}
            <Suspense fallback={<div className="h-10 bg-gray-900 animate-pulse" />}>
                <CryptoTicker />
            </Suspense>

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
                    <Suspense fallback={<div className="h-16 bg-gray-900 rounded-lg animate-pulse mb-8" />}>
                        <PredictiveSearch mode="crypto" behavior="filter" className="w-full max-w-xl mx-auto" />
                    </Suspense>
                </div>
                <Suspense fallback={<div className="h-96 bg-gray-900/50 rounded-xl animate-pulse" />}>
                    <CryptoDashboard />
                </Suspense>
            </main>

            {/* Short Footer */}
            <div className="py-8 text-center text-gray-600 text-xs border-t border-gray-900 mt-12 bg-black">
                Note: Crypto markets are highly volatile. Zenith Scores are for informational purposes only.
            </div>
        </div>
    );
}
