'use client';

/**
 * Smart Swap Page
 *
 * CRITICAL: This is a RECOMMENDATION UI ONLY
 * - Does NOT execute swaps
 * - Does NOT handle transactions
 * - Provides analysis and hands off to existing swap for execution
 *
 * Execution is handled by the existing swap component at /
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, TrendingUp, Shield, Zap, AlertTriangle, ArrowRight, Loader2 } from 'lucide-react';
import { RiskMode, RISK_MODE_CONFIG, SwapRecommendation, SmartSwapResponse } from '@/lib/smart-swap/types';

const SOL_MINT = 'So11111111111111111111111111111111111111112';

export default function SmartSwapPage() {
    const router = useRouter();

    // Form state
    const [amountIn, setAmountIn] = useState<string>('1');
    const [riskMode, setRiskMode] = useState<RiskMode>('balanced');

    // Results state
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [recommendations, setRecommendations] = useState<SwapRecommendation[]>([]);

    const handleAnalyze = async () => {
        if (!amountIn || parseFloat(amountIn) <= 0) {
            setError('Please enter a valid amount');
            return;
        }

        setLoading(true);
        setError(null);
        setRecommendations([]);

        try {
            const response = await fetch('/api/smart-swap/recommend', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amountIn: parseFloat(amountIn),
                    tokenInMint: SOL_MINT,
                    riskMode,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to generate recommendations');
            }

            const data: SmartSwapResponse = await response.json();
            setRecommendations(data.recommendations);

            if (data.recommendations.length === 0) {
                setError('No suitable tokens found for the selected risk mode. Try a different mode.');
            }
        } catch (err: any) {
            console.error('[Smart Swap UI] Error:', err);
            setError(err.message || 'Failed to analyze. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleExecuteSwap = (recommendation: SwapRecommendation) => {
        // CRITICAL: Hand off to existing swap component
        // We DO NOT execute here - we redirect to the existing swap page
        const params = new URLSearchParams({
            tokenOut: recommendation.tokenOut.mint,
            amountIn: amountIn,
        });
        router.push(`/?${params.toString()}`);
    };

    return (
        <div className="min-h-screen bg-black pt-20 pb-20 px-4">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center">
                            <Sparkles className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-white font-mono tracking-tight">
                                SMART SWAP OPTIMIZER
                            </h1>
                            <p className="text-sm text-zinc-400 font-mono">
                                Intelligent analysis • Top recommendations • Risk-aware
                            </p>
                        </div>
                    </div>

                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 font-mono text-sm text-blue-400">
                        <div className="flex items-start gap-2">
                            <Sparkles className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            <div>
                                <strong>How it works:</strong> Smart Swap analyzes tokens, filters risk, and recommends the best options.
                                Click "Execute" to swap using the existing Jupiter-powered swap engine.
                            </div>
                        </div>
                    </div>
                </div>

                {/* Input Section */}
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 mb-6 backdrop-blur-sm">
                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Amount Input */}
                        <div>
                            <label className="block text-sm font-mono text-zinc-400 mb-2">
                                Amount to Swap
                            </label>
                            <div className="relative">
                                <input
                                    type="number"
                                    value={amountIn}
                                    onChange={(e) => setAmountIn(e.target.value)}
                                    min="0"
                                    step="0.1"
                                    className="w-full bg-black/50 border border-zinc-700 rounded-lg px-4 py-3 text-white font-mono focus:outline-none focus:border-purple-500 transition-colors"
                                    placeholder="0.0"
                                />
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 font-mono">
                                    SOL
                                </div>
                            </div>
                        </div>

                        {/* Risk Mode Selection */}
                        <div>
                            <label className="block text-sm font-mono text-zinc-400 mb-2">
                                Risk Mode
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                                {(['safe', 'balanced', 'degenerate'] as RiskMode[]).map((mode) => (
                                    <button
                                        key={mode}
                                        onClick={() => setRiskMode(mode)}
                                        className={`px-4 py-3 rounded-lg font-mono text-sm font-medium transition-all border ${
                                            riskMode === mode
                                                ? 'bg-purple-600 text-white border-purple-500'
                                                : 'bg-black/50 text-zinc-400 border-zinc-700 hover:border-zinc-600'
                                        }`}
                                    >
                                        {RISK_MODE_CONFIG[mode].label}
                                    </button>
                                ))}
                            </div>
                            <p className="text-xs text-zinc-500 mt-2 font-mono">
                                {RISK_MODE_CONFIG[riskMode].description}
                            </p>
                        </div>
                    </div>

                    {/* Analyze Button */}
                    <button
                        onClick={handleAnalyze}
                        disabled={loading}
                        className="w-full mt-6 px-6 py-4 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white rounded-lg font-mono font-bold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Analyzing Tokens...
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-5 h-5" />
                                Analyze & Recommend
                            </>
                        )}
                    </button>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6 font-mono text-sm text-red-400">
                        <div className="flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            <div>{error}</div>
                        </div>
                    </div>
                )}

                {/* Recommendations */}
                {recommendations.length > 0 && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
                            <h2 className="text-xl font-bold text-white font-mono">
                                TOP RECOMMENDATIONS
                            </h2>
                            <span className="text-sm text-zinc-500 font-mono">
                                ({recommendations.length})
                            </span>
                        </div>

                        {recommendations.map((rec, index) => (
                            <RecommendationCard
                                key={rec.tokenOut.mint}
                                recommendation={rec}
                                rank={index + 1}
                                onExecute={() => handleExecuteSwap(rec)}
                            />
                        ))}

                        {/* Disclaimer */}
                        <div className="bg-amber-900/10 border border-amber-500/20 rounded-lg p-4 font-mono text-xs text-amber-400/80 mt-6">
                            <strong>Important:</strong> These are estimated recommendations based on current market data.
                            Cryptocurrency trading carries significant risk. Always do your own research and never invest more than you can afford to lose.
                        </div>
                    </div>
                )}

                {/* Empty State */}
                {!loading && recommendations.length === 0 && !error && (
                    <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-xl p-12 text-center">
                        <Sparkles className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                        <p className="text-zinc-500 font-mono text-sm">
                            Enter an amount and select a risk mode to get started
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

/**
 * Recommendation Card Component
 */
function RecommendationCard({
    recommendation,
    rank,
    onExecute,
}: {
    recommendation: SwapRecommendation;
    rank: number;
    onExecute: () => void;
}) {
    const getRiskColor = (level: string) => {
        switch (level) {
            case 'low':
                return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
            case 'medium':
                return 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10';
            case 'high':
                return 'text-red-400 border-red-500/30 bg-red-500/10';
            default:
                return 'text-zinc-400 border-zinc-500/30 bg-zinc-500/10';
        }
    };

    const getRiskIcon = (level: string) => {
        switch (level) {
            case 'low':
                return <Shield className="w-4 h-4" />;
            case 'medium':
                return <TrendingUp className="w-4 h-4" />;
            case 'high':
                return <Zap className="w-4 h-4" />;
            default:
                return null;
        }
    };

    return (
        <div className="bg-zinc-900/50 border border-zinc-800 hover:border-purple-500/30 rounded-xl p-6 transition-all backdrop-blur-sm">
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3">
                    {/* Rank Badge */}
                    <div className="w-8 h-8 rounded-lg bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 font-mono font-bold">
                        #{rank}
                    </div>

                    {/* Token Info */}
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-xl font-bold text-white font-mono">
                                {recommendation.tokenOut.symbol}
                            </h3>
                            <div
                                className={`px-2 py-0.5 rounded text-xs font-mono border ${getRiskColor(
                                    recommendation.riskLevel
                                )} flex items-center gap-1`}
                            >
                                {getRiskIcon(recommendation.riskLevel)}
                                {recommendation.riskLevel.toUpperCase()}
                            </div>
                        </div>
                        <p className="text-sm text-zinc-400 font-mono">{recommendation.tokenOut.name}</p>
                    </div>
                </div>

                {/* Smart Score */}
                <div className="text-right">
                    <div className="text-xs text-zinc-500 font-mono mb-1">Smart Score</div>
                    <div className="text-2xl font-bold text-purple-400 font-mono">
                        {recommendation.smartSwapScore}
                    </div>
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <MetricBox label="Est. Received" value={`${recommendation.estimatedAmountOut.toFixed(4)}`} />
                <MetricBox
                    label="Slippage"
                    value={`${recommendation.estimatedSlippage.toFixed(2)}%`}
                    color={recommendation.estimatedSlippage > 2 ? 'text-yellow-400' : 'text-emerald-400'}
                />
                <MetricBox
                    label="Liquidity"
                    value={`${recommendation.liquidityScore}/100`}
                    color={recommendation.liquidityScore > 70 ? 'text-emerald-400' : 'text-yellow-400'}
                />
                <MetricBox
                    label="Risk Score"
                    value={`${recommendation.riskScore}/100`}
                    color={recommendation.riskScore > 70 ? 'text-emerald-400' : 'text-red-400'}
                />
            </div>

            {/* Explanation */}
            <div className="bg-black/50 rounded-lg p-3 mb-4">
                <p className="text-sm text-zinc-400 font-mono leading-relaxed">
                    <span className="text-purple-400">Why recommended:</span> {recommendation.explanation}
                </p>
            </div>

            {/* Execute Button */}
            <button
                onClick={onExecute}
                className="w-full px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-mono font-bold transition-all flex items-center justify-center gap-2"
            >
                Execute Swap on Jupiter
                <ArrowRight className="w-4 h-4" />
            </button>
        </div>
    );
}

/**
 * Metric Box Component
 */
function MetricBox({
    label,
    value,
    color = 'text-white',
}: {
    label: string;
    value: string;
    color?: string;
}) {
    return (
        <div className="bg-black/50 rounded-lg p-3">
            <div className="text-xs text-zinc-500 font-mono mb-1">{label}</div>
            <div className={`text-lg font-bold font-mono ${color}`}>{value}</div>
        </div>
    );
}
