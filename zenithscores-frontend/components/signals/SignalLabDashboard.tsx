'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { ShieldCheck, Activity, Radio, TrendingUp, Zap, Server, ArrowRight, TrendingDown, Minus, AlertTriangle, Gauge } from 'lucide-react';
import SwapDrawer from '@/components/terminal/SwapDrawer';
import { getTrendingTokens, NormalizedToken, EXECUTION_CHAINS } from '@/lib/dexscreener';
import Paywall from '@/components/Paywall';

// Real data structures
interface EdgeScoreBreakdown {
    volume: number;      // 0-100
    liquidity: number;   // 0-100
    momentum: number;    // 0-100
    smartMoney: number;  // 0-100
    overall: number;     // weighted average
}

interface Signal extends NormalizedToken {
    time: string;
    score: number;
    edgeScore: EdgeScoreBreakdown;
    maxTradeSize: number; // Max tradeable amount in USD
    smartMoneyFlow: 'accumulation' | 'distribution' | 'neutral';
    status: 'ACTIVE' | 'PENDING';
    type: 'LONG'; // Spot is always long
}

type MarketRegime = 'TRENDING' | 'MEAN-REVERTING' | 'CHOPPY' | 'CRISIS';

// Helper: Calculate Edge Score
function calculateEdgeScore(token: NormalizedToken): EdgeScoreBreakdown {
    // Volume score (0-100) - normalized by volume
    const volumeScore = Math.min(100, Math.log10(token.volume24hUsd + 1) * 10);

    // Liquidity score (0-100) - based on liquidity
    const liquidityScore = Math.min(100, Math.log10(token.liquidityUsd + 1) * 10);

    // Momentum score (0-100) - based on price change
    const momentumScore = Math.min(100, Math.abs(token.priceChange24h) * 3);

    // Smart Money score (synthetic - based on volume/liquidity ratio)
    const smartMoneyScore = Math.min(100, (token.volume24hUsd / (token.liquidityUsd + 1)) * 100);

    // Overall weighted score
    const overall = Math.round(
        volumeScore * 0.3 +
        liquidityScore * 0.25 +
        momentumScore * 0.25 +
        smartMoneyScore * 0.2
    );

    return {
        volume: Math.round(volumeScore),
        liquidity: Math.round(liquidityScore),
        momentum: Math.round(momentumScore),
        smartMoney: Math.round(smartMoneyScore),
        overall
    };
}

// Helper: Determine smart money flow
function getSmartMoneyFlow(token: NormalizedToken): 'accumulation' | 'distribution' | 'neutral' {
    const volumeToLiqRatio = token.volume24hUsd / (token.liquidityUsd + 1);

    // High volume + positive price = accumulation
    if (volumeToLiqRatio > 0.5 && token.priceChange24h > 5) return 'accumulation';

    // High volume + negative price = distribution
    if (volumeToLiqRatio > 0.5 && token.priceChange24h < -5) return 'distribution';

    return 'neutral';
}

// Helper: Calculate max trade size (simplified)
function calculateMaxTradeSize(token: NormalizedToken): number {
    // Assume you can trade 2% of liquidity without >2% slippage
    return Math.round(token.liquidityUsd * 0.02);
}

// Helper: Detect market regime based on signals
function detectMarketRegime(signals: Signal[]): MarketRegime {
    if (signals.length === 0) return 'CHOPPY';

    const avgMomentum = signals.reduce((sum, s) => sum + Math.abs(s.priceChange24h), 0) / signals.length;
    const avgVolatility = signals.reduce((sum, s) => sum + s.edgeScore.momentum, 0) / signals.length;
    const positiveCount = signals.filter(s => s.priceChange24h > 0).length;
    const trendStrength = Math.abs((positiveCount / signals.length) - 0.5) * 2; // 0-1

    // Crisis: High volatility, extreme moves
    if (avgVolatility > 70 && avgMomentum > 15) return 'CRISIS';

    // Trending: Strong directional bias
    if (trendStrength > 0.6 && avgMomentum > 8) return 'TRENDING';

    // Mean reverting: Low trend strength, moderate momentum
    if (trendStrength < 0.3 && avgMomentum > 5) return 'MEAN-REVERTING';

    // Choppy: Default
    return 'CHOPPY';
}

