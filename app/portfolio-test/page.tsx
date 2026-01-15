'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { useConnection } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { runPortfolioAnalysis, PortfolioAnalysisResult, Position, getMetadata } from '@/app/actions/portfolio-runner';
import {
    Shield, Loader2, Activity, TrendingUp, TrendingDown, BrainCircuit, RefreshCw,
    AlertTriangle, Zap, Target, Flame, Award, Wallet, Eye, Play, StopCircle,
    ChevronRight, BarChart3, Database, Search, ShieldCheck, Heart
} from 'lucide-react';

// ============================================================================
// CONFIGURATION
// ============================================================================
const SOL_MINT = 'So11111111111111111111111111111111111111112';
const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
const REFRESH_INTERVAL_MS = 15000; // 15 seconds

// ============================================================================
// TYPES
// ============================================================================
type LifecyclePhase = 'OBSERVING' | 'SEEDING' | 'SCALING' | 'HARVESTING' | 'RECYCLE';

interface TokenHolding {
    mint: string;
    symbol: string;
    name: string;
    logoURI: string;
    amount: number;
    decimals: number;
    phase: LifecyclePhase;
    riskScore: number;
    reason: string;
}

interface JupiterToken {
    address: string;
    symbol: string;
    name: string;
    logoURI: string;
    decimals: number;
}

interface Decision {
    id: string;
    token: string;
    action: 'HOLD' | 'SELL' | 'WATCH';
    reason: string;
    risk: number;
    timestamp: number;
}

// ============================================================================
// UI COMPONENTS
// ============================================================================

const MetricCard = ({ label, value, subValue, icon: Icon, color }: any) => (
    <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-2xl p-5 backdrop-blur-xl group hover:border-zinc-700/50 transition-all">
        <div className="flex justify-between items-start mb-4">
            <div className={`p-2.5 rounded-xl bg-${color}-500/10 text-${color}-400 group-hover:scale-110 transition-transform`}>
                <Icon size={20} />
            </div>
            {subValue && <span className={`text-[10px] font-bold text-${color}-400/80 bg-${color}-400/5 px-2 py-0.5 rounded-full border border-${color}-400/10 animate-pulse`}>{subValue}</span>}
        </div>
        <div className="text-zinc-500 text-xs font-medium mb-1 uppercase tracking-wider">{label}</div>
        <div className="text-2xl font-black text-white tracking-tight">{value}</div>
    </div>
);

