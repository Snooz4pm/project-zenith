'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';

interface PortfolioHistoryPoint {
    portfolio_value: number;
    wallet_balance: number;
    total_pnl: number;
    timestamp: string;
}

interface PortfolioChartProps {
    sessionId: string;
    currentValue: number;
    totalPnl: number;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(value);
};

const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
};

export default function PortfolioChart({ sessionId, currentValue, totalPnl }: PortfolioChartProps) {
    const [history, setHistory] = useState<PortfolioHistoryPoint[]>([]);
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState<24 | 48 | 168>(24);

    useEffect(() => {
        loadHistory();
    }, [sessionId, timeRange]);

    const loadHistory = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${API_URL}/api/v1/trading/portfolio-history/${sessionId}?hours=${timeRange}`);
            const data = await res.json();

            if (data.status === 'success') {
                // Add current value as the last point
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
            }
        } catch (e) {
            console.error('Failed to load portfolio history:', e);
            // If no history, create mock data points
            const mockHistory = generateMockHistory(currentValue, totalPnl);
            setHistory(mockHistory);
        } finally {
            setLoading(false);
        }
    };

    const generateMockHistory = (currentValue: number, pnl: number) => {
        // Generate synthetic history for display
        const points: PortfolioHistoryPoint[] = [];
        const startValue = 10000;
        const hours = timeRange;

        for (let i = 0; i < Math.min(hours / 2, 24); i++) {
            const progress = i / (hours / 2);
            const value = startValue + (currentValue - startValue) * progress * (0.8 + Math.random() * 0.4);
            const date = new Date();
            date.setHours(date.getHours() - (hours - i * 2));

            points.push({
                portfolio_value: value,
                wallet_balance: value,
                total_pnl: value - startValue,
                timestamp: date.toISOString()
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

    // Calculate min/max for chart scaling
    const minValue = history.length > 0 ? Math.min(...history.map(h => h.portfolio_value)) * 0.98 : 9800;
    const maxValue = history.length > 0 ? Math.max(...history.map(h => h.portfolio_value)) * 1.02 : 10200;

    // Determine if trending up or down
    const isPositive = totalPnl >= 0;
    const chartColor = isPositive ? '#10b981' : '#ef4444';
    const gradientId = isPositive ? 'greenGradient' : 'redGradient';

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel rounded-xl p-4"
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Activity className="text-blue-400" size={20} />
                    <h3 className="font-bold">Portfolio Performance</h3>
                </div>

                {/* Time Range Selector */}
                <div className="flex gap-1 bg-white/5 rounded-lg p-1">
                    {[
                        { value: 24, label: '24H' },
                        { value: 48, label: '48H' },
                        { value: 168, label: '7D' },
                    ].map(option => (
                        <button
                            key={option.value}
                            onClick={() => setTimeRange(option.value as any)}
                            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${timeRange === option.value
                                    ? 'bg-white text-black'
                                    : 'text-gray-500 hover:text-white'
                                }`}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-white/5 rounded-lg p-3">
                    <div className="text-xs text-gray-500 uppercase">Current Value</div>
                    <div className="text-xl font-bold font-mono">{formatCurrency(currentValue)}</div>
                </div>
                <div className="bg-white/5 rounded-lg p-3">
                    <div className="text-xs text-gray-500 uppercase">Total P&L</div>
                    <div className={`text-xl font-bold font-mono flex items-center gap-1 ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                        {isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                        {formatCurrency(totalPnl)}
                    </div>
                </div>
            </div>

            {/* Chart */}
            <div className="h-[200px] w-full">
                {loading ? (
                    <div className="h-full flex items-center justify-center text-gray-500">
                        <Activity className="animate-pulse" size={32} />
                    </div>
                ) : history.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-gray-500 text-sm">
                        No history data yet. Make some trades!
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={history} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                            <defs>
                                <linearGradient id="greenGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="redGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <XAxis
                                dataKey="timestamp"
                                tickFormatter={formatTime}
                                tick={{ fill: '#6b7280', fontSize: 10 }}
                                axisLine={{ stroke: '#374151' }}
                                tickLine={false}
                                minTickGap={50}
                            />
                            <YAxis
                                domain={[minValue, maxValue]}
                                tickFormatter={(v) => `$${(v / 1000).toFixed(1)}k`}
                                tick={{ fill: '#6b7280', fontSize: 10 }}
                                axisLine={false}
                                tickLine={false}
                                width={50}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#1f2937',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '8px',
                                    color: '#fff'
                                }}
                                formatter={(value: number) => [formatCurrency(value), 'Portfolio Value']}
                                labelFormatter={(label) => new Date(label).toLocaleString()}
                            />
                            <Area
                                type="monotone"
                                dataKey="portfolio_value"
                                stroke={chartColor}
                                strokeWidth={2}
                                fill={`url(#${gradientId})`}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                )}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-4 mt-4 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                    <span>Profit</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <span>Loss</span>
                </div>
                <span className="text-gray-600">•</span>
                <span>Starting Balance: $10,000</span>
            </div>
        </motion.div>
    );
}
