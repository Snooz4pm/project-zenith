'use client';

/**
 * Smart Swap Page - NUCLEAR SAFE VERSION
 * 
 * RULES (NON-NEGOTIABLE):
 * - NO .address in JSX
 * - NO assumptions about token shape
 * - INDEX keys only
 * - Logos disabled
 * - All data through nukeArray
 */

import { useReducer, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Sparkles, TrendingUp, AlertTriangle, ArrowRight,
    Loader2, Search, RefreshCw, DollarSign
} from 'lucide-react';
import { nukeArray, safeString, safeNumber, safeArray } from '@/lib/nuclear';
import {
    SmartSwapState,
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

    // Form inputs
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

            // NUCLEAR: Force through sanitizer
            const rawTokens = nukeArray(data?.tokens);
            const filtered = rawTokens.filter((t: any) => safeString(t, 'address') !== SOL_MINT);
            const clean = sanitizeAndNormalize(filtered);

            console.log(`[Smart Swap] Loaded ${clean.length} clean tokens`);

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

        // Apply search filter
        let tokens = state.tokens;
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            tokens = state.tokens.filter(t => {
                const symbol = safeString(t, 'symbol').toLowerCase();
                const name = safeString(t, 'name').toLowerCase();
                return symbol.includes(query) || name.includes(query);
            });
        }

        if (tokens.length === 0) {
            dispatch({ type: 'ERROR', message: 'No tokens match your search' });
            return;
        }

        const { results, message, difficulty } = smartMatch(tokens, invest, target);

        if (results.length === 0) {
            dispatch({ type: 'ERROR', message: 'No matches found. Try different criteria.' });
            return;
        }

        dispatch({ type: 'MATCH_SUCCESS', results, message, difficulty });
    };

    const handleExecute = (token: any) => {
        // SAFE: Use safeString, not direct access
        const addr = safeString(token, 'address');
        if (!addr) return;

        const params = new URLSearchParams({
            tokenOut: addr,
            amountIn: investAmount,
        });
        router.push(`/?${params.toString()}`);
    };

    const targetMultiplier = (parseFloat(targetAmount) / parseFloat(investAmount)) || 1;

    // Get token count safely
    const tokenCount = (state.status === 'ready' || state.status === 'matching' || state.status === 'results')
        ? state.tokens?.length ?? 0
        : 0;

    // NUCLEAR: Force results through nukeArray before render
    const safeResults = state.status === 'results' ? nukeArray(state.results) : [];

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
                                Intent-based matching • {tokenCount.toLocaleString()} tokens
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
                                    placeholder="1.5"
                                />
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 font-mono">
                                    SOL
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Multiplier */}
                    <div className="flex items-center justify-center gap-4 py-3 bg-black/30 rounded-lg mb-6">
                        <span className="text-zinc-500 font-mono text-sm">Target:</span>
                        <span className={`text-2xl font-bold font-mono ${targetMultiplier > 2 ? 'text-red-400' :
                                targetMultiplier > 1.5 ? 'text-yellow-400' : 'text-emerald-400'
                            }`}>
                            {targetMultiplier.toFixed(2)}x
                        </span>
                    </div>

                    {/* Search */}
                    <div className="relative mb-6">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search tokens..."
                            className="w-full bg-black/50 border border-zinc-700 rounded-lg pl-10 pr-4 py-2 text-white font-mono text-sm focus:outline-none focus:border-purple-500"
                        />
                    </div>

                    {/* Button */}
                    <RenderButton state={state} onFindMatch={onFindMatch} onRetry={loadTokens} />
                </div>

                {/* Content */}
                <RenderContent
                    state={state}
                    safeResults={safeResults}
                    handleExecute={handleExecute}
                />
            </div>
        </div>
    );
}

// ============================================================================
// BUTTON COMPONENT
// ============================================================================

function RenderButton({ state, onFindMatch, onRetry }: {
    state: SmartSwapState;
    onFindMatch: () => void;
    onRetry: () => void;
}) {
    if (state.status === 'idle' || state.status === 'loading_tokens') {
        return (
            <button disabled className="w-full px-6 py-4 bg-zinc-700 text-zinc-400 rounded-lg font-mono font-bold text-lg flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                Loading Tokens...
            </button>
        );
    }

    if (state.status === 'matching') {
        return (
            <button disabled className="w-full px-6 py-4 bg-purple-600/50 text-white rounded-lg font-mono font-bold text-lg flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                Finding Matches...
            </button>
        );
    }

    if (state.status === 'error') {
        return (
            <button onClick={onRetry} className="w-full px-6 py-4 bg-red-600 hover:bg-red-500 text-white rounded-lg font-mono font-bold text-lg flex items-center justify-center gap-2">
                <RefreshCw className="w-5 h-5" />
                Retry
            </button>
        );
    }

    return (
        <button onClick={onFindMatch} className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white rounded-lg font-mono font-bold text-lg transition-all flex items-center justify-center gap-2">
            <Sparkles className="w-5 h-5" />
            {state.status === 'results' ? 'Find New Matches' : 'Find Best Matches'}
        </button>
    );
}

