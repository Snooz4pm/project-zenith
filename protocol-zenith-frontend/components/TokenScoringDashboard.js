"use client";

// File: protocol-zenith-frontend/components/TokenScoringDashboard.js

import React, { useState, useEffect } from 'react';

export default function TokenScoringDashboard() {
  const [tokenData, setTokenData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState(null);

  // Fetch real data from the API
  useEffect(() => {
    const fetchScores = async () => {
      setLoading(true);
      try {
        console.log('Fetching leaderboard...');
        const response = await fetch('/api/leaderboard');
        const data = await response.json();

        console.log('API Response:', data);
        setDebugInfo(data.debug);

        if (data.success && data.leaderboard) {
          setTokenData(data.leaderboard);
          setError(null);
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
      <div className="container mx-auto px-4 md:px-8 py-12 max-w-4xl">
        <div className="bg-red-900/20 border border-red-700 rounded-lg p-6">
          <h2 className="text-red-500 text-xl mb-4">⚠️ Error Loading Leaderboard</h2>
          <p className="text-gray-300 mb-4">{error}</p>
          {debugInfo && (
            <div className="bg-gray-800 p-4 rounded mt-4">
              <p className="text-xs text-gray-400 font-mono">Debug Info:</p>
              <pre className="text-xs text-gray-300 mt-2 overflow-auto">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </div>
          )}
          <p className="text-gray-400 text-sm mt-4">
            Make sure:
            <br />• Redis environment variables are set in Vercel
            <br />• The worker has run at least once
            <br />• Check Vercel function logs for errors
          </p>
        </div>
      </div>
    );
  }

  if (tokenData.length === 0) {
    return (
      <div className="container mx-auto px-4 md:px-8 py-12 max-w-4xl">
        <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-6">
          <h2 className="text-yellow-400 text-xl mb-4">📊 No Tokens Ranked Yet</h2>
          <p className="text-gray-300 mb-4">
            The leaderboard is empty. The worker needs to run to populate data.
          </p>
          {debugInfo && (
            <div className="bg-gray-800 p-4 rounded mt-4">
              <p className="text-xs text-gray-400 font-mono">Debug Info:</p>
              <pre className="text-xs text-gray-300 mt-2 overflow-auto">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </div>
          )}
          <p className="text-gray-400 text-sm mt-4">
            Try triggering the test worker: <code className="bg-gray-800 px-2 py-1 rounded">/api/test-worker</code>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 md:px-8 py-8">
      <h1 className="text-5xl font-bold text-center mb-12 text-green-400">
        Protocol Zenith
      </h1>

      {/* Debug Info */}
      {debugInfo && (
        <div className="max-w-5xl mx-auto mb-6 bg-gray-800 p-3 rounded text-xs">
          <span className="text-gray-400">Loaded {debugInfo.rawCount / 2} tokens from Redis</span>
        </div>
      )}

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
