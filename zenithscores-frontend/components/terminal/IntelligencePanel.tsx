'use client';

import { motion } from 'framer-motion';
import { TrendingUp, AlertTriangle, Target, Activity, Info, BookOpen, Save } from 'lucide-react';
import MiniJournal from '@/components/terminal/MiniJournal';
import type { RegimeType } from '@/lib/types/market';
import type { OHLCV } from '@/lib/market-data/types';
import { generateMarketSignals } from '@/lib/pulse/signal-generator';
import MarketLog from '@/components/pulse/MarketLog';
import { useMemo } from 'react';

interface IntelligencePanelProps {
    symbol: string;
    data?: OHLCV[]; // For generating live signals
    regime: RegimeType;
    convictionScore: number;
    factors: {
        momentum: number;
        volume: number;
        volatility: number;
        trend: number;
    };
    entryZone?: { min: number; max: number };
    invalidationLevel?: number;
    scenarios?: {
        bullish: number;
        neutral: number;
        bearish: number;
    };
    whatBreaks?: string;
    aiAnalysis?: string | null;
    isLoadingAI?: boolean;
    onDeepDive?: () => void; // Trigger Deep Dive
    onJournal?: () => void; // Trigger Journal
    className?: string;
}

/**
 * Normalize regime to ensure it's always valid
 */
function normalizeRegime(input?: string): RegimeType {
    if (
        input === 'trend' ||
        input === 'range' ||
        input === 'breakout' ||
        input === 'breakdown' ||
        input === 'chaos'
    ) {
        return input;
    }
    return 'chaos';
}

/**
 * Get regime display info - uses only canonical RegimeType values
 */
const REGIME_DISPLAY: Record<RegimeType, { label: string; color: string; bgColor: string; description: string }> = {
    trend: {
        label: 'Trending',
        color: '#22c55e',
        bgColor: 'rgba(34, 197, 94, 0.1)',
        description: 'Price moving in a clear direction with momentum'
    },
    breakout: {
        label: 'Breakout',
        color: '#3b82f6',
        bgColor: 'rgba(59, 130, 246, 0.1)',
        description: 'Breaking through key resistance/support levels'
    },
    range: {
        label: 'Ranging',
        color: '#f59e0b',
        bgColor: 'rgba(245, 158, 11, 0.1)',
        description: 'Consolidating between support and resistance'
    },
    breakdown: {
        label: 'Breakdown',
        color: '#ef4444',
        bgColor: 'rgba(239, 68, 68, 0.1)',
        description: 'Breaking below key support with momentum'
    },
    chaos: {
        label: 'Chaotic',
        color: '#6b7280',
        bgColor: 'rgba(107, 114, 128, 0.1)',
        description: 'Structure is unclear. Conditions lack alignment.'
    },
};

/**
 * Factor alignment bar component
 */
function FactorBar({ label, value, color }: { label: string; value: number; color: string }) {
    return (
        <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500 w-20">{label}</span>
            <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, Math.max(0, value))}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: color }}
                />
            </div>
            <span className="text-xs font-mono text-gray-400 w-8">{value}%</span>
        </div>
    );
}

/**
 * Intelligence Panel - Right panel for Terminal View
 * Shows regime explanation, factor alignment, scenarios OR AI Analysis
 */
