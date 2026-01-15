'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { PublicKey } from '@solana/web3.js';
import { runPortfolioAnalysis, PortfolioAnalysisResult, Position, getMetadata } from '@/app/actions/portfolio-runner';
import {
    Shield, Loader2, Activity, TrendingUp, TrendingDown, BrainCircuit, RefreshCw,
    AlertTriangle, Zap, Target, Flame, Award, Wallet, Eye, Play, StopCircle,
    ChevronRight, BarChart3, Database, Search, ShieldCheck, Heart, Skull
} from 'lucide-react';
import { SeedQuickPanel } from '@/components/SeedQuickPanel';
import { ObserveQuickPanel } from '@/components/ObserveQuickPanel';
import { ScaleQuickPanel } from '@/components/ScaleQuickPanel';
import { HarvestQuickPanel } from '@/components/HarvestQuickPanel';
import { RecycleQuickPanel } from '@/components/RecycleQuickPanel';

// ============================================================================
// CONFIGURATION
// ============================================================================
const SOL_MINT = 'So11111111111111111111111111111111111111112';
const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
const REFRESH_INTERVAL_MS = 20000;

// ============================================================================
// DATA FETCHING (Access via API to bypass CORS/DNS blocks)
// ============================================================================

async function fetchWalletFromApi(wallet: string) {
    const res = await fetch(`/api/wallet/helius`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet })
    });
    if (!res.ok) throw new Error("Helius Wallet API fetch failed");
    return res.json() as Promise<{
        sol: number,
        tokens: {
            mint: string,
            symbol: string,
            name: string,
            logo: string | null,
            decimals: number,
            amount: number
        }[]
    }>;
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

interface TokenHolding {
    mint: string;
    symbol: string;
    name: string;
    logoURI: string;
    amount: number;
    decimals: number;
    valueUSD?: number;
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
    const { publicKey, connected } = useWallet();
    const { setVisible } = useWalletModal();

