/**
 * Smart Swap Engine
 *
 * CRITICAL: This is a RECOMMENDATION ENGINE ONLY
 * - Does NOT execute swaps
 * - Does NOT sign transactions
 * - Does NOT interact with wallets
 * - Only provides analysis and suggestions
 *
 * Execution is handled by the existing swap component
 */

import {
    RiskMode,
    TokenCandidate,
    TokenMetrics,
    RiskAssessment,
    SwapRecommendation,
    SmartSwapRequest,
    SmartSwapResponse,
    RISK_MODE_CONFIG,
} from './types';

const JUPITER_QUOTE_API = 'https://quote-api.jup.ag/v6';
const DEXSCREENER_API = 'https://api.dexscreener.com/latest/dex';
const SOL_MINT = 'So11111111111111111111111111111111111111112';

/**
 * Step 1: Get Token Candidates
 * Fetches trending tokens from DexScreener with initial filtering
 */
export async function getTokenCandidates(
    riskMode: RiskMode
): Promise<TokenCandidate[]> {
    try {
        const config = RISK_MODE_CONFIG[riskMode];

        // Fetch trending SOL pairs from DexScreener
        const response = await fetch(`${DEXSCREENER_API}/tokens/${SOL_MINT}`);
        if (!response.ok) throw new Error('Failed to fetch token data');

        const data = await response.json();
        const pairs = data.pairs || [];

        // Filter and map to candidates
        const candidates: TokenCandidate[] = pairs
            .filter((pair: any) => {
                // Basic filters
                if (pair.chainId !== 'solana') return false;
                if (!pair.baseToken?.address) return false;
                if (pair.baseToken.address === SOL_MINT) return false;

                // Liquidity filter
                const liquidity = pair.liquidity?.usd || 0;
                if (liquidity < config.minLiquidity) return false;

                // Volume filter
                const volume = pair.volume?.h24 || 0;
                if (volume < config.minVolume24h) return false;

                return true;
            })
            .map((pair: any) => ({
                mint: pair.baseToken.address,
                symbol: pair.baseToken.symbol || 'UNKNOWN',
                name: pair.baseToken.name || 'Unknown Token',
                decimals: 9, // Default for SPL tokens
            }))
            .slice(0, 20); // Top 20 candidates

        return candidates;
    } catch (error) {
        console.error('[Smart Swap] Token candidate selection failed:', error);
        return [];
    }
}

/**
 * Step 2: Get Token Metrics
 * Fetches detailed metrics for each candidate
 */
export async function getTokenMetrics(
    mint: string
): Promise<TokenMetrics | null> {
    try {
        const response = await fetch(`${DEXSCREENER_API}/tokens/${mint}`);
        if (!response.ok) return null;

        const data = await response.json();
        const pair = data.pairs?.[0];

        if (!pair) return null;

        return {
            mint,
            liquidity: pair.liquidity?.usd || 0,
            volume24h: pair.volume?.h24 || 0,
            priceChange24h: pair.priceChange?.h24 || 0,
            marketCap: pair.fdv,
            age: pair.pairCreatedAt
                ? Math.floor((Date.now() - pair.pairCreatedAt) / (1000 * 60 * 60 * 24))
                : undefined,
        };
    } catch (error) {
        console.warn(`[Smart Swap] Failed to fetch metrics for ${mint}`);
        return null;
    }
}

/**
 * Step 3: Risk Assessment
 * Performs basic risk checks (simplified version without RugCheck for MVP)
 */
export async function assessRisk(
    mint: string,
    metrics: TokenMetrics,
    riskMode: RiskMode
): Promise<RiskAssessment> {
    const config = RISK_MODE_CONFIG[riskMode];
    const flags: string[] = [];
    let score = 100;

    // Age check
    if (metrics.age !== undefined && metrics.age < config.minTokenAge) {
        flags.push(`Token is only ${metrics.age} days old`);
        score -= 20;
    }

    // Liquidity check
    if (metrics.liquidity < config.minLiquidity) {
        flags.push('Below minimum liquidity threshold');
        score -= 15;
    }

    // Volume check
    if (metrics.volume24h < config.minVolume24h) {
        flags.push('Low trading volume');
        score -= 10;
    }

    // Price volatility check
    if (Math.abs(metrics.priceChange24h) > 50) {
        flags.push('High price volatility (>50% in 24h)');
        score -= 15;
    }

    return {
        mint,
        score: Math.max(0, Math.min(100, score)),
        flags,
        mintAuthority: false, // Simplified for MVP
        freezeAuthority: false,
        topHolderPercentage: 0,
    };
}

/**
 * Step 4: Get Jupiter Quote
 * USES EXISTING JUPITER QUOTE API - NO CUSTOM EXECUTION
 */
export async function getJupiterQuote(
    inputMint: string,
    outputMint: string,
    amountInLamports: number
): Promise<any> {
    try {
        const url = new URL(`${JUPITER_QUOTE_API}/quote`);
        url.searchParams.append('inputMint', inputMint);
        url.searchParams.append('outputMint', outputMint);
        url.searchParams.append('amount', amountInLamports.toString());
        url.searchParams.append('slippageBps', '50'); // 0.5% slippage

        const response = await fetch(url.toString());
        if (!response.ok) return null;

        return await response.json();
    } catch (error) {
        console.warn(`[Smart Swap] Quote failed for ${outputMint}`);
        return null;
    }
}

