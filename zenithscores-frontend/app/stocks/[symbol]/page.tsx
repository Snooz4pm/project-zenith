
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft, ArrowUp, ArrowDown, Activity, Zap, TrendingUp, Info,
    Bell, BarChart2, Share2, Layers, Cpu, Shield, Clock, Search
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceDot, AreaChart, Area, ComposedChart, Bar } from 'recharts';
import { getZenithSignal, generateInsight } from '@/lib/zenith';
import Link from 'next/link';
import PredictiveSearch from '@/components/PredictiveSearch'; // Import search for header

// Types for Stock Data
interface StockData {
    symbol: string;
    description: string;
    price_usd: number;
    price_change_24h: number;
    zenith_score: number;
    volume_24h: number;
    market_cap: number;
    sector: string;
    industry: string;
    beta: number;
}

// Mock History Generator
const generateHistory = (currentPrice: number, score: number) => {
    const data = [];
    let price = currentPrice * 0.9;
    for (let i = 0; i < 90; i++) {
        const volatility = (Math.random() - 0.5) * 0.03;
        price = price * (1 + volatility);
        if (i === 89) price = currentPrice;

        data.push({
            date: `D - ${90 - i} `,
            price: price,
            score: Math.min(100, Math.max(0, score + (Math.random() * 20 - 10))),
            volume: Math.floor(Math.random() * 1000000)
        });
    }
    return data;
};

