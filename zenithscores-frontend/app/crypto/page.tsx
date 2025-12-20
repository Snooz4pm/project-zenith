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



            <main className="container mx-auto px-6 py-8">
                <div className="mb-8">
                    <PredictiveSearch mode="crypto" behavior="filter" className="w-full max-w-xl mx-auto" />
                </div>
                <CryptoDashboard />
            </main>


        </div>
    );
}
