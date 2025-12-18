'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowUp, ArrowDown } from 'lucide-react';
import Link from 'next/link';

interface Stock {
    symbol: string;
    name: string;
    price_usd: number;
    price_change_24h: number;
    volume_24h: number;
    zenith_score: number;
}

export default function StockMarket() {
    const [stocks, setStocks] = useState<Stock[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchStocks() {
            try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://project-zenith-zexd.vercel.app';
                const res = await fetch(`${apiUrl}/api/v1/stocks/trending`);
                const data = await res.json();
                if (data.status === 'success') {
                    setStocks(data.data);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        fetchStocks();
    }, []);

    if (loading) return <div className="h-96 bg-gray-900/50 animate-pulse rounded-xl" />;

    return (
        <div className="space-y-8">
            {/* Focus Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {stocks.slice(0, 3).map((stock, i) => (
                    <Link href={`/stocks/${stock.symbol}`} key={stock.symbol} className="block group">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="bg-gray-900 border border-gray-800 p-6 rounded-xl hover:border-blue-500/50 transition-colors cursor-pointer h-full"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">{stock.symbol}</h3>
                                    <p className="text-xs text-gray-400 truncate max-w-[150px]">{stock.name}</p>
                                </div>
                                <div className="px-2 py-1 bg-blue-900/30 text-blue-300 text-xs font-bold rounded">
                                    Score: {stock.zenith_score.toFixed(0)}
                                </div>
                            </div>
                            <div className="flex items-end justify-between">
                                <div className="text-2xl font-mono text-white">${stock.price_usd.toFixed(2)}</div>
                                <div className={`flex items-center text-sm font-bold ${stock.price_change_24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                    {stock.price_change_24h >= 0 ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
                                    {Math.abs(stock.price_change_24h).toFixed(2)}%
                                </div>
                            </div>
                        </motion.div>
                    </Link>
                ))}
            </div>

            {/* Market Table */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                <div className="p-4 border-b border-gray-800 flex justify-between items-center">
                    <h2 className="font-bold text-white">Market Data</h2>
                    <div className="text-xs text-gray-500">Real-time FMP Data</div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-800/50 text-gray-400 uppercase text-xs">
                            <tr>
                                <th className="px-6 py-3">Symbol</th>
                                <th className="px-6 py-3">Price</th>
                                <th className="px-6 py-3">Change</th>
                                <th className="px-6 py-3">Volume</th>
                                <th className="px-6 py-3 text-right">Zenith Score</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                            {stocks.map((stock) => (
                                <tr key={stock.symbol} className="hover:bg-gray-800/50 transition-colors">
                                    <td className="px-6 py-4 font-bold text-white">
                                        {stock.symbol}
                                        <span className="block text-[10px] text-gray-500 font-normal">{stock.name}</span>
                                    </td>
                                    <td className="px-6 py-4 font-mono">${stock.price_usd.toFixed(2)}</td>
                                    <td className={`px-6 py-4 font-bold ${stock.price_change_24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                        {stock.price_change_24h > 0 ? '+' : ''}{stock.price_change_24h.toFixed(2)}%
                                    </td>
                                    <td className="px-6 py-4 text-gray-400">
                                        {(stock.volume_24h / 1000000).toFixed(1)}M
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <div className="w-16 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                                                <div className="h-full bg-blue-500" style={{ width: `${stock.zenith_score}%` }} />
                                            </div>
                                            <span className="font-bold text-white">{stock.zenith_score.toFixed(0)}</span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
