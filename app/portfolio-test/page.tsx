'use client';

import { useState } from 'react';
import { runPortfolioAnalysis, PortfolioAnalysisResult } from '@/app/actions/portfolio-runner';
import { Shield, AlertTriangle, Zap, Terminal, Play, Loader2, ArrowRight } from 'lucide-react';

// The "Virtual Wallet" of 10 Real Tokens
const VIRTUAL_WALLET = [
    // --- STABLE (Safe Havens) ---
    'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
    'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', // USDT
    '2b1kV6DkPAnxd5ixfnxCpjxmKwqjjaYmCZfHsFu24GXo', // PYUSD

    // --- MEME (Volatile) ---
    'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm', // WIF
    'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', // BONK
    '7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYkW2hr', // POPCAT
    'MEW1gQWJ3nEXg2qgPMIZuXaZCKam1oJ55Jk1hJp',       // MEW
    'ukHH6c7mMyiWCf1b9pnWe25TSpkDDt3H5pQZgZ74J82',   // BOME
    '6p6xgHyF54SJsqLvKqM39KG2W5Hk3b7b2h3J8h2J8h2J',  // TRUMP
    'ED5nyyWEzpPPiWimP8vPAz72K2k4kk4k4k4k4k4k4k4k',  // MOODENG
];

