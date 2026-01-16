'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { PublicKey, VersionedTransaction } from '@solana/web3.js';
import { computePortfolioUsd, computeSeedUsd } from '@/lib/engine/portfolio';
import { runPortfolioAnalysis, PortfolioAnalysisResult, Position, getMetadata } from '@/app/actions/portfolio-runner';
import {
    Shield, Loader2, Activity, TrendingUp, TrendingDown, BrainCircuit, RefreshCw,
    AlertTriangle, Zap, Target, Flame, Award, Wallet, Eye, Play, StopCircle,
    ChevronRight, BarChart3, Database, Search, ShieldCheck, Heart, Skull, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { executeLifecycleAction, ActionType } from '@/lib/engine/lifecycleExecutor';
import { SeedQuickPanel } from '@/components/SeedQuickPanel';
import { ObserveQuickPanel } from '@/components/ObserveQuickPanel';
import { ScaleQuickPanel } from '@/components/ScaleQuickPanel';
import { HarvestQuickPanel } from '@/components/HarvestQuickPanel';
import { RecycleQuickPanel } from '@/components/RecycleQuickPanel';

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
    setTimeout(() => { heliusLock = false; }, 10000); // 10s cooldown

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
            amount: Number(info.balance) / 10 ** info.decimals
        });
    }

    return {
        sol: (data.nativeBalance?.lamports || 0) / 1e9,
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
    const [activePhase, setActivePhase] = useState<LifecyclePhase>('OBS');
    const isTradable = position?.tradable !== false;

    return (
        <div className="relative">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                    <Eye className="w-4 h-4 text-zinc-600" />
                    <div>
                        <div className="text-sm font-black text-white tracking-widest">{op.symbol}</div>
                        <div className="text-[9px] text-zinc-700 font-mono tracking-widest">PROXIMITY_ALPHA_SCAN</div>
                    </div>
                </div>
                <div className="text-right flex items-center gap-8">
                    <div>
                        <div className="text-[9px] text-zinc-700 font-black uppercase tracking-widest mb-1">Shadow PnL</div>
                        <div className="text-xs font-black text-green-500">+{op.shadowPnL.toFixed(2)}%</div>
                    </div>
                    <div>
                        <div className="text-[9px] text-zinc-700 font-black uppercase tracking-widest mb-1">Seed</div>
                        <div className="text-xs font-black text-cyan-400">{op.seedSizeSOL.toFixed(4)} SOL</div>
                    </div>
                    {/* Direct Action Button */}
                    <div className="pl-4 border-l border-zinc-900 flex items-center gap-3">
                        {op.phase === 'SEE' ? (
                            <button
                                disabled={isSeeding}
                                onClick={() => onAction('SEED', { overrideQuote: hotQuote, baseMint: SOL_MINT, targetMint: op.mint, targetSymbol: op.symbol })}
                                className="px-4 py-1.5 rounded bg-emerald-500 text-black text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale"
                            >
                                {isSeeding ? "SEEDING..." : "SEED"}
                            </button>
                        ) : op.phase === 'SCA' ? (
                            <button
                                disabled={isSeeding}
                                onClick={() => onAction('SCALE', { overrideQuote: hotQuote, targetMint: op.mint, targetSymbol: op.symbol })}
                                className="px-4 py-1.5 rounded bg-cyan-500 text-black text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale flex items-center gap-2"
                            >
                                {isSeeding ? <Loader2 className="animate-spin w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                                SCALE (6%)
                            </button>
                        ) : op.phase === 'HAR' ? (
                            <button
                                disabled={isSeeding}
                                onClick={() => onAction('HARVEST', { overrideQuote: hotQuote, targetMint: op.mint, targetSymbol: op.symbol })}
                                className="px-4 py-1.5 rounded bg-amber-500 text-black text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale flex items-center gap-2"
                            >
                                {isSeeding ? <Loader2 className="animate-spin w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                HARVEST (40%)
                            </button>
                        ) : op.phase === 'REC' ? (
                            <button
                                disabled={isSeeding}
                                onClick={() => onAction('RECYCLE', { overrideQuote: hotQuote, targetMint: op.mint, targetSymbol: op.symbol })}
                                className="px-4 py-1.5 rounded bg-zinc-200 text-black text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale"
                            >
                                {isSeeding ? "RECYCLING..." : "RECYCLE ALL"}
                            </button>
                        ) : null}

                        {position && (
                            <div className="flex flex-col items-end">
                                <div className="text-[8px] text-zinc-600 font-black uppercase">Engine Position</div>
                                <div className="text-[10px] text-emerald-400 font-mono tracking-tighter">
                                    ACTIVE • ${position.investedUsd.toFixed(2)}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="relative flex justify-between items-center px-4">
                <div className="absolute h-px bg-zinc-800 left-8 right-8 top-1/2 -z-10" />
                {(['OBS', 'SEE', 'SCA', 'HAR', 'REC'] as LifecyclePhase[]).map((p, pi) => (
                    <button
                        key={p}
                        disabled={!isTradable && p !== 'OBS'}
                        onClick={() => setActivePhase(p)}
                        className={`flex flex-col items-center group outline-none ${!isTradable && p !== 'OBS' ? 'opacity-20 cursor-not-allowed' : ''}`}
                    >
                        <div className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all duration-300 ${p === op.phase ? (p === activePhase ? 'bg-cyan-500/20 border-cyan-400' : 'bg-cyan-600/10 border-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.3)] animate-pulse') : (p === activePhase ? 'bg-zinc-800 border-zinc-600' : 'bg-[#111] border-zinc-800 grayscale hover:grayscale-0 hover:border-zinc-700')
                            }`}>
                            {p === 'OBS' && <Eye className={p === op.phase || p === activePhase ? "text-cyan-400" : "text-zinc-800"} size={16} />}
                            {p === 'SEE' && <TrendingUp className={p === op.phase || p === activePhase ? "text-cyan-400" : "text-zinc-800"} size={16} />}
                            {p === 'SCA' && <Activity className={p === op.phase || p === activePhase ? "text-cyan-400" : "text-zinc-800"} size={16} />}
                            {p === 'HAR' && <Zap className={p === op.phase || p === activePhase ? "text-cyan-400" : "text-zinc-800"} size={16} />}
                            {p === 'REC' && <RefreshCw className={p === op.phase || p === activePhase ? "text-cyan-400" : "text-zinc-800"} size={16} />}
                        </div>
                        <span className={`mt-2 text-[8px] font-black tracking-widest uppercase transition-colors ${p === op.phase || p === activePhase ? 'text-cyan-400' : 'text-zinc-800 group-hover:text-zinc-600'}`}>{p}</span>
                    </button>
                ))}
            </div>

            {/* Command Layer (Inline Panels) */}
            <div className="mt-8 px-4">
                {activePhase === 'OBS' && <ObserveQuickPanel />}
                {activePhase === 'SEE' && (
                    <SeedQuickPanel
                        wallet={wallet}
                        selectedGem={op}
                        onSeed={(params) => onAction('SEED', params)}
                        isGlobalSeeding={isSeeding}
                        preloadedQuote={hotQuote}
                    />
                )}
                {activePhase === 'SCA' && <ScaleQuickPanel />}
                {activePhase === 'HAR' && <HarvestQuickPanel />}
                {activePhase === 'REC' && <RecycleQuickPanel />}
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

const DiscoveryRow = ({ gem, color }: { gem: PortfolioAnalysisResult, color: string }) => (
    <div className="px-4 py-3 hover:bg-zinc-800/20 transition-all flex items-center justify-between gap-3 group">
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
        <button className={`opacity-0 group-hover:opacity-100 px-3 py-1 bg-${color}-500/10 border border-${color}-500/30 text-${color}-400 text-[9px] font-black uppercase tracking-widest hover:bg-${color}-500 hover:text-white transition-all rounded`}>
            BUY
        </button>
    </div>
);

export default function SurvivalLegacyPage() {
    const { publicKey, connected, sendTransaction } = useWallet();
    const { connection } = useConnection();
    const { setVisible } = useWalletModal();

    // State
    const [loading, setLoading] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);
    const [jupiterTokenMap, setJupiterTokenMap] = useState<Map<string, JupiterToken>>(new Map());

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

    const addLog = useCallback((msg: string) => {
        setLogs(prev => [...prev.slice(-30), `[${new Date().toLocaleTimeString()}] ${msg}`]);
    }, []);

    // Refs
    const autoRefreshRef = useRef<NodeJS.Timeout | null>(null);
    const isTickingRef = useRef(false);

    // Fetch Jupiter Metadata (Server side to avoid client DNS)
    const fetchMetadata = useCallback(async () => {
        try {
            const tokens = await getMetadata();
            const map = new Map<string, JupiterToken>();
            tokens.forEach(t => map.set(t.mint, {
                address: t.mint,
                symbol: t.symbol,
                name: t.name || 'Asset',
                logoURI: `https://token.jup.ag/all/logo/${t.mint}`,
                decimals: t.decimals
            }));
            setJupiterTokenMap(map);
            addLog(`Kernel: Metadata engine initialized (${tokens.length} assets)`);
        } catch (err) {
            addLog(`Kernel: Metadata error: ${err}`);
        }
    }, [addLog]);

    // Survival Loop Analysis
    const performAnalyticalTick = useCallback(async () => {
        if (!publicKey || isTickingRef.current) return;
        isTickingRef.current = true;

        setAnalyzing(true);
        addLog('System: Initiating analytical tick...');

        try {
            // 1. Refresh Wallet via Server API
            const walletData = await fetchWalletFromApi(publicKey.toBase58());
            if (!walletData) {
                addLog('System: Analytics throttled (Cooldown active).');
                setAnalyzing(false);
                isTickingRef.current = false;
                return;
            }

            setSolBalance(walletData.sol);

            // If metadata isn't ready, we can't enrich, but we can still show basic SOL
            if (jupiterTokenMap.size === 0) {
                addLog('System: Metadata pending. Enrichment paused.');
                setAnalyzing(false);
                return;
            }

            const walletHoldings: any[] = walletData.tokens.map(t => {
                const jup = jupiterTokenMap.get(t.mint);
                return {
                    mint: t.mint,
                    symbol: t.symbol || jup?.symbol || t.mint.slice(0, 6),
                    name: t.name || jup?.name || 'Unknown',
                    logoURI: t.logo || `https://token.jup.ag/all/logo/${t.mint}`,
                    amount: t.amount,
                    decimals: t.decimals,
                    tradable: !!jup || whitelistMints.includes(t.mint)
                };
            }).filter(h => h.amount > 0);

            const holdingsWithUsd = walletHoldings.map(h => {
                const result = analysisResults.find(r => r.mint === h.mint);
                return {
                    ...h,
                    usdValue: h.amount * (result?.metrics.price || 0)
                };
            });

            setHoldings(holdingsWithUsd);

            // 2. Prepare for Physics Engine
            const positions: Position[] = walletHoldings.map(h => ({
                mint: h.mint,
                amount: h.amount,
                state: 'OBSERVING'
            }));

            if (walletData.sol > 0.001) {
                positions.unshift({ mint: SOL_MINT, amount: walletData.sol, state: 'OBSERVING' });
            }

            // 3. Execution Action (Only tradable tokens for Physics Engine)
            const tradablePositions = positions.filter(p =>
                p.mint === SOL_MINT || jupiterTokenMap.has(p.mint)
            );

            const analysis = await runPortfolioAnalysis(tradablePositions, []);
            const sPriceRaw = analysis.results?.find(r => r.mint === SOL_MINT)?.metrics.price || 0;
            const sPrice = isFinite(sPriceRaw) && sPriceRaw > 0 ? sPriceRaw : 0;
            setSolPrice(sPrice);
            setAnalysisResults(analysis.results || []);
            setDiscovery(analysis.discoveryResults || []);

            console.log("[DISCOVERY_UI] Discovery Results Split:", {
                safe: (analysis.discoveryResults || []).filter((g: any) => (g.verdict.riskScore || 0) <= 30).length,
                med: (analysis.discoveryResults || []).filter((g: any) => (g.verdict.riskScore || 0) > 30 && (g.verdict.riskScore || 0) <= 65).length,
                meme: (analysis.discoveryResults || []).filter((g: any) => (g.verdict.riskScore || 0) > 65).length
            });

            // Fetch Engine Positions
            const posRes = await fetch("/api/engine/positions");
            const enginePos = await posRes.json();
            setEnginePositions(enginePos);

            // === LIFECYCLE SYNC ===
            const currentLifecycle = lifecycle;
            const updatedLifecycle = [...currentLifecycle];

            // Sync with existing engine positions
            enginePos.forEach((p: any) => {
                const idx = updatedLifecycle.findIndex(op => op.mint === p.targetMint);
                if (idx > -1) {
                    updatedLifecycle[idx].phase = p.phase;
                } else {
                    // Added discovered gem that became position
                    updatedLifecycle.push({
                        mint: p.targetMint,
                        symbol: p.targetSymbol || p.targetMint.slice(0, 4),
                        phase: p.phase,
                        shadowPnL: 0,
                        seedSizeSOL: 0
                    });
                }
            });

            if (analysis.discoveryResults && analysis.discoveryResults.length > 0) {
                setLifecycle(prev => {
                    const next = [...updatedLifecycle];
                    analysis.discoveryResults!.forEach(res => {
                        if (!next.find(op => op.mint === res.mint)) {
                            next.push({
                                mint: res.mint,
                                symbol: res.symbol,
                                phase: 'SEE',
                                shadowPnL: res.metrics.poolPrice > 0 ? Math.max(0, (res.metrics.currentPrice / res.metrics.poolPrice - 1) * 100) : 0,
                                seedSizeSOL: (sPrice > 0) ? (computeSeedUsd(computePortfolioUsd({ sol: walletData.sol, tokens: holdingsWithUsd, solUsd: walletData.sol * sPrice }, sPrice)) / sPrice) : 0
                            });
                        }
                    });
                    return next.slice(0, 5); // 🏁 CAP: 5 gems (Precision over Volume)
                });
            } else {
                setLifecycle(updatedLifecycle.slice(0, 5));
            }

            if (analysis.logs) {
                analysis.logs.forEach(l => addLog(l));
            }

            addLog(`Tick Complete: ${walletHoldings.length} holdings audited, ${analysis.discoveryResults?.length} opportunities scouted.`);

        } catch (err) {
            addLog(`Tick Failure: ${err}`);
        } finally {
            setAnalyzing(false);
            isTickingRef.current = false;
        }
    }, [publicKey, jupiterTokenMap, addLog]);

    const handleAction = useCallback(async (type: ActionType, params: any) => {
        if (!publicKey || !params.targetMint) return;

        const targetMint = params.targetMint;
        setSeedingMints(prev => new Set(prev).add(targetMint));

        try {
            const context = {
                publicKey,
                connection,
                portfolioUsd: computePortfolioUsd({ sol: solBalance, tokens: holdings, solUsd: solBalance * solPrice }),
                prices: analysisResults.reduce((acc, r) => ({ ...acc, [r.mint]: r.metrics.price }), { [SOL_MINT]: solPrice }),
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

            for (const op of lifecycle) {
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
                        const decimals = holdings.find(h => h.mint === op.mint)?.decimals || 6;
                        rawAmount = Math.floor(pos.amount * factor * Math.pow(10, decimals));
                    }

                    if (rawAmount <= 0) continue;

                    lastQuoteFetchRef.current[op.mint] = now;

                    // Directly call Railway Proxy from frontend
                    const JUPITER_PROXY_URL = process.env.NEXT_PUBLIC_JUPITER_PROXY_URL || 'https://jupiter-proxy-production.up.railway.app';
                    const url = `${JUPITER_PROXY_URL}/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${rawAmount.toString()}&slippageBps=100`;

                    const res = await fetch(url, {
                        method: "GET",
                        headers: { "Accept": "application/json" }
                    });

                    const data = await res.json();
                    if (data && data.routePlan?.length) {
                        setHotQuotes(prev => ({ ...prev, [op.mint]: data }));
                    }
                } catch (e) {
                    console.error(`[HOT_CACHE] Failed for ${op.symbol}:`, e);
                }
            }
            isFetchingGlobalRef.current = false;
        };

        refreshQuotes();
        const interval = setInterval(refreshQuotes, 15000);
        return () => clearInterval(interval);
    }, [lifecycle, connected, publicKey, solBalance, holdings, solPrice]);

    // Initialize
    useEffect(() => {
        fetchMetadata();

        // Step 4: Test API Directly (Verification)
        if (connected && publicKey) {
            console.log(`[TEST] Verifying balances via API for: ${publicKey.toBase58()}`);
            fetchWalletFromApi(publicKey.toBase58())
                .then(data => console.log(`[TEST] API DATA:`, data))
                .catch(err => console.error(`[TEST] API FAILED:`, err));
        }
    }, [fetchMetadata, connected, publicKey]);

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
        <div className="min-h-screen bg-black text-white font-mono p-4 md:p-8 selection:bg-cyan-500/30">
            <div className="max-w-7xl mx-auto space-y-6">

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
                                    onClick={performAnalyticalTick}
                                    disabled={analyzing}
                                    className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl hover:bg-zinc-800 transition-all text-zinc-400"
                                >
                                    <RefreshCw className={`w-5 h-5 ${analyzing ? 'animate-spin text-cyan-400' : ''}`} />
                                </button>
                            </div>
                        </>
                    )}
                </div>

                {connected && (
                    <>
                        {/* Primary Action */}
                        <button
                            onClick={performAnalyticalTick}
                            disabled={analyzing}
                            className="w-full py-4 bg-green-950/20 border border-green-500/30 text-green-500 font-black uppercase tracking-[0.3em] flex items-center justify-center gap-3 hover:bg-green-600 hover:text-white transition-all rounded-xl group"
                        >
                            {analyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5 fill-current group-hover:scale-125 transition-transform" />}
                            {analyzing ? 'System Audit In Progress...' : 'Analyze Portfolio'}
                        </button>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Your Holdings */}
                            <div className="bg-[#0a0a0a] border border-zinc-800 rounded-xl overflow-hidden shadow-xl">
                                <PanelHeader title="Your Holdings" icon={Wallet} color="cyan" />
                                <div className="max-h-[400px] overflow-y-auto divide-y divide-zinc-900">
                                    {holdings.length === 0 ? (
                                        <div className="p-12 text-center text-zinc-600 text-xs italic uppercase">No token holdings detected</div>
                                    ) : (
                                        holdings.map((h, i) => (
                                            <div key={i} className="p-4 flex items-center justify-between hover:bg-zinc-800/10 transition-colors">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 bg-zinc-900 border border-zinc-800 rounded-lg flex items-center justify-center overflow-hidden">
                                                        {h.logoURI ? <img src={h.logoURI} alt="" className="w-full h-full object-cover" /> : <Shield size={18} className="text-zinc-700" />}
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
                                        <div className="p-12 text-center text-zinc-600 text-xs italic uppercase">Run analysis to see results</div>
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
                                            <div className="p-8 text-center text-[10px] text-zinc-800 uppercase italic">Scanning Stable Assets...</div>
                                        ) : (
                                            discovery.filter(g => (g.verdict.riskScore || 0) <= 30).map((gem, i) => (
                                                <DiscoveryRow key={i} gem={gem} color="green" />
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
                                            <div className="p-8 text-center text-[10px] text-zinc-800 uppercase italic">Awaiting Mid-Cap Physics...</div>
                                        ) : (
                                            discovery.filter(g => (g.verdict.riskScore || 0) > 30 && (g.verdict.riskScore || 0) <= 65).map((gem, i) => (
                                                <DiscoveryRow key={i} gem={gem} color="amber" />
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
                                            <div className="p-8 text-center text-[10px] text-zinc-800 uppercase italic">Scouting the trenches...</div>
                                        ) : (
                                            discovery.filter(g => (g.verdict.riskScore || 0) > 65).map((gem, i) => (
                                                <DiscoveryRow key={i} gem={gem} color="rose" />
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 5-Phase Lifecycle */}
                        <div className="bg-[#0a0a0a] border border-zinc-800 rounded-xl overflow-hidden p-6 shadow-2xl">
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-3">
                                    <Award className="w-5 h-5 text-purple-400" />
                                    <h2 className="text-sm font-black text-white uppercase tracking-[0.3em] italic">5-Phase Lifecycle ({lifecycle.length} Opportunities)</h2>
                                </div>
                                <div className="flex gap-4 text-[11px] font-black tracking-widest uppercase">
                                    <span className="text-zinc-600">Free: <span className="text-cyan-400">0.0000 SOL</span></span>
                                    <span className="text-zinc-600">Allocated: <span className="text-amber-500">0.0000 SOL</span></span>
                                </div>
                            </div>

                            <div className="space-y-12">
                                {lifecycle.map((op) => (
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
                                        onAction={handleAction}
                                    />
                                ))}
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
                        <span className="hover:text-cyan-400 cursor-pointer transition-colors">Documentation</span>
                        <span className="hover:text-cyan-400 cursor-pointer transition-colors">Network Status: OK</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
