'use client';

export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { PublicKey, VersionedTransaction } from '@solana/web3.js';
import { computePortfolioUsd, computeSeedUsd } from '@/lib/engine/portfolio';
import { runPortfolioAnalysis, PortfolioAnalysisResult, Position } from '@/app/actions/portfolio-runner';
import {
    Shield, Loader2, Activity, TrendingUp, TrendingDown, BrainCircuit, RefreshCw, RotateCcw,
    AlertTriangle, Zap, Target, Flame, Award, Wallet, Eye, Play, StopCircle,
    ChevronRight, BarChart3, Database, Search, ShieldCheck, Heart, Skull, ArrowUpRight, ArrowDownRight, ArrowRight
} from 'lucide-react';
import { executeLifecycleAction, ActionType } from '@/lib/engine/lifecycleExecutor';
import { derivePositionState, PositionState } from '@/lib/engine/lifecycleState';
import { SeedQuickPanel } from '@/components/SeedQuickPanel';
import { ObserveQuickPanel } from '@/components/ObserveQuickPanel';
import { ScaleQuickPanel } from '@/components/ScaleQuickPanel';
import { HarvestQuickPanel } from '@/components/HarvestQuickPanel';
import { RecycleQuickPanel } from '@/components/RecycleQuickPanel';
import UniversalLoader from '@/components/UniversalLoader';
import { AtlasWalkthrough } from '@/components/AtlasWalkthrough';

const SOL_MINT = 'So11111111111111111111111111111111111111112';
const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
const REFRESH_INTERVAL_MS = 60000; // Capped to 1 min to prevent API spam

const whitelistMints = [
    'So11111111111111111111111111111111111111112', // SOL
    'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
    'Es9vMFrzaDCSTuNv6S69P7Ra3SPfPLB26gh5pXB9ftx', // USDT
    'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN', // JUP
    'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm', // WIF
];

// ============================================================================
// DATA FETCHING (Access via API to bypass CORS/DNS blocks)
// ============================================================================

let heliusLock = false;

async function fetchWalletFromApi(wallet: string) {
    if (heliusLock) {
        console.warn("Helius lock engaged, skipping fetch");
        return null;
    }
    heliusLock = true;
    setTimeout(() => { heliusLock = false; }, 1000); // Reduced from 10s to 1s to match server speed

    const res = await fetch(`/api/wallet/helius`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet })
    });

    if (res.status === 429) {
        console.warn("Server Rate Guard Triggered");
        return null;
    }

    if (!res.ok) throw new Error(`Helius API failed [${res.status}]`);

    const data = await res.json();
    if (!data.items) throw new Error("Invalid Helius response format");

    const tokens = [];
    for (const item of data.items || []) {
        if (item.interface !== "FungibleToken") continue;
        const info = item.token_info;
        if (!info || info.balance <= 0) continue;

        tokens.push({
            mint: item.id,
            symbol: info.symbol || "UNKNOWN",
            name: item.content?.metadata?.name || item.id,
            logo: item.content?.files?.[0]?.uri || null,
            decimals: info.decimals,
            amount: Number(info.balance) / 10 ** info.decimals,
            rawAmount: info.balance.toString()
        });
    }

    return {
        sol: (data.nativeBalance?.lamports || 0) / 1e9,
        solRaw: data.nativeBalance?.lamports?.toString() || "0",
        tokens
    };
}

// ============================================================================
// TYPES
// ============================================================================
type LifecyclePhase = 'OBS' | 'SEE' | 'SCA' | 'HAR' | 'REC';

interface LifecycleOpportunity {
    mint: string;
    symbol: string;
    phase: LifecyclePhase;
    shadowPnL: number;
    seedSizeSOL: number;
    state?: PositionState; // Canonical Truth
}

