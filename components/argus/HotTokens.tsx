'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Target, Loader2, TrendingUp, AlertTriangle, Activity, BarChart3, ShieldAlert, Zap, DollarSign } from 'lucide-react';
import { isDollarFeasible, checkDollarFeasibility } from '@/lib/argus/correlationEngine';

export interface HotToken {
    mint: string;
    symbol: string;
    name: string;
    price: number;
    supply: number;
    mcap: number;
    liquidity?: number;
    volume24h?: number;
    volume5m?: number;
    riskScore: number;
    feasibility: 'POSSIBLE' | 'UNLIKELY' | 'UNREALISTIC';
    flow: string;
    integrity?: {
        contractRisk: 'LOW' | 'MEDIUM' | 'HIGH';
        holderRisk: 'LOW' | 'MEDIUM' | 'HIGH';
        flags: string[];
        score: number;
        top1Pct?: number;
        top10Pct?: number;
        distributionQuality?: {
            score: number;
            grade: 'HEALTHY' | 'MODERATE_RISK' | 'HIGHLY_CENTRALIZED';
        };
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
    holders?: {
        address: string;
        amount: number;
        pct: number;
    }[];
}

const TIER_STYLING = {
    "POSSIBLE": "border-emerald-500/30 group-hover:border-emerald-500/60 shadow-[0_0_15px_-5px_rgba(16,185,129,0.3)]",
    "UNLIKELY": "border-amber-500/20 group-hover:border-amber-500/50 shadow-[0_0_15px_-5px_rgba(245,158,11,0.2)]",
    "UNREALISTIC": "border-red-500/10 opacity-60"
};

function formatCompact(val: number) {
    if (val >= 1e9) return `$${(val / 1e9).toFixed(1)}B`;
    if (val >= 1e6) return `$${(val / 1e6).toFixed(1)}M`;
    if (val >= 1e3) return `$${(val / 1e3).toFixed(0)}K`;
    return `$${val.toFixed(2)}`;
}

/**
 * Tactical Token Card Component
 * Extracted to follow Rules of Hooks and prevent Render Errors
 */
function HotTokenCard({ token, isSelected, onSelect, index }: { token: HotToken, isSelected: boolean, onSelect: (t: HotToken) => void, index: number }) {
    // Intelligence Extraction with Tactical Recovery (Moved to top-level)
    const t1 = useMemo(() => {
        let val = token.integrity?.top1Pct || 0;
        if (val === 0 && token.integrity?.flags) {
            const f = token.integrity.flags.find(f => f.includes('Top Holder owns'));
            if (f) {
                const match = f.match(/(\d+\.?\d*)%/);
                if (match) val = parseFloat(match[1]);
            }
        }
        return val;
    }, [token.integrity]);

    const t10 = useMemo(() => {
        let val = token.integrity?.top10Pct || 0;
        if (val === 0 && token.integrity?.flags) {
            const f = token.integrity.flags.find(f => f.includes('Top 10 own'));
            if (f) {
                const match = f.match(/(\d+\.?\d*)%/);
                if (match) val = parseFloat(match[1]);
            }
        }
        return val;
    }, [token.integrity]);

    // Dollar-Feasible calculation
    const dollarFeasibility = useMemo(() => {
        return checkDollarFeasibility(
            token.supply,
            token.price,
            token.liquidity || 0,
            { top1Pct: t1, top10Pct: t10, contractRisk: token.integrity?.contractRisk }
        );
    }, [token.supply, token.price, token.liquidity, t1, t10, token.integrity?.contractRisk]);

    return (
        <motion.button
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.03 }}
            onClick={() => onSelect(token)}
            className={`w-full group relative p-4 rounded-xl border transition-all duration-300 text-left overflow-hidden ${isSelected
                ? 'bg-zinc-800 border-white text-white shadow-[0_0_30px_rgba(255,255,255,0.1)]'
                : `bg-zinc-950 ${TIER_STYLING[token.feasibility]}`
                }`}
        >
            {/* Layer 1: Identity & Key Metrics */}
            <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded bg-white text-black flex items-center justify-center font-black text-[10px] italic">
                            {token.symbol.slice(0, 1)}
                        </div>
                        <div className="text-sm font-black italic tracking-widest leading-none uppercase">
                            {token.symbol}
                        </div>
                    </div>
                    <div className="text-sm font-black italic tracking-tighter">
                        ${token.price.toLocaleString(undefined, { maximumSignificantDigits: 4 })}
                    </div>
                </div>

