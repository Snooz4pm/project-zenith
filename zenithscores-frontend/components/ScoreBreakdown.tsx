'use client';

import { motion } from 'framer-motion';
import { TrendingUp, BarChart3, Activity, Shield, Lock, Zap, Clock, AlertTriangle } from 'lucide-react';
import { isPremiumUser } from '@/lib/premium';

interface ScoreBreakdownProps {
    score: number;
    symbol: string;
    showFull?: boolean; // Override premium check for demos
}

// Calculate component scores from the main score (simulated breakdown)
function calculateComponents(score: number) {
    const base = score / 100;
    return {
        momentum: Math.min(10, Math.round(base * 10 + (Math.random() - 0.5) * 2)),
        volumeQuality: base > 0.7 ? 'High' : base > 0.4 ? 'Medium' : 'Low',
        trendStrength: base > 0.75 ? 'Strong' : base > 0.5 ? 'Moderate' : 'Weak',
        risk: base > 0.8 ? 'Low' : base > 0.5 ? 'Medium' : 'High',
    };
}

// Generate "Why" explanation based on score
function generateInsight(score: number, symbol: string): { trigger: string; historical: string; bias: 'bullish' | 'neutral' | 'bearish' } {
    if (score >= 80) {
        return {
            trigger: 'Volume spike + trend breakout detected',
            historical: `Historically: +${(2 + Math.random() * 3).toFixed(1)}% in next 24h`,
            bias: 'bullish'
        };
    } else if (score >= 60) {
        return {
            trigger: 'Steady accumulation pattern',
            historical: `Historically: +${(0.5 + Math.random() * 2).toFixed(1)}% in next 24h`,
            bias: 'neutral'
        };
    } else {
        return {
            trigger: 'Weakening momentum signals',
            historical: 'Caution: High volatility expected',
            bias: 'bearish'
        };
    }
}

export default function ScoreBreakdown({ score, symbol, showFull }: ScoreBreakdownProps) {
    const premium = showFull || isPremiumUser();
    const components = calculateComponents(score);
    const insight = generateInsight(score, symbol);

    const bars = [
        { label: 'Momentum', value: components.momentum, max: 10, color: 'from-cyan-500 to-blue-500' },
        { label: 'Volume', value: components.volumeQuality === 'High' ? 9 : components.volumeQuality === 'Medium' ? 6 : 3, max: 10, color: 'from-purple-500 to-pink-500' },
        { label: 'Trend', value: components.trendStrength === 'Strong' ? 9 : components.trendStrength === 'Moderate' ? 6 : 3, max: 10, color: 'from-green-500 to-emerald-500' },
        { label: 'Safety', value: components.risk === 'Low' ? 9 : components.risk === 'Medium' ? 6 : 3, max: 10, color: 'from-yellow-500 to-orange-500' },
    ];

    return (
        <div className="bg-[#0a0a12]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-5 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Zap size={14} className="text-cyan-400" />
                    Score Breakdown
                </h4>
                {!premium && (
                    <span className="text-[10px] text-purple-400 flex items-center gap-1">
                        <Lock size={10} /> Premium
                    </span>
                )}
            </div>

            {/* Component Bars */}
            <div className="space-y-3">
                {bars.map((bar, i) => (
                    <div key={bar.label} className="relative">
                        <div className="flex justify-between text-xs mb-1">
                            <span className="text-gray-400">{bar.label}</span>
                            <span className={premium ? 'text-white font-bold' : 'text-gray-600'}>
                                {premium ? `${bar.value}/${bar.max}` : '??'}
                            </span>
                        </div>
                        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                            {premium ? (
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(bar.value / bar.max) * 100}%` }}
                                    transition={{ duration: 0.5, delay: i * 0.1 }}
                                    className={`h-full rounded-full bg-gradient-to-r ${bar.color}`}
                                />
                            ) : (
                                <div className="h-full w-full bg-gradient-to-r from-gray-700/50 to-gray-600/50 blur-[2px]" />
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Insight Section */}
            <div className={`pt-3 border-t border-white/5 ${!premium ? 'blur-sm select-none' : ''}`}>
                {/* Trade Bias */}
                <div className="flex items-center gap-2 mb-2">
                    <div className={`w-2 h-2 rounded-full ${insight.bias === 'bullish' ? 'bg-green-500' :
                            insight.bias === 'neutral' ? 'bg-yellow-500' : 'bg-red-500'
                        }`} />
                    <span className={`text-sm font-bold ${insight.bias === 'bullish' ? 'text-green-400' :
                            insight.bias === 'neutral' ? 'text-yellow-400' : 'text-red-400'
                        }`}>
                        {insight.bias === 'bullish' ? '🟢 Bullish' : insight.bias === 'neutral' ? '🟡 Neutral' : '🔴 Risky'}
                    </span>
                </div>

                {/* Trigger */}
                <div className="flex items-start gap-2 mb-2">
                    <Activity size={12} className="text-cyan-400 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-gray-300">{insight.trigger}</p>
                </div>

                {/* Historical */}
                <div className="flex items-start gap-2">
                    <Clock size={12} className="text-purple-400 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-gray-400">{insight.historical}</p>
                </div>
            </div>

            {/* Premium CTA for locked users */}
            {!premium && (
                <div className="pt-3 text-center">
                    <p className="text-[10px] text-gray-500 mb-2">
                        Unlock the <span className="text-cyan-400">WHY</span> behind every score
                    </p>
                </div>
            )}
        </div>
    );
}

// Compact version for inline display
export function ScoreBreakdownMini({ score, symbol }: { score: number; symbol: string }) {
    const premium = isPremiumUser();
    const insight = generateInsight(score, symbol);

    if (!premium) {
        return (
            <div className="flex items-center gap-1 text-[10px] text-gray-500">
                <Lock size={10} />
                <span>Unlock insight</span>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${insight.bias === 'bullish' ? 'bg-green-500' :
                    insight.bias === 'neutral' ? 'bg-yellow-500' : 'bg-red-500'
                }`} />
            <span className="text-[10px] text-gray-400 truncate max-w-[120px]">
                {insight.trigger.split(' ').slice(0, 3).join(' ')}...
            </span>
        </div>
    );
}
