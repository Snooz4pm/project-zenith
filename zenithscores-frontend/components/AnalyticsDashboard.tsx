import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Activity, PieChart, ShieldAlert } from 'lucide-react';

interface Metrics {
    longest_win_streak: number;
    longest_loss_streak: number;
    current_streak: number;
    max_drawdown: number;
    total_trades: number;
    win_rate: number;
}

interface AnalyticsData {
    exposure: Record<string, number>;
    metrics: Metrics;
}

export function AnalyticsDashboard({ sessionId }: { sessionId: string }) {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAnalytics();
    }, [sessionId]);

    const fetchAnalytics = async () => {
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
            const res = await fetch(`${API_URL}/api/v1/trading/analytics/${sessionId}`);
            const json = await res.json();
            if (json.status === 'success') {
                setData(json.data);
            }
        } catch (e) {
            console.error('Failed to fetch analytics', e);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-400 animate-pulse">Loading Analytics...</div>;
    if (!data) return <div className="p-8 text-center text-gray-400">No data available</div>;

    const { metrics, exposure } = data;

    return (
        <div className="space-y-6 animate-in fade-in zoom-in duration-300">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="p-4 bg-gray-900/50 border-gray-800">
                    <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-4 h-4 text-green-400" />
                        <span className="text-sm text-gray-400">Longest Win Streak</span>
                    </div>
                    <div className="text-2xl font-bold text-white">{metrics.longest_win_streak}</div>
                </Card>

                <Card className="p-4 bg-gray-900/50 border-gray-800">
                    <div className="flex items-center gap-2 mb-2">
                        <TrendingDown className="w-4 h-4 text-red-400" />
                        <span className="text-sm text-gray-400">Longest Loss Streak</span>
                    </div>
                    <div className="text-2xl font-bold text-white">{metrics.longest_loss_streak}</div>
                </Card>

                <Card className="p-4 bg-gray-900/50 border-gray-800">
                    <div className="flex items-center gap-2 mb-2">
                        <ShieldAlert className="w-4 h-4 text-orange-400" />
                        <span className="text-sm text-gray-400">Max Drawdown</span>
                    </div>
                    <div className="text-2xl font-bold text-white">${metrics.max_drawdown.toFixed(2)}</div>
                </Card>

                <Card className="p-4 bg-gray-900/50 border-gray-800">
                    <div className="flex items-center gap-2 mb-2">
                        <Activity className="w-4 h-4 text-blue-400" />
                        <span className="text-sm text-gray-400">Win Rate</span>
                    </div>
                    <div className="text-2xl font-bold text-white">{metrics.win_rate.toFixed(1)}%</div>
                </Card>
            </div>

            {/* Exposure & Streak Status */}
            <div className="grid md:grid-cols-2 gap-6">
                <Card className="p-6 bg-gray-900/50 border-gray-800">
                    <h3 className="text-lg font-medium text-white mb-6 flex items-center gap-2">
                        <PieChart className="w-5 h-5 text-purple-400" />
                        Portfolio Exposure
                    </h3>
                    <div className="space-y-4">
                        {Object.entries(exposure).map(([asset, percent]) => (
                            <div key={asset}>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="capitalize text-gray-300">{asset}</span>
                                    <span className="text-gray-400">{percent.toFixed(1)}%</span>
                                </div>
                                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full ${asset === 'crypto' ? 'bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]' : 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]'}`}
                                        style={{ width: `${percent}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                        {Object.keys(exposure).length === 0 && (
                            <div className="text-gray-500 text-sm">No active positions</div>
                        )}
                    </div>
                </Card>

                <Card className="p-6 bg-gray-900/50 border-gray-800 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        {metrics.current_streak > 0 ? (
                            <TrendingUp className="w-32 h-32 text-green-500" />
                        ) : (
                            <TrendingDown className="w-32 h-32 text-red-500" />
                        )}
                    </div>

                    <h3 className="text-lg font-medium text-white mb-2">Current Momentum</h3>
                    <div className="mt-8">
                        {metrics.current_streak > 0 ? (
                            <div>
                                <div className="text-4xl font-bold text-green-400 mb-2">
                                    🔥 {metrics.current_streak} Wins
                                </div>
                                <p className="text-gray-400">You're on fire! Keep the momentum going.</p>
                            </div>
                        ) : metrics.current_streak < 0 ? (
                            <div>
                                <div className="text-4xl font-bold text-red-400 mb-2">
                                    ❄️ {Math.abs(metrics.current_streak)} Losses
                                </div>
                                <p className="text-gray-400">Cold streak detected. Take a break and review your strategy.</p>
                            </div>
                        ) : (
                            <div>
                                <div className="text-4xl font-bold text-gray-400 mb-2">
                                    Neutral
                                </div>
                                <p className="text-gray-500">Make your next trade count.</p>
                            </div>
                        )}
                    </div>
                </Card>
            </div>

            <div className="p-4 bg-blue-900/10 border border-blue-500/20 rounded-lg">
                <h4 className="text-sm font-medium text-blue-400 mb-1">📢 Zenith Insight</h4>
                <p className="text-sm text-gray-400">
                    High win rate ({'>'}60%) with low drawdown indicates strong risk management.
                    Monitor exposure to ensure you aren't over-allocated to volatile assets.
                </p>
            </div>
        </div>
    );
}
