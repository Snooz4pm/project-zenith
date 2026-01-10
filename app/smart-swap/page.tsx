'use client';

/**
 * Smart Swap Page - STATE MACHINE VERSION
 * 
 * Crash-proof by construction:
 * - Only render data that exists in current state
 * - No .map() on raw arrays
 * - No render during async transitions
 * - No undefined tokens ever
 */

import { useReducer, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Sparkles, TrendingUp, Shield, Zap, AlertTriangle, ArrowRight,
    Loader2, Search, RefreshCw, DollarSign
} from 'lucide-react';
import {
    SmartSwapState,
    SmartSwapAction,
    SmartMatchResult,
    NormalizedToken,
    smartSwapReducer,
    initialState,
    sanitizeAndNormalize,
    smartMatch,
} from '@/lib/smart-swap-v1/machine';

const SOL_MINT = 'So11111111111111111111111111111111111111112';
const TOKENS_API = '/api/smart-swap/tokens';

export default function SmartSwapPage() {
    const router = useRouter();

    // STATE MACHINE
    const [state, dispatch] = useReducer(smartSwapReducer, initialState);

    // Form inputs (separate from state machine)
    const [investAmount, setInvestAmount] = useState<string>('1');
    const [targetAmount, setTargetAmount] = useState<string>('1.5');
    const [searchQuery, setSearchQuery] = useState<string>('');

    // Load tokens on mount
    useEffect(() => {
        loadTokens();
    }, []);

    const loadTokens = async () => {
        dispatch({ type: 'LOAD_TOKENS' });

        try {
            const res = await fetch(TOKENS_API);
            const data = await res.json();

            // SANITIZE at the gate - bad tokens never enter
            const rawTokens = data.tokens || [];
            const clean = sanitizeAndNormalize(
                rawTokens.filter((t: any) => t?.address !== SOL_MINT)
            );

            console.log(`[Smart Swap] Loaded ${clean.length} clean tokens from ${rawTokens.length} raw`);

            dispatch({ type: 'TOKENS_LOADED', tokens: clean });
        } catch (err: any) {
            console.error('[Smart Swap] Failed to load tokens:', err);
            dispatch({ type: 'ERROR', message: 'Failed to load tokens. Please refresh.' });
        }
    };

    const onFindMatch = () => {
        if (state.status !== 'ready') return;

        const invest = parseFloat(investAmount) || 0;
        const target = parseFloat(targetAmount) || 0;

        if (invest <= 0) {
            dispatch({ type: 'ERROR', message: 'Please enter a valid investment amount' });
            return;
        }
        if (target <= invest) {
            dispatch({ type: 'ERROR', message: 'Target must be greater than investment' });
            return;
        }

        dispatch({ type: 'FIND_MATCH' });

        // Apply search filter (tokens are already sanitized)
        let tokens = state.tokens;
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            tokens = state.tokens.filter(t =>
                t.symbol.toLowerCase().includes(query) ||
                t.name.toLowerCase().includes(query)
            );
        }

        if (tokens.length === 0) {
            dispatch({ type: 'ERROR', message: 'No tokens match your search' });
            return;
        }

        // Run pure matching function
        const { results, message, difficulty } = smartMatch(tokens, invest, target);

        if (results.length === 0) {
            dispatch({ type: 'ERROR', message: 'No matches found. Try different criteria.' });
            return;
        }

        dispatch({ type: 'MATCH_SUCCESS', results, message, difficulty });
    };

    const handleExecute = (token: SmartMatchResult) => {
        const params = new URLSearchParams({
            tokenOut: token.address,
            amountIn: investAmount,
        });
        router.push(`/?${params.toString()}`);
    };

    const targetMultiplier = (parseFloat(targetAmount) / parseFloat(investAmount)) || 1;

    // Get token count for display
    const tokenCount = state.status === 'ready' || state.status === 'matching' || state.status === 'results'
        ? state.tokens.length
        : 0;

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
                                Intent-based matching • {tokenCount.toLocaleString()} tokens loaded
                            </p>
                        </div>
                    </div>
                </div>

                {/* Input Section - Always visible */}
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
                                    placeholder="1.5"
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

                    {/* Action Button - State Dependent */}
                    {renderButton(state, onFindMatch, loadTokens)}
                </div>

                {/* STATE-BASED RENDERING - CRASH PROOF */}
                {renderContent(state, handleExecute)}
            </div>
        </div>
    );
}

