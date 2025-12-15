'use client';

import { Suspense } from 'react';
import TokenSearch from '@/components/TokenSearch';
import ZenithLeaders from '@/components/ZenithLeaders';

export default function CryptoPortal() {
    return (
        <div className="min-h-screen bg-black text-white">
            {/* Sub-Header / Portal Theme */}
            <div className="border-b border-gray-800 bg-black/50 backdrop-blur-sm">
                <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-white">
                            🪙 Crypto Intelligence
                        </h1>
                        <p className="text-sm text-gray-400">Momentum-driven opportunities</p>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1 bg-green-900/30 text-green-400 border border-green-500/30 rounded-full text-xs font-bold">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        LIVE FEED
                    </div>
                </div>
            </div>

            <main className="container mx-auto px-6 py-8">
                <Suspense fallback={<div className="h-16 bg-gray-900 rounded-lg animate-pulse mb-8" />}>
                    <TokenSearch />
                </Suspense>
                <Suspense fallback={<div className="h-64 bg-gray-900 rounded-xl animate-pulse" />}>
                    <ZenithLeaders />
                </Suspense>
            </main>

            {/* Short Footer */}
            <div className="py-8 text-center text-gray-600 text-xs">
                Note: Crypto markets are highly volatile. Zenith Scores are for informational purposes only.
            </div>
        </div>
    );
}
