'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
    ArrowLeft, ArrowUp, ArrowDown, Activity, Zap, TrendingUp,
    Bell, BarChart2, Share2, Clock, Globe, RefreshCw
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ComposedChart, Area } from 'recharts';
import { getZenithSignal } from '@/lib/zenith';
import Link from 'next/link';
import { getForexRates, getForexCandles, getTimeRange, ALL_FOREX_PAIRS } from '@/lib/finnhub';
import ZenithRealtimeChart, { ChartRef } from '@/components/ZenithRealtimeChart';
import { useMarketData } from '@/hooks/useMarketData';

interface ForexData {
    pair: string;
    base: string;
    quote: string;
    name: string;
    rate: number;
    change_24h: number;
    zenith_score: number;
    high_24h: number;
    low_24h: number;
    volume: number;
}

// Transform Finnhub candle data for chart
const transformCandleData = (candles: any) => {
    if (!candles || !candles.t || candles.t.length === 0) return [];

    return candles.t.map((timestamp: number, index: number) => {
        const date = new Date(timestamp * 1000);
        return {
            date: date.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
            rate: candles.c[index], // close price
            high: candles.h[index],
            low: candles.l[index],
            open: candles.o[index],
            volume: candles.v[index],
            score: Math.floor(50 + Math.random() * 30) // Mock Zenith score for now
        };
    });
};

// Timeframe configurations for forex (shorter timeframes for intraday trading)
const FOREX_TIMEFRAME_CONFIG: Record<string, number> = {
    '1D': 1,
    '1W': 7,
    '1M': 30,
    '3M': 90,
    '1Y': 365
};

