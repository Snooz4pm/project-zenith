'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
    ArrowLeft, ArrowUp, ArrowDown, Activity, Zap, TrendingUp, Info,
    Bell, BarChart2, Share2, Layers, Cpu, Shield, Clock, Search,
    Database, CheckCircle
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceDot, AreaChart, Area, ComposedChart } from 'recharts';
import { getZenithSignal } from '@/lib/zenith';
import Link from 'next/link';
import PredictiveSearch from '@/components/PredictiveSearch';
import { getStockCandles, getTimeRange } from '@/lib/finnhub';
import ZenithRealtimeChart, { ChartRef } from '@/components/ZenithRealtimeChart';
import { useMarketData } from '@/hooks/useMarketData';
import { useTrackView } from '@/hooks/useTrackView';
import { useSession } from 'next-auth/react';

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
    name?: string;
}

// Transform Finnhub candle data to chart format
const transformCandleData = (candles: any, currentScore: number) => {
    if (!candles || !candles.t || candles.t.length === 0) return [];

    return candles.t.map((timestamp: number, i: number) => ({
        date: new Date(timestamp * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        price: candles.c[i],
        score: Math.min(100, Math.max(0, currentScore + (Math.random() * 20 - 10))),
        volume: candles.v[i] || 0,
        high: candles.h[i],
        low: candles.l[i],
    }));
};

// Mock History Generator (fallback)
const generateHistory = (currentPrice: number, score: number) => {
    const data = [];
    let price = currentPrice * 0.9;
    for (let i = 0; i < 90; i++) {
        const volatility = (Math.random() - 0.5) * 0.03;
        price = price * (1 + volatility);
        if (i === 89) price = currentPrice;

        data.push({
            date: `D-${90 - i}`,
            price: price,
            score: Math.min(100, Math.max(0, score + (Math.random() * 20 - 10))),
            volume: Math.floor(Math.random() * 1000000)
        });
    }
    return data;
};

// Mock Predictions Generator
const generatePredictions = (currentPrice: number, score: number) => {
    return [
        { date: '1 week ago', score: 75, outcome: '✓ Success' },
        { date: '2 weeks ago', score: 62, outcome: '✓ Success' },
        { date: '3 weeks ago', score: 45, outcome: '✗ Failed' },
    ];
};

// Timeframe configurations for stocks
const STOCK_TIMEFRAME_CONFIG: Record<string, number> = {
    '1D': 1,
    '1W': 7,
    '1M': 30,
    '3M': 90,
    '1Y': 365
};

const StockChartSection = ({ symbol, initialPrice, zenithScore, isPositive, change24h }: any) => {
    const [selectedTimeframe, setSelectedTimeframe] = useState('3M');
    const days = STOCK_TIMEFRAME_CONFIG[selectedTimeframe] || 90;

    const { currentPrice, history, lastTick } = useMarketData({
        initialPrice,
        volatility: 0.05,
        intervalMs: 2000,
        symbol,
        days
    });

    const chartRef = useRef<ChartRef>(null);

    // Sync live ticks to chart
    useEffect(() => {
        if (lastTick && chartRef.current) {
            chartRef.current.update(lastTick);
        }
    }, [lastTick]);

    // Initial load and timeframe changes
    useEffect(() => {
        if (history.length > 0 && chartRef.current) {
            chartRef.current.setData(history);
        }
    }, [history.length, selectedTimeframe]);

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 h-[500px] flex flex-col">
            {/* Live Header */}
            <div className="flex justify-between items-start mb-6">
                <div>
                    <motion.div
                        initial={{ opacity: 0.8 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        key={currentPrice}
                        className="text-4xl font-bold text-gray-900 font-mono tracking-tighter"
                    >
                        ${currentPrice.toFixed(2)}
                    </motion.div>
                    <div className={`text-sm font-bold flex items-center gap-1 mt-1 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                        {isPositive ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
                        {Math.abs(change24h).toFixed(2)}%
                        <span className="text-gray-400 font-normal ml-2 text-xs uppercase tracking-wide flex items-center gap-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> Live Market
                        </span>
                    </div>
                </div>

                <div className="flex gap-2">
                    <button className="px-3 py-1.5 text-xs font-bold rounded border bg-blue-50 border-blue-200 text-blue-700">
                        ZENITH SCORE: {zenithScore}
                    </button>
                    <div className="bg-gray-100 rounded-lg p-1 flex gap-1">
                        {Object.keys(STOCK_TIMEFRAME_CONFIG).map(tf => (
                            <button
                                key={tf}
                                onClick={() => setSelectedTimeframe(tf)}
                                className={`px-3 py-1 text-xs font-bold rounded transition-all ${tf === selectedTimeframe
                                    ? 'bg-white shadow-sm text-gray-900'
                                    : 'text-gray-400 hover:text-gray-600'
                                    }`}
                            >
                                {tf}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* The Chart */}
            <div className="flex-1 w-full relative border-t border-gray-50 pt-4">
                <ZenithRealtimeChart
                    ref={chartRef}
                    data={history}
                    height={380}
                    colors={{
                        lineColor: '#2563EB',
                        areaTopColor: 'rgba(37, 99, 235, 0.2)',
                        areaBottomColor: 'rgba(37, 99, 235, 0.0)',
                    }}
                />
            </div>

            <div className="mt-2 flex justify-between text-[10px] text-gray-400 font-mono uppercase">
                <span>Real-time Data Stream</span>
                <span>Timeframe: {selectedTimeframe}</span>
            </div>
        </div>
    );
};

export default function StockDetailPage() {
    const params = useParams();
    const symbol = typeof params.symbol === 'string' ? params.symbol : 'AAPL';
    const { data: session } = useSession();
    const isLoggedIn = !!session?.user;

    const [stock, setStock] = useState<StockData | null>(null);
    const [history, setHistory] = useState<any[]>([]);
    const [peers, setPeers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [chartTimeframe, setChartTimeframe] = useState('3M');
    const [showScoreOverlay, setShowScoreOverlay] = useState(true);

    // Track this view for personalization
    useTrackView({
        assetType: 'stocks',
        symbol: symbol.toUpperCase(),
        name: stock?.name || stock?.description || symbol.toUpperCase(),
        enabled: !!symbol && !loading
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://project-zenith-zexd.vercel.app';

                // 1. Fetch REAL stock data from Alpha Vantage GLOBAL_QUOTE via backend
                const quoteRes = await fetch(`${apiUrl}/api/v1/stocks/quote/${symbol.toUpperCase()}`);
                const quoteData = await quoteRes.json();

                let stockInfo: StockData;

                if (quoteData.status === 'success' && quoteData.data) {
                    // Use real data from Alpha Vantage GLOBAL_QUOTE endpoint
                    const data = quoteData.data;
                    stockInfo = {
                        symbol: data.symbol || symbol.toUpperCase(),
                        name: data.name || `${symbol.toUpperCase()} Inc.`,
                        description: `Real-time quote for ${symbol.toUpperCase()}.`,
                        price_usd: data.price_usd || 0,
                        price_change_24h: data.price_change_24h || 0,
                        zenith_score: data.zenith_score || 50,
                        volume_24h: data.volume_24h || 0,
                        market_cap: data.market_cap || 0,
                        sector: data.sector || 'Technology',
                        industry: data.industry || 'General',
                        beta: data.beta || 1.0
                    };
                } else {
                    // Fallback to mock data if API fails
                    console.warn('Stock quote API failed, using fallback data');
                    const fallbackPrice = 150.0;
                    const fallbackScore = 50;
                    stockInfo = {
                        symbol: symbol.toUpperCase(),
                        name: `${symbol.toUpperCase()} Inc.`,
                        description: `Stock data for ${symbol.toUpperCase()}.`,
                        price_usd: fallbackPrice,
                        price_change_24h: 0,
                        zenith_score: fallbackScore,
                        volume_24h: 10000000,
                        market_cap: 100000000000,
                        sector: 'Technology',
                        industry: 'General',
                        beta: 1.0
                    };
                }

                setStock(stockInfo);

                // Fetch real historical data based on timeframe
                const timeRange = getTimeRange(chartTimeframe);
                const candles = await getStockCandles(symbol.toUpperCase(), timeRange.resolution, timeRange.from, timeRange.to);

                if (candles) {
                    setHistory(transformCandleData(candles, stockInfo.zenith_score));
                } else {
                    // Fallback to mock data
                    setHistory(generateHistory(stockInfo.price_usd, stockInfo.zenith_score));
                }

                // 2. Fetch real peers from new endpoint
                const peersRes = await fetch(`${apiUrl}/api/v1/stocks/${symbol}/peers`);
                const peersData = await peersRes.json();
                if (peersData.status === 'success') {
                    setPeers(peersData.peers);
                }
            } catch (error) {
                console.error("Failed to fetch stock data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();

        // Auto-refresh for live data (every minute for short timeframes)
        const shouldAutoRefresh = ['1m', '5m', '15m', '30m', '1h'].includes(chartTimeframe);
        let refreshInterval: NodeJS.Timeout | null = null;

        if (shouldAutoRefresh) {
            refreshInterval = setInterval(fetchData, 60000); // Refresh every minute
        }

        return () => {
            if (refreshInterval) clearInterval(refreshInterval);
        };
    }, [symbol, chartTimeframe]); // Re-fetch when timeframe changes

    if (loading) return (
        <div className="min-h-screen bg-[var(--background-dark)] flex items-center justify-center text-gray-500 animate-pulse">
            Loading {symbol}...
        </div>
    );

    if (!stock) return null;

    const signal = getZenithSignal(stock.zenith_score);
    const isPositive = stock.price_change_24h >= 0;
    const predictions = generatePredictions(stock.price_usd, stock.zenith_score);
    // Define scoreColor properly
    const scoreColor = stock.zenith_score >= 80 ? 'green' : stock.zenith_score >= 60 ? 'blue' : stock.zenith_score >= 40 ? 'yellow' : 'red';
    const scoreText = stock.zenith_score >= 80 ? 'Strong Buy' : stock.zenith_score >= 60 ? 'Buy' : stock.zenith_score >= 40 ? 'Hold' : 'Avoid';

    return (
        <div className="theme-stock min-h-screen bg-[#F3F4F6] text-slate-800 pb-20 font-sans">

            {/* 1. Header Section */}
            <div className="bg-white border-b border-gray-200 sticky top-16 z-20 shadow-sm">
                <div className="container mx-auto px-4 py-3">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-4 w-full md:w-auto">
                            <Link href="/stocks" className="text-gray-400 hover:text-blue-600 transition-colors">
                                <ArrowLeft size={20} />
                            </Link>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                    {stock.symbol}
                                    <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded border border-gray-200 uppercase font-medium">NYSE</span>
                                </h1>
                                <div className="text-xs text-gray-500 flex items-center gap-2">
                                    {stock.sector} • {stock.industry}
                                </div>
                            </div>
                        </div>

                        {/* Search Bar in Header */}
                        <div className="flex-1 w-full max-w-md mx-4 hidden md:block">
                            <PredictiveSearch mode="stock" behavior="navigate" className="w-full" placeholder="Search another ticker..." />
                        </div>

                        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                            <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"><Bell size={18} /></button>
                            <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"><Share2 size={18} /></button>
                            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold shadow-sm hover:bg-blue-700 transition-colors">
                                Trade This
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Top Bar: Key Stats Ticker (Simplified) */}
            <div className="bg-slate-900 text-white py-2 overflow-hidden">
                <div className="container mx-auto px-4 flex justify-between text-xs font-mono opacity-80">
                    <span>MARKET STATUS: OPEN</span>
                    <span className="flex gap-4">
                        <span>SPY: $542.10 (+0.5%)</span>
                        <span>QQQ: $480.22 (+0.8%)</span>
                        <span>VIX: 12.4 (-2.1%)</span>
                    </span>
                </div>
            </div>

            <main className="container mx-auto px-4 py-8">

                {/* 3-Column Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                    {/* LEFT COLUMN (3/12 - 25%) - Score Intelligence */}
                    <div className="lg:col-span-3 space-y-6">

                        {/* ZENITH SCORE CARD */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 overflow-hidden relative">
                            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${stock.zenith_score >= 80 ? 'from-green-100 to-transparent' : stock.zenith_score <= 40 ? 'from-red-100 to-transparent' : 'from-blue-100 to-transparent'} rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none`} />

                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Zenith Score</h3>
                            <div className="flex items-end gap-2 mb-4">
                                <span className={`text-6xl font-black ${stock.zenith_score >= 60 ? 'text-green-600' : stock.zenith_score <= 40 ? 'text-red-600' : 'text-blue-600'}`}>
                                    {stock.zenith_score}
                                </span>
                                <span className="text-gray-400 font-bold mb-2">/100</span>
                            </div>

                            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mb-6 ${signal.bg} bg-opacity-10 ${signal.text ? signal.text.replace('text-', 'text-') : 'text-gray-700'}`}>
                                <Activity size={12} /> {signal.label}
                            </div>

                            <div className="space-y-4 pt-4 border-t border-gray-100">
                                <div className="space-y-1">
                                    <div className="flex justify-between text-xs font-medium">
                                        <span className="text-gray-500">Market Strength</span>
                                        <span className="text-gray-900">85/100</span>
                                    </div>
                                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-blue-500 w-[85%]" />
                                    </div>
                                    <p className="text-[10px] text-gray-400 leading-tight">High momentum confirmed by volume.</p>
                                </div>

                                <div className="space-y-1">
                                    <div className="flex justify-between text-xs font-medium">
                                        <span className="text-gray-500">Risk Awareness</span>
                                        <span className="text-gray-900">70/100</span>
                                    </div>
                                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-yellow-500 w-[70%]" />
                                    </div>
                                    <p className="text-[10px] text-gray-400 leading-tight">Moderate volatility, manageable drawdowns.</p>
                                </div>
                            </div>
                        </div>

                        {/* Recent Signals / News */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-4">
                                <Zap size={16} className="text-yellow-500" /> Recent Signals
                            </h3>
                            <div className="space-y-4">
                                {[1, 2, 3].map((_, i) => (
                                    <div key={i} className="flex gap-3 items-start border-l-2 border-gray-100 pl-3 py-1">
                                        <div className="flex-1">
                                            <div className="text-xs font-bold text-gray-700">MACD Crossover</div>
                                            <div className="text-[10px] text-gray-400">2 hours ago</div>
                                        </div>
                                        <span className="text-xs font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded">BULL</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Predictions Table (Trust Engine) */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                            <h3 className="text-sm font-bold text-gray-900 mb-3">Prediction History</h3>
                            <div className="space-y-3">
                                {predictions.slice(0, 2).map((p, i) => (
                                    <div key={i} className="flex justify-between items-center text-xs">
                                        <span className="text-gray-500">{p.date}</span>
                                        <span className={`font-bold ${p.score >= 60 ? 'text-green-600' : 'text-red-600'}`}>{p.outcome}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>

                    {/* CENTER COLUMN (6/12 - 50%) - Interactive Chart */}
                    <div className="lg:col-span-6 space-y-6">
                        <StockChartSection
                            symbol={stock.symbol}
                            initialPrice={stock.price_usd}
                            zenithScore={stock.zenith_score}
                            isPositive={isPositive}
                            change24h={stock.price_change_24h}
                        />


                    </div>

                    {/* RIGHT COLUMN (3/12 - 25%) - Metrics & Fundamentals */}
                    <div className="lg:col-span-3 space-y-6">

                        {/* Key Metrics Panel */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                            <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <BarChart2 size={16} className="text-gray-400" /> Fundamentals
                            </h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center py-2 border-b border-gray-50">
                                    <span className="text-xs text-gray-500">Market Cap</span>
                                    <span className="text-sm font-bold text-gray-900 font-mono">{(stock.market_cap / 1e9).toFixed(2)}B</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-gray-50">
                                    <span className="text-xs text-gray-500">Volume (24h)</span>
                                    <span className="text-sm font-bold text-gray-900 font-mono">{(stock.volume_24h / 1e6).toFixed(1)}M</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-gray-50">
                                    <span className="text-xs text-gray-500">Beta (Volatility)</span>
                                    <span className="text-sm font-bold text-gray-900 font-mono">{stock.beta}</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-gray-50">
                                    <span className="text-xs text-gray-500">P/E Ratio</span>
                                    <span className="text-sm font-bold text-gray-900 font-mono">24.5</span>
                                </div>
                            </div>
                        </div>

                        {/* Sector Rank */}
                        <div className="bg-blue-50 rounded-xl border border-blue-100 p-5">
                            <h3 className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-1">Sector Rank</h3>
                            <div className="text-lg font-bold text-gray-900 mb-2">Top 15%</div>
                            <p className="text-xs text-blue-800/70 leading-relaxed">
                                {stock.symbol} is outperforming 85% of other assets in the <strong>{stock.sector}</strong> sector this month.
                            </p>
                        </div>

                        {/* Score Context */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                            <h3 className="text-sm font-bold text-gray-900 mb-2">Analyst Note</h3>
                            <p className="text-xs text-gray-600 leading-relaxed">
                                <span className={`font-bold text-${scoreColor}-600`}>{stock.symbol} is rated {scoreText}</span> because it displays
                                consistent upward momentum combined with volume levels {stock.volume_24h > 1000000 ? 'above' : 'aligned with'} average.
                            </p>
                        </div>

                        {/* User Notes (Placeholder) */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 opacity-60 grayscale">
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="text-sm font-bold text-gray-900">Notes</h3>
                                <span className="text-[10px] bg-gray-100 px-1 rounded">PRO</span>
                            </div>
                            <textarea disabled placeholder="Upgrade to PRO to add personal analyst notes..." className="w-full h-24 bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs resize-none" />
                        </div>

                    </div>
                </div>
            </main>
        </div>
    );
}
