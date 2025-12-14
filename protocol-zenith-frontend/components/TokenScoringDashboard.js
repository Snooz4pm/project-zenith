"use client";

// File: protocol-zenith-frontend/components/TokenScoringDashboard.js

import React, { useState, useEffect } from 'react';

export default function TokenScoringDashboard() {
  const [tokenData, setTokenData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch real data from the API
  useEffect(() => {
    const fetchScores = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/leaderboard');
        const data = await response.json();

        if (data.success && data.leaderboard) {
          setTokenData(data.leaderboard);
        } else {
          setError(data.error || "Failed to load leaderboard");
        }
      } catch (err) {
        setError("Failed to fetch data from the scoring worker API.");
        console.error('Fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchScores();

    // Refresh every 30 seconds
    const interval = setInterval(fetchScores, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="text-center text-green-400 text-xl py-12">
        <div className="animate-pulse">Loading current token scores...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 text-xl mb-4">{error}</div>
        <p className="text-gray-400">Make sure the worker has run at least once and Redis is configured.</p>
      </div>
    );
  }

  if (tokenData.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-yellow-400 text-xl mb-4">No tokens ranked yet</div>
        <p className="text-gray-400">The worker needs to run to populate the leaderboard.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 md:px-8 py-8">
      <h1 className="text-5xl font-bold text-center mb-12 text-green-400">
        Protocol Zenith
      </h1>

      {/* Token Cards Container */}
      <div className="space-y-6 max-w-5xl mx-auto">
        {tokenData.map((token, index) => (
          <div
            key={token.address || index}
            className="bg-gray-900 p-6 rounded-xl border border-gray-800 shadow-2xl hover:border-gray-700 transition-all duration-300 hover:shadow-green-400/10"
          >
            {/* Token Header: Name and Score */}
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white">
                  {token.coingecko_id || 'Unknown Token'}
                </h2>
                <p className="text-gray-400 text-sm">
                  {token.chain} • {token.address?.substring(0, 8)}...
                </p>
              </div>
              <div className="text-right">
                <p className={`text-4xl font-extrabold ${token.finalScore > 7 ? 'text-green-400' :
                    token.finalScore > 4 ? 'text-yellow-400' :
                      'text-orange-500'
                  }`}>
                  {token.finalScore?.toFixed(2) || 'N/A'}
                </p>
                <p className="text-gray-500 text-xs">Zenith Score</p>
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {/* Sharpe Ratio */}
              <div className="bg-gray-800/50 p-4 rounded-lg">
                <p className="text-gray-400 text-xs font-medium mb-1">Sharpe Ratio</p>
                <p className={`text-lg font-semibold ${token.sharpeRatio > 1.5 ? 'text-green-400' :
                    token.sharpeRatio > 0.5 ? 'text-yellow-400' :
                      'text-red-400'
                  }`}>
                  {token.sharpeRatio?.toFixed(2) || 'N/A'}
                </p>
              </div>

              {/* Security Score */}
              <div className="bg-gray-800/50 p-4 rounded-lg">
                <p className="text-gray-400 text-xs font-medium mb-1">Security Score</p>
                <p className={`text-lg font-semibold ${token.securityScore >= 9 ? 'text-green-400' :
                    token.securityScore >= 7 ? 'text-yellow-400' :
                      'text-red-400'
                  }`}>
                  {token.securityScore?.toFixed(1) || 'N/A'} / 10
                </p>
              </div>

              {/* Rank */}
              <div className="bg-gray-800/50 p-4 rounded-lg">
                <p className="text-gray-400 text-xs font-medium mb-1">Rank</p>
                <p className="text-lg font-semibold text-white">
                  #{token.rank || index + 1}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
