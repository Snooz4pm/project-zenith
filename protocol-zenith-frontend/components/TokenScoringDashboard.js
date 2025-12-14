// File: protocol-zenith-frontend/components/TokenScoringDashboard.js

import React, { useState, useEffect } from 'react';

// Mock data structure matching what your worker will return (simplified)
const mockScores = [
    { tokenName: 'DEX Token A', score: 850, liquidity: '3.5M', safety: 'High', news: '+8' },
    { tokenName: 'Protocol B', score: 620, liquidity: '1.2M', safety: 'Medium', news: '+1' },
    { tokenName: 'New Coin C', score: 210, liquidity: '500K', safety: 'Low', news: '-5' },
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

    if (loading) return <div className="text-center text-indigo-400">Loading current token scores...</div>;
    if (error) return <div className="text-center text-red-500">{error}</div>;

    return (
        <div className="bg-gray-800 p-6 rounded-lg shadow-2xl">
            <h2 className="text-3xl font-bold mb-6 text-white border-b border-indigo-500 pb-2">Top Ranked Tokens</h2>

            <div className="grid grid-cols-5 gap-4 font-semibold text-indigo-300 border-b border-gray-700 pb-2 mb-4">
                <div>Token Name</div>
                <div>Zenith Score</div>
                <div>Liquidity (24h)</div>
                <div>GoPlus Safety</div>
                <div>Gemini News</div>
            </div>

            {tokenData.map((token, index) => (
                <div key={index} className="grid grid-cols-5 gap-4 py-3 border-b border-gray-700 hover:bg-gray-700 transition duration-100">
                    <div className="font-medium text-white">{token.tokenName}</div>
                    <div className={`font-extrabold ${token.score > 700 ? 'text-green-400' : token.score > 400 ? 'text-yellow-400' : 'text-red-400'}`}>{token.score}</div>
                    <div className="text-gray-300">{token.liquidity}</div>
                    <div className="text-gray-300">{token.safety}</div>
                    <div className="text-gray-300">{token.news}</div>
                </div>
            ))}
        </div>
    );
}
