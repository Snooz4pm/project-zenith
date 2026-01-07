'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Shield, Zap, Activity, Clock } from 'lucide-react';

interface ZenithScoreDisplayProps {
    symbol: string;
    assetType: 'stock' | 'crypto' | 'forex';
    showDetails?: boolean;
    className?: string;
}

export default function ZenithScoreDisplay({
    symbol,
    assetType,
    showDetails = true,
    className = ''
}: ZenithScoreDisplayProps) {
    const [scoreData, setScoreData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchScore = async () => {
            try {
                setLoading(true);
                // Add random cache buster or force logic if needed
                const response = await fetch(
                    `/api/zenith-score/${symbol}?type=${assetType}`
                );

                if (!response.ok) throw new Error('Failed to fetch score');

                const data = await response.json();
                setScoreData(data);
            } catch (err: any) {
                setError(err.message);
                console.error('Error fetching Zenith score:', err);
            } finally {
                setLoading(false);
            }
        };

        if (symbol) {
            fetchScore();
        }

        // Refresh every hour
        const interval = setInterval(fetchScore, 60 * 60 * 1000);
        return () => clearInterval(interval);
    }, [symbol, assetType]);

    if (loading) {
        return (
            <Card className={`border-gray-800 bg-gray-900/50 ${className}`}>
                <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-800 rounded-full animate-pulse" />
                            <div>
                                <div className="h-4 w-24 bg-gray-800 rounded animate-pulse mb-2" />
                                <div className="h-3 w-32 bg-gray-800 rounded animate-pulse" />
                            </div>
                        </div>
                        <div className="h-10 w-20 bg-gray-800 rounded animate-pulse" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (error || !scoreData) {
        return (
            <Card className={`border-red-800 bg-red-900/20 ${className}`}>
                <CardContent className="p-4">
                    <div className="text-red-400 text-sm">
                        {error || 'Failed to load Zenith Score'}
                    </div>
                </CardContent>
            </Card>
        );
    }

    const { score, breakdown, confidence, interpretation, lastUpdated } = scoreData;

    // Determine color based on score
    const getScoreColor = (score: number) => {
        if (score >= 90) return 'text-emerald-400';
        if (score >= 80) return 'text-blue-400';
        if (score >= 70) return 'text-violet-400';
        if (score >= 60) return 'text-amber-400';
        if (score >= 50) return 'text-gray-400';
        if (score >= 40) return 'text-red-400';
        return 'text-red-600';
    };

    const getScoreBgColor = (score: number) => {
        if (score >= 90) return 'bg-emerald-500/20';
        if (score >= 80) return 'bg-blue-500/20';
        if (score >= 70) return 'bg-violet-500/20';
        if (score >= 60) return 'bg-amber-500/20';
        if (score >= 50) return 'bg-gray-500/20';
        if (score >= 40) return 'bg-red-500/20';
        return 'bg-red-600/20';
    };

    return (
        <Card className={`border-gray-800 bg-gray-900/50 ${className}`}>
            <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="font-semibold text-lg">Zenith Lifetime Score</h3>
                        <p className="text-sm text-gray-500">
                            Performance since launch • Timeframe-independent
                        </p>
                    </div>

                    <Badge
                        className={`px-3 py-1.5 text-lg font-bold ${getScoreBgColor(score)} ${getScoreColor(score)}`}
                    >
                        {score.toFixed(0)}
                    </Badge>
                </div>

                {/* Score Interpretation */}
                <div className="mb-4 p-3 rounded-lg border" style={{ borderColor: interpretation.color + '40', backgroundColor: interpretation.color + '10' }}>
                    <div className="flex items-center gap-2 mb-1">
                        <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: interpretation.color }}
                        />
                        <span className="font-semibold" style={{ color: interpretation.color }}>
                            {interpretation.label}
                        </span>
                    </div>
                    <p className="text-sm text-gray-300">{interpretation.description}</p>
                    <p className="text-sm text-gray-400 mt-1">{interpretation.recommendation}</p>
                </div>

                {/* Confidence Indicator */}
                <div className="mb-4">
                    <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-gray-400">Confidence</span>
                        <span className="font-medium">{confidence}%</span>
                    </div>
                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-blue-500 rounded-full"
                            style={{ width: `${confidence}%` }}
                        />
                    </div>
                </div>

                {showDetails && (
                    <>
                        {/* Score Breakdown */}
                        <div className="space-y-3 mb-4">
                            <h4 className="font-medium text-sm text-gray-400">Score Breakdown</h4>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-2 bg-gray-800/30 rounded">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Clock className="w-3 h-3 text-gray-500" />
                                        <span className="text-xs text-gray-500">Lifetime</span>
                                    </div>
                                    <div className="text-lg font-bold">{breakdown.lifetime?.toFixed(0) || '--'}</div>
                                </div>

                                <div className="p-2 bg-gray-800/30 rounded">
                                    <div className="flex items-center gap-2 mb-1">
                                        <TrendingUp className="w-3 h-3 text-gray-500" />
                                        <span className="text-xs text-gray-500">Yearly</span>
                                    </div>
                                    <div className="text-lg font-bold">{breakdown.yearly?.toFixed(0) || '--'}</div>
                                </div>

                                <div className="p-2 bg-gray-800/30 rounded">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Activity className="w-3 h-3 text-gray-500" />
                                        <span className="text-xs text-gray-500">Quarterly</span>
                                    </div>
                                    <div className="text-lg font-bold">{breakdown.quarterly?.toFixed(0) || '--'}</div>
                                </div>

                                <div className="p-2 bg-gray-800/30 rounded">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Shield className="w-3 h-3 text-gray-500" />
                                        <span className="text-xs text-gray-500">Monthly</span>
                                    </div>
                                    <div className="text-lg font-bold">{breakdown.monthly?.toFixed(0) || '--'}</div>
                                </div>
                            </div>
                        </div>

                        {/* Last Updated */}
                        <div className="text-xs text-gray-600 text-center">
                            Score calculated from launch to today • Updated {new Date(lastUpdated).toLocaleDateString()}
                        </div>
                    </>
                )}

                {/* Timeframe Warning */}
                {!showDetails && (
                    <div className="mt-3 p-2 bg-blue-900/20 border border-blue-800/30 rounded text-xs text-blue-400">
                        <div className="flex items-center gap-1.5">
                            <Shield className="w-3 h-3" />
                            <span>This score is timeframe-independent. It won't change when you switch timeframes.</span>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
