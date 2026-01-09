/**
 * Smart Swap Engine V2
 *
 * SIMPLIFIED APPROACH:
 * 1. Get popular tokens from Jupiter
 * 2. Get quotes for each token
 * 3. Calculate estimated returns
 * 4. Return sorted by best value
 *
 * NO hard filters - let users decide based on data
 */

import {
    RiskMode,
    TokenCandidate,
    SwapRecommendation,
    SmartSwapRequest,
    SmartSwapResponse,
    RISK_MODE_CONFIG,
} from './types';

const JUPITER_QUOTE_API = 'https://quote-api.jup.ag/v6';
const JUPITER_TOKEN_API = 'https://token.jup.ag';
const SOL_MINT = 'So11111111111111111111111111111111111111112';

// Popular tokens to scan (always included)
const POPULAR_TOKENS = [
    { mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', symbol: 'USDC', name: 'USD Coin', decimals: 6 },
    { mint: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', symbol: 'USDT', name: 'Tether USD', decimals: 6 },
    { mint: 'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So', symbol: 'mSOL', name: 'Marinade SOL', decimals: 9 },
    { mint: 'J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn', symbol: 'JitoSOL', name: 'Jito SOL', decimals: 9 },
    { mint: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', symbol: 'BONK', name: 'Bonk', decimals: 5 },
    { mint: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN', symbol: 'JUP', name: 'Jupiter', decimals: 6 },
    { mint: 'rndrizKT3MK1iimdxRdWabcF7Zg7AR5T4nud4EkHBof', symbol: 'RNDR', name: 'Render', decimals: 8 },
    { mint: 'HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3', symbol: 'PYTH', name: 'Pyth Network', decimals: 6 },
    { mint: '7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs', symbol: 'WIF', name: 'dogwifhat', decimals: 6 },
    { mint: 'hntyVP6YFm1Hg25TN9WGLqM12b8TQmcknKrdu1oxWux', symbol: 'HNT', name: 'Helium', decimals: 8 },
    { mint: 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm', symbol: 'WEN', name: 'WEN', decimals: 5 },
    { mint: 'MEW1gQWJ3nEXg2qgERiKu7FAFj79PHvQVREQUzScPP5', symbol: 'MEW', name: 'cat in a dogs world', decimals: 5 },
];

/**
 * Get Jupiter quote for a token pair
 */
async function getJupiterQuote(
    inputMint: string,
    outputMint: string,
    amountInLamports: string
): Promise<any> {
    try {
        const url = `${JUPITER_QUOTE_API}/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amountInLamports}&slippageBps=50`;

        const response = await fetch(url, {
            headers: { 'Accept': 'application/json' },
        });

        if (!response.ok) return null;
        return await response.json();
    } catch (error) {
        console.warn(`[Smart Swap] Quote failed for ${outputMint}`);
        return null;
    }
}

/**
 * Get token price in USD from Jupiter
 */
async function getTokenPrice(mint: string): Promise<number> {
    try {
        const response = await fetch(`https://price.jup.ag/v6/price?ids=${mint}`);
        if (!response.ok) return 0;
        const data = await response.json();
        return data.data?.[mint]?.price || 0;
    } catch {
        return 0;
    }
}

/**
 * Main: Generate Recommendations using Jupiter
 */
export async function generateRecommendations(
    request: SmartSwapRequest
): Promise<SmartSwapResponse> {
    const { amountIn, tokenInMint, riskMode } = request;
    const config = RISK_MODE_CONFIG[riskMode];
    const startTime = Date.now();

    console.log(`[Smart Swap] Analyzing ${amountIn} SOL in ${riskMode} mode`);

    // Convert SOL to lamports (9 decimals)
    const amountInLamports = Math.floor(amountIn * 1e9).toString();
    console.log(`[Smart Swap] Amount in lamports: ${amountInLamports}`);

    // Get SOL price for USD calculations
    const solPrice = await getTokenPrice(SOL_MINT);
    const inputValueUsd = amountIn * solPrice;
    console.log(`[Smart Swap] SOL price: $${solPrice}, Input value: $${inputValueUsd.toFixed(2)}`);

    const recommendations: SwapRecommendation[] = [];

    // Process each popular token
    for (const token of POPULAR_TOKENS) {
        try {
            // Skip SOL
            if (token.mint === tokenInMint) continue;

            // Get Jupiter quote
            const quote = await getJupiterQuote(tokenInMint, token.mint, amountInLamports);
            if (!quote || !quote.outAmount) {
                console.log(`[Smart Swap] No quote for ${token.symbol}`);
                continue;
            }

            // Parse output amount
            const outAmount = Number(quote.outAmount) / Math.pow(10, token.decimals);
            const priceImpact = parseFloat(quote.priceImpactPct || '0');

            // Get token price to calculate USD value
            const tokenPrice = await getTokenPrice(token.mint);
            const outputValueUsd = outAmount * tokenPrice;

            // Calculate estimated return percentage
            const estimatedReturn = inputValueUsd > 0
                ? ((outputValueUsd - inputValueUsd) / inputValueUsd) * 100
                : 0;

            // Determine risk level based on price impact
            let riskLevel: 'low' | 'medium' | 'high' = 'low';
            if (Math.abs(priceImpact) > 2) riskLevel = 'high';
            else if (Math.abs(priceImpact) > 0.5) riskLevel = 'medium';

            // Calculate simple smart score (higher = better)
            const smartSwapScore = Math.round(
                Math.max(0, 100 - Math.abs(priceImpact) * 20) // Lower price impact = higher score
            );

            console.log(`[Smart Swap] ${token.symbol}: ${outAmount.toFixed(4)} tokens ($${outputValueUsd.toFixed(2)}), impact: ${priceImpact.toFixed(3)}%`);

            recommendations.push({
                tokenOut: {
                    mint: token.mint,
                    symbol: token.symbol,
                    name: token.name,
                    decimals: token.decimals,
                },
                estimatedAmountOut: outAmount,
                estimatedSlippage: Math.abs(priceImpact),
                liquidityScore: smartSwapScore,
                riskLevel,
                riskScore: 100 - Math.abs(priceImpact) * 10,
                smartSwapScore,
                explanation: `Receive ${outAmount.toFixed(4)} ${token.symbol} (~$${outputValueUsd.toFixed(2)}) with ${priceImpact.toFixed(3)}% price impact.`,
                priceImpact,
            });
        } catch (error) {
            console.warn(`[Smart Swap] Error processing ${token.symbol}:`, error);
        }
    }

    // Sort by smart score (best first)
    recommendations.sort((a, b) => b.smartSwapScore - a.smartSwapScore);

    console.log(`[Smart Swap] Generated ${recommendations.length} recommendations in ${Date.now() - startTime}ms`);

    return {
        recommendations: recommendations.slice(0, 6), // Top 6
        timestamp: Date.now(),
        riskMode,
    };
}

// Re-export types
export * from './types';