export default function StockDetailPage() {
    const params = useParams();
    const symbol = typeof params.symbol === 'string' ? params.symbol : 'AAPL';

    const [stock, setStock] = useState<StockData | null>(null);
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [chartTimeframe, setChartTimeframe] = useState('3M');
    const [showScoreOverlay, setShowScoreOverlay] = useState(true);

    useEffect(() => {
        // In a real app, fetch from API. Simulating data here.
        setTimeout(() => {
            const mockPrice = Math.random() * 500 + 50;
            const mockScore = Math.floor(Math.random() * 60) + 20; // 20-80

            setStock({
                symbol: symbol.toUpperCase(),
                description: `Leading technology company in ${symbol} sector.`,
                price_usd: mockPrice,
                price_change_24h: (Math.random() * 5) - 2,
                zenith_score: mockScore,
                volume_24h: 35000000,
                market_cap: 2500000000000,
                sector: 'Technology',
                industry: 'Consumer Electronics',
                beta: 1.2
            });
            setHistory(generateHistory(mockPrice, mockScore));
            setLoading(false);
        }, 1000);
    }, [symbol]);

    if (loading) return (
        <div className="min-h-screen bg-[var(--background-dark)] flex items-center justify-center text-gray-500 animate-pulse">
            Loading {symbol}...
        </div>
    );

    if (!stock) return null;

    const signal = getZenithSignal(stock.zenith_score);
    const isPositive = stock.price_change_24h >= 0;

    return (
                        <h1 className="text-5xl font-bold tracking-tight mb-2">{stock.symbol}</h1>
                        <p className="text-xl text-gray-400">{stock.name}</p>
                    </div >
        <div className="mt-6 md:mt-0 text-right">
            <div className="text-4xl font-mono font-medium">${stock.price_usd.toFixed(2)}</div>
            <div className={`text - lg font - medium flex items - center justify - end gap - 1 ${stock.price_change_24h >= 0 ? 'text-green-500' : 'text-red-500'} `}>
                {stock.price_change_24h >= 0 ? <ArrowUp size={20} /> : <ArrowDown size={20} />}
                {Math.abs(stock.price_change_24h).toFixed(2)}%
            </div>
        </div>
                </div >

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">

            {/* LEFT COLUMN: Insights & Score */}
            <div className="lg:col-span-2 space-y-12">

                {/* CHART SECTION */}
                <section>
                    <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">Price vs. Zenith Score Performance</h2>
                    <StockChart symbol={stock.symbol} currentPrice={stock.price_usd} currentScore={stock.zenith_score} />
                </section>

                {/* SECTION 2: WHY THIS SCORE EXISTS */}
                <section>
                    <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">Zenith Analysis</h2>
                    <p className="text-xl leading-relaxed text-gray-200 font-light">
                        <span className={`font - bold text - ${scoreColor} -400`}>{stock.symbol} is rated {scoreText}</span> because it displays
                        consistent upward momentum combined with volume levels {stock.volume_24h > 1000000 ? 'significantly above' : 'aligned with'} the 30-day average.
                        Our algorithm detects accumulation patterns typical of institutional entry.
                    </p>
                </section>

                {/* SECTION 4: PREDICTIONS OVER TIME (TRUST ENGINE) */}
                <section className="bg-gray-900/30 border border-gray-800 rounded-2xl p-8">
                    <div className="flex justify-between items-end mb-8">
                        <div>
                            <h2 className="text-xl font-bold text-white mb-2">Prediction Track Record</h2>
                            <p className="text-sm text-gray-400">Zenith tracks every signal against reality.</p>
                        </div>
                        <div className="text-right">
                            <div className="text-2xl font-bold text-white">87%</div>
                            <div className="text-xs text-gray-500">Global Accuracy</div>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-gray-500 border-b border-gray-800">
                                <tr>
                                    <th className="pb-4 font-normal">Date (Signal)</th>
                                    <th className="pb-4 font-normal">Zenith Prediction</th>
                                    <th className="pb-4 font-normal">Entry Price</th>
                                    <th className="pb-4 font-normal">Current Price</th>
                                    <th className="pb-4 font-normal text-right">Outcome</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800/50">
                                {predictions.map((p, i) => (
                                    <tr key={i} className="group hover:bg-white/5 transition-colors">
                                        <td className="py-4 text-gray-300 font-mono">{p.date}</td>
                                        <td className="py-4">
                                            <span className={`px - 2 py - 1 rounded text - xs font - bold bg - ${p.score >= 60 ? 'green' : 'red'} -500 / 20 text - ${p.score >= 60 ? 'green' : 'red'} -400`}>
                                                {p.prediction}
                                            </span>
                                        </td>
                                        <td className="py-4 text-gray-400">${p.priceThen.toFixed(2)}</td>
                                        <td className="py-4 text-white font-medium">${p.priceNow.toFixed(2)}</td>
                                        <td className="py-4 text-right text-green-400 font-bold">{p.outcome}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>

            </div>

            {/* RIGHT COLUMN: Score Visuals */}
            <div className="space-y-8">
                {/* ZENITH SCORE CARD */}
                <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-8 backdrop-blur-sm">
                    <div className="mb-6">
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Live Zenith Score</h3>
                        <div className="flex items-baseline gap-2">
                            <span className="text-6xl font-bold text-white">{stock.zenith_score.toFixed(0)}</span>
                            <span className="text-lg text-gray-400">/ 100</span>
                        </div>
                    </div>

                    {/* Animated Bar */}
                    <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden mb-8">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${stock.zenith_score}% ` }}
                            transition={{ duration: 1.5, ease: "circOut" }}
                            className={`h - full bg - ${scoreColor} -500`}
                        />
                    </div>

                    {/* SECTION 3: SCORE BREAKDOWN */}
                    <div className="space-y-6">
                        <div>
                            <div className="flex justify-between text-xs mb-2">
                                <span className="text-gray-400">Momentum</span>
                                <span className="text-white">Strong</span>
                            </div>
                            <div className="h-1 w-full bg-gray-800 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500 w-[85%]" />
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between text-xs mb-2">
                                <span className="text-gray-400">Volume Consistency</span>
                                <span className="text-white">High</span>
                            </div>
                            <div className="h-1 w-full bg-gray-800 rounded-full overflow-hidden">
                                <div className="h-full bg-purple-500 w-[70%]" />
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between text-xs mb-2">
                                <span className="text-gray-400">Stability Index</span>
                                <span className="text-white">Neutral</span>
                            </div>
                            <div className="h-1 w-full bg-gray-800 rounded-full overflow-hidden">
                                <div className="h-full bg-gray-500 w-[60%]" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* SECTION 5: SYSTEM METADATA */}
                <div className="p-6 border border-gray-800/50 rounded-xl text-xs space-y-3 text-gray-500">
                    <div className="flex items-center gap-2">
                        <Clock size={12} />
                        Last computation: 14 seconds ago
                    </div>
                    <div className="flex items-center gap-2">
                        <Database size={12} />
                        Source: NYSE/Nasdaq Real-time
                    </div>
                    <div className="flex items-center gap-2">
                        <CheckCircle size={12} />
                        Algorithmic Confidence: 94.2%
                    </div>
                </div>
            </div>

        </div>
            </main >
        </div >
    );
}