// ============================================================================
// CONTENT COMPONENT
// ============================================================================

function RenderContent({ state, safeResults, handleExecute }: {
    state: SmartSwapState;
    safeResults: any[];
    handleExecute: (token: any) => void;
}) {
    if (state.status === 'idle' || state.status === 'loading_tokens') {
        return (
            <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-xl p-12 text-center">
                <Loader2 className="w-12 h-12 text-purple-400 mx-auto mb-4 animate-spin" />
                <p className="text-zinc-500 font-mono text-sm">Loading token universe...</p>
            </div>
        );
    }

    if (state.status === 'ready') {
        return (
            <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-xl p-12 text-center">
                <Sparkles className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                <p className="text-zinc-500 font-mono text-sm">Click &quot;Find Best Matches&quot; to start</p>
            </div>
        );
    }

    if (state.status === 'matching') {
        return (
            <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-xl p-12 text-center">
                <Loader2 className="w-12 h-12 text-purple-400 mx-auto mb-4 animate-spin" />
                <p className="text-zinc-500 font-mono text-sm">Analyzing tokens...</p>
            </div>
        );
    }

    if (state.status === 'error') {
        return (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 font-mono text-sm text-red-400">
                <AlertTriangle className="w-4 h-4 inline mr-2" />
                {state.message}
            </div>
        );
    }

    // RESULTS - Use safeResults (already nuked), INDEX KEYS
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white font-mono flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
                    TOP {safeResults.length} MATCHES
                </h2>
                <span className="text-xs text-zinc-500 font-mono">
                    Difficulty: {(safeNumber(state, 'difficulty') * 100).toFixed(0)}%
                </span>
            </div>

            {state.status === 'results' && state.message && (
                <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4 font-mono text-sm text-purple-400">
                    <Sparkles className="w-4 h-4 inline mr-2" />
                    {state.message}
                </div>
            )}

            {/* NUCLEAR: INDEX KEYS, NO .address */}
            {safeResults.map((token, i) => (
                <TokenCard key={i} token={token} rank={i + 1} onExecute={() => handleExecute(token)} />
            ))}

            <div className="bg-amber-900/10 border border-amber-500/20 rounded-lg p-4 font-mono text-xs text-amber-400/80 mt-6">
                <strong>Disclaimer:</strong> Crypto is volatile. Always DYOR.
            </div>
        </div>
    );
}

// ============================================================================
// TOKEN CARD - NUCLEAR SAFE
// ============================================================================

function TokenCard({ token, rank, onExecute }: { token: any; rank: number; onExecute: () => void }) {
    // NUCLEAR: Validate token is object
    if (!token || typeof token !== 'object') return null;

    // SAFE: Use safeString/safeNumber, NEVER direct access
    const symbol = safeString(token, 'symbol', 'UNKNOWN');
    const name = safeString(token, 'name', 'Unknown Token');
    const matchPct = safeNumber(token, 'matchPercentage', 0);
    const contextLabel = safeString(token, 'contextLabel', '');
    const liquidityWarning = safeString(token, 'liquidityWarning', 'Unknown');
    const whyReasons = safeArray<string>(token, 'whyReasons');

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

                    {/* NO LOGO - disabled for stability */}

                    {/* Token Info */}
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-lg font-bold text-white font-mono">{symbol}</h3>
                            <span className={`px-2 py-0.5 rounded text-xs font-mono border ${getRiskColor(liquidityWarning)}`}>
                                {liquidityWarning}
                            </span>
                        </div>
                        <p className="text-xs text-zinc-500 font-mono">{name}</p>
                    </div>
                </div>

                {/* Match Score */}
                <div className="text-right">
                    <div className="text-xs text-zinc-500 font-mono">Match</div>
                    <div className="text-2xl font-bold text-purple-400 font-mono">
                        {matchPct}%
                    </div>
                </div>
            </div>

            {/* Why Reasons */}
            {whyReasons.length > 0 && (
                <div className="bg-black/30 rounded-lg p-3 mb-4">
                    <p className="text-xs text-zinc-500 font-mono mb-2">Why this token:</p>
                    <ul className="space-y-1">
                        {whyReasons.map((reason, i) => (
                            <li key={i} className="text-sm text-zinc-400 font-mono flex items-start gap-2">
                                <span className="text-purple-400">•</span>
                                {reason}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Context */}
            {contextLabel && (
                <div className="text-xs text-zinc-500 font-mono mb-4">{contextLabel}</div>
            )}

            {/* Execute */}
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