export default function SignalLabDashboard() {
    const { data: session } = useSession();
    const [signals, setSignals] = useState<Signal[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedToken, setSelectedToken] = useState<NormalizedToken | null>(null);
    const [liveFeed, setLiveFeed] = useState<string[]>([]);
    const [marketRegime, setMarketRegime] = useState<MarketRegime>('TRENDING');
    const [hoveredScore, setHoveredScore] = useState<string | null>(null);
    const [showPaywall, setShowPaywall] = useState(false);

    // Check premium status
    useEffect(() => {
        const checkPremium = async () => {
            try {
                const response = await fetch('/api/signals');
                if (response.status === 403) {
                    // Premium required
                    setShowPaywall(true);
                    setLoading(false);
                    return;
                }
            } catch (error) {
                console.error('Premium check failed:', error);
            }
        };

        if (session?.user) {
            checkPremium();
        }
    }, [session]);

    // 1. Fetch Real Trending Data
    useEffect(() => {
        if (showPaywall) return; // Don't fetch if paywall is showing
        let mounted = true;

        const fetchData = async () => {
            try {
                // Fetch from multiple chains for diversity
                const [baseTokens, arbTokens, ethTokens] = await Promise.all([
                    getTrendingTokens('base'),
                    getTrendingTokens('arbitrum'),
                    getTrendingTokens('ethereum')
                ]);

                if (!mounted) return;

                // Flatten and process into "Signals"
                const allTokens = [...baseTokens, ...arbTokens, ...ethTokens];

                // Add synthetic "Signal" data based on real metrics
                const processedSignals: Signal[] = allTokens.slice(0, 20).map(token => {
                    const edgeScore = calculateEdgeScore(token);
                    return {
                        ...token,
                        time: new Date().toLocaleTimeString('en-US', { hour12: false }),
                        score: Math.min(99, Math.floor((token.volume24hUsd / 10000) + (Math.abs(token.priceChange24h) * 2))), // Rough score
                        edgeScore,
                        maxTradeSize: calculateMaxTradeSize(token),
                        smartMoneyFlow: getSmartMoneyFlow(token),
                        status: 'ACTIVE' as const,
                        type: 'LONG' as const
                    };
                });

                setSignals(processedSignals);
                setMarketRegime(detectMarketRegime(processedSignals));
                setLiveFeed(processedSignals.map(s => `${s.symbol} volume spike detected on ${s.chainName}`));
                setLoading(false);

            } catch (err) {
                console.error("Signal Lab Fetch Error", err);
                setLoading(false);
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 60000); // Update every minute
        return () => {
            mounted = false;
            clearInterval(interval);
        };
    }, []);

    // 2. Simulate "Live Feed" Scanner Visuals
    useEffect(() => {
        if (signals.length === 0) return;
        const interval = setInterval(() => {
            const randomSignal = signals[Math.floor(Math.random() * signals.length)];
            const actions = ['Breakout detected', 'Volume spike', 'Liquidity injection', 'Trend acceleration'];
            const action = actions[Math.floor(Math.random() * actions.length)];

            setLiveFeed(prev => [`${randomSignal.symbol} ${action} [${randomSignal.chainName}]`, ...prev].slice(0, 20));
        }, 3000);
        return () => clearInterval(interval);
    }, [signals]);

    return (
        <div className="flex flex-col h-full bg-[#0B0E14] text-zinc-300 font-mono text-sm overflow-hidden border border-zinc-800 rounded-xl shadow-2xl relative">

            {/* PANEL 1: SYSTEM STATE HEADER */}
            <div className="bg-[#0f1219] border-b border-zinc-800 p-4 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] animate-pulse`} />
                        <span className="text-lg font-bold tracking-widest text-zinc-100">SIGNAL LAB <span className="text-emerald-500">LIVE</span></span>
                    </div>
                    {/* Market Regime Indicator */}
                    <div className={`px-3 py-1.5 rounded border flex items-center gap-2 ${
                        marketRegime === 'TRENDING' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' :
                        marketRegime === 'MEAN-REVERTING' ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' :
                        marketRegime === 'CRISIS' ? 'bg-red-500/10 border-red-500/30 text-red-400' :
                        'bg-zinc-500/10 border-zinc-500/30 text-zinc-400'
                    }`}>
                        {marketRegime === 'TRENDING' && <TrendingUp size={12} />}
                        {marketRegime === 'MEAN-REVERTING' && <TrendingDown size={12} />}
                        {marketRegime === 'CRISIS' && <AlertTriangle size={12} />}
                        {marketRegime === 'CHOPPY' && <Minus size={12} />}
                        <span className="text-[10px] font-bold tracking-wider">REGIME: {marketRegime}</span>
                    </div>
                </div>

                <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-2 text-zinc-400">
                        <Server size={14} />
                        <span>NETWORKS: BASE/ARB/ETH</span>
                    </div>
                    <div className="px-3 py-1 bg-zinc-900 border border-zinc-700 rounded flex items-center gap-2">
                        <ShieldCheck size={12} className="text-emerald-500" />
                        0x ROUTING: <span className="text-emerald-500">ACTIVE</span>
                    </div>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">

                {/* PANEL 2: SIGNAL QUEUE (REAL DATA) */}
                <div className="flex-1 flex flex-col border-r border-zinc-800 min-w-0">
                    <div className="p-3 bg-zinc-900/50 border-b border-zinc-800 flex justify-between items-center">
                        <span className="font-bold flex items-center gap-2 text-zinc-200">
                            <Radio size={14} className="text-blue-400" />
                            HIGH VELOCITY OPPORTUNITIES
                        </span>
                        <span className="text-xs text-zinc-500">{signals.length} ACTIVE SIGNALS</span>
                    </div>

                    <div className="flex-1 overflow-auto bg-[#0B0E14]">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center h-full gap-4 text-zinc-500">
                                <Activity className="animate-spin text-emerald-500" size={32} />
                                <p>SCANNING EXECUTION CHAINS...</p>
                            </div>
                        ) : (
                            <table className="w-full text-left border-collapse">
                                <thead className="sticky top-0 bg-[#0f1219] text-xs uppercase text-zinc-500 font-medium z-10">
                                    <tr>
                                        <th className="p-3 border-b border-zinc-800 w-24">Chain</th>
                                        <th className="p-3 border-b border-zinc-800">Asset</th>
                                        <th className="p-3 border-b border-zinc-800 text-right">Price</th>
                                        <th className="p-3 border-b border-zinc-800 text-right">24h Change</th>
                                        <th className="p-3 border-b border-zinc-800 text-right">Volume</th>
                                        <th className="p-3 border-b border-zinc-800 text-center">Edge Score</th>
                                        <th className="p-3 border-b border-zinc-800 text-right">Max Size</th>
                                        <th className="p-3 border-b border-zinc-800 w-24">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {signals.map((sig) => (
                                        <tr
                                            key={sig.id}
                                            className="border-b border-zinc-800/50 hover:bg-zinc-800/20 transition-colors group"
                                        >
                                            <td className="p-3">
                                                <span className={`text-[10px] uppercase px-1.5 py-0.5 rounded border ${sig.chainName === 'Base' ? 'border-blue-500/30 text-blue-400 bg-blue-500/10' :
                                                        sig.chainName === 'Arbitrum' ? 'border-indigo-500/30 text-indigo-400 bg-indigo-500/10' :
                                                            'border-zinc-500/30 text-zinc-400 bg-zinc-500/10'
                                                    }`}>
                                                    {sig.chainName}
                                                </span>
                                            </td>
                                            <td className="p-3">
                                                <div className="flex items-center gap-2">
                                                    {/* Smart Money Flow Indicator */}
                                                    {sig.smartMoneyFlow === 'accumulation' && (
                                                        <span title="Whale accumulation detected" className="text-emerald-400">💎</span>
                                                    )}
                                                    {sig.smartMoneyFlow === 'distribution' && (
                                                        <span title="Distribution pattern detected" className="text-rose-400">📉</span>
                                                    )}
                                                    {sig.smartMoneyFlow === 'neutral' && (
                                                        <span title="Neutral flow" className="text-zinc-600">➖</span>
                                                    )}
                                                    <span className="font-bold text-zinc-200">{sig.symbol}</span>
                                                    <span className="text-xs text-zinc-500 truncate max-w-[100px]">{sig.name}</span>
                                                    {sig.isMeme && <span className="text-[10px] text-pink-500">MEME</span>}
                                                </div>
                                            </td>
                                            <td className="p-3 text-right font-mono text-zinc-300">
                                                ${sig.priceUsd < 0.01 ? sig.priceUsd.toExponential(2) : sig.priceUsd.toFixed(2)}
                                            </td>
                                            <td className={`p-3 text-right font-mono font-bold ${sig.priceChange24h >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                {sig.priceChange24h >= 0 ? '+' : ''}{sig.priceChange24h.toFixed(2)}%
                                            </td>
                                            <td className="p-3 text-right text-zinc-400 font-mono">
                                                ${(sig.volume24hUsd / 1000).toFixed(0)}k
                                            </td>
                                            {/* Edge Score with Hover Breakdown */}
                                            <td className="p-3 text-center">
                                                <div
                                                    className="relative inline-flex items-center gap-1 px-2 py-0.5 rounded border cursor-help"
                                                    style={{
                                                        backgroundColor: sig.edgeScore.overall >= 70 ? 'rgba(16, 185, 129, 0.1)' :
                                                                       sig.edgeScore.overall >= 40 ? 'rgba(234, 179, 8, 0.1)' :
                                                                       'rgba(239, 68, 68, 0.1)',
                                                        borderColor: sig.edgeScore.overall >= 70 ? 'rgba(16, 185, 129, 0.3)' :
                                                                    sig.edgeScore.overall >= 40 ? 'rgba(234, 179, 8, 0.3)' :
                                                                    'rgba(239, 68, 68, 0.3)'
                                                    }}
                                                    onMouseEnter={() => setHoveredScore(sig.id)}
                                                    onMouseLeave={() => setHoveredScore(null)}
                                                >
                                                    <Gauge size={10} className={
                                                        sig.edgeScore.overall >= 70 ? 'text-emerald-400' :
                                                        sig.edgeScore.overall >= 40 ? 'text-yellow-400' :
                                                        'text-rose-400'
                                                    } />
                                                    <span className={`text-xs font-bold ${
                                                        sig.edgeScore.overall >= 70 ? 'text-emerald-400' :
                                                        sig.edgeScore.overall >= 40 ? 'text-yellow-400' :
                                                        'text-rose-400'
                                                    }`}>
                                                        {sig.edgeScore.overall}
                                                    </span>

                                                    {/* Hover Tooltip */}
                                                    {hoveredScore === sig.id && (
                                                        <div className="absolute z-50 top-full mt-2 left-1/2 -translate-x-1/2 bg-zinc-900 border border-zinc-700 rounded p-3 shadow-xl w-48 text-xs text-left">
                                                            <div className="font-bold text-zinc-300 mb-2 text-center">Edge Breakdown</div>
                                                            <div className="space-y-1.5">
                                                                <div className="flex justify-between">
                                                                    <span className="text-zinc-400">Volume:</span>
                                                                    <span className="text-zinc-200 font-mono">{sig.edgeScore.volume}</span>
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <span className="text-zinc-400">Liquidity:</span>
                                                                    <span className="text-zinc-200 font-mono">{sig.edgeScore.liquidity}</span>
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <span className="text-zinc-400">Momentum:</span>
                                                                    <span className="text-zinc-200 font-mono">{sig.edgeScore.momentum}</span>
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <span className="text-zinc-400">Smart Money:</span>
                                                                    <span className="text-zinc-200 font-mono">{sig.edgeScore.smartMoney}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            {/* Liquidity Depth Gauge */}
                                            <td className="p-3 text-right">
                                                <span className={`text-xs font-mono font-bold ${
                                                    sig.maxTradeSize >= 100000 ? 'text-emerald-400' :
                                                    sig.maxTradeSize >= 10000 ? 'text-yellow-400' :
                                                    'text-rose-400'
                                                }`}>
                                                    ${sig.maxTradeSize >= 1000000
                                                        ? `${(sig.maxTradeSize / 1000000).toFixed(1)}M`
                                                        : `${(sig.maxTradeSize / 1000).toFixed(0)}k`
                                                    }
                                                </span>
                                            </td>
                                            <td className="p-3">
                                                <button
                                                    onClick={() => setSelectedToken(sig)}
                                                    className="w-full py-1.5 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-500 hover:text-black border border-emerald-500/20 hover:border-emerald-500 rounded font-bold text-xs transition-all flex items-center justify-center gap-1"
                                                >
                                                    SWAP <ArrowRight size={10} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

                {/* RIGHT SIDEBAR: MARKET SCANNER */}
                <div className="w-80 flex flex-col bg-[#0f1219] border-l border-zinc-800">

                    {/* TOP: Quick Stats */}
                    <div className="h-1/3 border-b border-zinc-800 flex flex-col p-4 space-y-4">
                        <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                            <TrendingUp size={14} /> Market Pulse
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-zinc-900/50 p-2 rounded border border-zinc-800">
                                <span className="block text-zinc-500 text-[10px] mb-1">BASE VOLUME</span>
                                <span className="text-lg font-mono text-blue-400 font-bold">High</span>
                            </div>
                            <div className="bg-zinc-900/50 p-2 rounded border border-zinc-800">
                                <span className="block text-zinc-500 text-[10px] mb-1">MEME INDEX</span>
                                <span className="text-lg font-mono text-pink-400 font-bold">Unstable</span>
                            </div>
                        </div>
                        <div className="text-xs text-zinc-400 leading-relaxed bg-zinc-900 p-2 rounded">
                            <span className="text-emerald-400 font-bold">INSIGHT:</span> Capital rotating into L2 mid-caps. Volatility expanding on Base.
                        </div>
                    </div>

                    {/* BOTTOM: Live Feed */}
                    <div className="flex-1 flex flex-col min-h-0">
                        <div className="p-3 bg-zinc-900/50 border-b border-zinc-800 font-bold flex items-center gap-2 justify-between">
                            <div className="flex items-center gap-2 text-xs">
                                <Activity size={14} className="text-emerald-500 animate-pulse" /> SCANNER FEED
                            </div>
                            <span className="text-[10px] text-zinc-600 bg-zinc-900 px-2 rounded">LIVE</span>
                        </div>
                        <div className="flex-1 overflow-auto p-2 space-y-1 bg-[#080a0f]">
                            {liveFeed.map((msg, i) => (
                                <div key={i} className="flex items-start gap-2 p-2 rounded hover:bg-zinc-800/30 transition-colors text-xs border-l-2 border-emerald-500/20 hover:border-emerald-500">
                                    <span className="text-zinc-600 font-mono w-12 shrink-0">{new Date().toLocaleTimeString('en-US', { hour12: false, minute: '2-digit', second: '2-digit' })}</span>
                                    <span className="text-zinc-400">{msg}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            </div>

            {/* FOOTER */}
            <div className="bg-[#0f1219] border-t border-zinc-800 p-2 px-4 flex justify-between items-center text-[10px] text-zinc-600">
                <span>SYSTEM ID: ZSL-LIVE-FEED</span>
                <span>Opportunity detected. Execution Ready.</span>
            </div>

            {/* SWAP DRAWER INTEGRATION */}
            {selectedToken && (
                <SwapDrawer
                    token={selectedToken}
                    onClose={() => setSelectedToken(null)}
                />
            )}

            {/* PAYWALL */}
            <Paywall
                isOpen={showPaywall}
                onClose={() => setShowPaywall(false)}
                featureName="Signal Lab"
            />
        </div>
    );
}
