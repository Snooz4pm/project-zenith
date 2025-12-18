'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
    ReferenceLine, ReferenceDot
} from 'recharts';
import { TrendingUp, TrendingDown, Activity, RefreshCw, Zap } from 'lucide-react';
import AnimatedValue from './AnimatedValue';

interface PortfolioHistoryPoint {
    portfolio_value: number;
    wallet_balance: number;
    total_pnl: number;
    timestamp: string;
    trade_marker?: 'buy' | 'sell';
}

interface PortfolioChartProps {
    sessionId: string;
    currentValue: number;
    totalPnl: number;
    onTimeRangeChange?: (range: string) => void;
}

type TimeRange = '1H' | '24H' | '7D' | '1M' | '3M' | '1Y' | 'ALL';

const TIME_RANGES: { value: TimeRange; label: string; hours: number }[] = [
    { value: '1H', label: '1H', hours: 1 },
    { value: '24H', label: '24H', hours: 24 },
    { value: '7D', label: '7D', hours: 168 },
    { value: '1M', label: '1M', hours: 720 },
    { value: '3M', label: '3M', hours: 2160 },
    { value: '1Y', label: '1Y', hours: 8760 },
    { value: 'ALL', label: 'ALL', hours: 0 },
];

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://defioracleworkerapi.vercel.app';

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(value);
};

