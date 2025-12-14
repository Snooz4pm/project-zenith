"use client";

// components/TokenScoringDashboard.js - Enhanced dashboard with buy recommendations

import React, { useState, useEffect } from 'react';

export default function TokenScoringDashboard() {
  const [tokens, setTokens] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [filter, setFilter] = useState('all'); // all, strong-buy, buy, new

  const fetchTokens = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/analyze');
      const data = await response.json();

      if (data.success) {
        setTokens(data.tokens);
        setStats(data.stats);
        setLastUpdate(new Date(data.timestamp));
        setError(null);
      } else {
        setError(data.error || 'Failed to load market data');
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
    const interval = setInterval(fetchTokens, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  // Filter tokens
  const filteredTokens = tokens.filter(token => {
    if (filter === 'strong-buy') return token.recommendation.recommendation === 'STRONG BUY';
    if (filter === 'buy') return token.recommendation.recommendation === 'BUY';
    if (filter === 'new') return token.isNewLaunch;
    return true;
  });

  if (loading && tokens.length === 0) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <div className="animate-pulse">
          <div className="text-green-400 text-3xl mb-4">🔍 Scanning Market...</div>
          <p className="text-gray-400">Analyzing 500+ tokens across ETH, BSC, and Polygon</p>
          <p className="text-gray-500 text-sm mt-2">This may take 30-60 seconds</p>
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

  const getRecColor = (rec) => {
    switch (rec) {
      case 'STRONG BUY': return 'text-green-400';
      case 'BUY': return 'text-yellow-400';
      case 'HOLD': return 'text-orange-400';
      default: return 'text-red-400';
    }
  };

  const getRecBg = (rec) => {
    switch (rec) {
      case 'STRONG BUY': return 'bg-green-500/20 border-green-500';
      case 'BUY': return 'bg-yellow-500/20 border-yellow-500';
      case 'HOLD': return 'bg-orange-500/20 border-orange-500';
      default: return 'bg-red-500/20 border-red-500';
    }
  };

  return (
    <div className="container mx-auto px-4 md:px-8 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-5xl font-bold text-green-400 mb-2">
          Protocol Zenith
        </h1>
        <p className="text-gray-400 text-lg">
          AI-Powered Market Analysis • Buy Recommendations
        </p>
        {lastUpdate && (
          <p className="text-gray-500 text-sm mt-2">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </p>
        )}
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mb-8">
          <div className="bg-gray-900 p-4 rounded-lg border border-gray-800">
            <p className="text-gray-400 text-sm">Tokens Scanned</p>
            <p className="text-2xl font-bold text-white">{stats.totalScanned}</p>
          </div>
          <div className="bg-gray-900 p-4 rounded-lg border border-gray-800">
            <p className="text-gray-400 text-sm">Analyzed</p>
            <p className="text-2xl font-bold text-white">{stats.analyzed}</p>
          </div>
          <div className="bg-green-900/30 p-4 rounded-lg border border-green-700">
            <p className="text-green-400 text-sm">Strong Buys</p>
            <p className="text-2xl font-bold text-green-400">{stats.strongBuys}</p>
          </div>
          <div className="bg-yellow-900/30 p-4 rounded-lg border border-yellow-700">
            <p className="text-yellow-400 text-sm">Buys</p>
            <p className="text-2xl font-bold text-yellow-400">{stats.buys}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 justify-center mb-8 flex-wrap">
        {['all', 'strong-buy', 'buy', 'new'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg font-semibold transition ${filter === f
                ? 'bg-green-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
          >
            {f === 'all' ? 'All Tokens' :
              f === 'strong-buy' ? '🟢 Strong Buy' :
                f === 'buy' ? '🟡 Buy' :
                  '⭐ New Launches'}
          </button>
        ))}
      </div>

      {/* Token Cards */}
      <div className="space-y-6 max-w-6xl mx-auto">
        {filteredTokens.map((token, index) => (
          <div
            key={token.address}
            className={`bg-gray-900 p-6 rounded-xl border-2 shadow-2xl transition-all duration-300 hover:shadow-green-400/20 ${getRecBg(token.recommendation.recommendation)
              }`}
          >
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-gray-500 font-bold">#{index + 1}</span>
                  <h2 className="text-2xl font-bold text-white">{token.symbol}</h2>
                  <span className="text-xs bg-gray-800 px-2 py-1 rounded">{token.chain}</span>
                  {token.isNewLaunch && (
                    <span className="text-xs bg-yellow-600 px-2 py-1 rounded">⭐ NEW</span>
                  )}
                </div>
                <p className="text-gray-400 text-sm">{token.name}</p>
                <p className="text-gray-600 text-xs mt-1 font-mono">
                  {token.address.substring(0, 12)}...
                </p>
              </div>

              {/* Recommendation Badge */}
              <div className="text-right">
                <div className={`text-3xl font-extrabold ${getRecColor(token.recommendation.recommendation)}`}>
                  {token.recommendation.recommendation}
                </div>
                <div className="text-sm text-gray-400 mt-1">
                  {token.recommendation.confidence}% confidence
                </div>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
              {/* Price */}
              <div className="bg-gray-800/50 p-3 rounded-lg">
                <p className="text-gray-400 text-xs mb-1">Price</p>
                <p className="text-white text-sm font-semibold">
                  ${token.priceUsd < 0.01 ? token.priceUsd.toExponential(2) : token.priceUsd.toFixed(4)}
                </p>
                <p className={`text-xs ${token.priceChange24h > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {token.priceChange24h > 0 ? '+' : ''}{token.priceChange24h.toFixed(2)}%
                </p>
              </div>

              {/* Trend Score */}
              <div className="bg-gray-800/50 p-3 rounded-lg">
                <p className="text-gray-400 text-xs mb-1">Trend Score</p>
                <p className={`text-lg font-bold ${token.trend.score > 7.5 ? 'text-green-400' :
                    token.trend.score > 5 ? 'text-yellow-400' : 'text-orange-400'
                  }`}>
                  {token.trend.score.toFixed(1)}/10
                </p>
              </div>

              {/* Security */}
              <div className="bg-gray-800/50 p-3 rounded-lg">
                <p className="text-gray-400 text-xs mb-1">Security</p>
                <p className={`text-lg font-bold ${token.security?.score >= 8 ? 'text-green-400' :
                    token.security?.score >= 6 ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                  {token.security?.score.toFixed(1) || 'N/A'}/10
                </p>
              </div>

              {/* Liquidity */}
              <div className="bg-gray-800/50 p-3 rounded-lg">
                <p className="text-gray-400 text-xs mb-1">Liquidity</p>
                <p className="text-white text-sm font-semibold">
                  ${(token.liquidity / 1000).toFixed(0)}K
                </p>
              </div>

              {/* Volume */}
              <div className="bg-gray-800/50 p-3 rounded-lg">
                <p className="text-gray-400 text-xs mb-1">24h Volume</p>
                <p className="text-white text-sm font-semibold">
                  ${(token.volume24h / 1000).toFixed(0)}K
                </p>
              </div>
            </div>

            {/* Buy Reasons */}
            {token.recommendation.reasons.length > 0 && (
              <div className="bg-gray-800/30 p-4 rounded-lg">
                <p className="text-gray-400 text-xs mb-2">Analysis:</p>
                <ul className="space-y-1">
                  {token.recommendation.reasons.map((reason, i) => (
                    <li key={i} className="text-sm text-gray-300">
                      • {reason}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Refresh Button */}
      <div className="text-center mt-8">
        <button
          onClick={fetchTokens}
          disabled={loading}
          className="px-8 py-4 bg-green-600 hover:bg-green-500 disabled:bg-gray-700 text-white font-bold rounded-lg transition shadow-lg text-lg"
        >
          {loading ? 'Analyzing Market...' : '🔄 Refresh Analysis'}
        </button>
      </div>

      {/* Disclaimer */}
      <div className="max-w-4xl mx-auto mt-12 p-4 bg-red-900/20 border border-red-700 rounded-lg">
        <p className="text-red-400 text-sm text-center font-semibold">
          ⚠️ DISCLAIMER: This is NOT financial advice. Always DYOR (Do Your Own Research).
          Cryptocurrency investments are highly risky and volatile.
        </p>
      </div>
    </div>
  );
}
