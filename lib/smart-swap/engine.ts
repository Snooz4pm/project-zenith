/**
 * Smart Swap Engine V2
 *
 * SIMPLIFIED APPROACH - ALWAYS RETURNS RESULTS:
 * 1. Get quotes from Jupiter for popular tokens
 * 2. If quotes fail, show tokens with estimated values
 * 3. Always return at least the popular tokens list
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
const SOL_MINT = 'So11111111111111111111111111111111111111112';

// Popular tokens to scan (always shown)
const POPULAR_TOKENS = [
    { mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', symbol: 'USDC', name: 'USD Coin', decimals: 6, priceUsd: 1.0 },
    { mint: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', symbol: 'USDT', name: 'Tether USD', decimals: 6, priceUsd: 1.0 },
    { mint: 'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So', symbol: 'mSOL', name: 'Marinade SOL', decimals: 9, priceUsd: 185 },
    { mint: 'J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn', symbol: 'JitoSOL', name: 'Jito SOL', decimals: 9, priceUsd: 190 },
    { mint: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', symbol: 'BONK', name: 'Bonk', decimals: 5, priceUsd: 0.00002 },
    { mint: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN', symbol: 'JUP', name: 'Jupiter', decimals: 6, priceUsd: 0.8 },
];

// Fallback SOL price
const FALLBACK_SOL_PRICE = 180;

/**
 * Get Jupiter quote - with timeout and error handling
 */
async function getJupiterQuote(
    inputMint: string,
    outputMint: string,
    amountInLamports: string
): Promise<any> {
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000); // 5s timeout

        const url = `${JUPITER_QUOTE_API}/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amountInLamports}&slippageBps=50`;

        const response = await fetch(url, {
            headers: { 'Accept': 'application/json' },
            signal: controller.signal,
        });

        clearTimeout(timeout);

        if (!response.ok) {
            console.log(`[Smart Swap] Quote API returned ${response.status} for ${outputMint}`);
            return null;
        }

        const data = await response.json();
        return data;
    } catch (error: any) {
        if (error.name === 'AbortError') {
            console.log(`[Smart Swap] Quote timeout for ${outputMint}`);
        } else {
            console.log(`[Smart Swap] Quote error for ${outputMint}:`, error.message);
        }
        return null;
    }
}

/**
 * Main: Generate Recommendations - ALWAYS returns results
 */
export async function generateRecommendations(
    request: SmartSwapRequest
): Promise<SmartSwapResponse> {
    const { amountIn, tokenInMint, riskMode } = request;
    const startTime = Date.now();

    console.log(`[Smart Swap] Analyzing ${amountIn} SOL`);

    // Convert SOL to lamports
    const amountInLamports = Math.floor(amountIn * 1e9).toString();
    const inputValueUsd = amountIn * FALLBACK_SOL_PRICE;

    const recommendations: SwapRecommendation[] = [];

    // Process each token
    for (const token of POPULAR_TOKENS) {
        try {
            // Skip SOL
            if (token.mint === tokenInMint) continue;

            // Try to get Jupiter quote
            const quote = await getJupiterQuote(tokenInMint, token.mint, amountInLamports);

            let outAmount: number;
            let priceImpact: number;
            let hasRealQuote: boolean;

            if (quote && quote.outAmount) {
                // Real quote data
                outAmount = Number(quote.outAmount) / Math.pow(10, token.decimals);
                priceImpact = parseFloat(quote.priceImpactPct || '0');
                hasRealQuote = true;
                console.log(`[Smart Swap] ${token.symbol}: Real quote = ${outAmount.toFixed(4)}`);
            } else {
                // Fallback: estimate based on prices
                outAmount = inputValueUsd / token.priceUsd;
                priceImpact = 0.1; // Assume minimal impact
                hasRealQuote = false;
                console.log(`[Smart Swap] ${token.symbol}: Estimated = ${outAmount.toFixed(4)}`);
            }

            const outputValueUsd = outAmount * token.priceUsd;

            // Determine risk level
            let riskLevel: 'low' | 'medium' | 'high' = 'low';
            if (Math.abs(priceImpact) > 2) riskLevel = 'high';
            else if (Math.abs(priceImpact) > 0.5) riskLevel = 'medium';

            // Score based on price impact
            const smartSwapScore = Math.round(100 - Math.abs(priceImpact) * 20);

            recommendations.push({
                tokenOut: {
                    mint: token.mint,
                    symbol: token.symbol,
                    name: token.name,
                    decimals: token.decimals,
                },
                estimatedAmountOut: outAmount,
                estimatedSlippage: Math.abs(priceImpact),
                liquidityScore: hasRealQuote ? smartSwapScore : 80,
                riskLevel,
                riskScore: hasRealQuote ? 100 - Math.abs(priceImpact) * 10 : 85,
                smartSwapScore: hasRealQuote ? smartSwapScore : 75,
                explanation: hasRealQuote
                    ? `Receive ~${outAmount.toFixed(4)} ${token.symbol} ($${outputValueUsd.toFixed(2)}) with ${priceImpact.toFixed(3)}% impact`
                    : `Estimated ~${outAmount.toFixed(4)} ${token.symbol} ($${outputValueUsd.toFixed(2)})`,
                priceImpact,
            });
        } catch (error) {
            console.warn(`[Smart Swap] Error for ${token.symbol}:`, error);
            // Still add with fallback
            const outAmount = inputValueUsd / token.priceUsd;
            recommendations.push({
                tokenOut: {
                    mint: token.mint,
                    symbol: token.symbol,
                    name: token.name,
                    decimals: token.decimals,
                },
                estimatedAmountOut: outAmount,
                estimatedSlippage: 0.1,
                liquidityScore: 70,
                riskLevel: 'low',
                riskScore: 80,
                smartSwapScore: 70,
                explanation: `Estimated ~${outAmount.toFixed(4)} ${token.symbol}`,
                priceImpact: 0.1,
            });
        }
    }

    // Sort by smart score
    recommendations.sort((a, b) => b.smartSwapScore - a.smartSwapScore);

    console.log(`[Smart Swap] Returning ${recommendations.length} recommendations in ${Date.now() - startTime}ms`);

    return {
        recommendations,
        timestamp: Date.now(),
        riskMode,
    };
}

// Re-export types
export * from './types';
