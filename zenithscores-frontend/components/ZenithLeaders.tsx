'use client';

import { useEffect, useState } from 'react';
import { formatNumber } from '@/lib/utils';

interface Token {
    symbol: string;
    name: string;
    address: string;
    chain: string;
    price_usd: number;
    liquidity_usd: number;
    volume_24h: number;
    price_change_24h: number;
    dex_id: string;
    url: string;
    fdv?: number;
    market_cap?: number;
}

export default function ZenithLeaders() {
    const [tokens, setTokens] = useState<Token[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedToken, setSelectedToken] = useState<string | null>(null);
    const [displayCount, setDisplayCount] = useState(10);

    useEffect(() => {
        fetchTokens();
    }, []);

    const fetchTokens = async () => {
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
            const response = await fetch(`${apiUrl}/api/v1/tokens/trending?limit=100`);

            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }

            const data = await response.json();

            if (data.status === 'success') {
                setTokens(data.data);
                if (data.data.length > 0) {
                    setSelectedToken(data.data[0].symbol);
                }
                setError(null);
            } else {
                throw new Error('Invalid response format');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch tokens');
            console.error('Error fetching tokens:', err);
        } finally {
            setLoading(false);
        }
    };

    const loadMore = () => {
        setDisplayCount(prev => Math.min(prev + 10, tokens.length));
    };

    const featuredToken = tokens[0];
    const displayedTokens = tokens.slice(0, displayCount);

    if (loading) {
        return (
            <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-xl p-6 shadow-2xl">
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
                        <p className="text-gray-400">Loading trending tokens...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-xl p-6 shadow-2xl">
                <div className="flex items-center justify-center h-64">
                    <div className="text-center max-w-lg">
                        <div className="text-red-500 text-4xl mb-4">⚠️</div>
                        <h3 className="text-xl font-bold text-red-400 mb-2">Error Loading Tokens</h3>
                        <div className="bg-gray-900 p-4 rounded-lg text-left mb-4 overflow-x-auto border border-gray-700">
                            <p className="text-red-300 font-mono text-xs break-all">{error}</p>
                            <p className="text-gray-500 font-mono text-xs mt-2 pt-2 border-t border-gray-800">
                                Attempted API: {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/tokens/trending
                            </p>
                        </div>
                        <button
                            onClick={fetchTokens}
                            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                        >
                            Retry Request
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-xl p-6 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-bold mb-1">Zenith Leaders</h2>
                    <p className="text-sm text-gray-400">Live trending tokens from DexScreener</p>
                </div>

                <div className="flex items-center gap-2">
                    <div className="px-4 py-2 bg-blue-500/20 border border-blue-500/50 rounded-lg">
                        <span className="text-xs text-gray-400">Total Tokens:</span>
                        <span className="ml-2 font-bold text-blue-400">{tokens.length}</span>
                    </div>
                    <button
                        onClick={fetchTokens}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors text-sm font-semibold"
                    >
                        🔄 Refresh
                    </button>
                </div>
            </div>

            {/* Featured Token */}
            {featuredToken && (
                <div className="mb-6 p-6 bg-gradient-to-r from-purple-900/30 to-blue-900/30 border-2 border-purple-500/50 rounded-xl">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-4xl font-bold">{featuredToken.symbol}</h3>
                                <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 border border-yellow-500/50 rounded-full text-sm font-bold">
                                    ⭐ #1 Trending
                                </span>
                            </div>
                            <p className="text-gray-400 text-sm mb-2">{featuredToken.name}</p>
                            <p className="text-xs text-gray-500 font-mono">{featuredToken.address.slice(0, 10)}...{featuredToken.address.slice(-8)}</p>
                        </div>

                        <div className="text-right">
                            <div className="text-sm text-gray-400 mb-1">Price</div>
                            <div className="text-4xl font-bold text-green-400">
                                ${featuredToken.price_usd.toFixed(6)}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-4 gap-4 mt-6">
                        <div>
                            <div className="text-xs text-gray-400 uppercase">24h Change</div>
                            <div className={`text-2xl font-bold ${featuredToken.price_change_24h > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {featuredToken.price_change_24h > 0 ? '+' : ''}{featuredToken.price_change_24h.toFixed(2)}%
                            </div>
                        </div>
                        <div>
                            <div className="text-xs text-gray-400 uppercase">Volume 24h</div>
                            <div className="text-2xl font-bold">${formatNumber(featuredToken.volume_24h)}</div>
                        </div>
                        <div>
                            <div className="text-xs text-gray-400 uppercase">Liquidity</div>
                            <div className="text-2xl font-bold">${formatNumber(featuredToken.liquidity_usd)}</div>
                        </div>
                        <div>
                            <div className="text-xs text-gray-400 uppercase">DEX</div>
                            <div className="text-2xl font-bold uppercase">{featuredToken.dex_id}</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Tokens Table */}
            <div className="bg-gray-800/30 border border-gray-700 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gray-800/50 border-b border-gray-700">
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                    Rank
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                    Token
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                    Price
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                    24h Change
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                    Volume 24h
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                    Liquidity
                                </th>
                                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                    Action
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                            {displayedTokens.map((token, index) => (
                                <tr
                                    key={token.address}
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
                                        <div>
                                            <div className="font-bold text-lg">{token.symbol}</div>
                                            <div className="text-xs text-gray-400">{token.name}</div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                        <div className="font-mono text-gray-300">${token.price_usd.toFixed(6)}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                        <div className={`font-semibold ${token.price_change_24h > 0 ? 'text-green-400' : 'text-red-400'
                                            }`}>
                                            {token.price_change_24h > 0 ? '+' : ''}{token.price_change_24h.toFixed(2)}%
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                        <div className="font-mono text-gray-300">${formatNumber(token.volume_24h)}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                        <div className="font-mono text-gray-300">${formatNumber(token.liquidity_usd)}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <a
                                            href={token.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded-lg text-xs font-semibold transition-colors"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            View →
                                        </a>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Load More */}
            {displayCount < tokens.length && (
                <div className="mt-6 text-center">
                    <button
                        onClick={loadMore}
                        className="px-8 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors"
                    >
                        Load More Tokens
                    </button>
                    <p className="text-xs text-gray-500 mt-2">
                        Showing {displayCount} of {tokens.length} tokens
                    </p>
                </div>
            )}
        </div>
    );
}
