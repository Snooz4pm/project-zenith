'use client';

import { Suspense } from 'react';
import TokenSearch from '@/components/TokenSearch';
import ZenithLeaders from '@/components/ZenithLeaders';

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-gray-800 bg-black/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                Zenith Scores
              </h1>
              <p className="text-sm text-gray-400 mt-1">Live Crypto Token Analytics</p>
            </div>

            <div className="flex items-center gap-4">
              <div className="px-4 py-2 bg-green-500/20 text-green-400 border border-green-500/50 rounded-lg font-bold">
                🟢 LIVE
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <Suspense fallback={<div className="h-16 bg-gray-900 rounded-lg animate-pulse mb-8" />}>
          <TokenSearch />
        </Suspense>
        <Suspense fallback={<div className="h-64 bg-gray-900 rounded-xl animate-pulse" />}>
          <ZenithLeaders />
        </Suspense>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 mt-12">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div>
              <p>Powered by DexScreener API</p>
              <p className="text-xs mt-1">Real-time trending tokens</p>
            </div>
            <div className="text-right">
              <p>© 2025 Zenith Scores</p>
              <p className="text-xs mt-1">Live market intelligence</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