export default function IntelligencePanel({
    symbol,
    data,
    regime,
    convictionScore,
    factors,
    entryZone,
    invalidationLevel,
    scenarios = { bullish: 33, neutral: 34, bearish: 33 },
    whatBreaks,
    aiAnalysis,
    isLoadingAI,
    onDeepDive,
    onJournal,
    className = '',
}: IntelligencePanelProps) {
    const safeRegime = normalizeRegime(regime);
    const regimeDisplay = REGIME_DISPLAY[safeRegime];

    // Generate real-time signals from OHLCV data
    const signals = useMemo(() => {
        if (!data || data.length < 50) return [];
        return generateMarketSignals(data, safeRegime);
    }, [data, safeRegime]);

    // --- AI CONTEXT MODE (Text Only) ---
    if (aiAnalysis || isLoadingAI) {
        return (
            <div className={`space-y-4 ${className}`}>
                {/* Regime Badge + Score HEADER */}
                <div className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                    <div className="flex items-center justify-between mb-3">
                        <div
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
                            style={{ backgroundColor: regimeDisplay.bgColor }}
                        >
                            <div
                                className="w-2 h-2 rounded-full animate-pulse"
                                style={{ backgroundColor: regimeDisplay.color }}
                            />
                            <span className="text-sm font-medium" style={{ color: regimeDisplay.color }}>
                                {regimeDisplay.label}
                            </span>
                        </div>
                    </div>
                    {/* Deep Dive Button */}
                    {onDeepDive && (
                        <button
                            onClick={onDeepDive}
                            className="w-full mt-3 py-2 px-3 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 rounded-lg text-xs font-medium text-purple-300 transition-colors flex items-center justify-center gap-2 group"
                        >
                            <BookOpen size={14} />
                            Read Professor's Deep Dive
                        </button>
                    )}

                    {/* Journal Button */}
                    {onJournal && (
                        <button
                            onClick={onJournal}
                            className="w-full mt-2 py-2 px-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-medium text-gray-300 transition-colors flex items-center justify-center gap-2 group"
                        >
                            <Save size={14} />
                            Save to Journal
                        </button>
                    )}
                </div>

                {/* MARKET LOG (Formerly AI Context) */}
                <div className="rounded-xl border border-white/[0.06] bg-[#0c0c14] overflow-hidden min-h-[300px]">
                    <div className="p-3 border-b border-white/[0.06] flex items-center justify-between bg-white/[0.01]">
                        <div className="flex items-center gap-2">
                            <div className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </div>
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Market Log</span>
                        </div>
                        <span className="text-[10px] text-gray-600 font-mono">LIVE</span>
                    </div>

                    <MarketLog
                        signals={signals}
                        className="p-3"
                        maxVisible={8}
                    />
                </div>

                {/* Keep Invalidation Level as it's critical */}
                {invalidationLevel && (
                    <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/5">
                        <div className="flex items-center gap-2 mb-2">
                            <AlertTriangle size={14} className="text-red-400" />
                            <span className="text-xs text-red-400 font-medium">Invalidation Level</span>
                        </div>
                        <p className="text-sm text-white">${invalidationLevel.toFixed(2)}</p>
                    </div>
                )}

                {/* Model Version */}
                <div className="text-[10px] text-gray-600 text-center">
                    Model v2.1 • Updated just now
                </div>
            </div>
        );
    }

    // --- FALLBACK (Old Mode - Charts) ---
    return (
        <div className={`space-y-4 ${className}`}>
            {/* Regime Badge + Score */}
            <div className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                <div className="flex items-center justify-between mb-3">
                    <div
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
                        style={{ backgroundColor: regimeDisplay.bgColor }}
                    >
                        <div
                            className="w-2 h-2 rounded-full animate-pulse"
                            style={{ backgroundColor: regimeDisplay.color }}
                        />
                        <span
                            className="text-sm font-medium"
                            style={{ color: regimeDisplay.color }}
                        >
                            {regimeDisplay.label}
                        </span>
                    </div>
                    <div className="text-right hidden">
                        <div className="text-2xl font-bold text-white">{convictionScore}</div>
                        <div className="text-[10px] text-gray-500 uppercase">Score</div>
                    </div>
                </div>
                <p className="text-xs text-gray-500">{regimeDisplay.description}</p>
            </div>

            {/* Factor Alignment */}
            <div className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                <div className="flex items-center gap-2 mb-4">
                    <Activity size={14} className="text-gray-500" />
                    <span className="text-xs text-gray-400 uppercase tracking-wide">Factor Alignment</span>
                </div>
                <div className="space-y-3">
                    <FactorBar label="Momentum" value={factors.momentum} color="#22c55e" />
                    <FactorBar label="Volume" value={factors.volume} color="#3b82f6" />
                    <FactorBar label="Volatility" value={factors.volatility} color="#f59e0b" />
                    <FactorBar label="Trend" value={factors.trend} color="#a855f7" />
                </div>
            </div>

            {/* Scenario Probabilities (uses scenario types, not regime types) */}
            <div className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                <div className="flex items-center gap-2 mb-4">
                    <TrendingUp size={14} className="text-gray-500" />
                    <span className="text-xs text-gray-400 uppercase tracking-wide">Scenario Probabilities</span>
                </div>
                <div className="flex items-center gap-1 h-3 rounded-full overflow-hidden bg-gray-800">
                    <div className="h-full bg-emerald-500" style={{ width: `${scenarios.bullish}%` }} />
                    <div className="h-full bg-gray-500" style={{ width: `${scenarios.neutral}%` }} />
                    <div className="h-full bg-red-500" style={{ width: `${scenarios.bearish}%` }} />
                </div>
                <div className="flex justify-between mt-2 text-[10px]">
                    <span className="text-emerald-400">Upside {scenarios.bullish}%</span>
                    <span className="text-gray-400">Unclear {scenarios.neutral}%</span>
                    <span className="text-red-400">Downside {scenarios.bearish}%</span>
                </div>
            </div>

            {/* Entry Zone */}
            {entryZone && (
                <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
                    <div className="flex items-center gap-2 mb-2">
                        <Target size={14} className="text-emerald-400" />
                        <span className="text-xs text-emerald-400 font-medium">Entry Zone</span>
                    </div>
                    <p className="text-sm text-white">
                        ${entryZone.min.toFixed(2)} — ${entryZone.max.toFixed(2)}
                    </p>
                </div>
            )}

            {/* Invalidation Level */}
            {invalidationLevel && (
                <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/5">
                    <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle size={14} className="text-red-400" />
                        <span className="text-xs text-red-400 font-medium">Invalidation Level</span>
                    </div>
                    <p className="text-sm text-white">${invalidationLevel.toFixed(2)}</p>
                </div>
            )}

            {/* What Breaks This Thesis */}
            {whatBreaks && (
                <div className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                    <div className="flex items-center gap-2 mb-2">
                        <Info size={14} className="text-gray-500" />
                        <span className="text-xs text-gray-400 uppercase tracking-wide">What Breaks This</span>
                    </div>
                    <p className="text-sm text-gray-300 leading-relaxed">{whatBreaks}</p>
                </div>
            )}

            {/* Model Version */}
            <div className="text-[10px] text-gray-600 text-center">
                Model v2.1 • Updated just now
            </div>

            {/* Deep Dive Button (Fallback Mode) */}
            {onDeepDive && (
                <button
                    onClick={onDeepDive}
                    className="w-full mt-3 py-2 px-3 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 rounded-lg text-xs font-medium text-purple-300 transition-colors flex items-center justify-center gap-2 group"
                >
                    <BookOpen size={14} />
                    Read Professor's Deep Dive
                </button>
            )}

            {/* Notes Section (Common) */}
            <MiniJournal symbol={symbol} />
        </div>
    );
}