function LifecycleRow({ op, wallet, seedingMints, hotQuote, position, onAction }: {
    op: LifecycleOpportunity,
    wallet: any,
    seedingMints: Set<string>,
    hotQuote: any,
    position?: any,
    onAction: (type: ActionType, params: any) => Promise<void>
}) {
    const isSeeding = seedingMints.has(op.mint);
    const [activePhase, setActivePhase] = useState<LifecyclePhase>(op.phase || 'OBS');
    const isTradable = position?.tradable !== false;

    return (
        <div className="relative mb-8 bg-black/40 rounded-xl border border-zinc-900 overflow-hidden backdrop-blur-sm group hover:border-zinc-700/50 transition-all duration-500">
            {/* 1. Header Row: Identity & Quick Exit */}
            <div className="flex justify-between items-center p-6 border-b border-zinc-900/50">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded bg-zinc-800 flex items-center justify-center p-2">
                        <span className="text-xs font-black text-zinc-500">{op.symbol.slice(0, 2)}</span>
                    </div>
                    <div>
                        <div className="text-lg font-black text-white tracking-widest leading-none mb-1">{op.symbol}</div>
                        <div className="text-[10px] text-zinc-600 font-mono tracking-widest uppercase">
                            Proximity • {op.mint.slice(0, 4)}...{op.mint.slice(-4)}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-12">
                    <div className="flex gap-8">
                        <div className="text-right">
                            <div className="text-[9px] text-zinc-600 font-black uppercase tracking-[0.2em] mb-1">Shadow PnL</div>
                            <div className={`text-sm font-black italic ${(op.shadowPnL || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                {(op.shadowPnL || 0) >= 0 ? '+' : ''}{(op.shadowPnL || 0).toFixed(2)}%
                            </div>
                        </div>
                        <div className="text-right pr-6 border-r border-zinc-900">
                            <div className="text-[9px] text-zinc-600 font-black uppercase tracking-[0.2em] mb-1">Seed Allocation</div>
                            <div className="text-sm font-black text-white italic">
                                {(op.seedSizeSOL || 0).toFixed(4)} <span className="text-zinc-500">SOL</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {position && (
                            <div className="text-right">
                                <div className="text-[10px] text-zinc-600 font-black uppercase tracking-[0.2em]">Live Value</div>
                                <div className="text-xs font-mono text-emerald-400">
                                    ${(position.usdValue || 0).toFixed(2)}
                                </div>
                            </div>
                        )}
                        <button
                            disabled={isSeeding || !op.state?.canExit}
                            onClick={(e) => {
                                e.stopPropagation();
                                onAction('RECYCLE', {
                                    overrideQuote: hotQuote,
                                    targetMint: op.mint,
                                    targetSymbol: op.symbol,
                                    state: op.state,
                                    position
                                });
                            }}
                            className="px-6 py-2.5 rounded bg-red-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(220,38,38,0.2)] flex items-center gap-2"
                        >
                            <Skull className="w-3.5 h-3.5" />
                            FAST EXIT
                        </button>
                    </div>
                </div>
            </div>

            {/* 2. Lifecycle Progress Track (The 5-Phase Circle UI) */}
            <div className="px-12 py-8 bg-zinc-900/20 relative">
                <div className="absolute left-24 right-24 top-[42px] h-[1px] bg-gradient-to-r from-transparent via-zinc-800 to-transparent z-0" />

                <div className="flex justify-between items-center relative z-10 max-w-4xl mx-auto">
                    {[
                        { id: 'OBS', label: 'OBSERVE', icon: <Eye className="w-4 h-4" />, color: 'cyan' },
                        { id: 'SEE', label: 'SEED', icon: <Zap className="w-4 h-4" />, color: 'emerald' },
                        { id: 'SCA', label: 'SCALE', icon: <ArrowUpRight className="w-4 h-4" />, color: 'emerald' },
                        { id: 'HAR', label: 'HARVEST', icon: <TrendingUp className="w-4 h-4" />, color: 'amber' },
                        { id: 'REC', label: 'RECYCLE', icon: <RotateCcw className="w-4 h-4" />, color: 'red' }
                    ].map((phase, idx) => {
                        const isActive = activePhase === phase.id;
                        const isCanonical = op.phase === phase.id;
                        const colors: { [key: string]: string } = {
                            cyan: 'text-cyan-400 border-cyan-900/50 bg-cyan-900/10 shadow-[0_0_15px_rgba(34,211,238,0.1)]',
                            emerald: 'text-emerald-400 border-emerald-900/50 bg-emerald-900/10 shadow-[0_0_15px_rgba(16,185,129,0.1)]',
                            amber: 'text-amber-500 border-amber-900/50 bg-amber-900/10 shadow-[0_0_15px_rgba(245,158,11,0.1)]',
                            red: 'text-red-500 border-red-900/50 bg-red-900/10 shadow-[0_0_15px_rgba(239,68,68,0.1)]'
                        };

                        return (
                            <div key={phase.id} className="flex flex-col items-center gap-3">
                                <button
                                    onClick={() => setActivePhase(phase.id as LifecyclePhase)}
                                    className={`w-12 h-12 rounded-full border flex items-center justify-center transition-all duration-300 relative group/node ${isActive
                                        ? 'bg-white text-black border-white scale-110 shadow-[0_0_25px_rgba(255,255,255,0.2)] z-20'
                                        : isCanonical
                                            ? `${colors[phase.color]} z-10`
                                            : 'bg-black text-zinc-700 border-zinc-900 hover:border-zinc-700 z-10'
                                        }`}
                                >
                                    {phase.icon}
                                    {isCanonical && !isActive && (
                                        <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-zinc-100 rounded-full border-2 border-black animate-pulse" />
                                    )}
                                </button>
                                <span className={`text-[9px] font-black tracking-[0.2em] transition-colors ${isActive ? 'text-white' : 'text-zinc-600'}`}>
                                    {phase.label}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* 3. Operational Panel (The Console) */}
            <div className="p-6 bg-black/40 border-t border-zinc-900/50">
                {activePhase === 'OBS' && (
                    <ObserveQuickPanel selectedGem={op} onRecycle={onAction} position={position} state={op.state} />
                )}
                {activePhase === 'SEE' && (
                    <SeedQuickPanel wallet={wallet} selectedGem={op} onAction={(p) => onAction('SEED', p)} onRecycle={onAction} isGlobalSeeding={isSeeding} preloadedQuote={hotQuote} state={op.state} />
                )}
                {activePhase === 'SCA' && (
                    <ScaleQuickPanel wallet={wallet} selectedGem={op} onAction={onAction} onRecycle={onAction} isGlobalSeeding={isSeeding} preloadedQuote={hotQuote} position={position} state={op.state} />
                )}
                {activePhase === 'HAR' && (
                    <HarvestQuickPanel wallet={wallet} selectedGem={op} onAction={onAction} onRecycle={onAction} isGlobalSeeding={isSeeding} preloadedQuote={hotQuote} position={position} state={op.state} />
                )}
                {activePhase === 'REC' && (
                    <RecycleQuickPanel wallet={wallet} selectedGem={op} onAction={onAction} isGlobalSeeding={isSeeding} preloadedQuote={hotQuote} position={position} state={op.state} />
                )}
            </div>
        </div>
    );
}

interface TokenHolding {
    mint: string;
    symbol: string;
    name: string;
    logoURI: string;
    amount: number;
    rawAmount: string;
    decimals: number;
    valueUSD?: number;
    tradable: boolean;
}

interface JupiterToken {
    address: string;
    symbol: string;
    name: string;
    logoURI: string;
    decimals: number;
}

// ============================================================================
// UI COMPONENTS
// ============================================================================

const PanelHeader = ({ title, icon: Icon, count, color = "cyan" }: any) => (
    <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/40">
        <div className="flex items-center gap-2">
            <Icon className={`w-4 h-4 text-${color}-400`} />
            <span className={`text-xs font-black uppercase tracking-widest text-${color}-400`}>{title}</span>
        </div>
        {count !== undefined && <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-tight">{count} ACTIVE_SIGNALS</span>}
    </div>
);

const DiscoveryRow = ({
    gem,
    color,
    wallet,
    onAction,
    hotQuote,
    isSeeding
}: {
    gem: PortfolioAnalysisResult,
    color: string,
    wallet: any;
    onAction: (params: any) => Promise<void>;
    hotQuote?: any;
    isSeeding: boolean;
}) => {
    const [isExpanded, setIsExpanded] = useState(false);

    // Map discovery gem format to common 'op' format for SeedQuickPanel
    const op = {
        mint: gem.mint,
        symbol: gem.symbol,
        decimals: gem.decimals || 6
    };

    return (
        <div className="flex flex-col border-b border-zinc-900/50 last:border-0 hover:bg-zinc-800/5 transition-all group/disco">
            <div className="px-4 py-3 flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="font-black text-xs text-white uppercase italic tracking-tighter truncate">{gem.symbol}</span>
                        <span className={`text-[8px] font-black text-${color}-500/80 bg-${color}-500/5 px-1 border border-${color}-500/20 rounded`}>{gem.verdict.riskScore}</span>
                    </div>
                    <div className="flex items-center gap-3 text-[9px] font-mono text-zinc-600">
                        <span>${gem.metrics.price.toFixed(gem.metrics.price < 0.01 ? 6 : 4)}</span>
                        <span>LIQ: ${(gem.metrics.liquidityUSD / 1000).toFixed(0)}k</span>
                    </div>
                </div>
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className={`px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded transition-all ${isExpanded
                        ? 'bg-zinc-800 text-white'
                        : `opacity-0 group-hover/disco:opacity-100 bg-${color}-500/10 border border-${color}-500/30 text-${color}-400 hover:bg-${color}-500 hover:text-white`
                        }`}
                >
                    {isExpanded ? 'CANCEL' : 'BUY'}
                </button>
            </div>

            {isExpanded && (
                <div className="px-4 pb-4 animate-in slide-in-from-top-2 duration-300">
                    <SeedQuickPanel
                        wallet={wallet}
                        selectedGem={op}
                        onAction={(p) => onAction('SEED', p)}
                        isGlobalSeeding={isSeeding}
                        preloadedQuote={hotQuote}
                        state={{ currentPhase: 'OBS', canSeed: true, hasPosition: false } as any}
                    />
                </div>
            )}
        </div>
    );
};

function RoadmapCard({ roadmap, onAction, solPrice }: { roadmap: any, onAction: any, solPrice: number }) {
    if (!roadmap || !roadmap.steps || roadmap.steps.length === 0) return null;

    return (
        <div className="bg-zinc-900/10 border border-zinc-800 rounded-xl p-6 hover:border-cyan-500/30 transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <BrainCircuit size={48} className="text-cyan-500" />
            </div>

            <div className="flex items-center justify-between mb-6 relative z-10">
                <div className="flex items-center gap-3">
                    <div className="px-2 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded text-[10px] font-black text-cyan-500 uppercase tracking-widest flex items-center gap-2">
                        <Zap size={10} className="fill-current" />
                        {roadmap.scenario || 'BALANCED'} Strategy
                    </div>
                </div>
                <div className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">
                    Confidence: <span className="text-cyan-400">{roadmap.summary?.confidence || 'MEDIUM'}</span>
                </div>
            </div>

            <div className="flex items-center gap-4 mb-8 overflow-x-auto pb-4 scrollbar-hide relative z-10">
                {roadmap.steps.map((step: any, i: number) => (
                    <div key={i} className="flex items-center gap-4 flex-shrink-0">
                        <div className="flex flex-col items-center">
                            <div className="w-10 h-10 rounded-xl border border-zinc-800 bg-black flex items-center justify-center text-[10px] font-black text-zinc-500 relative">
                                {i + 1}
                                {step.action === 'HOLD' && (
                                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500/20 border border-amber-500/40 rounded-full flex items-center justify-center">
                                        <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                                    </div>
                                )}
                            </div>
                            <div className="mt-2 text-[10px] font-black text-white uppercase tracking-widest text-center max-w-[60px] truncate">
                                {step.action === 'SWAP' ? (step.toSymbol || 'TOKEN') : `HOLD ${step.holdMinutes || 0}m`}
                            </div>
                        </div>
                        {i < roadmap.steps.length - 1 && (
                            <ArrowRight className="w-4 h-4 text-zinc-800 mb-4" />
                        )}
                    </div>
                ))}
            </div>

            <div className="p-4 bg-black/40 border border-zinc-800/50 rounded-lg mb-6 relative z-10">
                <div className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-2 italic flex items-center gap-2">
                    <Activity size={10} /> Intelligence Insight:
                </div>
                <div className="text-[11px] text-zinc-400 leading-relaxed font-black uppercase tracking-tighter">
                    {roadmap.explanation?.whyChosen?.[0] || 'Multi-hop rotation detected for optimal capital flow.'}
                </div>
            </div>

            <button
                onClick={() => onAction('SEED', {
                    overrideQuote: null,
                    baseMint: roadmap.steps[0]?.fromToken,
                    targetMint: roadmap.steps[0]?.toToken,
                    seedUsd: 10
                })}
                className="w-full py-4 bg-cyan-950/20 border border-cyan-500/30 text-cyan-500 font-black uppercase text-[11px] tracking-[0.3em] rounded-xl hover:bg-cyan-600 hover:text-white transition-all flex items-center justify-center gap-3 group/btn z-10 relative"
            >
                <Play className="w-4 h-4 fill-current group-hover/btn:scale-110 transition-transform" />
                Launch Strategic Hop 1
            </button>
        </div>
    );
}

const DiscoverySkeleton = ({ color = "cyan" }: { color?: string }) => (
    <div className="p-4 space-y-4 animate-pulse">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded bg-${color}-500/10 border border-${color}-500/20`} />
                <div className="space-y-1">
                    <div className={`h-3 w-16 bg-${color}-500/20 rounded`} />
                    <div className="h-2 w-24 bg-zinc-800 rounded" />
                </div>
            </div>
            <div className="h-4 w-12 bg-zinc-800 rounded" />
        </div>
        <div className="h-[1px] bg-zinc-900" />
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[8px] font-mono text-zinc-700">
                <div className="w-1.5 h-1.5 rounded-full bg-zinc-800 animate-ping" />
                EXTRACTING_MARKET_VECTORS...
            </div>
            <div className={`w-12 h-5 bg-${color}-500/10 rounded`} />
        </div>
    </div>
);

export default function AtlasPage() {
    const { publicKey, connected, sendTransaction } = useWallet();
    const { connection } = useConnection();
    const { setVisible } = useWalletModal();

    // State
    const [loading, setLoading] = useState(true);
    const [showWalkthrough, setShowWalkthrough] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);
    const [activeFleet, setActiveFleet] = useState<LifecycleOpportunity[]>([]);
    const [globalRoadmaps, setGlobalRoadmaps] = useState<any[]>([]); // BrainRoadmap[]

    // Core Data
    const [solBalance, setSolBalance] = useState(0);
    const [holdings, setHoldings] = useState<TokenHolding[]>([]);
    const [discovery, setDiscovery] = useState<PortfolioAnalysisResult[]>([]);
    const [solPrice, setSolPrice] = useState(0);
    const [seedingMints, setSeedingMints] = useState<Set<string>>(new Set());
    const [enginePositions, setEnginePositions] = useState<any[]>([]);
    const [analysisResults, setAnalysisResults] = useState<PortfolioAnalysisResult[]>([]);
    const [logs, setLogs] = useState<string[]>([]);
    const [lifecycle, setLifecycle] = useState<LifecycleOpportunity[]>([]);

    // Reset loading state on identity link
    useEffect(() => {
        if (publicKey) {
            setLoading(true);
        }
    }, [publicKey]);

    // Persistence Effect (Walkthrough)
    useEffect(() => {
        if (connected && publicKey) {
            const hasSeen = localStorage.getItem('has_seen_atlas_walkthrough');
            if (!hasSeen) {
                setShowWalkthrough(true);
            }
        }
    }, [connected, publicKey]);

    const addLog = useCallback((msg: string) => {
        setLogs(prev => [...prev.slice(-30), `[${new Date().toLocaleTimeString()}] ${msg}`]);
    }, []);

    // Refs
    const autoRefreshRef = useRef<NodeJS.Timeout | null>(null);
    const isTickingRef = useRef(false);

    // Survival Loop Analysis
    const performAnalyticalTick = useCallback(async (forceFull = false) => {
        if (!publicKey || isTickingRef.current) return;
        isTickingRef.current = true;

        setAnalyzing(true);
        addLog('Atlas: Initiating analytical tick...');

        try {
            // 1. Parallel Fetch: Wallet Data + Engine Positions
            const [walletData, enginePosRes] = await Promise.all([
                fetchWalletFromApi(publicKey.toBase58()),
                fetch("/api/engine/positions")
            ]);

            if (!walletData) {
                addLog('System: Analytics throttled (Cooldown active).');
                setAnalyzing(false);
                isTickingRef.current = false;

                // If we are still in the initial loading state, retry much faster (2s) 
                // instead of waiting for the 60s global interval.
                setTimeout(performAnalyticalTick, 2000);
                return;
            }

            setSolBalance(walletData.sol);
            setHoldings(walletData.tokens); // Initial set for responsiveness

            // Metadata is now handled server-side or lazily, no longer blocking initial sync
            const walletHoldings: any[] = walletData.tokens.map(t => {
                return {
                    mint: t.mint,
                    symbol: t.symbol || t.mint.slice(0, 6),
                    name: t.name || 'Unknown',
                    logoURI: t.logo || `https://token.jup.ag/all/logo/${t.mint}`,
                    amount: t.amount,
                    rawAmount: t.rawAmount,
                    decimals: t.decimals,
                    tradable: true // We assume tradable, server will refine if SELL is triggered
                };
            }).filter(h => h.amount > 0);

            setHoldings(walletHoldings); // Temporary set for UI placeholders

            // 2. Prepare for Physics Engine
            const positions: Position[] = walletHoldings.map(h => ({
                mint: h.mint,
                amount: h.amount,
                state: 'OBSERVING'
            }));

            if (walletData.sol > 0.001) {
                positions.unshift({ mint: SOL_MINT, amount: walletData.sol, state: 'OBSERVING' });
            }

            // 3. Execution Action (Server will filter for tradability)
            const tradablePositions = positions;

            const analysis = await runPortfolioAnalysis(tradablePositions, [], { skipDiscovery: false });

            const sPriceRaw = analysis.results?.find(r => r.mint === SOL_MINT)?.metrics.price || 0;
            const sPrice = isFinite(sPriceRaw) && sPriceRaw > 0 ? sPriceRaw : 0;
            setSolPrice(sPrice);
            setAnalysisResults(analysis.results || []);
            setDiscovery(analysis.discoveryResults || []);
            setGlobalRoadmaps(analysis.globalRoadmaps || []);

            console.log("[DISCOVERY_UI] Discovery Results Split:", {
                safe: (analysis.discoveryResults || []).filter((g: any) => (g.verdict.riskScore || 0) <= 30).length,
                med: (analysis.discoveryResults || []).filter((g: any) => (g.verdict.riskScore || 0) > 30 && (g.verdict.riskScore || 0) <= 65).length,
                meme: (analysis.discoveryResults || []).filter((g: any) => (g.verdict.riskScore || 0) > 65).length
            });

            // 4. Parse Engine Positions (Already fetched in Step 1)
            const enginePos = await enginePosRes.json();
            setEnginePositions(enginePos);

            // 4. Current Frame Enrichment (The Consciousness)
            const holdingsWithUsd = walletHoldings.map(h => {
                const result = analysis.results?.find((r: any) => r.mint === h.mint);
                return {
                    ...h,
                    usdValue: h.amount * (result?.metrics.price || 0)
                };
            });
            setHoldings(holdingsWithUsd);

            // === ACTIVE FLEET SYNC ===
            const fleet: LifecycleOpportunity[] = holdingsWithUsd
                .filter(h => (h.tradable || h.mint === SOL_MINT) && h.amount > 0)
                .map(h => {
                    const pos = enginePos.find((p: any) => p.targetMint === h.mint);
                    const currentSolValue = (h.usdValue || 0) / (sPrice || 1);
                    const state = derivePositionState(h.mint, h.symbol, currentSolValue, pos);
                    return {
                        mint: h.mint,
                        symbol: h.symbol,
                        phase: state.currentPhase,
                        shadowPnL: pos ? ((currentSolValue / (pos.investedUsd / pos.solPriceAtEntry)) - 1) * 100 : 0,
                        seedSizeSOL: 0,
                        state
                    };
                });
            setActiveFleet(fleet);

            // === DISCOVERY SYNC ===
            if (analysis.discoveryResults && analysis.discoveryResults.length > 0) {
                const discoveryOps: LifecycleOpportunity[] = analysis.discoveryResults.map(res => {
                    const hToken = holdingsWithUsd.find(h => h.mint === res.mint);
                    const pos = enginePos.find((p: any) => p.targetMint === res.mint);
                    const currentSolValue = (hToken?.usdValue || 0) / (sPrice || 1);
                    const state = derivePositionState(res.mint, res.symbol, currentSolValue, pos);

                    return {
                        mint: res.mint,
                        symbol: res.symbol,
                        phase: state.currentPhase,
                        shadowPnL: res.metrics.poolPrice > 0 ? Math.max(0, (res.metrics.currentPrice / res.metrics.poolPrice - 1) * 100) : 0,
                        seedSizeSOL: (sPrice > 0) ? (computeSeedUsd(computePortfolioUsd({ sol: walletData.sol, tokens: holdingsWithUsd, solUsd: walletData.sol * sPrice }, sPrice)) / sPrice) : 0,
                        state
                    };
                });
                setLifecycle(discoveryOps.slice(0, 5));
            } else {
                setLifecycle([]);
            }

            if (analysis.logs) {
                analysis.logs.forEach(l => addLog(l));
            }

            addLog(`Atlas Tick Complete: ${walletHoldings.length} holdings audited, ${analysis.discoveryResults?.length} opportunities scouted.`);
            setLoading(false); // Only finish loading once we have actual results

        } catch (err) {
            addLog(`Tick Failure: ${err}`);
            // Retry sooner if we don't have results yet
            if (loading) {
                setTimeout(() => performAnalyticalTick(), 3000);
            }
        } finally {
            setAnalyzing(false);
            isTickingRef.current = false;
        }
    }, [publicKey, addLog]);

    const onAction = useCallback(async (type: ActionType, params: any) => {
        if (!publicKey || !params.targetMint) return;

        const targetMint = params.targetMint;
        setSeedingMints(prev => new Set(prev).add(targetMint));

        try {
            const context = {
                publicKey,
                connection,
                portfolioUsd: computePortfolioUsd({ sol: solBalance, tokens: holdings, solUsd: solBalance * solPrice }),
                prices: {
                    ...analysisResults.reduce((acc, r) => ({ ...acc, [r.mint]: r.metrics.price }), {}),
                    ...holdings.reduce((acc, h) => ({ ...acc, [h.mint]: (h.usdValue || 0) / (h.amount || 1) }), {}),
                    [SOL_MINT]: solPrice
                },
                holdings,
                addLog,
                sendTransaction
            };

            const signature = await executeLifecycleAction(type, {
                ...params,
                position: enginePositions.find(p => p.targetMint === targetMint)
            }, context);

            if (signature) {
                // Refresh data immediately
                setTimeout(performAnalyticalTick, 1500);
            }

        } catch (err: any) {
            addLog(`Action [${type}] Failed: ${err.message}`);
        } finally {
            setSeedingMints(prev => {
                const next = new Set(prev);
                next.delete(targetMint);
                return next;
            });
        }
    }, [publicKey, connection, solBalance, holdings, solPrice, analysisResults, enginePositions, addLog, sendTransaction, performAnalyticalTick]);

    // PRELOAD QUOTES (Global Hot-Cache)
    const [hotQuotes, setHotQuotes] = useState<Record<string, any>>({});
    const lastQuoteFetchRef = useRef<Record<string, number>>({});
    const isFetchingGlobalRef = useRef(false);

    useEffect(() => {
        if (!connected || !publicKey || lifecycle.length === 0) return;

        const refreshQuotes = async () => {
            if (isFetchingGlobalRef.current) return;
            isFetchingGlobalRef.current = true;

            const now = Date.now();
            const pUsd = computePortfolioUsd({ sol: solBalance, tokens: holdings, solUsd: solBalance * solPrice }, solPrice);
            const sUsd = computeSeedUsd(pUsd);

            const allOps = [...lifecycle, ...activeFleet];

            for (const op of allOps) {
                // Throttle: Only fetch if 15s have passed since last fetch for this mint
                const lastFetch = lastQuoteFetchRef.current[op.mint] || 0;
                if (now - lastFetch < 15000) continue;

                try {
                    let inputMint = SOL_MINT;
                    let outputMint = op.mint;
                    let rawAmount = 0;

                    if (op.phase === 'SEE') {
                        if (sUsd <= 0) continue;
                        rawAmount = Math.floor((sUsd / solPrice) * 1e9);
                    } else if (op.phase === 'SCA') {
                        const scaleUsd = pUsd * 0.06;
                        rawAmount = Math.floor((scaleUsd / solPrice) * 1e9);
                    } else if (op.phase === 'HAR' || op.phase === 'REC') {
                        const pos = enginePositions.find(p => p.targetMint === op.mint);
                        if (!pos || !pos.amount) continue;
                        inputMint = op.mint;
                        outputMint = SOL_MINT;
                        const factor = op.phase === 'HAR' ? 0.4 : 1.0;
                        // BUG FIX: pos.amount is already RAW (outAmount from quote). 
                        // Do not multiply by decimals again.
                        rawAmount = Math.floor(pos.amount * factor);
                    }

                    if (rawAmount <= 0) continue;

                    lastQuoteFetchRef.current[op.mint] = now;

                    // Directly call Railway Proxy from frontend
                    const JUPITER_PROXY_URL = process.env.NEXT_PUBLIC_JUPITER_PROXY_URL || 'https://jupiter-proxy-production.up.railway.app';
                    const url = `${JUPITER_PROXY_URL}/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${rawAmount.toString()}&slippageBps=100&platformFeeBps=50`;

                    const res = await fetch(url, {
                        method: "GET",
                        headers: { "Accept": "application/json" }
                    });

                    const data = await res.json();
                    if (data && data.routePlan?.length) {
                        setHotQuotes(prev => ({ ...prev, [op.mint]: data }));
                    }
                } catch (e) {
                    // console.error(`[HOT_CACHE] Failed for ${op.symbol}:`, e);
                }
            }
            isFetchingGlobalRef.current = false;
        };

        refreshQuotes();
        const interval = setInterval(refreshQuotes, 15000);
        return () => clearInterval(interval);
    }, [lifecycle, activeFleet, connected, publicKey, solBalance, holdings, solPrice]);

    // Initialize
    useEffect(() => {
        // Step 4: Test API Directly (Verification)
        if (connected && publicKey) {
            console.log(`[TEST] Verifying balances via API for: ${publicKey.toBase58()}`);
            fetchWalletFromApi(publicKey.toBase58())
                .then(data => console.log(`[TEST] API DATA:`, data))
                .catch(err => console.error(`[TEST] API FAILED:`, err));
        }
    }, [connected, publicKey]);

    useEffect(() => {
        if (connected && publicKey) {
            performAnalyticalTick();

            // Refresh loop - 60s for wallet data, can be faster for discovery but we link them here
            const interval = setInterval(() => {
                if (document.visibilityState === 'visible') {
                    performAnalyticalTick();
                }
            }, REFRESH_INTERVAL_MS);

            autoRefreshRef.current = interval;
            return () => clearInterval(interval);
        }
    }, [connected, publicKey, performAnalyticalTick]);

    return (
        <>
            {connected && loading && (
                <UniversalLoader
                    fullScreen
                    message="Syncing Atlas Physics..."
                />
            )}
            <div className="min-h-screen bg-black text-white font-mono p-4 md:p-8 selection:bg-cyan-500/30">
                <div className="max-w-7xl mx-auto space-y-6">

                    {/* Project Label */}
                    <div className="flex items-center gap-3 px-1">
                        <div className="w-2 h-2 rounded-full bg-cyan-400 group-hover:animate-ping" />
                        <h1 className="text-2xl font-black italic tracking-[0.5em] text-white uppercase">Atlas</h1>
                        <span className="text-[10px] text-zinc-600 font-black uppercase tracking-widest mt-1 border-l border-zinc-800 pl-3">Observatory_Mode</span>
                    </div>

                    {/* Header: Identity & Metrics */}
                    <div className="bg-[#0a0a0a] border border-zinc-800 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
                        {!connected ? (
                            <div className="flex-1 text-center py-4">
                                <h2 className="text-xl font-black text-zinc-800 mb-2 tracking-tighter italic uppercase">Waiting for Identity Link...</h2>
                                <p className="text-[10px] text-zinc-700 uppercase tracking-widest">Connect wallet in the top navbar to begin</p>
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center gap-4">
                                    <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse shadow-[0_0_15px_rgba(34,197,94,0.5)]"></div>
                                    <div>
                                        <div className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">Identity Secured</div>
                                        <div className="text-sm font-bold tracking-tight">{publicKey?.toBase58().slice(0, 8)}...{publicKey?.toBase58().slice(-8)}</div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-12">
                                    <div className="text-right">
                                        <div className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">SOL Balance</div>
                                        <div className="text-xl font-black text-cyan-400 tracking-tighter">{solBalance.toFixed(4)} <span className="text-xs">SOL</span></div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">Holdings</div>
                                        <div className="text-xl font-black text-white tracking-tighter">{holdings.length}</div>
                                    </div>
                                    <button
                                        onClick={() => performAnalyticalTick(true)}
                                        disabled={analyzing}
                                        className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl hover:bg-zinc-800 transition-all text-zinc-400 group"
                                        title="Force Full Market Scan"
                                    >
                                        <RefreshCw className={`w-5 h-5 ${analyzing ? 'animate-spin text-cyan-400' : 'group-hover:text-cyan-400'}`} />
                                    </button>
                                </div>
                            </>
                        )}
                    </div>

                    {connected && (
                        <>
                            {/* Status Overlay */}
                            {analyzing && !loading && (
                                <div className="flex items-center gap-4 px-6 py-3 bg-zinc-900/50 border border-zinc-800 rounded-xl animate-pulse w-fit backdrop-blur-sm">
                                    <div className="relative w-4 h-4">
                                        <div className="absolute inset-0 border-2 border-cyan-500/20 rounded-full" />
                                        <div className="absolute inset-0 border-2 border-cyan-500 rounded-full border-t-transparent animate-spin" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest leading-none mb-1">Atlas Syncing</span>
                                        <span className="text-[8px] text-zinc-500 font-mono tracking-tighter uppercase">Mapping_Universe...</span>
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Your Holdings */}
                                <div className="bg-[#0a0a0a] border border-zinc-800 rounded-xl overflow-hidden shadow-xl">
                                    <PanelHeader title="Your Holdings" icon={Wallet} color="cyan" />
                                    <div className="max-h-[400px] overflow-y-auto divide-y divide-zinc-900">
                                        {holdings.length === 0 ? (
                                            analyzing ? (
                                                <div className="space-y-0">
                                                    <DiscoverySkeleton color="cyan" />
                                                    <DiscoverySkeleton color="cyan" />
                                                </div>
                                            ) : (
                                                <div className="p-12 text-center text-zinc-600 text-xs italic uppercase">No token holdings detected</div>
                                            )
                                        ) : (
                                            holdings.map((h, i) => (
                                                <div key={i} className="p-4 flex items-center justify-between hover:bg-zinc-800/10 transition-colors">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 bg-zinc-900 border border-zinc-800 rounded-lg flex items-center justify-center overflow-hidden">
                                                            <Shield size={18} className="text-zinc-700" />
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <div className="text-sm font-black tracking-tight">{h.symbol}</div>
                                                                {!h.tradable && (
                                                                    <span className="text-[7px] bg-zinc-900 border border-zinc-800 text-zinc-500 px-1 rounded uppercase font-black">Not Tradable</span>
                                                                )}
                                                            </div>
                                                            <div className="text-[9px] text-zinc-600 font-mono tracking-tighter">{h.mint.slice(0, 16)}...</div>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-sm font-black text-white">{h.amount.toLocaleString()}</div>
                                                        <div className="text-[10px] text-zinc-500 uppercase font-black">Quantity</div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>

                                {/* Analysis Results */}
                                <div className="bg-[#0a0a0a] border border-zinc-800 rounded-xl overflow-hidden shadow-xl">
                                    <PanelHeader title="Analysis Results" icon={BrainCircuit} color="purple" />
                                    <div className="max-h-[400px] overflow-y-auto divide-y divide-zinc-900">
                                        {analysisResults.length === 0 ? (
                                            analyzing ? (
                                                <div className="space-y-0">
                                                    <DiscoverySkeleton color="purple" />
                                                    <DiscoverySkeleton color="purple" />
                                                </div>
                                            ) : (
                                                <div className="p-12 text-center text-zinc-600 text-xs italic uppercase">Run analysis to see results</div>
                                            )
                                        ) : (
                                            analysisResults.map((r, i) => (
                                                <div key={i} className="p-4 hover:bg-zinc-800/10 transition-colors">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <div className="font-black text-sm uppercase italic tracking-tight">{r.symbol}</div>
                                                        <div className={`text-[10px] font-black px-2 py-0.5 border rounded-full ${r.verdict.action === 'HOLD' ? 'border-green-500/30 text-green-500 bg-green-500/5' :
                                                            r.verdict.action === 'SELL' ? 'border-rose-500/30 text-rose-500 bg-rose-500/5' :
                                                                'border-zinc-500/30 text-zinc-500 bg-zinc-500/5'
                                                            }`}>
                                                            {r.verdict.action}
                                                        </div>
                                                    </div>
                                                    <p className="text-[11px] text-zinc-400 mb-2 leading-tight">{r.verdict.reason}</p>
                                                    <div className="flex items-center gap-4 text-[9px] font-black uppercase tracking-widest text-zinc-600">
                                                        <span>Risk: {r.verdict.riskScore}/100</span>
                                                        <span>Status: {r.verdict.state || 'MONITORING'}</span>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* WONDERING (HUNTING GEMS) */}
                            <div className="bg-[#0a0a0a] border border-zinc-800 rounded-xl overflow-hidden shadow-2xl">
                                <PanelHeader title="Wondering (Hunting Gems)" icon={Search} count={discovery.length} color="cyan" />

                                <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-zinc-800">
                                    {/* COLUMN 1: SAFE */}
                                    <div className="flex flex-col">
                                        <div className="px-4 py-2 bg-green-500/5 border-b border-zinc-800 flex items-center justify-between">
                                            <span className="text-[10px] font-black text-green-500 uppercase tracking-widest">🛡️ SAFE</span>
                                            <span className="text-[10px] text-zinc-600 font-bold uppercase">{discovery.filter(g => (g.verdict.riskScore || 0) <= 30).length} Opps</span>
                                        </div>
                                        <div className="divide-y divide-zinc-900 min-h-[300px]">
                                            {discovery.filter(g => (g.verdict.riskScore || 0) <= 30).length === 0 ? (
                                                <div className="space-y-0 text-center">
                                                    <DiscoverySkeleton color="green" />
                                                    <DiscoverySkeleton color="green" />
                                                    <div className="p-8 text-[10px] text-zinc-800 uppercase italic animate-pulse">Searching Stable Vectors...</div>
                                                </div>
                                            ) : (
                                                discovery.filter(g => (g.verdict.riskScore || 0) <= 30).slice(0, 5).map((gem, i) => (
                                                    <DiscoveryRow
                                                        key={gem.mint}
                                                        gem={gem}
                                                        color="green"
                                                        onAction={onAction}
                                                        isSeeding={seedingMints.has(gem.mint)}
                                                        hotQuote={hotQuotes[gem.mint]}
                                                        wallet={{
                                                            sol: solBalance,
                                                            tokens: holdings,
                                                            solUsd: solBalance * solPrice,
                                                            solPrice: solPrice
                                                        }}
                                                    />
                                                ))
                                            )}
                                        </div>
                                    </div>

                                    {/* COLUMN 2: MEDIUM */}
                                    <div className="flex flex-col">
                                        <div className="px-4 py-2 bg-amber-500/5 border-b border-zinc-800 flex items-center justify-between">
                                            <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">⚡ MEDIUM</span>
                                            <span className="text-[10px] text-zinc-600 font-bold uppercase">{discovery.filter(g => (g.verdict.riskScore || 0) > 30 && (g.verdict.riskScore || 0) <= 65).length} Opps</span>
                                        </div>
                                        <div className="divide-y divide-zinc-900 min-h-[300px]">
                                            {discovery.filter(g => (g.verdict.riskScore || 0) > 30 && (g.verdict.riskScore || 0) <= 65).length === 0 ? (
                                                <div className="space-y-0 text-center">
                                                    <DiscoverySkeleton color="amber" />
                                                    <DiscoverySkeleton color="amber" />
                                                    <div className="p-8 text-[10px] text-zinc-800 uppercase italic animate-pulse">Awaiting Mid-Cap Physics...</div>
                                                </div>
                                            ) : (
                                                discovery.filter(g => (g.verdict.riskScore || 0) > 30 && (g.verdict.riskScore || 0) <= 65).slice(0, 5).map((gem, i) => (
                                                    <DiscoveryRow
                                                        key={gem.mint}
                                                        gem={gem}
                                                        color="amber"
                                                        onAction={onAction}
                                                        isSeeding={seedingMints.has(gem.mint)}
                                                        hotQuote={hotQuotes[gem.mint]}
                                                        wallet={{
                                                            sol: solBalance,
                                                            tokens: holdings,
                                                            solUsd: solBalance * solPrice,
                                                            solPrice: solPrice
                                                        }}
                                                    />
                                                ))
                                            )}
                                        </div>
                                    </div>

                                    {/* COLUMN 3: MEME */}
                                    <div className="flex flex-col">
                                        <div className="px-4 py-2 bg-rose-500/5 border-b border-zinc-800 flex items-center justify-between">
                                            <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest">🔥 MEME</span>
                                            <span className="text-[10px] text-zinc-600 font-bold uppercase">{discovery.filter(g => (g.verdict.riskScore || 0) > 65).length} Opps</span>
                                        </div>
                                        <div className="divide-y divide-zinc-900 min-h-[300px]">
                                            {discovery.filter(g => (g.verdict.riskScore || 0) > 65).length === 0 ? (
                                                <div className="space-y-0 text-center">
                                                    <DiscoverySkeleton color="rose" />
                                                    <DiscoverySkeleton color="rose" />
                                                    <div className="p-8 text-[10px] text-zinc-800 uppercase italic animate-pulse">Scouting the trenches...</div>
                                                </div>
                                            ) : (
                                                discovery.filter(g => (g.verdict.riskScore || 0) > 65).slice(0, 5).map((gem, i) => (
                                                    <DiscoveryRow
                                                        key={gem.mint}
                                                        gem={gem}
                                                        color="rose"
                                                        onAction={onAction}
                                                        isSeeding={seedingMints.has(gem.mint)}
                                                        hotQuote={hotQuotes[gem.mint]}
                                                        wallet={{
                                                            sol: solBalance,
                                                            tokens: holdings,
                                                            solUsd: solBalance * solPrice,
                                                            solPrice: solPrice
                                                        }}
                                                    />
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Active Fleet */}
                            <div className="bg-[#0a0a0a] border border-zinc-800 rounded-xl overflow-hidden p-6 shadow-2xl">
                                <div className="flex items-center justify-between mb-8">
                                    <div className="flex items-center gap-3">
                                        <ShieldCheck className="w-5 h-5 text-emerald-400" />
                                        <h2 className="text-sm font-black text-white uppercase tracking-[0.3em] italic">Active Fleet ({activeFleet.length} Positions)</h2>
                                    </div>
                                    <div className="text-[10px] text-zinc-500 font-black uppercase tracking-widest bg-zinc-900 px-3 py-1 rounded">
                                        Deployment Status: <span className="text-emerald-500">ENGAGED</span>
                                    </div>
                                </div>
                                <div className="space-y-12">
                                    {activeFleet.length === 0 ? (
                                        <div className="py-20 text-center text-zinc-800 text-xs font-black uppercase tracking-[0.2em] italic">No active positions in the fleet. Seed a gem to begin.</div>
                                    ) : (
                                        activeFleet.map((op) => (
                                            <LifecycleRow
                                                key={op.mint}
                                                op={op}
                                                seedingMints={seedingMints}
                                                hotQuote={hotQuotes[op.mint]}
                                                position={enginePositions.find(p => p.targetMint === op.mint)}
                                                wallet={{
                                                    sol: solBalance,
                                                    tokens: holdings,
                                                    solUsd: solBalance * solPrice,
                                                    solPrice: solPrice
                                                }}
                                                onAction={onAction}
                                            />
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Strategic Rebalance Hub */}
                            {globalRoadmaps.length > 0 && (
                                <div className="bg-[#0a0a0a] border border-cyan-900/30 rounded-xl overflow-hidden p-6 shadow-2xl">
                                    <div className="flex items-center justify-between mb-8">
                                        <div className="flex items-center gap-3">
                                            <BrainCircuit className="w-5 h-5 text-cyan-400" />
                                            <h2 className="text-sm font-black text-white uppercase tracking-[0.3em] italic">Strategic Rebalance Hub ({globalRoadmaps.length} Paths)</h2>
                                        </div>
                                        <div className="text-[10px] text-zinc-500 font-black uppercase tracking-widest bg-zinc-900 px-3 py-1 rounded flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-pulse" />
                                            Multi-Hop Intelligence Active
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {globalRoadmaps.slice(0, 4).map((roadmap, i) => (
                                            <RoadmapCard key={i} roadmap={roadmap} onAction={onAction} solPrice={solPrice} />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Discovery Hive */}
                            <div className="bg-[#0a0a0a] border border-zinc-800 rounded-xl overflow-hidden p-6 shadow-2xl opacity-80 hover:opacity-100 transition-opacity">
                                <div className="flex items-center justify-between mb-8">
                                    <div className="flex items-center gap-3">
                                        <Award className="w-5 h-5 text-purple-400" />
                                        <h2 className="text-sm font-black text-white uppercase tracking-[0.3em] italic">Discovery Hive ({lifecycle.length} Scoped)</h2>
                                    </div>
                                </div>

                                <div className="space-y-12">
                                    {lifecycle.length === 0 ? (
                                        <div className="py-20 flex flex-col items-center justify-center space-y-4">
                                            <div className="w-16 h-16 border-2 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" />
                                            <div className="text-[10px] text-zinc-600 font-black uppercase tracking-[0.4em] animate-pulse italic">Engaging Discovery_Hive Protocol...</div>
                                        </div>
                                    ) : (
                                        lifecycle.map((op) => (
                                            <LifecycleRow
                                                key={op.mint}
                                                op={op}
                                                seedingMints={seedingMints}
                                                hotQuote={hotQuotes[op.mint]}
                                                position={enginePositions.find(p => p.targetMint === op.mint)}
                                                wallet={{
                                                    sol: solBalance,
                                                    tokens: holdings,
                                                    solUsd: solBalance * solPrice,
                                                    solPrice: solPrice
                                                }}
                                                onAction={onAction}
                                            />
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Activity Log */}
                            <div className="bg-[#0a0a0a] border border-zinc-800 rounded-xl overflow-hidden shadow-xl">
                                <PanelHeader title="Activity Log" icon={Activity} color="green" />
                                <div className="p-4 bg-black/50 h-32 overflow-y-auto font-mono text-[10px] space-y-1 text-zinc-500 scrollbar-hide">
                                    {logs.length === 0 ? (
                                        <div className="text-zinc-800 italic uppercase tracking-[0.2em] py-4 text-center">Kernel: Monitoring network packets for activity...</div>
                                    ) : (
                                        logs.map((log, i) => <div key={i} className="hover:text-zinc-300 transition-colors border-l border-zinc-900 pl-2">{log}</div>)
                                    )}
                                </div>
                            </div>
                        </>
                    )}

                    {/* Footer */}
                    <div className="py-8 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] font-black text-zinc-700 uppercase tracking-[0.4em] border-t border-zinc-900">
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-zinc-800" />
                            Zenith Engine v1.0.4 - REAL_TIME_MODE
                        </div>
                        <div className="flex gap-8">
                            <span
                                onClick={() => setShowWalkthrough(true)}
                                className="hover:text-cyan-400 cursor-pointer transition-colors"
                            >
                                How It Works
                            </span>
                            <span className="hover:text-cyan-400 cursor-pointer transition-colors">Documentation</span>
                            <span className="hover:text-cyan-400 cursor-pointer transition-colors">Network Status: OK</span>
                        </div>
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {showWalkthrough && (
                    <AtlasWalkthrough
                        onComplete={() => {
                            setShowWalkthrough(false);
                            localStorage.setItem('has_seen_atlas_walkthrough', 'true');
                        }}
                    />
                )}
            </AnimatePresence>
        </>
    );
}
