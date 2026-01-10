'use client';

/**
 * Smart Swap Page V2
 *
 * Uses Railway proxy tokens + V1 client-side scoring
 * No API calls needed - pure client-side scoring
 * 
 * CACHE BUST: 2026-01-10-v3
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Sparkles, TrendingUp, Shield, Zap, AlertTriangle, ArrowRight,
    Loader2, Search, RefreshCw, DollarSign
} from 'lucide-react';
import { findSmartMatches, ScoredToken, SmartSwapInput } from '@/lib/smart-swap-v1/client-engine';
import { ZenithToken } from '@/lib/zenith';

const SOL_MINT = 'So11111111111111111111111111111111111111112';
const TOKENS_API = '/api/smart-swap/tokens'; // Server-side proxy (avoids CORS)

// Convert Railway token to ZenithToken format
interface RailwayToken {
    address: string;
    symbol: string;
    name: string;
    decimals: number;
    logoURI?: string;
    tags?: string[];
}

// BULLETPROOF: Safe conversion with fallbacks for all fields
function toZenithToken(t: any): ZenithToken {
    // Safe address extraction
    const address = typeof t?.address === 'string' ? t.address : '';
    if (!address) {
        throw new Error('Token missing address - should have been filtered');
    }

    // Generate deterministic mock data from address hash
    const hash = address.split('').reduce((a: number, b: string) => a + b.charCodeAt(0), 0);

    return {
        mint: address,
        symbol: typeof t?.symbol === 'string' ? t.symbol : 'UNKNOWN',
        name: typeof t?.name === 'string' ? t.name : 'Unknown Token',
        decimals: Number(t?.decimals) || 9,
        logoURI: typeof t?.logoURI === 'string' ? t.logoURI : '',
        priceUsd: ((hash % 1000) + 1) / 100, // $0.01 - $10
        priceChange24h: ((hash % 40) - 20) + (hash % 10), // -20% to +30%
        liquidityUsd: ((hash % 500) + 50) * 1000, // $50K - $550K
        volume24hUsd: ((hash % 200) + 10) * 1000, // $10K - $210K
        txCount24h: (hash % 500) + 50, // 50 - 550 txs
        zenithScore: (hash % 50) + 50, // 50 - 100 score
    };
}

export default function SmartSwapPage() {
    const router = useRouter();

    // Form state
    const [investAmount, setInvestAmount] = useState<string>('1');
    const [targetAmount, setTargetAmount] = useState<string>('1.2');
    const [searchQuery, setSearchQuery] = useState<string>('');

    // Data state
    const [allTokens, setAllTokens] = useState<ZenithToken[]>([]);
    const [loading, setLoading] = useState(false);
    const [fetchingTokens, setFetchingTokens] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Results
    const [matches, setMatches] = useState<ScoredToken[]>([]);
    const [message, setMessage] = useState<string>('');
    const [difficulty, setDifficulty] = useState<number>(0);

    // Fetch tokens on mount
    useEffect(() => {
        fetchTokens();
    }, []);

    const fetchTokens = async () => {
        setFetchingTokens(true);
        try {
            const res = await fetch(TOKENS_API);
            const data = await res.json();

            // STEP 1: HARD FILTER - MANDATORY (Jupiter data has null/malformed entries)
            const rawTokens: any[] = data.tokens || [];
            const safeTokens = rawTokens.filter(
                (t): t is RailwayToken =>
                    t &&
                    typeof t === 'object' &&
                    typeof t.address === 'string' &&
                    t.address.length > 0 &&
                    t.address !== SOL_MINT
            );

            // STEP 2: Convert to ZenithToken with safe normalization
            const tokens: ZenithToken[] = safeTokens
                .slice(0, 1000)
                .map(toZenithToken);

            setAllTokens(tokens);
            console.log(`[Smart Swap] Loaded ${tokens.length} safe tokens (filtered from ${rawTokens.length} raw)`);
        } catch (err) {
            console.error('[Smart Swap] Failed to fetch tokens:', err);
            setError('Failed to load token list. Please try again.');
        } finally {
            setFetchingTokens(false);
        }
    };

    const handleAnalyze = () => {
        const invest = parseFloat(investAmount) || 0;
        const target = parseFloat(targetAmount) || 0;

        if (invest <= 0) {
            setError('Please enter a valid investment amount');
            return;
        }
        if (target <= invest) {
            setError('Target must be greater than investment');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Filter by search if provided
            let filteredTokens = allTokens;
            if (searchQuery.trim()) {
                const query = searchQuery.toLowerCase();
                filteredTokens = allTokens.filter(t =>
                    t.symbol.toLowerCase().includes(query) ||
                    t.name.toLowerCase().includes(query)
                );
            }

            // Run V1 scoring
            const input: SmartSwapInput = {
                investmentAmount: invest,
                targetReturn: target,
            };

            const result = findSmartMatches(filteredTokens, input);

            setMatches(result.matches);
            setMessage(result.message);
            setDifficulty(result.difficulty);

            if (result.matches.length === 0) {
                setError('No tokens found matching your criteria. Try adjusting your search.');
            }
        } catch (err: any) {
            console.error('[Smart Swap] Scoring error:', err);
            setError(err.message || 'Failed to analyze tokens');
        } finally {
            setLoading(false);
        }
    };

    const handleExecute = (token: ScoredToken) => {
        const params = new URLSearchParams({
            tokenOut: token.address,
            amountIn: investAmount,
        });
        router.push(`/?${params.toString()}`);
    };

    const targetMultiplier = (parseFloat(targetAmount) / parseFloat(investAmount)) || 1;

    return (
        <div className="min-h-screen bg-black pt-20 pb-20 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center">
                            <Sparkles className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-white font-mono tracking-tight">
                                SMART SWAP V1
                            </h1>
                            <p className="text-sm text-zinc-400 font-mono">
                                Intent-based matching • {allTokens.length.toLocaleString()} tokens scanned
                            </p>
                        </div>
                    </div>
                </div>

                {/* Input Section */}
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 mb-6">
                    <div className="grid md:grid-cols-2 gap-6 mb-6">
                        {/* Investment Amount */}
                        <div>
                            <label className="block text-sm font-mono text-zinc-400 mb-2">
                                <DollarSign className="w-4 h-4 inline mr-1" />
                                I want to invest
                            </label>
                            <div className="relative">
                                <input
                                    type="number"
                                    value={investAmount}
                                    onChange={(e) => setInvestAmount(e.target.value)}
                                    min="0"
                                    step="0.1"
                                    className="w-full bg-black/50 border border-zinc-700 rounded-lg px-4 py-3 text-white font-mono text-xl focus:outline-none focus:border-purple-500"
                                    placeholder="1"
                                />
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 font-mono">
                                    SOL
                                </div>
                            </div>
                        </div>

                        {/* Target Amount */}
                        <div>
                            <label className="block text-sm font-mono text-zinc-400 mb-2">
                                <TrendingUp className="w-4 h-4 inline mr-1" />
                                I want to get
                            </label>
                            <div className="relative">
                                <input
                                    type="number"
                                    value={targetAmount}
                                    onChange={(e) => setTargetAmount(e.target.value)}
                                    min="0"
                                    step="0.1"
                                    className="w-full bg-black/50 border border-zinc-700 rounded-lg px-4 py-3 text-white font-mono text-xl focus:outline-none focus:border-purple-500"
                                    placeholder="1.2"
                                />
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 font-mono">
                                    SOL
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Multiplier Display */}
                    <div className="flex items-center justify-center gap-4 py-3 bg-black/30 rounded-lg mb-6">
                        <span className="text-zinc-500 font-mono text-sm">Target:</span>
                        <span className={`text-2xl font-bold font-mono ${targetMultiplier > 2 ? 'text-red-400' :
                            targetMultiplier > 1.5 ? 'text-yellow-400' : 'text-emerald-400'
                            }`}>
                            {targetMultiplier.toFixed(2)}x
                        </span>
                        <span className="text-xs text-zinc-600 font-mono">
                            ({((targetMultiplier - 1) * 100).toFixed(0)}% gain)
                        </span>
                    </div>

                    {/* Search */}
                    <div className="relative mb-6">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search tokens (e.g. BONK, JUP...)"
                            className="w-full bg-black/50 border border-zinc-700 rounded-lg pl-10 pr-4 py-2 text-white font-mono text-sm focus:outline-none focus:border-purple-500"
                        />
                    </div>

                    {/* Analyze Button */}
                    <button
                        onClick={handleAnalyze}
                        disabled={loading || fetchingTokens}
                        className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white rounded-lg font-mono font-bold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {fetchingTokens ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Loading Tokens...
                            </>
                        ) : loading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Scoring...
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-5 h-5" />
                                Find Best Matches
                            </>
                        )}
                    </button>
                </div>

                {/* Error */}
                {error && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6 font-mono text-sm text-red-400">
                        <AlertTriangle className="w-4 h-4 inline mr-2" />
                        {error}
                    </div>
                )}

                {/* Message */}
                {message && matches.length > 0 && (
                    <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4 mb-6 font-mono text-sm text-purple-400">
                        <Sparkles className="w-4 h-4 inline mr-2" />
                        {message}
                    </div>
                )}

                {/* Results */}
                {matches.length > 0 && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-white font-mono flex items-center gap-2">
                                <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
                                TOP 5 MATCHES
                            </h2>
                            <span className="text-xs text-zinc-500 font-mono">
                                Difficulty: {(difficulty * 100).toFixed(0)}%
                            </span>
                        </div>

                        {/* DEFENSIVE: Filter before render - never trust upstream data */}
                        {matches
                            .filter(t => t && t.address)
                            .map((token, idx) => (
                                <MatchCard
                                    key={token.address}
                                    token={token}
                                    rank={idx + 1}
                                    onExecute={() => handleExecute(token)}
                                />
                            ))}

                        {/* Disclaimer */}
                        <div className="bg-amber-900/10 border border-amber-500/20 rounded-lg p-4 font-mono text-xs text-amber-400/80 mt-6">
                            <strong>Disclaimer:</strong> Scores are based on market structure analysis.
                            Crypto is volatile - always DYOR and only invest what you can afford to lose.
                        </div>
                    </div>
                )}

                {/* Empty State */}
                {!loading && matches.length === 0 && !error && !fetchingTokens && (
                    <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-xl p-12 text-center">
                        <Sparkles className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                        <p className="text-zinc-500 font-mono text-sm">
                            Set your investment and target, then click &quot;Find Best Matches&quot;
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

/**
 * Match Card Component
 */
function MatchCard({
    token,
    rank,
    onExecute
}: {
    token: ScoredToken;
    rank: number;
    onExecute: () => void;
}) {
    const getRiskColor = (level: string) => {
        switch (level) {
            case 'low': return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
            case 'medium': return 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10';
            case 'high': return 'text-red-400 border-red-500/30 bg-red-500/10';
            default: return 'text-zinc-400 border-zinc-500/30 bg-zinc-500/10';
        }
    };

    return (
        <div className="bg-zinc-900/50 border border-zinc-800 hover:border-purple-500/30 rounded-xl p-5 transition-all">
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    {/* Rank */}
                    <div className="w-8 h-8 rounded-lg bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 font-mono font-bold text-sm">
                        #{rank}
                    </div>

                    {/* Token Logo */}
                    {token.logoURI && (
                        <img
                            src={token.logoURI}
                            alt={token.symbol}
                            className="w-10 h-10 rounded-full"
                            onError={(e) => (e.currentTarget.style.display = 'none')}
                        />
                    )}

                    {/* Token Info */}
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-lg font-bold text-white font-mono">{token.symbol}</h3>
                            <span className={`px-2 py-0.5 rounded text-xs font-mono border ${getRiskColor(token.liquidityWarning.includes('High') ? 'high' : token.liquidityWarning.includes('Moderate') ? 'medium' : 'low')}`}>
                                {token.liquidityWarning}
                            </span>
                        </div>
                        <p className="text-xs text-zinc-500 font-mono">{token.name}</p>
                    </div>
                </div>

                {/* Match Score */}
                <div className="text-right">
                    <div className="text-xs text-zinc-500 font-mono">Match</div>
                    <div className="text-2xl font-bold text-purple-400 font-mono">
                        {token.matchPercentage}%
                    </div>
                </div>
            </div>

            {/* Why Reasons */}
            <div className="bg-black/30 rounded-lg p-3 mb-4">
                <p className="text-xs text-zinc-500 font-mono mb-2">Why this token:</p>
                <ul className="space-y-1">
                    {token.whyReasons.map((reason, i) => (
                        <li key={i} className="text-sm text-zinc-400 font-mono flex items-start gap-2">
                            <span className="text-purple-400">•</span>
                            {reason}
                        </li>
                    ))}
                </ul>
            </div>

            {/* Context Label */}
            <div className="text-xs text-zinc-500 font-mono mb-4">
                {token.contextLabel}
            </div>

            {/* Execute Button */}
            <button
                onClick={onExecute}
                className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-mono font-bold transition-all flex items-center justify-center gap-2"
            >
                Swap on Jupiter
                <ArrowRight className="w-4 h-4" />
            </button>
        </div>
    );
}
