'use client';

/**
 * Smart Swap V1 - Intent-Based Token Matching
 *
 * CRITICAL: This is DISPLAY ONLY
 * - NO swap execution
 * - NO wallet interaction
 * - Shows matches based on user intent
 * - "Swap" buttons are disabled with "Coming Soon"
 */

import { useState, useEffect } from 'react';
import { Target, TrendingUp, Droplets, Shield, Clock, Lock } from 'lucide-react';
import { SmartMatchResult } from '@/lib/smart-swap-v1/intent-engine';
import { getRankLabel } from '@/lib/smart-swap-v1/intent-engine';
import { buildZenithTokenList, ZenithToken } from '@/lib/zenith';
import { findSmartMatchesFromZenith } from '@/lib/smart-swap-v1/client-engine';

export default function SmartSwapV1Page() {
    const [investmentAmount, setInvestmentAmount] = useState<string>('10');
    const [targetReturn, setTargetReturn] = useState<string>('15');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [matches, setMatches] = useState<SmartMatchResult[]>([]);
    const [tokensAnalyzed, setTokensAnalyzed] = useState<number>(0);
    const [zenithTokens, setZenithTokens] = useState<ZenithToken[]>([]);
    const [tokensLoading, setTokensLoading] = useState(true);
    const [infoMessage, setInfoMessage] = useState<string | null>(null);

    // Load tokens on mount (same as /swap)
    useEffect(() => {
        buildZenithTokenList()
            .then(tokens => {
                setZenithTokens(tokens);
                setTokensAnalyzed(tokens.length);
                console.log(`[Smart Swap V1] Loaded ${tokens.length} tokens from Zenith (same source as /swap)`);
            })
            .catch(err => {
                console.error('[Smart Swap V1] Failed to load tokens:', err);
                setError('Failed to load token list. Please refresh the page.');
            })
            .finally(() => {
                setTokensLoading(false);
            });
    }, []);

    const handleFindMatches = () => {
        const investment = parseFloat(investmentAmount);
        const target = parseFloat(targetReturn);

        if (!investment || investment <= 0) {
            setError('Please enter a valid investment amount');
            return;
        }

        if (!target || target <= investment) {
            setError('Target return must be greater than investment');
            return;
        }

        if (zenithTokens.length === 0) {
            setError('Token data not loaded yet. Please wait...');
            return;
        }

        setLoading(true);
        setError(null);
        setMatches([]);
        setInfoMessage(null);

        try {
            // CLIENT-SIDE matching (no API call, reuses /swap tokens)
            const { matches: results, message } = findSmartMatchesFromZenith(zenithTokens, {
                investmentAmount: investment,
                targetReturn: target,
            });

            if (results.length === 0) {
                setError(message || 'No matches found. Try adjusting your target.');
            } else {
                setMatches(results);
                // Show info message if relaxed/fallback pass was used
                if (message) {
                    setInfoMessage(message);
                }
            }
        } catch (err: any) {
            console.error('[Smart Swap V1] Error:', err);
            setError(err.message || 'Failed to analyze. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const multiplier = parseFloat(investmentAmount) && parseFloat(targetReturn)
        ? (parseFloat(targetReturn) / parseFloat(investmentAmount)).toFixed(2)
        : '0.00';

    return (
        <div className="min-h-screen bg-black pt-20 pb-20 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center">
                            <Target className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-white tracking-tight">
                                Smart Swap V1
                            </h1>
                            <p className="text-sm text-zinc-400">
                                Intent-based token matching • Display only
                            </p>
                        </div>
                    </div>

                    <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4 text-sm text-emerald-400">
                        <strong>How it works:</strong> Tell us your investment goal, and we'll find tokens
                        that historically matched similar moves. This is analysis only - no execution.
                    </div>
                </div>

                {/* Input Card */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-6">
                    <h2 className="text-lg font-bold text-white mb-4">Your Investment Intent</h2>

                    <div className="grid md:grid-cols-2 gap-6 mb-4">
                        {/* Investment Amount */}
                        <div>
                            <label className="block text-sm text-zinc-400 mb-2">
                                I want to invest
                            </label>
                            <div className="relative">
                                <input
                                    type="number"
                                    value={investmentAmount}
                                    onChange={(e) => setInvestmentAmount(e.target.value)}
                                    min="0"
                                    step="0.1"
                                    className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                                    placeholder="0.0"
                                />
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500">
                                    SOL
                                </div>
                            </div>
                        </div>

                        {/* Target Return */}
                        <div>
                            <label className="block text-sm text-zinc-400 mb-2">
                                I want to reach
                            </label>
                            <div className="relative">
                                <input
                                    type="number"
                                    value={targetReturn}
                                    onChange={(e) => setTargetReturn(e.target.value)}
                                    min="0"
                                    step="0.1"
                                    className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                                    placeholder="0.0"
                                />
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500">
                                    SOL
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Multiplier Display */}
                    <div className="bg-black/50 rounded-lg p-3 mb-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-zinc-400">Target Multiplier</span>
                            <span className="text-lg font-bold text-emerald-400">{multiplier}x</span>
                        </div>
                    </div>

                    {/* Find Matches Button */}
                    <button
                        onClick={handleFindMatches}
                        disabled={loading || tokensLoading}
                        className="w-full px-6 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {tokensLoading ? 'Loading Tokens...' : loading ? 'Analyzing Tokens...' : 'Find Smart Matches'}
                    </button>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6 text-sm text-red-400">
                        {error}
                    </div>
                )}

                {/* Info Message (when relaxed/fallback pass is used) */}
                {infoMessage && matches.length > 0 && (
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6 text-sm text-blue-400">
                        ℹ️ {infoMessage}
                    </div>
                )}

                {/* Results */}
                {matches.length > 0 && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-2xl font-bold text-white">
                                Top Matches for Your Goal
                            </h2>
                            {tokensAnalyzed > 0 && (
                                <span className="text-xs text-zinc-500">
                                    Analyzed {tokensAnalyzed.toLocaleString()} tokens
                                </span>
                            )}
                        </div>

                        {matches.map((match) => (
                            <TokenMatchCard key={match.token.address} match={match} />
                        ))}

                        {/* Disclaimer */}
                        <div className="bg-yellow-900/10 border border-yellow-500/20 rounded-lg p-4 text-xs text-yellow-400/80 mt-6">
                            <strong>Important:</strong> These are historical analysis results, not guarantees.
                            Past performance does not indicate future returns. Cryptocurrency trading carries
                            significant risk. Always DYOR and never invest more than you can afford to lose.
                        </div>
                    </div>
                )}

                {/* Empty State */}
                {!loading && matches.length === 0 && !error && (
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-12 text-center">
                        <Target className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                        <p className="text-zinc-500 text-sm">
                            Enter your investment goal to discover matching tokens
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

/**
 * Token Match Card Component
 */
function TokenMatchCard({ match }: { match: SmartMatchResult }) {
    const { token, smartScore, matchPercentage, expectedRange, whyReasons, volumeTrend, rank } = match;

    return (
        <div className="bg-zinc-900 border border-zinc-800 hover:border-emerald-500/30 rounded-xl p-6 transition-all">
            {/* Rank Label */}
            <div className="inline-block px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-xs font-bold text-emerald-400 mb-4">
                {getRankLabel(rank)}
            </div>

            {/* Token Header */}
            <div className="flex items-start justify-between mb-4">
                <div>
                    <h3 className="text-2xl font-bold text-white mb-1">{token.symbol}</h3>
                    <p className="text-sm text-zinc-400">{token.name}</p>
                </div>

                <div className="text-right">
                    <div className="text-xs text-zinc-500 mb-1">Smart Match</div>
                    <div className="text-3xl font-bold text-emerald-400">
                        {matchPercentage.toFixed(0)}%
                    </div>
                </div>
            </div>

            {/* Expected Profile Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                <MetricBox
                    icon={<TrendingUp className="w-4 h-4" />}
                    label="Typical Range"
                    value={`${expectedRange.min.toFixed(1)}x - ${expectedRange.max.toFixed(1)}x`}
                />
                <MetricBox
                    icon={<Droplets className="w-4 h-4" />}
                    label="Liquidity"
                    value={`$${(token.liquidity / 1000).toFixed(0)}K`}
                />
                <MetricBox
                    icon={<TrendingUp className="w-4 h-4" />}
                    label="Volume Trend"
                    value={volumeTrend}
                    color={volumeTrend === 'Rising' ? 'text-emerald-400' : 'text-zinc-400'}
                />
                <MetricBox
                    icon={<Shield className="w-4 h-4" />}
                    label="Risk Level"
                    value={token.rugRisk === 'low' ? 'Low' : 'Medium'}
                    color={token.rugRisk === 'low' ? 'text-emerald-400' : 'text-yellow-400'}
                />
            </div>

            {/* Why This Token */}
            <div className="bg-black/50 rounded-lg p-4 mb-4">
                <h4 className="text-sm font-bold text-emerald-400 mb-2">Why this token?</h4>
                <ul className="space-y-1">
                    {whyReasons.map((reason, i) => (
                        <li key={i} className="text-sm text-zinc-300 flex items-start gap-2">
                            <span className="text-emerald-400 mt-1">•</span>
                            <span>{reason}</span>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Disabled Swap Button */}
            <button
                disabled
                className="w-full px-6 py-3 bg-zinc-800 text-zinc-500 rounded-lg font-bold flex items-center justify-center gap-2 cursor-not-allowed"
            >
                <Lock className="w-4 h-4" />
                Swap - Coming Soon
            </button>

            {/* Additional Info */}
            <div className="mt-3 flex items-center justify-between text-xs text-zinc-600">
                <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {token.ageInDays} days old
                </div>
                <div>Smart Score: {smartScore}/100</div>
            </div>
        </div>
    );
}

/**
 * Metric Box Component
 */
function MetricBox({
    icon,
    label,
    value,
    color = 'text-white',
}: {
    icon: React.ReactNode;
    label: string;
    value: string;
    color?: string;
}) {
    return (
        <div className="bg-black/50 rounded-lg p-3">
            <div className="flex items-center gap-1 mb-1 text-zinc-500">
                {icon}
                <span className="text-xs">{label}</span>
            </div>
            <div className={`text-sm font-bold ${color}`}>{value}</div>
        </div>
    );
}