                {/* Layer 2: Primary Risk Highlight */}
                {token.primaryRisk && (
                    <div className={`p-2 rounded border transition-colors ${token.primaryRisk.score === 3 ? 'bg-red-950/40 border-red-500/20' :
                        token.primaryRisk.score === 2 ? 'bg-amber-950/40 border-amber-500/20' :
                            'bg-zinc-900/40 border-zinc-800'
                        }`}>
                        <div className="flex items-center gap-1.5 mb-1.5">
                            <span className="text-[10px]">{token.primaryRisk.score === 3 ? '🔴' : token.primaryRisk.score === 2 ? '🟡' : '🟢'}</span>
                            <span className="text-[7px] text-zinc-500 font-black uppercase tracking-widest">Primary Risk</span>
                        </div>
                        <div className={`text-[10px] font-black italic ${token.primaryRisk.score === 3 ? 'text-red-400' :
                            token.primaryRisk.score === 2 ? 'text-amber-400' :
                                'text-zinc-300'
                            }`}>
                            {token.primaryRisk.label}
                        </div>
                    </div>
                )}

                {/* Dollar-Feasible Badge */}
                {dollarFeasibility.isDollarFeasible && (
                    <div className="p-2 rounded border bg-emerald-950/30 border-emerald-500/30">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-5 h-5 rounded bg-emerald-500 flex items-center justify-center">
                                    <DollarSign size={12} className="text-black" />
                                </div>
                                <div>
                                    <div className="text-[8px] text-emerald-400 font-black uppercase tracking-widest">
                                        Dollar-Feasible
                                    </div>
                                    <div className="text-[7px] text-zinc-500">
                                        Req. MCAP: ${(dollarFeasibility.requiredMcap / 1000).toFixed(1)}K
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-[10px] font-black text-emerald-400">
                                    {dollarFeasibility.growthNeeded.toFixed(1)}×
                                </div>
                                <div className="text-[7px] text-zinc-600">to $1</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Layer 3: The 4-Layer Summary Grid */}
                <div className="grid grid-cols-2 gap-4 pb-3 border-b border-zinc-900/50">
                    <div>
                        <div className="text-[7px] text-zinc-600 font-bold uppercase mb-1">On-Chain DNA</div>
                        <div className="flex items-center gap-1.5">
                            <ShieldAlert size={10} className={token.integrity?.contractRisk === 'HIGH' ? 'text-red-500' : 'text-emerald-500'} />
                            <span className="text-[8px] font-mono text-zinc-400">
                                {token.behavior ? `${token.behavior.deployerAddress.slice(0, 4)}...${token.behavior.deployerAddress.slice(-4)}` : 'UNKNOWN'}
                            </span>
                        </div>
                    </div>
                    <div>
                        <div className="text-[7px] text-zinc-600 font-bold uppercase mb-1">Market Velocity</div>
                        <div className="flex items-center gap-1.5">
                            <Activity size={10} className={token.timing?.velocity === 'ACCELERATING' ? 'text-emerald-400' : 'text-zinc-600'} />
                            <span className={`text-[8px] font-black italic ${token.timing?.velocity === 'ACCELERATING' ? 'text-emerald-400' : 'text-zinc-400'}`}>
                                {token.timing?.velocity || 'Neutral'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Layer 4: Deep Concentration Metrics */}
                <div className="grid grid-cols-2 gap-4 pt-1">
                    <div>
                        <div className="text-[7px] text-zinc-600 font-bold uppercase mb-1">Top Holder</div>
                        <div className={`text-sm font-black italic ${t1 > 20 ? 'text-red-400' : 'text-zinc-300'}`}>
                            {t1.toFixed(1)}%
                        </div>
                    </div>
                    <div>
                        <div className="text-[7px] text-zinc-600 font-bold uppercase mb-1">Top 10 Pool</div>
                        <div className={`text-sm font-black italic ${t10 > 50 ? 'text-red-400' : 'text-zinc-300'}`}>
                            {t10.toFixed(1)}%
                        </div>
                    </div>
                </div>

                {/* Layer 5: Safety Index + Distribution Quality */}
                <div className="pt-3 border-t border-zinc-900/50 space-y-2">
                    {/* Distribution Quality Score */}
                    {token.integrity?.distributionQuality && (
                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <div className="text-[7px] text-zinc-600 font-black uppercase tracking-widest italic">Distribution Health</div>
                                <div className={`text-[9px] font-black italic ${token.integrity.distributionQuality.grade === 'HEALTHY' ? 'text-emerald-400' :
                                    token.integrity.distributionQuality.grade === 'MODERATE_RISK' ? 'text-amber-400' :
                                        'text-red-400'
                                    }`}>
                                    {token.integrity.distributionQuality.score}/100
                                </div>
                            </div>
                            <div className="h-0.5 w-full bg-zinc-900 rounded-full overflow-hidden">
                                <div
                                    className={`h-full transition-all duration-1000 ${token.integrity.distributionQuality.grade === 'HEALTHY' ? 'bg-emerald-500' :
                                        token.integrity.distributionQuality.grade === 'MODERATE_RISK' ? 'bg-amber-500' :
                                            'bg-red-500'
                                        }`}
                                    style={{ width: `${token.integrity.distributionQuality.score}%` }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Safety Index */}
                    <div>
                        <div className="flex items-center justify-between mb-1.5">
                            <div className="text-[7px] text-zinc-600 font-black uppercase tracking-widest italic">Safety Index</div>
                            <div className={`text-[9px] font-black italic ${token.riskScore > 70 ? 'text-emerald-400' : token.riskScore > 40 ? 'text-amber-400' : 'text-red-400'}`}>
                                {token.riskScore.toFixed(0)}/100
                            </div>
                        </div>
                        <div className="h-1 w-full bg-zinc-900 rounded-full overflow-hidden">
                            <div
                                className={`h-full transition-all duration-1000 ${token.riskScore > 70 ? 'bg-emerald-500' : token.riskScore > 40 ? 'bg-amber-500' : 'bg-red-500'
                                    }`}
                                style={{ width: `${token.riskScore}%` }}
                            />
                        </div>
                    </div>
                </div>

                {/* Layer 6: Meta Status */}
                <div className="flex items-center justify-between pt-2">
                    <span className={`text-[8px] font-black uppercase tracking-[0.2em] ${token.flow.includes('Mega') ? 'text-emerald-400' : 'text-zinc-700'
                        }`}>
                        {token.flow}
                    </span>
                    <span className="text-[8px] font-mono text-zinc-800">
                        {formatCompact(token.mcap)} MCAP
                    </span>
                </div>
            </div>

            {/* Selection Glow */}
            {isSelected && (
                <motion.div
                    layoutId="glow"
                    className="absolute inset-0 bg-white/5 pointer-events-none"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                />
            )}
        </motion.button>
    );
}

interface HotTokensProps {
    onSelect: (token: HotToken) => void;
    selectedMint?: string;
    hydratedToken?: HotToken | null;
    onHydratedTokensChange?: (tokens: HotToken[]) => void;
}

export function HotTokens({ onSelect, selectedMint, hydratedToken, onHydratedTokensChange }: HotTokensProps) {
    const [tokens, setTokens] = useState<HotToken[]>([]);
    const [filter, setFilter] = useState<'ALL' | 'SAFE' | 'HOT' | 'DOLLAR'>('ALL');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [hydratedCache, setHydratedCache] = useState<Record<string, HotToken>>({});

    // Notify parent when hydrated tokens change
    useEffect(() => {
        if (onHydratedTokensChange) {
            const hydratedTokens = Object.values(hydratedCache).filter(t => t.holders && t.holders.length > 0);
            onHydratedTokensChange(hydratedTokens);
        }
    }, [hydratedCache, onHydratedTokensChange]);

    // Background Hydration Queue
    useEffect(() => {
        const queue = tokens.filter(t => !hydratedCache[t.mint]);
        if (queue.length === 0) return;

        const nextMint = queue[0].mint;

        const timer = setTimeout(async () => {
            try {
                // Fetch full specs from local API
                const res = await fetch(`/api/argus/token-specs?mint=${nextMint}`);
                if (res.ok) {
                    const fullData = await res.json();
                    setHydratedCache(prev => ({
                        ...prev,
                        [nextMint]: {
                            ...queue[0], // Keep basic feed data
                            ...fullData // Overwrite with detailed specs (integrity, holders, etc.)
                        }
                    }));
                }
            } catch (err) {
                // Determine if we should retry or skip. For now, we skip to avoid infinite loops on error.
                // In a robust app, we might mark it as 'failed' in cache.
                console.warn(`[Hydration] Failed for ${nextMint}`, err);
            }
        }, 1000); // 1s delay between fetches to be gentle

        return () => clearTimeout(timer);
    }, [tokens, hydratedCache]);

    useEffect(() => {
        let interval: NodeJS.Timeout;

        async function fetchHot() {
            try {
                const res = await fetch('https://jupiter-proxy-production.up.railway.app/api/argus/feed', {
                    cache: 'no-store'
                });

                if (!res.ok) throw new Error(`Radar Sync Failed: ${res.status}`);

                const data = await res.json();
                const list = (data.tokens || []).map((t: any) => ({
                    ...t,
                    mcap: (t.price || 0) * (t.supply || 0)
                })).filter((t: any) => t.mcap > 0);

                setTokens(list);
                setError(null);

                // Initial selection if needed
                if (list.length > 0 && !selectedMint && !hydratedToken) {
                    // We don't auto-select here to avoid loops or overrides if parent controls selection
                    // onSelect(list[0]); 
                }
            } catch (e: any) {
                console.error('[ARGUS_RADAR] Fetch Error:', e.message);
                setError(e.message);
            } finally {
                setLoading(false);
            }
        }

        fetchHot();
        interval = setInterval(fetchHot, 30000);
        return () => clearInterval(interval);
    }, [onSelect, selectedMint]); // Removed hydratedToken from deps to prevent re-fetching

    const filteredTokens = tokens.filter(t => {
        if (filter === 'SAFE') return t.feasibility === 'POSSIBLE';
        if (filter === 'HOT') return (t.volume5m || 0) > 5000;
        if (filter === 'DOLLAR') {
            const top1 = t.integrity?.top1Pct ?? 0;
            const top10 = t.integrity?.top10Pct ?? 0;
            return isDollarFeasible(t.supply, t.liquidity || 0, top1, top10);
        }
        return true;
    });

    if (loading && tokens.length === 0) {
        return (
            <div className="flex flex-col items-center py-20 opacity-20">
                <Loader2 className="animate-spin mb-4" size={32} />
                <span className="text-[10px] font-mono uppercase tracking-[0.4em]">Initializing Radar Sweep...</span>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col min-h-0">
            {/* Radar Controls */}
            <div className="px-4 py-3 border-b border-zinc-900 flex items-center justify-between sticky top-0 bg-black z-10">
                <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
                    {(['ALL', 'SAFE', 'HOT', 'DOLLAR'] as const).map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-3 py-1 rounded-md text-[8px] font-black uppercase tracking-tighter transition-all flex items-center gap-1 ${
                                filter === f
                                    ? f === 'DOLLAR'
                                        ? 'bg-emerald-500 text-black'
                                        : 'bg-white text-black'
                                    : 'text-zinc-500 hover:text-white hover:bg-zinc-900'
                            }`}
                        >
                            {f === 'DOLLAR' && <DollarSign size={10} />}
                            {f === 'DOLLAR' ? '$1' : f}
                        </button>
                    ))}
                </div>
                <div className="text-[9px] text-zinc-700 font-mono uppercase shrink-0 ml-4">Radar: Active</div>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 scrollbar-hide py-3 space-y-4">
                {filteredTokens.map((t, i) => {
                    // Start with feed data
                    let displayToken = t;

                    // Level 1 Hydration: Background Cache
                    if (hydratedCache[t.mint]) {
                        displayToken = hydratedCache[t.mint];
                    }

                    // Level 2 Hydration: Active Selection (Freshest)
                    if (hydratedToken && hydratedToken.mint === t.mint) {
                        displayToken = {
                            ...displayToken, // Use background data as base
                            ...hydratedToken // Override with active selection data
                        };
                    }

                    return (
                        <HotTokenCard
                            key={displayToken.mint}
                            token={displayToken}
                            index={i}
                            isSelected={selectedMint === displayToken.mint}
                            onSelect={onSelect}
                        />
                    );
                })}
            </div>
        </div>
    );
}