    // State
    const [loading, setLoading] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);
    const [jupiterTokenMap, setJupiterTokenMap] = useState<Map<string, JupiterToken>>(new Map());

    // Core Data
    const [solBalance, setSolBalance] = useState(0);
    const [holdings, setHoldings] = useState<TokenHolding[]>([]);
    const [discovery, setDiscovery] = useState<PortfolioAnalysisResult[]>([]);
    const [lifecycle, setLifecycle] = useState<LifecycleOpportunity[]>([]);
    const [analysisResults, setAnalysisResults] = useState<PortfolioAnalysisResult[]>([]);
    const [logs, setLogs] = useState<string[]>([]);
    const [activePhase, setActivePhase] = useState<LifecyclePhase>('OBS');

    const addLog = useCallback((msg: string) => {
        setLogs(prev => [...prev.slice(-30), `[${new Date().toLocaleTimeString()}] ${msg}`]);
    }, []);

    // Refs
    const autoRefreshRef = useRef<NodeJS.Timeout | null>(null);

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
        if (!publicKey) return;

        setAnalyzing(true);
        addLog('System: Initiating analytical tick...');

        try {
            // 1. Refresh Wallet via Server API
            const walletData = await fetchWalletFromApi(publicKey.toBase58());
            setSolBalance(walletData.sol);

            // If metadata isn't ready, we can't enrich, but we can still show basic SOL
            if (jupiterTokenMap.size === 0) {
                addLog('System: Metadata pending. Enrichment paused.');
                setAnalyzing(false);
                return;
            }

            const walletHoldings: TokenHolding[] = walletData.tokens.map(t => {
                const jup = jupiterTokenMap.get(t.mint);
                return {
                    mint: t.mint,
                    symbol: t.symbol || jup?.symbol || t.mint.slice(0, 6),
                    name: t.name || jup?.name || 'Unknown',
                    logoURI: t.logo || `https://token.jup.ag/all/logo/${t.mint}`,
                    amount: t.amount,
                    decimals: t.decimals
                };
            }).filter(h => h.amount > 0);

            setHoldings(walletHoldings);

            // 2. Prepare for Physics Engine
            const positions: Position[] = walletHoldings.map(h => ({
                mint: h.mint,
                amount: h.amount,
                state: 'OBSERVING'
            }));

            if (walletData.sol > 0.01) {
                positions.unshift({ mint: SOL_MINT, amount: walletData.sol, state: 'OBSERVING' });
            }

            // 3. Execution Action
            const analysis = await runPortfolioAnalysis(positions, []);
            setAnalysisResults(analysis.results || []);
            setDiscovery(analysis.discoveryResults || []);

            // === LIFECYCLE SYNC ===
            if (analysis.discoveryResults && analysis.discoveryResults.length > 0) {
                setLifecycle(prev => {
                    const next = [...prev];
                    analysis.discoveryResults!.forEach(gem => {
                        const exists = next.find(l => l.mint === gem.mint);
                        if (!exists) {
                            next.push({
                                mint: gem.mint,
                                symbol: gem.symbol,
                                phase: 'OBS',
                                shadowPnL: 0,
                                seedSizeSOL: 0.05 // Baseline seed
                            });
                        } else {
                            // Update existing (e.g. shadow PnL if we had price history)
                            // For now just keep it simple
                        }
                    });
                    return next.slice(-5); // Keep only the latest 5 gems in the lifecycle UI for density
                });
            }

            if (analysis.logs) {
                analysis.logs.forEach(l => addLog(l));
            }

            addLog(`Tick Complete: ${walletHoldings.length} holdings audited, ${analysis.discoveryResults?.length} opportunities scouted.`);

        } catch (err) {
            addLog(`Tick Failure: ${err}`);
        } finally {
            setAnalyzing(false);
        }
    }, [publicKey, jupiterTokenMap, addLog]);

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
            autoRefreshRef.current = setInterval(performAnalyticalTick, REFRESH_INTERVAL_MS);
        }
        return () => { if (autoRefreshRef.current) clearInterval(autoRefreshRef.current); };
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
                                                        <div className="text-sm font-black tracking-tight">{h.symbol}</div>
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
                                {lifecycle.map((op, i) => (
                                    <div key={i} className="relative">
                                        <div className="flex justify-between items-center mb-6">
                                            <div className="flex items-center gap-3">
                                                <Eye className="w-4 h-4 text-zinc-600" />
                                                <div>
                                                    <div className="text-sm font-black text-white tracking-widest">{op.symbol}</div>
                                                    <div className="text-[9px] text-zinc-700 font-mono tracking-widest">PROXIMITY_ALPHA_SCAN</div>
                                                </div>
                                            </div>
                                            <div className="text-right flex gap-8">
                                                <div>
                                                    <div className="text-[9px] text-zinc-700 font-black uppercase tracking-widest mb-1">Shadow PnL</div>
                                                    <div className="text-xs font-black text-green-500">+{op.shadowPnL.toFixed(2)}%</div>
                                                </div>
                                                <div>
                                                    <div className="text-[9px] text-zinc-700 font-black uppercase tracking-widest mb-1">Seed</div>
                                                    <div className="text-xs font-black text-cyan-400">{op.seedSizeSOL.toFixed(4)} SOL</div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Progress Bar */}
                                        <div className="relative flex justify-between items-center px-4">
                                            <div className="absolute h-px bg-zinc-800 left-8 right-8 top-1/2 -z-10" />
                                            {(['OBS', 'SEE', 'SCA', 'HAR', 'REC'] as LifecyclePhase[]).map((p, pi) => (
                                                <button
                                                    key={p}
                                                    onClick={() => setActivePhase(p)}
                                                    className="flex flex-col items-center group outline-none"
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
                                            {activePhase === 'SEE' && <SeedQuickPanel />}
                                            {activePhase === 'SCA' && <ScaleQuickPanel />}
                                            {activePhase === 'HAR' && <HarvestQuickPanel />}
                                            {activePhase === 'REC' && <RecycleQuickPanel />}
                                        </div>
                                    </div>
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
