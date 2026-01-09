/**
 * Smart Swap Engine V3 - Production Architecture
 *
 * 3-PHASE APPROACH:
 * PHASE 1: Get Jupiter token list, filter locally (NO quotes)
 * PHASE 2: Price-based estimation (covers 100s of tokens instantly)
 * PHASE 3: Real Jupiter quotes (ONLY top 10-15 candidates)
 *
 * This is how real aggregators work.
 */

import {
    RiskMode,
    SwapRecommendation,
    SmartSwapRequest,
    SmartSwapResponse,
    RISK_MODE_CONFIG,
} from './types';

const JUPITER_TOKEN_API = 'https://token.jup.ag/strict'; // Verified tokens only
const JUPITER_PRICE_API = 'https://price.jup.ag/v6/price';
const JUPITER_QUOTE_API = 'https://quote-api.jup.ag/v6/quote';
const SOL_MINT = 'So11111111111111111111111111111111111111112';

// Cache for token list (refresh every 5 minutes)
let tokenListCache: any[] = [];
let tokenListCacheTime = 0;
const TOKEN_LIST_CACHE_DURATION = 5 * 60 * 1000;

// =============================================================================
// PHASE 1: Get Token Universe (FAST, NO QUOTES)
// =============================================================================

interface TokenInfo {
    address: string;
    symbol: string;
    name: string;
    decimals: number;
    logoURI?: string;
    daily_volume?: number;
    // Price will be fetched in Phase 2
    price?: number;
}

async function getTokenUniverse(): Promise<TokenInfo[]> {
    const now = Date.now();

    // Use cache if fresh
    if (tokenListCache.length > 0 && now - tokenListCacheTime < TOKEN_LIST_CACHE_DURATION) {
        console.log(`[Smart Swap] Using cached token list (${tokenListCache.length} tokens)`);
        return tokenListCache;
    }

    try {
        console.log('[Smart Swap] Fetching Jupiter token list...');
        const response = await fetch(JUPITER_TOKEN_API, {
            headers: { 'Accept': 'application/json' },
        });

        if (!response.ok) {
            console.error('[Smart Swap] Failed to fetch token list:', response.status);
            return [];
        }

        const tokens = await response.json();
        console.log(`[Smart Swap] Got ${tokens.length} tokens from Jupiter`);

        // Filter to tradeable tokens (skip weird ones)
        const filtered = tokens.filter((t: any) =>
            t.address &&
            t.symbol &&
            t.decimals <= 18 &&
            t.address !== SOL_MINT // Skip SOL itself
        ).map((t: any) => ({
            address: t.address,
            symbol: t.symbol,
            name: t.name || t.symbol,
            decimals: t.decimals,
            logoURI: t.logoURI,
        }));

        // Cache it
        tokenListCache = filtered;
        tokenListCacheTime = now;

        console.log(`[Smart Swap] Filtered to ${filtered.length} tradeable tokens`);
        return filtered;
    } catch (error) {
        console.error('[Smart Swap] Token list fetch error:', error);
        return [];
    }
}

// =============================================================================
// PHASE 2: Price-Based Estimation (CHEAP, INSTANT)
// =============================================================================

interface EstimatedCandidate {
    token: TokenInfo;
    price: number;
    estimatedOut: number;
    estimatedUsd: number;
}

async function getTokenPrices(mints: string[]): Promise<Map<string, number>> {
    const prices = new Map<string, number>();

    try {
        // Jupiter price API accepts comma-separated IDs
        // Batch in chunks of 100
        const chunks = [];
        for (let i = 0; i < mints.length; i += 100) {
            chunks.push(mints.slice(i, i + 100));
        }

        for (const chunk of chunks) {
            const ids = chunk.join(',');
            const response = await fetch(`${JUPITER_PRICE_API}?ids=${ids}`);

            if (response.ok) {
                const data = await response.json();
                for (const [mint, info] of Object.entries(data.data || {})) {
                    prices.set(mint, (info as any).price || 0);
                }
            }
        }

        console.log(`[Smart Swap] Got prices for ${prices.size} tokens`);
    } catch (error) {
        console.error('[Smart Swap] Price fetch error:', error);
    }

    return prices;
}

async function estimateCandidates(
    tokens: TokenInfo[],
    inputValueUsd: number,
    riskMode: RiskMode
): Promise<EstimatedCandidate[]> {
    console.log(`[Smart Swap] Estimating ${tokens.length} tokens...`);

    // Get prices for all tokens
    const mints = tokens.map(t => t.address);
    const prices = await getTokenPrices(mints);

    const candidates: EstimatedCandidate[] = [];

    for (const token of tokens) {
        const price = prices.get(token.address);
        if (!price || price <= 0) continue; // Skip tokens without price

        // Estimate output
        const estimatedOut = inputValueUsd / price;
        const estimatedUsd = estimatedOut * price; // Should equal inputValueUsd

        candidates.push({
            token,
            price,
            estimatedOut,
            estimatedUsd,
        });
    }

    // Sort by estimated output (most tokens first - for memecoins etc)
    candidates.sort((a, b) => b.estimatedOut - a.estimatedOut);

    console.log(`[Smart Swap] ${candidates.length} tokens with valid prices`);
    return candidates;
}

// =============================================================================
// PHASE 3: Real Quotes (ONLY TOP CANDIDATES)
// =============================================================================

async function getJupiterQuote(
    inputMint: string,
    outputMint: string,
    amountInLamports: string
): Promise<any> {
    try {
        const url = `${JUPITER_QUOTE_API}?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amountInLamports}&slippageBps=50`;

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3000); // 3s timeout

        const response = await fetch(url, {
            headers: { 'Accept': 'application/json' },
            signal: controller.signal,
        });

        clearTimeout(timeout);

        if (!response.ok) return null;
        return await response.json();
    } catch (error) {
        return null;
    }
}

