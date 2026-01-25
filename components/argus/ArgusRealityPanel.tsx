'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    AlertCircle, ArrowRight, Target, TrendingUp,
    Info, ShieldAlert, CheckCircle2, Zap, Activity
} from 'lucide-react';
import { calculateReality, RealityFeasibility } from '@/lib/argus/realityEngine';

export interface ArgusRealityPanelProps {
    currentPrice: number;
    circulatingSupply: number;
    symbol: string;
    integrity?: {
        contractRisk: 'LOW' | 'MEDIUM' | 'HIGH';
        holderRisk: 'LOW' | 'MEDIUM' | 'HIGH';
        flags: string[];
        score: number;
        top1Pct: number;
        top10Pct: number;
    };
    behavior?: {
        deployerAddress: string;
        behaviorRisk: "LOW" | "MEDIUM" | "HIGH";
        fundingSource: { type: string; name?: string };
        trackRecord: { totalLaunched: number; diedQuickly: number; confirmedRugs: number };
        flags: string[];
        score: number;
    };
    timing?: {
        velocity: "STAGNANT" | "STEADY" | "ACCELERATING" | "EXHAUSTED";
        momentumScore: number;
        signals: string[];
        volumeChange24h?: number;
        priceChange24h?: number;
    };
    primaryRisk?: {
        label: string;
        score: number;
        explanation: string[];
    };
}

const TIER_STYLING: Record<RealityFeasibility, { color: string, icon: any, bg: string, border: string }> = {
    "POSSIBLE": {
        color: "text-emerald-400",
        icon: CheckCircle2,
        bg: "bg-emerald-500/10",
        border: "border-emerald-500/20"
    },
    "UNLIKELY": {
        color: "text-amber-400",
        icon: AlertCircle,
        bg: "bg-amber-500/10",
        border: "border-amber-500/20"
    },
    "UNREALISTIC": {
        color: "text-red-400",
        icon: ShieldAlert,
        bg: "bg-red-500/10",
        border: "border-red-500/20"
    }
};

function formatCompact(val: number) {
    if (val >= 1e12) return `$${(val / 1e12).toFixed(2)}T`;
    if (val >= 1e12) return `$${(val / 1e12).toFixed(2)}T`;
    if (val >= 1e9) return `$${(val / 1e9).toFixed(2)}B`;
    if (val >= 1e6) return `$${(val / 1e6).toFixed(2)}M`;
    if (val >= 1e3) return `$${(val / 1e3).toFixed(1)}K`;
    return `$${val.toFixed(2)}`;
}

