'use client';

import { useEffect, useState } from 'react';
import MarketRegimeMonitor from '@/components/MarketRegimeMonitor';
import ZenithLeaders from '@/components/ZenithLeaders';

interface RegimeData {
  regime: string;
  date: string;
  vix_used: number;
  sma_200: number;
  updated_at: string;
}

export default function Dashboard() {
  const [regimeData, setRegimeData] = useState<RegimeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRegimeData();
    // Refresh every 5 minutes
    const interval = setInterval(fetchRegimeData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchRegimeData = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/api/v1/market_regime`);

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();

      if (data.status === 'success') {
        setRegimeData(data.data);
        setError(null);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
      console.error('Error fetching regime data:', err);
    } finally {
      setLoading(false);
    }
  };

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
              <p className="text-sm text-gray-400 mt-1">Market Intelligence Dashboard</p>
            </div>

            {regimeData && (
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-xs text-gray-400">Last Updated</div>
                  <div className="text-sm font-mono">
                    {new Date(regimeData.updated_at).toLocaleString()}
                  </div>
                </div>

                <div className={`px-4 py-2 rounded-lg font-bold ${regimeData.regime === 'BULLISH'
                    ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                    : regimeData.regime === 'BEARISH'
                      ? 'bg-red-500/20 text-red-400 border border-red-500/50'
                      : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50'
                  }`}>
                  {regimeData.regime}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {loading ? (
          <div className="flex items-center justify-center h-[600px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-400">Loading market data...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-[600px]">
            <div className="text-center">
              <div className="text-red-500 text-6xl mb-4">⚠️</div>
              <h2 className="text-2xl font-bold text-red-400 mb-2">Connection Error</h2>
              <p className="text-gray-400 mb-4">{error}</p>
              <button
                onClick={fetchRegimeData}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Monitor: Market Regime */}
            <div className="lg:col-span-2">
              <MarketRegimeMonitor data={regimeData} />
            </div>

            {/* Bottom Monitor: Zenith Leaders */}
            <div className="lg:col-span-2">
              <ZenithLeaders />
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 mt-12">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div>
              <p>Powered by Machine Alpha Engine</p>
              <p className="text-xs mt-1">Data sources: Alpha Vantage, Yahoo Finance</p>
            </div>
            <div className="text-right">
              <p>© 2025 Zenith Scores</p>
              <p className="text-xs mt-1">Real-time market intelligence</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