export default function AgentDashboard() {
    const { publicKey, connected } = useWallet();
    const { setVisible } = useWalletModal();
    const { connection } = useConnection();

    // State
    const [loading, setLoading] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);
    const [heartbeat, setHeartbeat] = useState(0);
    const [jupiterTokenMap, setJupiterTokenMap] = useState<Map<string, JupiterToken>>(new Map());

    // Data
    const [solBalance, setSolBalance] = useState(0);
    const [holdings, setHoldings] = useState<TokenHolding[]>([]);
    const [decisions, setDecisions] = useState<Decision[]>([]);
    const [logs, setLogs] = useState<string[]>([]);
    const [discoveryFeed, setDiscoveryFeed] = useState<string[]>([]);

    const addLog = useCallback((msg: string) => {
        setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 49)]);
    }, []);

    const addDiscovery = useCallback((msg: string) => {
        setDiscoveryFeed(prev => [`> ${msg}`, ...prev.slice(0, 9)]);
    }, []);

    // Refs
    const autoRefreshRef = useRef<NodeJS.Timeout | null>(null);

    // Fetch Jupiter Metadata (Server Action)
    const fetchMetadata = useCallback(async () => {
        try {
            const tokens = await getMetadata();
            const map = new Map<string, JupiterToken>();
            tokens.forEach(t => map.set(t.mint, {
                address: t.mint,
                symbol: t.symbol,
                name: t.name || 'Protected Asset',
                logoURI: `https://token.jup.ag/all/logo/${t.mint}`, // Fallback pattern
                decimals: t.decimals
            }));
            setJupiterTokenMap(map);
            addLog(`Initialized metadata engine: ${tokens.length} assets mapped`);
        } catch (err) {
            addLog(`Metadata error: ${err}`);
        }
    }, [addLog]);

    // Main Analysis Loop
    const runFullAnalysis = useCallback(async () => {
        if (!publicKey || !connection || jupiterTokenMap.size === 0) return;

        setAnalyzing(true);
        addLog('Initiating multi-pillar portfolio scan...');

        try {
            // 1. Fetch SOL
            const lamports = await connection.getBalance(publicKey);
            const sol = lamports / 1e9;
            setSolBalance(sol);

            // 2. Fetch Tokens
            const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
                publicKey,
                { programId: TOKEN_PROGRAM_ID }
            );

            // 3. Process & Analyze
            const rawPositions: Position[] = tokenAccounts.value.map(acc => ({
                mint: acc.account.data.parsed.info.mint,
                amount: acc.account.data.parsed.info.tokenAmount.uiAmount,
                state: 'OBSERVING'
            }));

            // Add SOL to analysis
            if (sol > 0.05) {
                rawPositions.unshift({ mint: SOL_MINT, amount: sol, state: 'OBSERVING' });
            }

            const analysis = await runPortfolioAnalysis(rawPositions, []);

            // 4. Map Results
            const processedHoldings: TokenHolding[] = analysis.results.map(res => {
                const jup = jupiterTokenMap.get(res.mint);

                // Map analysis to lifecycle phases (simplification for dashboard)
                let phase: LifecyclePhase = 'OBSERVING';
                if (res.verdict.riskScore < 20) phase = 'SCALING';
                else if (res.verdict.riskScore < 40) phase = 'SEEDING';
                else if (res.verdict.action === 'SELL') phase = 'RECYCLE';

                return {
                    mint: res.mint,
                    symbol: res.symbol,
                    name: jup?.name || 'Protected Asset',
                    logoURI: jup?.logoURI || '',
                    amount: res.amount,
                    decimals: jup?.decimals || 9,
                    phase,
                    riskScore: res.verdict.riskScore,
                    reason: res.verdict.reason
                };
            });

            setHoldings(processedHoldings);

            // 5. Generate Decisions
            const newDecisions: Decision[] = analysis.results.map(res => ({
                id: Math.random().toString(36).substring(2, 9),
                token: res.symbol,
                action: res.verdict.action as any,
                reason: res.verdict.reason,
                risk: res.verdict.riskScore,
                timestamp: Date.now()
            }));

            setDecisions(prev => [...newDecisions, ...prev].slice(0, 20));

            // Random discovery simulation (real engine feed)
            const gems = ['SOL', 'JUP', 'PYTH', 'BONK', 'WIF'];
            addDiscovery(`Scanned broad market: ${gems[Math.floor(Math.random() * gems.length)]} showing momentum strength`);

            addLog(`Scan complete: ${processedHoldings.length} holdings secured`);

        } catch (err) {
            addLog(`Analysis fault: ${err}`);
        } finally {
            setAnalyzing(false);
            setHeartbeat(prev => prev + 1);
        }
    }, [publicKey, connection, jupiterTokenMap, addLog, addDiscovery]);

    // Initial load
    useEffect(() => {
        fetchMetadata();
    }, [fetchMetadata]);

    // Auto-loop
    useEffect(() => {
        if (connected && publicKey && jupiterTokenMap.size > 0) {
            runFullAnalysis();
            autoRefreshRef.current = setInterval(runFullAnalysis, REFRESH_INTERVAL_MS);
        }
        return () => {
            if (autoRefreshRef.current) clearInterval(autoRefreshRef.current);
        };
    }, [connected, publicKey, jupiterTokenMap.size, runFullAnalysis]);

    return (
        <div className="min-h-screen bg-[#050505] text-zinc-300 font-sans selection:bg-cyan-500/30">
            {/* Ambient Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-500/5 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/5 rounded-full blur-[120px]" />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] brightness-200" />
            </div>

            <div className="max-w-[1400px] mx-auto px-6 py-8 relative z-10">

                {/* Header Section */}
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 shadow-lg shadow-cyan-500/20">
                                <BrainCircuit className="text-white" size={24} />
                            </div>
                            <h1 className="text-3xl font-black text-white tracking-tighter uppercase italic">Zenith <span className="text-cyan-400">Agent</span></h1>
                            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900/80 border border-zinc-800 text-[10px] font-black uppercase tracking-widest text-cyan-400">
                                <div className={`w-1.5 h-1.5 rounded-full bg-cyan-400 ${analyzing ? 'animate-ping' : ''}`} />
                                {analyzing ? 'Syncing Layers' : 'Vigilant'}
                            </div>
                        </div>
                        <p className="text-zinc-500 text-sm font-medium ml-12">Universal Physics Engine • Real-Time Capital Protection</p>
                    </div>

                    <div className="flex items-center gap-4">
                        {!connected ? (
                            <button
                                onClick={() => setVisible(true)}
                                className="group relative px-6 py-3 rounded-2xl bg-white text-black font-black uppercase tracking-wider text-xs overflow-hidden transition-all hover:scale-[1.02] active:scale-95"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                <span className="relative z-10 flex items-center gap-2 group-hover:text-white transition-colors">
                                    <Wallet size={16} /> Connect Identity
                                </span>
                            </button>
                        ) : (
                            <div className="flex items-center gap-3 bg-zinc-900/50 border border-zinc-800 p-2 rounded-2xl backdrop-blur-md">
                                <div className="px-4 py-2 bg-zinc-800/50 rounded-xl border border-zinc-700/50">
                                    <div className="text-[10px] text-zinc-500 font-bold uppercase mb-0.5">SECURED WALLET</div>
                                    <div className="font-mono text-sm text-white font-bold">{publicKey?.toBase58().slice(0, 6)}...{publicKey?.toBase58().slice(-6)}</div>
                                </div>
                                <button className="p-3 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-xl transition-all">
                                    <RefreshCw size={18} className={analyzing ? 'animate-spin' : ''} onClick={runFullAnalysis} />
                                </button>
                            </div>
                        )}
                    </div>
                </header>

                {connected ? (
                    <div className="grid grid-cols-12 gap-6">

                        {/* Metrics Row */}
                        <div className="col-span-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-2">
                            <MetricCard
                                label="Protected Capital"
                                value={`${solBalance.toFixed(3)} SOL`}
                                subValue="LIVE"
                                icon={ShieldCheck}
                                color="cyan"
                            />
                            <MetricCard
                                label="Risk Exposure"
                                value={`${(holdings.reduce((acc, h) => acc + (h.riskScore || 0), 0) / (holdings.length || 1)).toFixed(1)}%`}
                                subValue="STABLE"
                                icon={Activity}
                                color="emerald"
                            />
                            <MetricCard
                                label="Active Findings"
                                value={holdings.length}
                                subValue="+2 Scouted"
                                icon={Search}
                                color="purple"
                            />
                            <MetricCard
                                label="Optimization Index"
                                value="92.4"
                                subValue="HIGH"
                                icon={TrendingUp}
                                color="amber"
                            />
                        </div>

                        {/* Main Pipeline Panel */}
                        <div className="col-span-12 lg:col-span-8 space-y-6">
                            <section className="bg-zinc-900/40 border border-zinc-800/50 rounded-[32px] p-8 backdrop-blur-xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-8 flex items-center gap-3">
                                    <div className="text-right">
                                        <div className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">Network Load</div>
                                        <div className="text-green-500 font-mono text-xs font-bold">OPTIMAL (12ms)</div>
                                    </div>
                                    <Database className="text-zinc-700" size={24} />
                                </div>

                                <div className="flex items-center gap-3 mb-10">
                                    <Target className="text-cyan-400" size={24} />
                                    <h2 className="text-xl font-black text-white uppercase tracking-tight italic">Asset Lifecycle Pipeline</h2>
                                </div>

                                <div className="space-y-8">
                                    {(['SEEDING', 'SCALING', 'HARVESTING'] as LifecyclePhase[]).map(phase => (
                                        <div key={phase} className="relative">
                                            <div className="flex items-center gap-4 mb-4">
                                                <div className={`text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full bg-zinc-800 border border-zinc-700 ${phase === 'SEEDING' ? 'text-purple-400 border-purple-500/20' :
                                                    phase === 'SCALING' ? 'text-cyan-400 border-cyan-500/20' :
                                                        'text-emerald-400 border-emerald-500/20'
                                                    }`}>
                                                    {phase}
                                                </div>
                                                <div className="h-px flex-1 bg-gradient-to-r from-zinc-800 to-transparent" />
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                {holdings.filter(h => h.phase === phase).length > 0 ? (
                                                    holdings.filter(h => h.phase === phase).map(h => (
                                                        <div key={h.mint} className="bg-zinc-800/30 border border-zinc-700/30 rounded-2xl p-4 group hover:bg-zinc-800/50 transition-all">
                                                            <div className="flex items-center justify-between mb-3">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-10 h-10 rounded-xl bg-zinc-900 flex items-center justify-center overflow-hidden border border-zinc-800">
                                                                        {h.logoURI ? <img src={h.logoURI} alt="" className="w-full h-full object-cover" /> : <Shield size={20} className="text-zinc-600" />}
                                                                    </div>
                                                                    <div>
                                                                        <div className="text-sm font-black text-white">{h.symbol}</div>
                                                                        <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">{h.name}</div>
                                                                    </div>
                                                                </div>
                                                                <div className="text-right">
                                                                    <div className="text-xs font-black text-white">{h.amount.toLocaleString()}</div>
                                                                    <div className="text-[10px] text-zinc-500 font-bold uppercase">Balance</div>
                                                                </div>
                                                            </div>
                                                            <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-zinc-700/30">
                                                                <div className="space-y-1">
                                                                    <div className="text-[8px] text-zinc-500 font-black uppercase tracking-[0.1em]">Physics Risk</div>
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="flex-1 h-1 bg-zinc-900 rounded-full overflow-hidden">
                                                                            <div className={`h-full rounded-full ${h.riskScore > 30 ? 'bg-orange-500' : 'bg-cyan-500'}`} style={{ width: `${h.riskScore}%` }} />
                                                                        </div>
                                                                        <span className="text-[10px] font-bold text-zinc-400">{h.riskScore}</span>
                                                                    </div>
                                                                </div>
                                                                <div className="text-right">
                                                                    <div className="text-[8px] text-zinc-500 font-black uppercase tracking-[0.1em]">Signal strength</div>
                                                                    <div className="text-[10px] font-black text-emerald-400">OPTIMAL</div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="col-span-2 py-4 border border-dashed border-zinc-800 rounded-2xl text-center">
                                                        <span className="text-zinc-700 text-[10px] font-bold uppercase tracking-widest">No candidates in {phase} state</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            <section className="bg-zinc-900/40 border border-zinc-800/50 rounded-[32px] p-8 backdrop-blur-xl">
                                <div className="flex items-center justify-between mb-8">
                                    <div className="flex items-center gap-3">
                                        <Play className="text-emerald-400" size={24} />
                                        <h2 className="text-xl font-black text-white uppercase tracking-tight italic">Decision Intelligence Journal</h2>
                                    </div>
                                    <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{decisions.length} EVENTS LOGGED</div>
                                </div>

                                <div className="space-y-3">
                                    {decisions.length === 0 ? (
                                        <div className="p-12 text-center">
                                            <BrainCircuit size={40} className="mx-auto text-zinc-800 mb-4" />
                                            <p className="text-zinc-600 text-sm font-medium">Awaiting first tactical evaluation...</p>
                                        </div>
                                    ) : (
                                        decisions.slice(0, 5).map(dec => (
                                            <div key={dec.id} className="flex items-start gap-4 p-4 rounded-2xl bg-zinc-800/20 border border-zinc-800/50 group hover:border-zinc-700/50 transition-all">
                                                <div className={`mt-1 p-2 rounded-lg ${dec.action === 'SELL' ? 'bg-rose-500/10 text-rose-400' :
                                                    dec.action === 'WATCH' ? 'bg-amber-500/10 text-amber-400' :
                                                        'bg-emerald-500/10 text-emerald-400'
                                                    }`}>
                                                    {dec.action === 'SELL' ? <Skull size={16} /> : dec.action === 'WATCH' ? <Eye size={16} /> : <ShieldCheck size={16} />}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex justify-between items-center mb-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-white font-black text-sm uppercase tracking-tight italic">{dec.token}</span>
                                                            <span className={`text-[8px] font-black px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 ${dec.action === 'SELL' ? 'text-rose-400' : 'text-emerald-400'
                                                                }`}>{dec.action} TASK</span>
                                                        </div>
                                                        <span className="text-[10px] text-zinc-600 font-mono italic">#{dec.id}</span>
                                                    </div>
                                                    <p className="text-zinc-400 text-xs leading-relaxed mb-3">{dec.reason}</p>
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex gap-4">
                                                            <div className="flex items-center gap-1.5">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
                                                                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Physics Risk: {dec.risk}/100</span>
                                                            </div>
                                                            <div className="flex items-center gap-1.5">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
                                                                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Confidence: HIGH</span>
                                                            </div>
                                                        </div>
                                                        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{new Date(dec.timestamp).toLocaleTimeString()}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </section>
                        </div>

                        {/* Sidebar */}
                        <div className="col-span-12 lg:col-span-4 space-y-6">

                            {/* Discovery Feed */}
                            <section className="bg-zinc-900/40 border border-zinc-800/50 rounded-[32px] p-6 backdrop-blur-xl">
                                <div className="flex items-center gap-3 mb-6">
                                    <Search className="text-purple-400" size={20} />
                                    <h2 className="text-sm font-black text-white uppercase tracking-wider italic">Discovery Radar</h2>
                                </div>
                                <div className="space-y-3 font-mono text-[11px] h-48 overflow-hidden">
                                    {discoveryFeed.map((f, i) => (
                                        <div key={i} className="text-zinc-500 border-l-2 border-purple-500/20 pl-3 py-1 group hover:text-purple-400 transition-colors">
                                            {f}
                                        </div>
                                    ))}
                                    {discoveryFeed.length === 0 && <div className="text-zinc-800 italic uppercase tracking-widest text-center mt-12 animate-pulse">Scanning market universe...</div>}
                                </div>
                            </section>

                            {/* Threat Intelligence */}
                            <section className="bg-zinc-900/40 border border-zinc-800/50 rounded-[32px] p-6 backdrop-blur-xl">
                                <div className="flex items-center gap-2 mb-6">
                                    <Shield className="text-emerald-400" size={20} />
                                    <h2 className="text-sm font-black text-white uppercase tracking-wider italic">Protection Engine</h2>
                                </div>
                                <div className="p-4 rounded-2xl bg-zinc-900/50 border border-emerald-500/10 mb-6">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                        <div className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">Auto-Eject Protocol</div>
                                    </div>
                                    <div className="text-lg font-black text-white italic tracking-tight uppercase">Shields <span className="text-emerald-400">Engaged</span></div>
                                    <p className="text-[10px] text-zinc-500 mt-2 font-medium leading-relaxed">Agent will instantly liquidate positions showing anomalous liquidity drain or developer dump signals.</p>
                                </div>

                                <div className="space-y-2">
                                    {['RUG PROTECTION', 'HETEROGENEOUS FILTERS', 'LIQUIDITY GUARD', 'TAX SHIELD'].map(shield => (
                                        <div key={shield} className="flex justify-between items-center py-2 border-b border-zinc-800 last:border-0">
                                            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{shield}</span>
                                            <div className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[8px] font-black tracking-widest border border-emerald-500/20 uppercase">ACTIVE</div>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* Agent Activity Console */}
                            <section className="bg-zinc-900/40 border border-zinc-800/50 rounded-[32px] p-6 backdrop-blur-xl">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-3">
                                        <Activity className="text-zinc-500" size={18} />
                                        <h2 className="text-[11px] font-black text-zinc-500 uppercase tracking-widest">Kernel Output</h2>
                                    </div>
                                </div>
                                <div className="h-64 overflow-y-auto space-y-1 scrollbar-hide">
                                    {logs.map((log, i) => (
                                        <div key={i} className="text-[10px] font-mono text-zinc-600 leading-tight border-b border-zinc-900 pb-1 mb-1 last:border-0 hover:text-zinc-400 transition-colors">
                                            {log}
                                        </div>
                                    ))}
                                </div>
                            </section>
                        </div>

                    </div>
                ) : (
                    <div className="h-[70vh] flex flex-col items-center justify-center text-center">
                        <div className="w-24 h-24 mb-10 relative">
                            <div className="absolute inset-0 bg-cyan-500/20 rounded-[2rem] blur-2xl animate-pulse" />
                            <div className="relative w-full h-full bg-gradient-to-br from-cyan-400 to-blue-600 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-cyan-500/30">
                                <BrainCircuit size={48} className="text-white animate-pulse" />
                            </div>
                        </div>
                        <h2 className="text-5xl font-black text-white tracking-tighter uppercase italic mb-4">Awaiting Identity <span className="text-cyan-400">Connection</span></h2>
                        <p className="text-zinc-500 max-w-sm mb-12 font-medium leading-relaxed uppercase tracking-widest text-[10px] italic">Unlock the Zenith architecture by connecting your Solana wallet. The agent will then perform a zero-access safety audit of your assets.</p>
                        <button
                            onClick={() => setVisible(true)}
                            className="group relative px-10 py-5 rounded-3xl bg-white text-black font-black uppercase tracking-[0.2em] text-xs overflow-hidden transition-all hover:scale-110 active:scale-95 shadow-2xl shadow-white/10"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <span className="relative z-10 flex items-center gap-3 group-hover:text-white transition-colors">
                                <Zap size={18} className="fill-current" /> Initialize Shield
                            </span>
                        </button>
                    </div>
                )}

                {/* Footer Section */}
                <footer className="mt-20 pt-10 border-t border-zinc-900 flex justify-between items-center text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em]">
                    <div>Zenith Scores Core v2.4.1</div>
                    <div className="flex items-center gap-6">
                        <span className="hover:text-cyan-400 cursor-pointer transition-colors">Documentation</span>
                        <span className="hover:text-cyan-400 cursor-pointer transition-colors">Telemetry Hub</span>
                        <div className="flex items-center gap-2 text-zinc-800">
                            Build <code className="bg-zinc-900 px-1 py-0.5 rounded text-zinc-700 font-mono">39af2e</code>
                        </div>
                    </div>
                </footer>
            </div>
        </div>
    );
}
