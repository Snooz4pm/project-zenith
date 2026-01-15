'use client';

import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { useConnection } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { runPortfolioAnalysis, PortfolioAnalysisResult, Position } from '@/app/actions/portfolio-runner';
import {
    Shield, Loader2, Activity, TrendingUp, TrendingDown, BrainCircuit, RefreshCw,
    AlertTriangle, Zap, Target, Flame, Award, Wallet, Eye, Play, StopCircle
} from 'lucide-react';

// SOL mint address
const SOL_MINT = 'So11111111111111111111111111111111111111112';
// Token program ID
const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');

interface TokenHolding {
    mint: string;
    symbol: string;
    amount: number;
    decimals: number;
    valueSOL?: number;
}

export default function PortfolioTestPage() {
    // Wallet connection
    const { publicKey, connected } = useWallet();
    const { setVisible } = useWalletModal();
    const { connection } = useConnection();

    // Loading states
    const [loadingWallet, setLoadingWallet] = useState(false);
    const [loadingAnalysis, setLoadingAnalysis] = useState(false);
    const [running, setRunning] = useState(false);

    // Wallet data
    const [solBalance, setSolBalance] = useState<number>(0);
    const [holdings, setHoldings] = useState<TokenHolding[]>([]);

    // Analysis results
    const [analysisResults, setAnalysisResults] = useState<PortfolioAnalysisResult[]>([]);
    const [logs, setLogs] = useState<string[]>([]);

    const addLog = useCallback((msg: string) => {
        setLogs(prev => [...prev.slice(-50), `[${new Date().toLocaleTimeString()}] ${msg}`]);
    }, []);

    // Fetch wallet balances using the wallet adapter connection
    const fetchWalletBalances = useCallback(async () => {
        if (!publicKey || !connection) return;

        setLoadingWallet(true);
        addLog('Fetching wallet balances...');

        try {
            // Fetch SOL balance using connection
            const lamports = await connection.getBalance(publicKey);
            const solBal = lamports / 1e9;
            setSolBalance(solBal);
            addLog(`SOL Balance: ${solBal.toFixed(4)} SOL`);

            // Fetch token accounts using connection
            const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
                publicKey,
                { programId: TOKEN_PROGRAM_ID }
            );

            const tokenHoldings: TokenHolding[] = tokenAccounts.value
                .map((acc) => {
                    const info = acc.account.data.parsed.info;
                    return {
                        mint: info.mint as string,
                        symbol: (info.mint as string).slice(0, 6) + '...',
                        amount: info.tokenAmount.uiAmount as number,
                        decimals: info.tokenAmount.decimals as number
                    };
                })
                .filter((t: TokenHolding) => t.amount > 0);

            setHoldings(tokenHoldings);
            addLog(`Found ${tokenHoldings.length} token holdings`);

        } catch (err) {
            addLog(`Error fetching wallet: ${err}`);
        } finally {
            setLoadingWallet(false);
        }
    }, [publicKey, connection, addLog]);

    // Auto-fetch when wallet connects
    useEffect(() => {
        if (connected && publicKey) {
            fetchWalletBalances();
        } else {
            setSolBalance(0);
            setHoldings([]);
        }
    }, [connected, publicKey, fetchWalletBalances]);

    // Run analysis on holdings
    const runAnalysis = async () => {
        if (holdings.length === 0 && solBalance === 0) {
            addLog('No holdings to analyze');
            return;
        }

        setLoadingAnalysis(true);
        setRunning(true);
        addLog('Starting portfolio analysis...');

        try {
            // Convert holdings to positions
            const positions: Position[] = holdings.map(h => ({
                mint: h.mint,
                amount: h.amount,
                state: 'OBSERVING' as const
            }));

            // Add SOL as a position if we have any
            if (solBalance > 0.01) {
                positions.unshift({
                    mint: SOL_MINT,
                    amount: solBalance,
                    state: 'OBSERVING' as const
                });
            }

            addLog(`Analyzing ${positions.length} positions...`);
            const results = await runPortfolioAnalysis(positions, []);
            setAnalysisResults(results.results);

            // Log each result
            results.results.forEach(r => {
                const actionColor = r.verdict.action === 'HOLD' ? '✅' : r.verdict.action === 'SELL' ? '🔴' : '🟡';
                addLog(`${actionColor} ${r.symbol}: ${r.verdict.action} | Risk: ${r.verdict.riskScore}/100 | ${r.verdict.reason}`);
            });

            addLog(`Analysis complete. ${results.results.length} tokens evaluated.`);
        } catch (err) {
            addLog(`Analysis error: ${err}`);
        } finally {
            setLoadingAnalysis(false);
            setRunning(false);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white p-6">
            <div className="max-w-6xl mx-auto">

                {/* Header */}
                <div className="mb-8 text-center">
                    <h1 className="text-4xl font-black mb-2 bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                        🧠 ZENITH AGENT
                    </h1>
                    <p className="text-zinc-400">Autonomous Portfolio Analysis & Protection</p>
                </div>

                {/* Wallet Connection */}
                {!connected ? (
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-12 text-center mb-8">
                        <Wallet className="w-16 h-16 mx-auto text-zinc-600 mb-4" />
                        <h2 className="text-xl font-bold mb-4">Connect Your Wallet</h2>
                        <p className="text-zinc-500 mb-6">Connect your Solana wallet to analyze your portfolio</p>
                        <button
                            onClick={() => setVisible(true)}
                            className="px-8 py-4 bg-gradient-to-r from-cyan-600 to-purple-600 rounded-xl font-bold hover:brightness-110 transition-all"
                        >
                            Connect Wallet
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Wallet Info Bar */}
                        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 mb-6 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                                <div>
                                    <div className="text-sm text-zinc-400">Connected</div>
                                    <div className="font-mono text-sm">{publicKey?.toBase58().slice(0, 8)}...{publicKey?.toBase58().slice(-8)}</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-6">
                                <div className="text-right">
                                    <div className="text-sm text-zinc-400">SOL Balance</div>
                                    <div className="text-xl font-bold text-cyan-400">{solBalance.toFixed(4)} SOL</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm text-zinc-400">Token Holdings</div>
                                    <div className="text-xl font-bold">{holdings.length}</div>
                                </div>
                                <button
                                    onClick={fetchWalletBalances}
                                    disabled={loadingWallet}
                                    className="p-3 bg-zinc-800 rounded-lg hover:bg-zinc-700 transition-all"
                                >
                                    <RefreshCw className={`w-5 h-5 ${loadingWallet ? 'animate-spin' : ''}`} />
                                </button>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-4 mb-6">
                            <button
                                onClick={runAnalysis}
                                disabled={loadingAnalysis || holdings.length === 0}
                                className="flex-1 py-4 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl font-bold flex items-center justify-center gap-2 hover:brightness-110 transition-all disabled:opacity-50"
                            >
                                {loadingAnalysis ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
                                {loadingAnalysis ? 'Analyzing...' : 'Analyze Portfolio'}
                            </button>
                        </div>

                        {/* Main Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                            {/* Holdings Panel */}
                            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
                                <div className="px-4 py-3 border-b border-zinc-800 flex items-center gap-2">
                                    <Wallet className="w-4 h-4 text-cyan-400" />
                                    <h2 className="font-bold">Your Holdings</h2>
                                </div>
                                <div className="max-h-96 overflow-y-auto">
                                    {loadingWallet ? (
                                        <div className="p-8 text-center text-zinc-500">
                                            <Loader2 className="w-8 h-8 mx-auto animate-spin mb-2" />
                                            Loading wallet...
                                        </div>
                                    ) : holdings.length === 0 ? (
                                        <div className="p-8 text-center text-zinc-500">
                                            No token holdings found
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-zinc-800/50">
                                            {holdings.map((h, i) => (
                                                <div key={i} className="px-4 py-3 flex items-center justify-between hover:bg-zinc-800/30">
                                                    <div>
                                                        <div className="font-mono text-sm">{h.mint.slice(0, 12)}...</div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="font-bold">{h.amount.toLocaleString()}</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Analysis Results Panel */}
                            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
                                <div className="px-4 py-3 border-b border-zinc-800 flex items-center gap-2">
                                    <BrainCircuit className="w-4 h-4 text-purple-400" />
                                    <h2 className="font-bold">Analysis Results</h2>
                                </div>
                                <div className="max-h-96 overflow-y-auto">
                                    {analysisResults.length === 0 ? (
                                        <div className="p-8 text-center text-zinc-500">
                                            Click "Analyze Portfolio" to see results
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-zinc-800/50">
                                            {analysisResults.map((r, i) => (
                                                <div key={i} className="px-4 py-3 hover:bg-zinc-800/30">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <div className="font-bold">{r.symbol}</div>
                                                        <span className={`text-xs font-bold px-2 py-1 rounded ${r.verdict.action === 'HOLD' ? 'bg-green-500/20 text-green-400' :
                                                            r.verdict.action === 'SELL' ? 'bg-red-500/20 text-red-400' :
                                                                'bg-zinc-500/20 text-zinc-400'
                                                            }`}>
                                                            {r.verdict.action}
                                                        </span>
                                                    </div>
                                                    <div className="text-xs text-zinc-400">{r.verdict.reason}</div>
                                                    <div className="mt-1 flex gap-4 text-[10px]">
                                                        <span className={`${r.verdict.riskScore > 70 ? 'text-red-400' : 'text-zinc-500'}`}>
                                                            Risk: {r.verdict.riskScore}/100
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Live Log */}
                        <div className="mt-6 bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
                            <div className="px-4 py-3 border-b border-zinc-800 flex items-center gap-2">
                                <Activity className="w-4 h-4 text-green-400" />
                                <h2 className="font-bold">Activity Log</h2>
                            </div>
                            <div className="p-4 max-h-48 overflow-y-auto font-mono text-xs text-zinc-400 space-y-1">
                                {logs.length === 0 ? (
                                    <div className="text-zinc-500">Waiting for activity...</div>
                                ) : (
                                    logs.map((log, i) => <div key={i}>{log}</div>)
                                )}
                            </div>
                        </div>

                        {/* Capabilities */}
                        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-zinc-900/50 border border-cyan-900/30 rounded-xl p-4 text-center">
                                <Eye className="w-8 h-8 mx-auto text-cyan-400 mb-2" />
                                <div className="text-sm font-bold">Real-Time Monitoring</div>
                                <div className="text-[10px] text-zinc-500">Watches all holdings</div>
                            </div>
                            <div className="bg-zinc-900/50 border border-purple-900/30 rounded-xl p-4 text-center">
                                <BrainCircuit className="w-8 h-8 mx-auto text-purple-400 mb-2" />
                                <div className="text-sm font-bold">Physics Engine</div>
                                <div className="text-[10px] text-zinc-500">Multi-pillar analysis</div>
                            </div>
                            <div className="bg-zinc-900/50 border border-orange-900/30 rounded-xl p-4 text-center">
                                <AlertTriangle className="w-8 h-8 mx-auto text-orange-400 mb-2" />
                                <div className="text-sm font-bold">Threat Detection</div>
                                <div className="text-[10px] text-zinc-500">Rug & scam protection</div>
                            </div>
                            <div className="bg-zinc-900/50 border border-green-900/30 rounded-xl p-4 text-center">
                                <Shield className="w-8 h-8 mx-auto text-green-400 mb-2" />
                                <div className="text-sm font-bold">Capital Protection</div>
                                <div className="text-[10px] text-zinc-500">5-phase lifecycle</div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