/**
 * Step 5: Calculate Smart Swap Score
 * Composite scoring algorithm
 */
export function calculateSmartSwapScore(
    estimatedReturn: number,
    liquidityUsd: number,
    riskScore: number,
    slippage: number,
    momentum: number
): number {
    // Normalize inputs to 0-100 scale
    const returnScore = Math.min(100, Math.max(0, estimatedReturn * 10)); // Assuming <10% return
    const liquidityScore = Math.min(100, (liquidityUsd / 10000000) * 100); // $10M = 100
    const normalizedRiskScore = riskScore; // Already 0-100
    const slippageScore = Math.max(0, 100 - slippage * 100); // Lower slippage is better
    const momentumScore = Math.min(100, Math.max(0, momentum + 50)); // -50% to +50% → 0-100

    // Weighted composite score
    const score =
        returnScore * 0.4 +
        liquidityScore * 0.25 +
        normalizedRiskScore * 0.2 +
        slippageScore * 0.1 +
        momentumScore * 0.05;

    return Math.round(score);
}

/**
 * Main Engine: Generate Smart Swap Recommendations
 */
export async function generateRecommendations(
    request: SmartSwapRequest
): Promise<SmartSwapResponse> {
    const { amountIn, tokenInMint, riskMode } = request;
    const startTime = Date.now();

    console.log(`[Smart Swap] Generating recommendations for ${amountIn} tokens in ${riskMode} mode`);

    // Step 1: Get candidates
    const candidates = await getTokenCandidates(riskMode);
    console.log(`[Smart Swap] Found ${candidates.length} candidates`);

    // Step 2-5: Process each candidate
    const recommendations: SwapRecommendation[] = [];
    const amountInLamports = Math.floor(amountIn * 1e9); // Convert SOL to lamports

    for (const candidate of candidates) {
        try {
            // Get metrics
            const metrics = await getTokenMetrics(candidate.mint);
            if (!metrics) continue;

            // Assess risk
            const risk = await assessRisk(candidate.mint, metrics, riskMode);
            if (risk.score < RISK_MODE_CONFIG[riskMode].minRugCheckScore) {
                console.log(`[Smart Swap] ${candidate.symbol} filtered out - low risk score: ${risk.score}`);
                continue;
            }

            // Get Jupiter quote
            const quote = await getJupiterQuote(tokenInMint, candidate.mint, amountInLamports);
            if (!quote) continue;

            const outAmount = parseInt(quote.outAmount) / Math.pow(10, candidate.decimals);
            const priceImpactPct = parseFloat(quote.priceImpactPct || '0');

            // Calculate composite score
            const smartSwapScore = calculateSmartSwapScore(
                0, // We're not calculating return without price prediction
                metrics.liquidity,
                risk.score,
                Math.abs(priceImpactPct) / 100,
                metrics.priceChange24h
            );

            // Determine risk level
            let riskLevel: 'low' | 'medium' | 'high' = 'medium';
            if (risk.score >= 80) riskLevel = 'low';
            else if (risk.score < 60) riskLevel = 'high';

            // Generate explanation
            const explanation = generateExplanation(
                candidate,
                metrics,
                risk,
                riskLevel
            );

            recommendations.push({
                tokenOut: candidate,
                estimatedAmountOut: outAmount,
                estimatedSlippage: Math.abs(priceImpactPct),
                liquidityScore: Math.min(100, (metrics.liquidity / 10000000) * 100),
                riskLevel,
                riskScore: risk.score,
                smartSwapScore,
                explanation,
                priceImpact: priceImpactPct,
            });
        } catch (error) {
            console.warn(`[Smart Swap] Failed to process ${candidate.symbol}:`, error);
        }
    }

    // Sort by smart swap score and return top 3
    recommendations.sort((a, b) => b.smartSwapScore - a.smartSwapScore);
    const top3 = recommendations.slice(0, 3);

    console.log(`[Smart Swap] Generated ${top3.length} recommendations in ${Date.now() - startTime}ms`);

    return {
        recommendations: top3,
        timestamp: Date.now(),
        riskMode,
    };
}

/**
 * Helper: Generate explanation text
 */
function generateExplanation(
    token: TokenCandidate,
    metrics: TokenMetrics,
    risk: RiskAssessment,
    riskLevel: string
): string {
    const parts: string[] = [];

    // Liquidity
    if (metrics.liquidity > 5000000) {
        parts.push('strong liquidity');
    } else if (metrics.liquidity > 1000000) {
        parts.push('decent liquidity');
    } else {
        parts.push('moderate liquidity');
    }

    // Volume
    if (metrics.volume24h > 500000) {
        parts.push('high trading volume');
    } else if (metrics.volume24h > 100000) {
        parts.push('good trading volume');
    }

    // Momentum
    if (metrics.priceChange24h > 10) {
        parts.push('positive momentum (+' + metrics.priceChange24h.toFixed(1) + '%)');
    } else if (metrics.priceChange24h < -10) {
        parts.push('negative momentum (' + metrics.priceChange24h.toFixed(1) + '%)');
    }

    // Risk flags
    if (risk.flags.length > 0) {
        parts.push(`Note: ${risk.flags[0].toLowerCase()}`);
    }

    return parts.join(', ') + '.';
}
