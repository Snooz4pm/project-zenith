"use client";

// components/TokenScoringDashboard.js - Simplified live dashboard

import React, { useState, useEffect } from 'react';

export default function TokenScoringDashboard() {
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  const fetchTokens = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/analyze');
      const data = await response.json();

      if (data.success) {
        setTokens(data.tokens);
        setLastUpdate(new Date(data.timestamp));
        setError(null);
      } else {
        setError(data.error || 'Failed to load tokens');
      }
    } catch (err) {
      setError('Network error - please try again');
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTokens();

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchTokens, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading && tokens.length === 0) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <div className="animate-pulse">
          <div className="text-green-400 text-2xl mb-4">🔍 Analyzing Trending Tokens...</div>
          <p className="text-gray-400">Fetching data from Dexscreener and GoPlus</p>
        </div>
      </div>
    );
  }

  if (error && tokens.length === 0) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <div className="bg-red-900/20 border border-red-700 rounded-lg p-6">
          <h2 className="text-red-400 text-xl mb-2">⚠️ Error</h2>
          <p className="text-gray-300">{error}</p>
          <button
            onClick={fetchTokens}
            className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 md:px-8 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-5xl font-bold text-green-400 mb-2">
          Protocol Zenith
        </h1>
        <p className="text-gray-400">
          Live DeFi Token Analysis • Updates every 30s
        </p>
        {lastUpdate && (
          <p className="text-gray-500 text-sm mt-2">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </p>
        )}
      </div>

      {/* Token Cards */}
      <div className="space-y-6 max-w-5xl mx-auto">
        {tokens.map((token, index) => (
          <div
            key={token.address}
            className="bg-gray-900 p-6 rounded-xl border border-gray-800 shadow-2xl hover:border-green-400/30 transition-all duration-300"
          >
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <div>
                <div className="flex items-center gap-3">
                  <span className="text-gray-500 font-bold">#{index + 1}</span>
                  <h2 className="text-2xl font-bold text-white">{token.symbol}</h2>
                </div>
                <p className="text-gray-400 text-sm mt-1">{token.name}</p>
                <p className="text-gray-500 text-xs mt-1">
                  {token.address.substring(0, 10)}...
                </p>
              </div>
              <div className="text-right">
                <p
                  className={`text-4xl font-extrabold ${token.finalScore > 7
                      ? 'text-green-400'
                      : token.finalScore > 5
                        ? 'text-yellow-400'
                        : 'text-orange-500'
                    }`}
                >
                  {token.finalScore.toFixed(1)}
                </p>
                <p className="text-gray-500 text-xs">Zenith Score</p>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Security */}
              <div className="bg-gray-800/50 p-4 rounded-lg">
                <p className="text-gray-400 text-xs mb-1">Security</p>
                <p
                  className={`text-lg font-semibold ${token.securityScore >= 8
                      ? 'text-green-400'
                      : token.securityScore >= 6
                        ? 'text-yellow-400'
                        : 'text-red-400'
                    }`}
                >
                  {token.securityScore.toFixed(1)}/10
                </p>
              </div>

              {/* Liquidity */}
              <div className="bg-gray-800/50 p-4 rounded-lg">
                <p className="text-gray-400 text-xs mb-1">Liquidity</p>
                <p className="text-white text-lg font-semibold">
                  ${(token.liquidity / 1000000).toFixed(2)}M
                </p>
              </div>

              {/* Volume */}
              <div className="bg-gray-800/50 p-4 rounded-lg">
                <p className="text-gray-400 text-xs mb-1">24h Volume</p>
                <p className="text-white text-lg font-semibold">
                  ${(token.volume24h / 1000000).toFixed(2)}M
                </p>
              </div>

              {/* Price Change */}
              <div className="bg-gray-800/50 p-4 rounded-lg">
                <p className="text-gray-400 text-xs mb-1">24h Change</p>
                <p
                  className={`text-lg font-semibold ${token.priceChange24h > 0 ? 'text-green-400' : 'text-red-400'
                    }`}
                >
                  {token.priceChange24h > 0 ? '+' : ''}
                  {token.priceChange24h.toFixed(2)}%
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Refresh Button */}
      <div className="text-center mt-8">
        <button
          onClick={fetchTokens}
          disabled={loading}
          className="px-6 py-3 bg-green-600 hover:bg-green-500 disabled:bg-gray-700 text-white font-semibold rounded-lg transition shadow-lg"
        >
          {loading ? 'Refreshing...' : 'Refresh Now'}
        </button>
      </div>
    </div>
  );
}