export function ArgusRealityPanel({ currentPrice, circulatingSupply, symbol, integrity, behavior, timing, primaryRisk }: ArgusRealityPanelProps) {
    const [targetPrice, setTargetPrice] = useState(currentPrice * 10);
    const [isCustom, setIsCustom] = useState(false);

    const metrics = useMemo(() => {
        if (currentPrice <= 0) return null;
        return calculateReality(currentPrice, circulatingSupply, targetPrice);
    }, [currentPrice, circulatingSupply, targetPrice]);

    if (!metrics) {
        return (
            <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-12 text-center font-mono">
                <Zap size={32} className="text-zinc-800 mx-auto mb-4 animate-pulse" />
                <div className="text-zinc-500 text-xs uppercase tracking-widest leading-relaxed">
                    Reality Assessment Unavailable
                    <br />
                    <span className="opacity-50 text-[10px]">Awaiting Market Listing / DexScreener Indexing</span>
                </div>
            </div>
        );
    }

    const style = TIER_STYLING[metrics.feasibility];

    const targets = [
        { label: "10x", value: currentPrice * 10 },
        { label: "$1.00", value: 1.00 },
        { label: "$10.00", value: 10.00 },
    ];

    // Tactical Intelligence Extraction (Defense Layer)
    const intelligence = useMemo(() => {
        let t1 = integrity?.top1Pct || 0;
        let t10 = integrity?.top10Pct || 0;

        if (integrity?.flags) {
            if (t1 === 0) {
                const f1 = integrity.flags.find(f => f.includes('Top Holder owns'));
                if (f1) {
                    const match = f1.match(/(\d+\.?\d*)%/);
                    if (match) t1 = parseFloat(match[1]);
                }
            }
            if (t10 === 0) {
                const f10 = integrity.flags.find(f => f.includes('Top 10 own'));
                if (f10) {
                    const match = f10.match(/(\d+\.?\d*)%/);
                    if (match) t10 = parseFloat(match[1]);
                }
            }
        }

        return { t1, t10 };
    }, [integrity]);

    return (
        <div className="bg-zinc-950 border border-zinc-900 rounded-2xl overflow-hidden font-mono shadow-2xl">
            {/* Layer 1: Feasibility Badge */}
            <div className={`p-6 border-b border-zinc-900 ${style.bg} transition-colors duration-500`}>
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                        <style.icon className={`w-8 h-8 ${style.color}`} />
                        <div>
                            <div className={`text-2xl font-black italic tracking-tighter ${style.color}`}>
                                {metrics.feasibility}
                            </div>
                            <div className="text-[10px] text-zinc-500 uppercase tracking-[0.2em]">
                                Reality Assessment Analysis
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 text-sm">
                    <span className="text-zinc-400">Required Mcap:</span>
                    <span className="text-white font-black">{formatCompact(metrics.requiredMarketCap)}</span>
                    <div className="h-1 w-1 rounded-full bg-zinc-700 mx-1" />
                    <span className="text-zinc-500 text-[10px] uppercase">Tier: {metrics.requiredMarketCap > 10e9 ? 'Global Elite' : metrics.requiredMarketCap > 1e9 ? 'Large-Cap' : 'Mid-Cap'}</span>
                </div>
            </div>

            {/* NEW: Primary Risk Highlight (Cognitive Anchor) */}
            {primaryRisk && (
                <div className={`px-8 py-6 border-b border-zinc-900 transition-colors ${primaryRisk.score === 3 ? 'bg-red-950/20 border-red-500/30' :
                        primaryRisk.score === 2 ? 'bg-amber-950/20 border-amber-500/30' :
                            'bg-zinc-900/40 border-zinc-800'
                    }`}>
                    <div className="flex items-center gap-2 mb-4">
                        <div className="text-[10px] text-zinc-500 uppercase tracking-[0.3em] font-black">
                            🎯 Primary Risk
                        </div>
                    </div>

                    <div className={`text-2xl font-black italic mb-4 flex items-center gap-3 ${primaryRisk.score === 3 ? 'text-red-400' :
                            primaryRisk.score === 2 ? 'text-amber-400' :
                                'text-zinc-300'
                        }`}>
                        <span>{primaryRisk.score === 3 ? '🔴' : primaryRisk.score === 2 ? '🟡' : '🟢'}</span>
                        {primaryRisk.label}
                    </div>

                    <div className="space-y-3">
                        <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Why this matters:</div>
                        <ul className="space-y-1.5 list-none">
                            {primaryRisk.explanation.map((line, idx) => (
                                <li key={idx} className="text-[11px] text-zinc-400 font-mono italic leading-relaxed flex items-start gap-2">
                                    <span className="text-zinc-700 mt-1.5">•</span>
                                    <span>{line}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}

            {/* Phase 4: Integrity Analysis (Layer 1.5) */}
            {integrity && (
                <div className="px-8 py-6 border-b border-zinc-900 bg-black/40">
                    <div className="flex items-center justify-between mb-4">
                        <div className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-black">
                            On-Chain Integrity & Distribution Audit
                        </div>
                        <div className="flex items-center gap-2">
                            <div className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${integrity.contractRisk === 'HIGH' ? 'bg-red-500 text-black' :
                                integrity.contractRisk === 'MEDIUM' ? 'bg-amber-500 text-black' :
                                    'bg-emerald-500 text-black'
                                }`}>
                                {integrity.contractRisk} CONTRACT RISK
                            </div>
                            <div className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${integrity.holderRisk === 'HIGH' ? 'bg-red-500 text-black' :
                                integrity.holderRisk === 'MEDIUM' ? 'bg-amber-500 text-black' :
                                    'bg-emerald-500 text-black'
                                }`}>
                                {integrity.holderRisk} CONCENTRATION
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                            {integrity.flags.length > 0 ? (
                                integrity.flags.map((flag, idx) => (
                                    <div key={idx} className="flex items-center gap-2 text-[10px] text-zinc-400 font-mono">
                                        <ShieldAlert size={12} className={flag.includes('🚩') || flag.includes('⚠️') ? 'text-red-500' : 'text-amber-500'} />
                                        <span>{flag}</span>
                                    </div>
                                ))
                            ) : (
                                <div className="flex items-center gap-2 text-[10px] text-emerald-500 font-mono italic">
                                    <CheckCircle2 size={12} />
                                    <span>No structural vulnerabilities detected</span>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4 border-l border-zinc-900 pl-8">
                            <div>
                                <div className="text-[8px] text-zinc-600 font-bold uppercase mb-1">Top Holder</div>
                                <div className={`text-lg font-black italic ${intelligence.t1 > 20 ? 'text-red-400' : 'text-white'}`}>
                                    {intelligence.t1.toFixed(1)}%
                                </div>
                            </div>
                            <div>
                                <div className="text-[8px] text-zinc-600 font-bold uppercase mb-1">Top 10 Pool</div>
                                <div className={`text-lg font-black italic ${intelligence.t10 > 50 ? 'text-red-400' : 'text-white'}`}>
                                    {intelligence.t10.toFixed(1)}%
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Remaining layers: Behavior, Timing, Index, Numbers... */}
            {behavior && (
                <div className="px-8 py-6 border-b border-zinc-900 bg-cyan-500/5">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded-md bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                                <Zap size={12} className="text-cyan-400" />
                            </div>
                            <div className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-black">
                                Human Signature Intelligence
                            </div>
                        </div>
                        <div className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${behavior.behaviorRisk === 'HIGH' ? 'bg-red-500 text-black' :
                            behavior.behaviorRisk === 'MEDIUM' ? 'bg-amber-500 text-black' :
                                'bg-cyan-500 text-black'
                            }`}>
                            {behavior.behaviorRisk} BEHAVIOR RISK
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <div className="text-[8px] text-zinc-600 font-bold uppercase mb-2">Deployer Track Record</div>
                            <div className="space-y-1.5">
                                <div className="text-xs font-black italic text-white">
                                    {behavior.trackRecord.totalLaunched} Previous Assets
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-[9px] text-zinc-500 font-mono italic">• {behavior.trackRecord.diedQuickly} died in &lt; 1h</span>
                                    {behavior.trackRecord.confirmedRugs > 0 && (
                                        <span className="text-[9px] text-red-500 font-mono italic uppercase font-black">!! {behavior.trackRecord.confirmedRugs} RUGS DETECTED !!</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="border-l border-zinc-900 pl-8">
                            <div className="text-[8px] text-zinc-600 font-bold uppercase mb-2">Funding Source Intelligence</div>
                            <div className="flex items-center gap-2">
                                <div className={`px-2 py-1 rounded text-[9px] font-black uppercase border ${behavior.fundingSource.type === 'CEX' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                    behavior.fundingSource.type === 'MIXER' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                        'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                    }`}>
                                    {behavior.fundingSource.type} {behavior.fundingSource.name !== 'Unknown' ? `(${behavior.fundingSource.name})` : ''}
                                </div>
                            </div>
                            <p className="text-[8px] text-zinc-700 font-mono italic mt-2">
                                {behavior.fundingSource.type === 'MIXER' ? 'Warning: Source obscured via bridge or mixer. Extreme anonymity.' :
                                    behavior.fundingSource.type === 'BURNER' ? 'Suspicious: Funded by a fresh wallet with no history.' :
                                        'Source verified. Likely authentic developer capital.'}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {timing && (
                <div className="px-8 py-6 border-b border-zinc-900 bg-emerald-500/5">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded-md bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                                <Activity size={12} className="text-emerald-400" />
                            </div>
                            <div className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-black">
                                Timing & Velocity Intelligence
                            </div>
                        </div>
                        <div className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${timing.velocity === 'ACCELERATING' ? 'bg-emerald-500 text-black' :
                            timing.velocity === 'EXHAUSTED' ? 'bg-red-500 text-black' :
                                'bg-zinc-800 text-zinc-400'
                            }`}>
                            {timing.velocity} VELOCITY
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <div className="text-[8px] text-zinc-600 font-bold uppercase mb-2">Momentum Signals</div>
                            <div className="space-y-1.5 font-mono italic">
                                {timing.signals.map((sig, idx) => (
                                    <div key={idx} className="text-[10px] text-zinc-300">
                                        • {sig}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="border-l border-zinc-900 pl-8">
                            <div className="text-[8px] text-zinc-600 font-bold uppercase mb-2">Market Pulse</div>
                            <div className="flex items-center gap-6">
                                <div>
                                    <div className="text-[8px] text-zinc-500 mb-0.5">24h Vol</div>
                                    <div className="text-xs font-black text-white italic">${formatCompact((timing.volumeChange24h || 0))}</div>
                                </div>
                                <div>
                                    <div className="text-[8px] text-zinc-500 mb-0.5">24h Price</div>
                                    <div className={`text-xs font-black italic ${timing.priceChange24h && timing.priceChange24h > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                        {timing.priceChange24h?.toFixed(1)}%
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Global Safety Index */}
            <div className="px-8 py-4 bg-zinc-900/30 border-b border-zinc-900 flex items-center justify-between">
                <div className="text-[9px] text-zinc-500 uppercase tracking-[0.4em] font-black italic">
                    Protocol Safety Index
                </div>
                <div className="flex items-center gap-4">
                    <div className="h-1.5 w-32 bg-zinc-800 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(integrity?.score || 100, behavior?.score || 100)}%` }}
                            className={`h-full ${Math.min(integrity?.score || 100, behavior?.score || 100) < 40 ? 'bg-red-500' :
                                Math.min(integrity?.score || 100, behavior?.score || 100) < 70 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                        />
                    </div>
                    <div className={`text-xs font-black italic ${Math.min(integrity?.score || 100, behavior?.score || 100) < 40 ? 'text-red-500' :
                        Math.min(integrity?.score || 100, behavior?.score || 100) < 70 ? 'text-amber-500' : 'text-emerald-500'}`}>
                        {Math.min(integrity?.score || 100, behavior?.score || 100)}/100
                    </div>
                </div>
            </div>

            {/* Price Numbers and Translation */}
            <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8 relative">
                <div className="space-y-1">
                    <div className="text-[9px] text-zinc-600 font-black uppercase tracking-[0.2em]">Current Mcap</div>
                    <div className="text-xl font-black text-white italic">{formatCompact(metrics.currentMarketCap)}</div>
                </div>

                <div className="hidden md:flex items-center justify-center opacity-20">
                    <ArrowRight className="w-6 h-6 text-zinc-400" />
                </div>

                <div className="space-y-1 items-end md:text-right">
                    <div className="text-[9px] text-zinc-600 font-black uppercase tracking-[0.2em]">Required Mcap @ ${targetPrice.toLocaleString()}</div>
                    <div className="text-xl font-black text-white italic">{formatCompact(metrics.requiredMarketCap)}</div>
                    <div className="flex items-center gap-2 md:justify-end">
                        <TrendingUp size={14} className={style.color} />
                        <span className={`text-sm font-black ${style.color}`}>+{metrics.growthMultiplier.toFixed(0)}x</span>
                        <span className="text-[10px] text-zinc-600">(+{metrics.growthPercent.toLocaleString()}% )</span>
                    </div>
                </div>
            </div>

            <div className="px-8 pb-8">
                <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-6 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Zap size={64} className="text-white" />
                    </div>

                    <div className="flex items-start gap-4 mb-4">
                        <Info className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                        <p className="text-sm text-zinc-300 leading-relaxed italic">
                            {metrics.meaningQuote}
                        </p>
                    </div>

                    {metrics.comparison && (
                        <div className="mt-4 pt-4 border-t border-zinc-800/50">
                            <div className="text-[10px] text-zinc-500 uppercase tracking-widest mb-2">Relational Context</div>
                            <div className="text-xs text-zinc-400">
                                This would require a market cap similar to <span className="text-white font-bold">{metrics.comparison.name}</span>.
                                <br />
                                <span className="opacity-60 italic">{metrics.comparison.description}</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Target Selector Selector */}
            <div className="px-8 py-4 bg-zinc-900 border-t border-zinc-800 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <Target size={14} className="text-zinc-500" />
                    <span className="text-[10px] text-zinc-500 uppercase tracking-widest">Test Target:</span>
                </div>

                <div className="flex gap-2">
                    {targets.map(t => (
                        <button
                            key={t.label}
                            onClick={() => { setTargetPrice(t.value); setIsCustom(false); }}
                            className={`px-3 py-1.5 rounded-md text-[10px] font-bold tracking-tighter transition-all ${targetPrice === t.value && !isCustom
                                ? 'bg-white text-black'
                                : 'bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700'
                                }`}
                        >
                            {t.label}
                        </button>
                    ))}
                    <div className="relative">
                        <input
                            type="number"
                            placeholder="Custom"
                            className={`w-28 px-3 py-1.5 rounded-md text-[10px] font-bold bg-zinc-800 text-white border transition-all ${isCustom ? 'border-cyan-500' : 'border-transparent'
                                }`}
                            onChange={(e) => {
                                const val = parseFloat(e.target.value);
                                if (!isNaN(val)) {
                                    setTargetPrice(val);
                                    setIsCustom(true);
                                }
                            }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
