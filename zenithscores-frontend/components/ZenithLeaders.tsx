'use client';

import { useState } from 'react';

interface LeaderToken {
    symbol: string;
    score: number;
    change24h: number;
    volume: string;
    trend: 'up' | 'down' | 'neutral';
}

// Mock data - replace with real API data later
const mockLeaders: LeaderToken[] = [
    { symbol: 'TSLA', score: 2.1, change24h: 5.2, volume: '$12.5B', trend: 'up' },
    { symbol: 'NVDA', score: 1.9, change24h: 3.8, volume: '$45.2B', trend: 'up' },
    { symbol: 'AAPL', score: 1.7, change24h: 2.1, volume: '$52.1B', trend: 'up' },
    { symbol: 'MSFT', score: 1.6, change24h: 1.9, volume: '$38.7B', trend: 'up' },
    { symbol: 'GOOGL', score: 1.5, change24h: -0.5, volume: '$28.3B', trend: 'down' },
];

export default function ZenithLeaders() {
    const [selectedToken, setSelectedToken] = useState<string | null>('TSLA');

    return (
        <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-xl p-6 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-bold mb-1">Zenith Leaders</h2>
                    <p className="text-sm text-gray-400">Top 100 tokens by Zenith Score</p>
                </div>

                <div className="flex items-center gap-2">
                    <div className="px-4 py-2 bg-blue-500/20 border border-blue-500/50 rounded-lg">
                        <span className="text-xs text-gray-400">Total Leaders:</span>
                        <span className="ml-2 font-bold text-blue-400">100</span>
                    </div>
                </div>
            </div>

            {/* Featured Token (TSLA) */}
            <div className="mb-6 p-6 bg-gradient-to-r from-purple-900/30 to-blue-900/30 border-2 border-purple-500/50 rounded-xl">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-4xl font-bold">TSLA</h3>
                            <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 border border-yellow-500/50 rounded-full text-sm font-bold">
                                ⭐ Featured
                            </span>
                        </div>
                        <p className="text-gray-400 text-sm">Tesla, Inc.</p>
                    </div>

                    <div className="text-right">
                        <div className="text-sm text-gray-400 mb-1">Zenith Score</div>
                        <div className="text-6xl font-bold bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
                            2.1
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mt-6">
                    <div>
                        <div className="text-xs text-gray-400 uppercase">24h Change</div>
                        <div className="text-2xl font-bold text-green-400">+5.2%</div>
                    </div>
                    <div>
                        <div className="text-xs text-gray-400 uppercase">Volume</div>
                        <div className="text-2xl font-bold">$12.5B</div>
                    </div>
                    <div>
                        <div className="text-xs text-gray-400 uppercase">Trend</div>
                        <div className="text-2xl font-bold text-green-400">↗ Strong</div>
                    </div>
                </div>
            </div>

            {/* Leaders Table */}
            <div className="bg-gray-800/30 border border-gray-700 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gray-800/50 border-b border-gray-700">
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                    Rank
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                    Symbol
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                    Zenith Score
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                    24h Change
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                    Volume
                                </th>
                                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                    Trend
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                            {mockLeaders.map((token, index) => (
                                <tr
                                    key={token.symbol}
                                    className={`hover:bg-gray-800/50 transition-colors cursor-pointer ${selectedToken === token.symbol ? 'bg-blue-900/20 border-l-4 border-blue-500' : ''
                                        }`}
                                    onClick={() => setSelectedToken(token.symbol)}
                                >
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <span className="text-gray-400 font-mono">#{index + 1}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="font-bold text-lg">{token.symbol}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                        <div className="text-2xl font-bold bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
                                            {token.score.toFixed(1)}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                        <div className={`font-semibold ${token.change24h > 0 ? 'text-green-400' : 'text-red-400'
                                            }`}>
                                            {token.change24h > 0 ? '+' : ''}{token.change24h.toFixed(1)}%
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                        <div className="font-mono text-gray-300">{token.volume}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${token.trend === 'up'
                                                ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                                                : token.trend === 'down'
                                                    ? 'bg-red-500/20 text-red-400 border border-red-500/50'
                                                    : 'bg-gray-500/20 text-gray-400 border border-gray-500/50'
                                            }`}>
                                            {token.trend === 'up' ? '↗' : token.trend === 'down' ? '↘' : '→'} {token.trend.toUpperCase()}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Load More */}
            <div className="mt-6 text-center">
                <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors">
                    Load More Leaders
                </button>
                <p className="text-xs text-gray-500 mt-2">Showing 5 of 100 leaders</p>
            </div>
        </div>
    );
}
