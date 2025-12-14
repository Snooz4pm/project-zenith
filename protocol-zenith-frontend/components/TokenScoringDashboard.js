"use client";

// File: protocol-zenith-frontend/components/TokenScoringDashboard.js

import React, { useState, useEffect } from 'react';

// Mock data structure matching what your worker will return (simplified)
const mockScores = [
  { tokenName: 'DEX Token A', symbol: 'DEXA', score: 850, liquidity: 3500000, volume: 1200000, safety: 'High', news: 8 },
  { tokenName: 'Protocol B', symbol: 'PROB', score: 620, liquidity: 1200000, volume: 450000, safety: 'Medium', news: 1 },
  { tokenName: 'New Coin C', symbol: 'NEWC', score: 210, liquidity: 500000, volume: 180000, safety: 'Low', news: -5 },
];

export default function TokenScoringDashboard() {
  const [tokenData, setTokenData] = useState(mockScores);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // In a real application, this would fetch data from your Vercel Worker's exposed endpoint
  useEffect(() => {
    // Example fetch:
    /*
    const fetchScores = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/scores'); 
        const data = await response.json();
        setTokenData(data);
      } catch (err) {
        setError("Failed to fetch data from the scoring worker API.");
      } finally {
        setLoading(false);
      }
    };
    fetchScores();
    */
  }, []);

  if (loading) return <div className="text-center text-green-400 text-xl py-12">Loading current token scores...</div>;
  if (error) return <div className="text-center text-red-500 text-xl py-12">{error}</div>;

  return (
    <div className="container mx-auto px-4 md:px-8 py-8">
      <h1 className="text-5xl font-bold text-center mb-12 text-green-400">
        Protocol Zenith
      </h1>

      {/* Token Cards Container */}
      <div className="space-y-6 max-w-5xl mx-auto">
        {tokenData.map((token, index) => (
          <div
            key={index}
            className="bg-gray-900 p-6 rounded-xl border border-gray-800 shadow-2xl hover:border-gray-700 transition-all duration-300 hover:shadow-green-400/10"
          >
            {/* Token Header: Name and Score */}
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white">
                  {token.symbol}
                </h2>
                <p className="text-gray-400 text-sm">{token.tokenName}</p>
              </div>
              <div className="text-right">
                <p className={`text-4xl font-extrabold ${token.score > 700 ? 'text-green-400' : token.score > 400 ? 'text-yellow-400' : 'text-orange-500'}`}>
                  {token.score}
                </p>
                <p className="text-gray-500 text-xs">Zenith Score</p>
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {/* Liquidity */}
              <div className="bg-gray-800/50 p-4 rounded-lg">
                <p className="text-gray-400 text-xs font-medium mb-1">Liquidity</p>
                <p className="text-white text-lg font-semibold">${(token.liquidity / 1000000).toFixed(2)}M</p>
              </div>

              {/* Volume */}
              <div className="bg-gray-800/50 p-4 rounded-lg">
                <p className="text-gray-400 text-xs font-medium mb-1">24h Volume</p>
                <p className="text-white text-lg font-semibold">${(token.volume / 1000000).toFixed(2)}M</p>
              </div>

              {/* Safety */}
              <div className="bg-gray-800/50 p-4 rounded-lg">
                <p className="text-gray-400 text-xs font-medium mb-1">GoPlus Safety</p>
                <p className={`text-lg font-semibold ${token.safety === 'High' ? 'text-green-400' :
                    token.safety === 'Medium' ? 'text-yellow-400' :
                      'text-red-400'
                  }`}>
                  {token.safety}
                </p>
              </div>

              {/* News Sentiment */}
              <div className="bg-gray-800/50 p-4 rounded-lg">
                <p className="text-gray-400 text-xs font-medium mb-1">News Sentiment</p>
                <p className={`text-lg font-semibold ${token.news > 5 ? 'text-green-400' :
                    token.news > 0 ? 'text-yellow-400' :
                      'text-red-400'
                  }`}>
                  {token.news > 0 ? '+' : ''}{token.news}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