export default function PortfolioTestPage() {
    const [analyzing, setAnalyzing] = useState(false);
    const [results, setResults] = useState<PortfolioAnalysisResult[]>([]);
    const [logs, setLogs] = useState<string[]>([]);
    const [expanded, setExpanded] = useState<string | null>(null);

    const runScan = async () => {
        setAnalyzing(true);
        setResults([]);
        setLogs(prev => [...prev, `[System] Starting analysis of ${VIRTUAL_WALLET.length} assets...`]);

        try {
            const data = await runPortfolioAnalysis(VIRTUAL_WALLET);
            setResults(data);

            // Generate detailed logs
            data.forEach(r => {
                setLogs(prev => [
                    ...prev,
                    `[${r.symbol}] Verdict: ${r.verdict.action} (Risk: ${r.metrics.riskLevel})`,
                    `  > Reason: ${r.verdict.reason}`,
                    r.exitPlan ? `  > Exit Plan: ${r.exitPlan.routeSummary} to ${r.exitPlan.targetToken}` : `  > No exit needed.`
                ]);
            });

            setLogs(prev => [...prev, `[System] Analysis complete.`]);

        } catch (error: any) {
            console.error(error);
            setLogs(prev => [...prev, `[Error] Analysis failed: ${error.message}`]);
        } finally {
            setAnalyzing(false);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white p-6 md:p-12 font-mono">

            {/* Header */}
            <div className="max-w-7xl mx-auto mb-12 flex flex-col md:flex-row justify-between items-center gap-6">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                        VIRTUAL PORTFOLIO SIMULATION
                    </h1>
                    <p className="text-zinc-400 mt-2">
                        10 Real Assets. Live Physics Observation. Autonomous Execution Planning.
                    </p>
                </div>

                <button
                    onClick={runScan}
                    disabled={analyzing}
                    className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-xl font-bold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(168,85,247,0.4)]"
                >
                    {analyzing ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            SCANNING MARKETS...
                        </>
                    ) : (
                        <>
                            <Play className="w-5 h-5 fill-current" />
                            RUN SIMULATION
                        </>
                    )}
                </button>
            </div>

            {/* Main Grid */}
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                {VIRTUAL_WALLET.map((mint, idx) => {
                    const result = results.find(r => r.mint === mint);
                    const isStable = idx < 3; // First 3 are stable in our list

                    // Placeholder card (waiting for scan)
                    if (!result) {
                        return (
                            <div key={mint} className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 flex items-center justify-center min-h-[200px] opacity-60">
                                {analyzing ? (
                                    <div className="text-center">
                                        <Loader2 className="w-8 h-8 text-purple-500 animate-spin mx-auto mb-2" />
                                        <div className="text-xs text-purple-400">Analyzing Physics...</div>
                                        <div className="text-[10px] text-zinc-600 mt-2">{mint.slice(0, 8)}...</div>
                                    </div>
                                ) : (
                                    <div className="text-zinc-600 italic">Waiting to scan...</div>
                                )}
                            </div>
                        );
                    }

                    // Result Card
                    const isSafe = result.verdict.isSafe;
                    const borderColor = isSafe
                        ? 'border-green-500/30'
                        : result.verdict.action === 'OBSERVE' ? 'border-yellow-500/30' : 'border-red-500/50';

                    const bgGradient = isSafe
                        ? 'bg-gradient-to-b from-green-900/10 to-transparent'
                        : result.verdict.action === 'OBSERVE' ? 'bg-gradient-to-b from-yellow-900/10 to-transparent' : 'bg-gradient-to-b from-red-900/10 to-transparent';

                    return (
                        <div key={mint} className={`${bgGradient} ${borderColor} border rounded-xl p-6 transition-all hover:scale-[1.02]`}>
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-2xl font-bold">{result.symbol}</h3>
                                    <div className="text-xs text-zinc-500">{mint.slice(0, 8)}...</div>
                                </div>
                                <div className={`px-3 py-1 rounded-full text-xs font-bold ${isSafe ? 'bg-green-500/20 text-green-400' :
                                        result.verdict.action === 'OBSERVE' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'
                                    }`}>
                                    {result.verdict.action}
                                </div>
                            </div>

                            {/* Physics Metrics */}
                            <div className="space-y-2 mb-4 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-zinc-500">Liquidity</span>
                                    <span>${(result.metrics.liquidityUSD || 0).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-zinc-500">Volume (5m)</span>
                                    <span>${(result.metrics.volume5m || 0).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-zinc-500">Risk Level</span>
                                    <span className={result.metrics.riskLevel === 'LOW' ? 'text-green-400' : 'text-red-400'}>
                                        {result.metrics.riskLevel}
                                    </span>
                                </div>
                            </div>

                            {/* Verdict Reason */}
                            <div className="text-xs text-zinc-400 border-t border-zinc-800 pt-3 mb-3 italic">
                                "{result.verdict.reason}"
                            </div>

                            {/* Exit Plan (If needed) */}
                            {result.exitPlan && (
                                <div className="bg-red-500/10 border border-red-500/20 rounded p-3 text-xs">
                                    <div className="flex items-center gap-2 mb-1 text-red-400 font-bold">
                                        <Zap className="w-3 h-3" />
                                        EXECUTION PLAN
                                    </div>
                                    <div className="flex justify-between items-center mb-1">
                                        <span>Route:</span>
                                        <span className="text-white">{result.exitPlan.targetToken}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span>Method:</span>
                                        <span className="text-white">{result.exitPlan.scenarioUsed}</span>
                                    </div>
                                </div>
                            )}

                            {/* Safe Asset Badge */}
                            {isSafe && (
                                <div className="bg-green-500/10 border border-green-500/20 rounded p-3 text-xs flex items-center gap-2 text-green-400">
                                    <Shield className="w-3 h-3" />
                                    ASSET SECURED
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Terminal Log */}
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center gap-2 mb-2 text-zinc-400">
                    <Terminal className="w-4 h-4" />
                    <span>SYSTEM LOGS</span>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 h-64 overflow-y-auto font-mono text-xs text-zinc-300 shadow-inner">
                    {logs.length === 0 ? (
                        <span className="text-zinc-600">Ready for initialization...</span>
                    ) : (
                        logs.map((log, i) => (
                            <div key={i} className="mb-1 border-b border-zinc-800/50 pb-1 last:border-0">
                                <span className="text-purple-500 mr-2">{'>'}</span>
                                {log}
                            </div>
                        ))
                    )}
                </div>
            </div>

        </div>
    );
}