// ============================================================================
// STATE-BASED BUTTON RENDERING
// ============================================================================

function renderButton(
    state: SmartSwapState,
    onFindMatch: () => void,
    onRetry: () => void
) {
    switch (state.status) {
        case 'idle':
        case 'loading_tokens':
            return (
                <button
                    disabled
                    className="w-full px-6 py-4 bg-zinc-700 text-zinc-400 rounded-lg font-mono font-bold text-lg flex items-center justify-center gap-2"
                >
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Loading Tokens...
                </button>
            );

        case 'ready':
            return (
                <button
                    onClick={onFindMatch}
                    className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white rounded-lg font-mono font-bold text-lg transition-all flex items-center justify-center gap-2"
                >
                    <Sparkles className="w-5 h-5" />
                    Find Best Matches
                </button>
            );

        case 'matching':
            return (
                <button
                    disabled
                    className="w-full px-6 py-4 bg-purple-600/50 text-white rounded-lg font-mono font-bold text-lg flex items-center justify-center gap-2"
                >
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Finding Best Matches...
                </button>
            );

        case 'results':
            return (
                <button
                    onClick={onFindMatch}
                    className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white rounded-lg font-mono font-bold text-lg transition-all flex items-center justify-center gap-2"
                >
                    <RefreshCw className="w-5 h-5" />
                    Find New Matches
                </button>
            );

        case 'error':
            return (
                <button
                    onClick={onRetry}
                    className="w-full px-6 py-4 bg-red-600 hover:bg-red-500 text-white rounded-lg font-mono font-bold text-lg transition-all flex items-center justify-center gap-2"
                >
                    <RefreshCw className="w-5 h-5" />
                    Retry
                </button>
            );
    }
}

// ============================================================================
// STATE-BASED CONTENT RENDERING (CRASH PROOF)
// ============================================================================

function renderContent(
    state: SmartSwapState,
    handleExecute: (token: SmartMatchResult) => void
) {
    switch (state.status) {
        case 'idle':
        case 'loading_tokens':
            return (
                <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-xl p-12 text-center">
                    <Loader2 className="w-12 h-12 text-purple-400 mx-auto mb-4 animate-spin" />
                    <p className="text-zinc-500 font-mono text-sm">
                        Loading token universe...
                    </p>
                </div>
            );

        case 'ready':
            return (
                <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-xl p-12 text-center">
                    <Sparkles className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                    <p className="text-zinc-500 font-mono text-sm">
                        Set your investment goal and click &quot;Find Best Matches&quot;
                    </p>
                </div>
            );

        case 'matching':
            return (
                <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-xl p-12 text-center">
                    <Loader2 className="w-12 h-12 text-purple-400 mx-auto mb-4 animate-spin" />
                    <p className="text-zinc-500 font-mono text-sm">
                        Analyzing {state.tokens.length} tokens...
                    </p>
                </div>
            );

        case 'error':
            return (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 font-mono text-sm text-red-400">
                    <AlertTriangle className="w-4 h-4 inline mr-2" />
                    {state.message}
                </div>
            );

        case 'results':
            // SAFE: results are guaranteed valid in this state
            return (
                <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-white font-mono flex items-center gap-2">
                            <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
                            TOP {state.results.length} MATCHES
                        </h2>
                        <span className="text-xs text-zinc-500 font-mono">
                            Difficulty: {(state.difficulty * 100).toFixed(0)}%
                        </span>
                    </div>

                    {/* Message */}
                    <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4 font-mono text-sm text-purple-400">
                        <Sparkles className="w-4 h-4 inline mr-2" />
                        {state.message}
                    </div>

                    {/* Results - SAFE: state.results is guaranteed array of valid tokens */}
                    {state.results.map((token, idx) => (
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
            );
    }
}

// ============================================================================
// MATCH CARD COMPONENT
// ============================================================================

function MatchCard({
    token,
    rank,
    onExecute
}: {
    token: SmartMatchResult;
    rank: number;
    onExecute: () => void;
}) {
    const getRiskColor = (warning: string) => {
        if (warning.includes('Low')) return 'text-red-400 border-red-500/30 bg-red-500/10';
        if (warning.includes('Moderate')) return 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10';
        return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
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
                            <span className={`px-2 py-0.5 rounded text-xs font-mono border ${getRiskColor(token.liquidityWarning)}`}>
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