// Custom Forex Chart Section Component
const ForexChartSection = ({ pair, initialRate, zenithScore, isPositive, change24h }: any) => {
    const [selectedTimeframe, setSelectedTimeframe] = useState('1M');
    const days = FOREX_TIMEFRAME_CONFIG[selectedTimeframe] || 30;

    const { currentPrice, history, lastTick } = useMarketData({
        initialPrice: initialRate,
        volatility: 0.02, // Lower volatility for forex
        intervalMs: 2000,
        symbol: pair,
        days
    });

    const chartRef = useRef<ChartRef>(null);

    // Sync live ticks
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
        <div className="bg-[#1A1A22] rounded-xl border border-gray-800 p-6 h-[500px] flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <motion.div
                        initial={{ opacity: 0.8 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        key={currentPrice}
                        className="text-3xl font-bold text-white font-mono tracking-tight"
                    >
                        {currentPrice.toFixed(4)}
                    </motion.div>
                    <div className={`text-sm font-bold flex items-center gap-1 ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                        {isPositive ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                        {Math.abs(change24h).toFixed(2)}%
                        <span className="text-gray-500 font-normal ml-1 flex items-center gap-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> LIVE
                        </span>
                    </div>
                </div>

                <div className="flex gap-2">
                    <button className="px-3 py-1.5 text-xs font-bold rounded border bg-blue-500/10 border-blue-500/30 text-blue-400">
                        ZENITH: {zenithScore}
                    </button>
                    <div className="bg-gray-800 rounded-lg p-1 flex gap-1">
                        {Object.keys(FOREX_TIMEFRAME_CONFIG).map(tf => (
                            <button
                                key={tf}
                                onClick={() => setSelectedTimeframe(tf)}
                                className={`px-2 py-1 text-xs font-bold rounded transition-all ${tf === selectedTimeframe
                                        ? 'bg-gray-700 text-white'
                                        : 'text-gray-500 hover:text-gray-300'
                                    }`}
                            >
                                {tf}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="flex-1 w-full relative">
                <ZenithRealtimeChart
                    ref={chartRef}
                    data={history}
                    height={380}
                    colors={{
                        backgroundColor: 'transparent',
                        lineColor: '#3B82F6',
                        areaTopColor: 'rgba(59, 130, 246, 0.2)',
                        areaBottomColor: 'rgba(59, 130, 246, 0.0)',
                        textColor: '#6B7280'
                    }}
                />
            </div>

            <div className="mt-2 flex justify-between text-[10px] text-gray-500 font-mono uppercase">
                <span>Real-time Data</span>
                <span>Timeframe: {selectedTimeframe}</span>
            </div>
        </div>
    );
};

export default function ForexDetailPage() {
    const params = useParams();
    const pairParam = typeof params.pair === 'string' ? params.pair : 'EUR-USD';
    const pair = pairParam.replace('-', '/').toUpperCase();

    const [forex, setForex] = useState<ForexData | null>(null);
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [chartTimeframe, setChartTimeframe] = useState('3M');
    const [showScoreOverlay, setShowScoreOverlay] = useState(true);
    const [lastUpdate, setLastUpdate] = useState(new Date());

    const fetchData = async () => {
        try {
            // Get pair info from our list
            const pairInfo = ALL_FOREX_PAIRS[pair as keyof typeof ALL_FOREX_PAIRS];
            if (!pairInfo) {
                console.error(`Pair ${pair} not found`);
                setLoading(false);
                return;
            }

            // Fetch real forex rates from Finnhub
            const rates = await getForexRates(pairInfo.base);

            let rate = 1;
            if (rates?.quote) {
                rate = rates.quote[pairInfo.quote] || 1;
            }

            // Calculate mock data for display
            const mockChange = (Math.random() - 0.5) * 2;
            const mockScore = Math.floor(40 + Math.random() * 40);

            const forexData: ForexData = {
                pair: pair,
                base: pairInfo.base,
                quote: pairInfo.quote,
                name: pairInfo.name,
                rate: rate,
                change_24h: mockChange,
                zenith_score: mockScore,
                high_24h: rate * 1.005,
                low_24h: rate * 0.995,
                volume: Math.floor(Math.random() * 1000000000)
            };

            setForex(forexData);

            // Fetch real historical candle data based on timeframe
            const timeRange = getTimeRange(chartTimeframe);
            const candleData = await getForexCandles(pair, timeRange.resolution, timeRange.from, timeRange.to);

            if (candleData) {
                const transformedData = transformCandleData(candleData);
                setHistory(transformedData);
            } else {
                console.warn('No forex candle data available');
                setHistory([]);
            }

            setLastUpdate(new Date());
        } catch (error) {
            console.error('Failed to fetch forex data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
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
    }, [pair, chartTimeframe]);

    if (loading) return (
        <div className="min-h-screen bg-[#0D0D12] flex items-center justify-center text-gray-500 animate-pulse">
            Loading {pair}...
        </div>
    );

    if (!forex) return (
        <div className="min-h-screen bg-[#0D0D12] flex items-center justify-center text-gray-500">
            Pair not found: {pair}
        </div>
    );

    const signal = getZenithSignal(forex.zenith_score);
    const isPositive = forex.change_24h >= 0;

    return (
        <div className="theme-forex min-h-screen bg-[#0D0D12] text-gray-100 pb-20">

            {/* Header */}
            <div className="bg-[#14141A] border-b border-gray-800 sticky top-16 z-20">
                <div className="container mx-auto px-4 py-3">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-4 w-full md:w-auto">
                            <Link href="/forex" className="text-gray-500 hover:text-blue-400 transition-colors">
                                <ArrowLeft size={20} />
                            </Link>
                            <div>
                                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                                    {forex.pair}
                                    <span className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded border border-blue-500/30 uppercase font-medium">FOREX</span>
                                </h1>
                                <div className="text-xs text-gray-500 flex items-center gap-2">
                                    {forex.name}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                            <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                <Clock size={12} />
                                <span>Updated {lastUpdate.toLocaleTimeString()}</span>
                            </div>
                            <button onClick={fetchData} className="p-2 hover:bg-gray-800 rounded-lg text-gray-400">
                                <RefreshCw size={18} />
                            </button>
                            <button className="p-2 hover:bg-gray-800 rounded-lg text-gray-400"><Bell size={18} /></button>
                            <button className="p-2 hover:bg-gray-800 rounded-lg text-gray-400"><Share2 size={18} /></button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Market Status Bar */}
            <div className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 py-2">
                <div className="container mx-auto px-4 flex justify-between text-xs font-mono text-gray-300">
                    <span className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                        FOREX MARKET: 24/5
                    </span>
                    <span className="flex gap-4">
                        <span>EUR/USD: 1.0892</span>
                        <span>GBP/USD: 1.2701</span>
                        <span>USD/JPY: 149.32</span>
                    </span>
                </div>
            </div>

            <main className="container mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                    {/* LEFT COLUMN - Score */}
                    <div className="lg:col-span-3 space-y-6">
                        {/* Zenith Score Card */}
                        <div className="bg-[#1A1A22] rounded-xl border border-gray-800 p-6 relative overflow-hidden">
                            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${forex.zenith_score >= 60 ? 'from-green-500/20' : 'from-blue-500/20'} rounded-full blur-2xl -mr-10 -mt-10`} />

                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Zenith Score</h3>
                            <div className="flex items-end gap-2 mb-4">
                                <span className={`text-6xl font-black ${forex.zenith_score >= 60 ? 'text-green-400' : forex.zenith_score <= 40 ? 'text-red-400' : 'text-blue-400'}`}>
                                    {forex.zenith_score}
                                </span>
                                <span className="text-gray-600 font-bold mb-2">/100</span>
                            </div>

                            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${signal.bg} bg-opacity-20 ${signal.text}`}>
                                <Activity size={12} /> {signal.label}
                            </div>

                            <div className="space-y-4 pt-4 mt-4 border-t border-gray-800">
                                <div className="space-y-1">
                                    <div className="flex justify-between text-xs font-medium">
                                        <span className="text-gray-500">Trend Strength</span>
                                        <span className="text-gray-300">{Math.floor(60 + Math.random() * 25)}/100</span>
                                    </div>
                                    <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                                        <div className="h-full bg-blue-500" style={{ width: '75%' }} />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <div className="flex justify-between text-xs font-medium">
                                        <span className="text-gray-500">Volatility</span>
                                        <span className="text-gray-300">{Math.floor(30 + Math.random() * 40)}/100</span>
                                    </div>
                                    <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                                        <div className="h-full bg-yellow-500" style={{ width: '50%' }} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Session Info */}
                        <div className="bg-[#1A1A22] rounded-xl border border-gray-800 p-5">
                            <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
                                <Globe size={16} className="text-blue-400" /> Trading Sessions
                            </h3>
                            <div className="space-y-3">
                                {['London', 'New York', 'Tokyo', 'Sydney'].map((session, i) => (
                                    <div key={session} className="flex justify-between items-center text-xs">
                                        <span className="text-gray-400">{session}</span>
                                        <span className={`font-bold ${i < 2 ? 'text-green-400' : 'text-gray-600'}`}>
                                            {i < 2 ? 'ACTIVE' : 'CLOSED'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* CENTER COLUMN - Chart */}
                    <div className="lg:col-span-6 space-y-6">
                        <ForexChartSection
                            pair={forex.pair}
                            initialRate={forex.rate}
                            zenithScore={forex.zenith_score}
                            isPositive={isPositive}
                            change24h={forex.change_24h}
                        />

                        {/* Related Pairs */}
                        <div className="bg-[#1A1A22] rounded-xl border border-gray-800 p-6">
                            <h3 className="text-sm font-bold text-white mb-4">Related Pairs</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {Object.entries(ALL_FOREX_PAIRS).slice(0, 8).map(([pairKey, info]) => (
                                    <Link
                                        key={pairKey}
                                        href={`/forex/${pairKey.replace('/', '-').toLowerCase()}`}
                                        className="bg-gray-800/50 p-3 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer"
                                    >
                                        <div className="text-sm font-bold text-white">{pairKey}</div>
                                        <div className="text-xs text-gray-500">{info.name}</div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN - Metrics */}
                    <div className="lg:col-span-3 space-y-6">
                        <div className="bg-[#1A1A22] rounded-xl border border-gray-800 p-5">
                            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                                <BarChart2 size={16} className="text-gray-500" /> Key Metrics
                            </h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center py-2 border-b border-gray-800">
                                    <span className="text-xs text-gray-500">24h High</span>
                                    <span className="text-sm font-bold text-white font-mono">{forex.high_24h.toFixed(4)}</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-gray-800">
                                    <span className="text-xs text-gray-500">24h Low</span>
                                    <span className="text-sm font-bold text-white font-mono">{forex.low_24h.toFixed(4)}</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-gray-800">
                                    <span className="text-xs text-gray-500">Spread</span>
                                    <span className="text-sm font-bold text-white font-mono">0.8 pips</span>
                                </div>
                                <div className="flex justify-between items-center py-2">
                                    <span className="text-xs text-gray-500">Volume</span>
                                    <span className="text-sm font-bold text-white font-mono">${(forex.volume / 1e9).toFixed(1)}B</span>
                                </div>
                            </div>
                        </div>

                        {/* Signals */}
                        <div className="bg-[#1A1A22] rounded-xl border border-gray-800 p-5">
                            <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
                                <Zap size={16} className="text-yellow-400" /> Recent Signals
                            </h3>
                            <div className="space-y-3">
                                {[
                                    { signal: 'RSI Oversold', time: '1h ago', type: 'BULL' },
                                    { signal: 'Support Test', time: '3h ago', type: 'NEUTRAL' },
                                    { signal: 'MACD Cross', time: '6h ago', type: 'BULL' }
                                ].map((s, i) => (
                                    <div key={i} className="flex justify-between items-center py-2 border-l-2 border-gray-700 pl-3">
                                        <div>
                                            <div className="text-xs font-bold text-gray-300">{s.signal}</div>
                                            <div className="text-[10px] text-gray-500">{s.time}</div>
                                        </div>
                                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${s.type === 'BULL' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                                            {s.type}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Analyst Note */}
                        <div className="bg-gradient-to-br from-blue-900/30 to-purple-900/30 rounded-xl border border-blue-500/30 p-5">
                            <h3 className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-2">Analysis</h3>
                            <p className="text-xs text-gray-300 leading-relaxed">
                                <strong>{forex.pair}</strong> is showing {forex.zenith_score >= 60 ? 'bullish' : forex.zenith_score <= 40 ? 'bearish' : 'neutral'} momentum
                                with the current rate at {forex.rate.toFixed(4)}. Watch for key resistance at {(forex.rate * 1.01).toFixed(4)}.
                            </p>
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <div className="py-4 text-center text-gray-600 text-xs">
                Real-time forex rates • Updates every minute • Powered by Finnhub
            </div>
        </div>
    );
}