async function quoteTopCandidates(
    candidates: EstimatedCandidate[],
    inputMint: string,
    amountInLamports: string,
    limit: number = 15
): Promise<SwapRecommendation[]> {
    const topCandidates = candidates.slice(0, limit);
    console.log(`[Smart Swap] Quoting top ${topCandidates.length} candidates...`);

    const recommendations: SwapRecommendation[] = [];

    // Quote in parallel (Promise.allSettled to handle failures)
    const quotePromises = topCandidates.map(async (candidate) => {
        const quote = await getJupiterQuote(inputMint, candidate.token.address, amountInLamports);
        return { candidate, quote };
    });

    const results = await Promise.allSettled(quotePromises);

    for (const result of results) {
        if (result.status !== 'fulfilled') continue;

        const { candidate, quote } = result.value;

        let outAmount: number;
        let priceImpact: number;
        let hasRealQuote: boolean;

        if (quote && quote.outAmount) {
            // Real quote
            outAmount = Number(quote.outAmount) / Math.pow(10, candidate.token.decimals);
            priceImpact = parseFloat(quote.priceImpactPct || '0');
            hasRealQuote = true;
        } else {
            // Fallback to estimate
            outAmount = candidate.estimatedOut;
            priceImpact = 0.1;
            hasRealQuote = false;
        }

        const outputValueUsd = outAmount * candidate.price;

        // Risk level based on price impact
        let riskLevel: 'low' | 'medium' | 'high' = 'low';
        if (Math.abs(priceImpact) > 2) riskLevel = 'high';
        else if (Math.abs(priceImpact) > 0.5) riskLevel = 'medium';

        // Score: lower price impact = higher score
        const smartSwapScore = Math.round(100 - Math.abs(priceImpact) * 15);

        recommendations.push({
            tokenOut: {
                mint: candidate.token.address,
                symbol: candidate.token.symbol,
                name: candidate.token.name,
                decimals: candidate.token.decimals,
                logoURI: candidate.token.logoURI,
            },
            estimatedAmountOut: outAmount,
            estimatedSlippage: Math.abs(priceImpact),
            liquidityScore: hasRealQuote ? 90 : 70,
            riskLevel,
            riskScore: hasRealQuote ? (100 - Math.abs(priceImpact) * 10) : 75,
            smartSwapScore: hasRealQuote ? smartSwapScore : 65,
            explanation: hasRealQuote
                ? `Receive ~${outAmount.toLocaleString(undefined, { maximumFractionDigits: 4 })} ${candidate.token.symbol} ($${outputValueUsd.toFixed(2)}) • ${priceImpact.toFixed(2)}% impact`
                : `Est. ~${outAmount.toLocaleString(undefined, { maximumFractionDigits: 4 })} ${candidate.token.symbol} ($${outputValueUsd.toFixed(2)}) • final amount depends on liquidity`,
            priceImpact,
        });
    }

    // Sort by smart score (real quotes first, then by score)
    recommendations.sort((a, b) => {
        // Prioritize real quotes
        const aReal = a.liquidityScore >= 90 ? 1 : 0;
        const bReal = b.liquidityScore >= 90 ? 1 : 0;
        if (aReal !== bReal) return bReal - aReal;
        return b.smartSwapScore - a.smartSwapScore;
    });

    return recommendations;
}

// =============================================================================
// MAIN: Generate Recommendations (3-Phase)
// =============================================================================

export async function generateRecommendations(
    request: SmartSwapRequest
): Promise<SmartSwapResponse> {
    const { amountIn, tokenInMint, riskMode } = request;
    const startTime = Date.now();

    console.log(`[Smart Swap V3] Starting 3-phase analysis for ${amountIn} SOL`);

    // Convert SOL to lamports
    const amountInLamports = Math.floor(amountIn * 1e9).toString();

    // Get SOL price first
    const solPrices = await getTokenPrices([SOL_MINT]);
    const solPrice = solPrices.get(SOL_MINT) || 180; // Fallback
    const inputValueUsd = amountIn * solPrice;

    console.log(`[Smart Swap V3] SOL price: $${solPrice}, Input: $${inputValueUsd.toFixed(2)}`);

    // PHASE 1: Get token universe
    const allTokens = await getTokenUniverse();
    if (allTokens.length === 0) {
        console.error('[Smart Swap V3] No tokens available');
        return { recommendations: [], timestamp: Date.now(), riskMode };
    }

    // PHASE 2: Estimate all tokens (fast)
    const candidates = await estimateCandidates(allTokens, inputValueUsd, riskMode);
    if (candidates.length === 0) {
        console.error('[Smart Swap V3] No candidates with prices');
        return { recommendations: [], timestamp: Date.now(), riskMode };
    }

    // PHASE 3: Quote top candidates
    const recommendations = await quoteTopCandidates(
        candidates,
        tokenInMint,
        amountInLamports,
        15 // Quote top 15
    );

    const elapsed = Date.now() - startTime;
    console.log(`[Smart Swap V3] Complete: ${recommendations.length} recommendations in ${elapsed}ms`);
    console.log(`[Smart Swap V3] Scanned ${allTokens.length} tokens, priced ${candidates.length}, quoted ${Math.min(15, candidates.length)}`);

    return {
        recommendations: recommendations.slice(0, 6), // Show top 6
        timestamp: Date.now(),
        riskMode,
    };
}

// Re-export types
export * from './types';