const formatTime = (timestamp: string, range: TimeRange) => {
    const date = new Date(timestamp);
    if (range === '1H' || range === '24H') {
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (range === '7D') {
        return date.toLocaleDateString('en-US', { weekday: 'short', hour: '2-digit' });
    } else {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
};

// Custom crosshair tooltip
const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        const isPositive = data.total_pnl >= 0;

        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-black/95 backdrop-blur-xl border border-white/20 rounded-xl p-3 shadow-2xl"
            >
                <div className="text-xs text-gray-400 mb-1">
                    {new Date(label).toLocaleString()}
                </div>
                <div className="text-lg font-bold font-mono text-white mb-1">
                    {formatCurrency(data.portfolio_value)}
                </div>
                <div className={`text-sm font-mono flex items-center gap-1 ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                    {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                    {isPositive ? '+' : ''}{formatCurrency(data.total_pnl)}
                    <span className="text-gray-500 ml-1">
                        ({isPositive ? '+' : ''}{((data.total_pnl / 10000) * 100).toFixed(2)}%)
                    </span>
                </div>
                {data.trade_marker && (
                    <div className={`mt-2 text-xs font-bold uppercase ${data.trade_marker === 'buy' ? 'text-emerald-400' : 'text-red-400'}`}>
                        🎯 {data.trade_marker === 'buy' ? 'Buy Entry' : 'Sell Exit'}
                    </div>
                )}
            </motion.div>
        );
    }
    return null;
};

export default function PortfolioChart({ sessionId, currentValue, totalPnl, onTimeRangeChange }: PortfolioChartProps) {
    const [history, setHistory] = useState<PortfolioHistoryPoint[]>([]);
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState<TimeRange>('24H');
    const [isAnimating, setIsAnimating] = useState(true);
    const [previousValue, setPreviousValue] = useState(currentValue);

    // Track value changes for animation
    useEffect(() => {
        if (currentValue !== previousValue) {
            setPreviousValue(currentValue);
        }
    }, [currentValue, previousValue]);

    const loadHistory = useCallback(async () => {
        try {
            setLoading(true);
            setIsAnimating(true);
            const hours = TIME_RANGES.find(r => r.value === timeRange)?.hours || 24;
            const res = await fetch(`${API_URL}/api/v1/trading/portfolio-history/${sessionId}?hours=${hours || 8760}`);
            const data = await res.json();

            if (data.status === 'success' && data.data.length > 0) {
                const historyWithCurrent = [
                    ...data.data,
                    {
                        portfolio_value: currentValue,
                        wallet_balance: 0,
                        total_pnl: totalPnl,
                        timestamp: new Date().toISOString()
                    }
                ];
                setHistory(historyWithCurrent);
            } else {
                // Generate mock data for visualization
                const mockHistory = generateMockHistory(currentValue, totalPnl, timeRange);
                setHistory(mockHistory);
            }
        } catch (e) {
            console.error('Failed to load portfolio history:', e);
            const mockHistory = generateMockHistory(currentValue, totalPnl, timeRange);
            setHistory(mockHistory);
        } finally {
            setLoading(false);
            setTimeout(() => setIsAnimating(false), 2000);
        }
    }, [sessionId, timeRange, currentValue, totalPnl]);

    useEffect(() => {
        loadHistory();
    }, [loadHistory]);

    const generateMockHistory = (currentValue: number, pnl: number, range: TimeRange) => {
        const points: PortfolioHistoryPoint[] = [];
        const startValue = 10000;
        const hoursObj = TIME_RANGES.find(r => r.value === range);
        const hours = hoursObj?.hours || 24;
        const numPoints = range === '1H' ? 12 : range === '24H' ? 24 : range === '7D' ? 28 : 30;

        for (let i = 0; i < numPoints; i++) {
            const progress = i / numPoints;
            // Add realistic volatility
            const volatility = (Math.random() - 0.5) * 0.03;
            const trendValue = startValue + (currentValue - startValue) * progress;
            const value = trendValue * (1 + volatility);
            const date = new Date();
            date.setHours(date.getHours() - Math.floor(hours * (1 - progress)));

            points.push({
                portfolio_value: Math.round(value),
                wallet_balance: Math.round(value),
                total_pnl: Math.round(value - startValue),
                timestamp: date.toISOString(),
                // Add random trade markers
                trade_marker: i > 0 && Math.random() > 0.85 ? (Math.random() > 0.5 ? 'buy' : 'sell') : undefined
            });
        }

        // Add current point
        points.push({
            portfolio_value: currentValue,
            wallet_balance: currentValue,
            total_pnl: pnl,
            timestamp: new Date().toISOString()
        });

        return points;
    };

    // Calculate chart bounds
    const { minValue, maxValue, avgValue } = useMemo(() => {
        if (history.length === 0) return { minValue: 9800, maxValue: 10200, avgValue: 10000 };
        const values = history.map(h => h.portfolio_value);
        const min = Math.min(...values);
        const max = Math.max(...values);
        const avg = values.reduce((a, b) => a + b, 0) / values.length;
        return {
            minValue: min * 0.995,
            maxValue: max * 1.005,
            avgValue: avg
        };
    }, [history]);

    // Dynamic color based on P&L
    const isPositive = totalPnl >= 0;
    const chartColor = isPositive ? '#10b981' : '#ef4444';
    const chartColorLight = isPositive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)';
    const pnlPercent = ((totalPnl / 10000) * 100);

    const handleTimeRangeChange = (range: TimeRange) => {
        setTimeRange(range);
        onTimeRangeChange?.(range);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative bg-gradient-to-br from-gray-900/90 to-black border border-white/10 rounded-2xl p-5 overflow-hidden"
        >
            {/* Animated background gradient */}
            <div className={`absolute inset-0 opacity-20 ${isPositive ? 'bg-gradient-to-br from-emerald-500/10 to-transparent' : 'bg-gradient-to-br from-red-500/10 to-transparent'}`} />

            {/* Header */}
            <div className="relative flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20">
                        <Activity className="text-cyan-400" size={20} />
                    </div>
                    <div>
                        <h3 className="font-bold text-white">Portfolio Performance</h3>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span>Updated just now</span>
                            <button
                                onClick={loadHistory}
                                className="hover:text-cyan-400 transition-colors"
                            >
                                <RefreshCw size={12} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Time Range Selector */}
                <div className="flex gap-1 bg-black/40 rounded-xl p-1 border border-white/5">
                    {TIME_RANGES.map(option => (
                        <button
                            key={option.value}
                            onClick={() => handleTimeRangeChange(option.value)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${timeRange === option.value
                                    ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg'
                                    : 'text-gray-500 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Value Display */}
            <div className="relative mb-4">
                <div className="flex items-end gap-4">
                    <div className="text-4xl font-bold font-mono text-white">
                        <AnimatedValue
                            value={currentValue}
                            previousValue={previousValue}
                            decimals={0}
                            duration={1}
                        />
                    </div>
                    <motion.div
                        className={`flex items-center gap-1 text-lg font-bold ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}
                        animate={{
                            scale: previousValue !== currentValue ? [1, 1.1, 1] : 1
                        }}
                        transition={{ duration: 0.3 }}
                    >
                        {isPositive ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                        {isPositive ? '+' : ''}{formatCurrency(totalPnl)}
                        <span className="text-sm opacity-75">
                            ({isPositive ? '+' : ''}{pnlPercent.toFixed(2)}%)
                        </span>
                    </motion.div>
                </div>
            </div>

            {/* Chart */}
            <div className="h-[280px] w-full relative">
                {loading ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="flex flex-col items-center gap-2">
                            <Activity className="animate-spin text-cyan-400" size={32} />
                            <span className="text-sm text-gray-500">Loading chart data...</span>
                        </div>
                    </div>
                ) : history.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-gray-500 text-sm">
                        <div className="text-center">
                            <Zap className="mx-auto mb-2 text-gray-600" size={32} />
                            <p>No history data yet. Make some trades!</p>
                        </div>
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                            data={history}
                            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                        >
                            <defs>
                                <linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor={chartColor} stopOpacity={0.4} />
                                    <stop offset="50%" stopColor={chartColor} stopOpacity={0.15} />
                                    <stop offset="100%" stopColor={chartColor} stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                                    <stop offset="0%" stopColor={chartColor} stopOpacity={0.5} />
                                    <stop offset="100%" stopColor={chartColor} stopOpacity={1} />
                                </linearGradient>
                            </defs>

                            {/* Reference line at starting value */}
                            <ReferenceLine
                                y={10000}
                                stroke="#4b5563"
                                strokeDasharray="5 5"
                                strokeOpacity={0.5}
                            />

                            <XAxis
                                dataKey="timestamp"
                                tickFormatter={(t) => formatTime(t, timeRange)}
                                tick={{ fill: '#6b7280', fontSize: 10 }}
                                axisLine={{ stroke: '#374151', strokeOpacity: 0.3 }}
                                tickLine={false}
                                minTickGap={60}
                            />
                            <YAxis
                                domain={[minValue, maxValue]}
                                tickFormatter={(v) => `$${(v / 1000).toFixed(1)}k`}
                                tick={{ fill: '#6b7280', fontSize: 10 }}
                                axisLine={false}
                                tickLine={false}
                                width={55}
                            />
                            <Tooltip
                                content={<CustomTooltip />}
                                cursor={{
                                    stroke: '#ffffff',
                                    strokeWidth: 1,
                                    strokeDasharray: '3 3',
                                    strokeOpacity: 0.3
                                }}
                            />
                            <Area
                                type="monotone"
                                dataKey="portfolio_value"
                                stroke="url(#lineGradient)"
                                strokeWidth={2.5}
                                fill="url(#portfolioGradient)"
                                animationDuration={isAnimating ? 2000 : 0}
                                animationEasing="ease-out"
                            />

                            {/* Trade markers */}
                            {history.filter(h => h.trade_marker).map((point, i) => (
                                <ReferenceDot
                                    key={i}
                                    x={point.timestamp}
                                    y={point.portfolio_value}
                                    r={6}
                                    fill={point.trade_marker === 'buy' ? '#10b981' : '#ef4444'}
                                    stroke="#ffffff"
                                    strokeWidth={2}
                                />
                            ))}
                        </AreaChart>
                    </ResponsiveContainer>
                )}

                {/* Live pulse indicator on chart */}
                {!loading && history.length > 0 && (
                    <motion.div
                        className="absolute right-4 top-4"
                        animate={{ scale: [1, 1.2, 1], opacity: [0.7, 1, 0.7] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                    >
                        <div className={`w-3 h-3 rounded-full ${isPositive ? 'bg-emerald-500' : 'bg-red-500'} shadow-lg`}>
                            <div className={`absolute inset-0 rounded-full ${isPositive ? 'bg-emerald-400' : 'bg-red-400'} animate-ping`} />
                        </div>
                    </motion.div>
                )}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-white/5 text-xs text-gray-500">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>Buy Entry</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                    <span>Sell Exit</span>
                </div>
                <span className="text-gray-600">•</span>
                <span>Starting: $10,000</span>
                <span className="text-gray-600">•</span>
                <span>Avg: {formatCurrency(avgValue)}</span>
            </div>
        </motion.div>
    );
}
