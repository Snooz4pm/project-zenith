/**
 * Smart Swap Engine - Uses Same Logic as /swap
 *
 * APPROACH:
 * - Uses Railway proxy for quotes (same as existing swap)
 * - Curated list of popular tokens
 * - Risk mode filtering by category
 */

import {
    RiskMode,
    SwapRecommendation,
    SmartSwapRequest,
    SmartSwapResponse,
} from './types';
import { fetchQuote } from '@/lib/swap/execution';

const SOL_MINT = 'So11111111111111111111111111111111111111112';

// ============================================================================
// CURATED TOKEN LIST
// ============================================================================

interface TokenData {
    mint: string;
    symbol: string;
    name: string;
    decimals: number;
    category: 'stablecoin' | 'liquid-staking' | 'defi' | 'memecoin' | 'utility';
}

const CURATED_TOKENS: TokenData[] = [
    // Stablecoins
    { mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', symbol: 'USDC', name: 'USD Coin', decimals: 6, category: 'stablecoin' },
    { mint: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', symbol: 'USDT', name: 'Tether USD', decimals: 6, category: 'stablecoin' },

    // Liquid Staking
    { mint: 'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So', symbol: 'mSOL', name: 'Marinade SOL', decimals: 9, category: 'liquid-staking' },
    { mint: 'J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn', symbol: 'JitoSOL', name: 'Jito SOL', decimals: 9, category: 'liquid-staking' },
    { mint: 'bSo13r4TkiE4KumL71LsHTPpL2euBYLFx6h9HP3piy1', symbol: 'bSOL', name: 'BlazeStake SOL', decimals: 9, category: 'liquid-staking' },

    // DeFi
    { mint: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN', symbol: 'JUP', name: 'Jupiter', decimals: 6, category: 'defi' },
    { mint: 'RaydiumuX7bNEPbxCnKXGEHiZdLx2qQf7K5dHQ4LxQv', symbol: 'RAY', name: 'Raydium', decimals: 6, category: 'defi' },
    { mint: 'orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE', symbol: 'ORCA', name: 'Orca', decimals: 6, category: 'defi' },

    // Memecoins
    { mint: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', symbol: 'BONK', name: 'Bonk', decimals: 5, category: 'memecoin' },
    { mint: '7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs', symbol: 'WIF', name: 'dogwifhat', decimals: 6, category: 'memecoin' },
    { mint: 'MEW1gQWJ3nEXg2qgERiKu7FAFj79PHvQVREQUzScPP5', symbol: 'MEW', name: 'cat in a dogs world', decimals: 5, category: 'memecoin' },
    { mint: 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm', symbol: 'WEN', name: 'WEN', decimals: 5, category: 'memecoin' },

    // Utility
    { mint: 'HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3', symbol: 'PYTH', name: 'Pyth Network', decimals: 6, category: 'utility' },
    { mint: 'rndrizKT3MK1iimdxRdWabcF7Zg7AR5T4nud4EkHBof', symbol: 'RNDR', name: 'Render', decimals: 8, category: 'utility' },
];

// ============================================================================
// MAIN: Generate Recommendations using same quote logic as /swap
// ============================================================================

export async function generateRecommendations(
    request: SmartSwapRequest
): Promise<SmartSwapResponse> {
    const { amountIn, tokenInMint, riskMode } = request;

    console.log(`[Smart Swap] Generating for ${amountIn} SOL, mode: ${riskMode}`);

    // Convert SOL to lamports (same as useSwap)
    const amountInLamports = Math.floor(amountIn * 1e9).toString();

    // Filter tokens based on risk mode
    let tokensToQuote: TokenData[];

    if (riskMode === 'safe') {
        tokensToQuote = CURATED_TOKENS.filter(t =>
            t.category === 'stablecoin' ||
            t.category === 'liquid-staking' ||
            t.category === 'defi'
        );
    } else if (riskMode === 'degenerate') {
        tokensToQuote = CURATED_TOKENS.filter(t =>
            t.category === 'memecoin' ||
            t.category === 'utility'
        );
    } else {
        tokensToQuote = CURATED_TOKENS;
    }

    console.log(`[Smart Swap] Quoting ${tokensToQuote.length} tokens`);

    // Quote each token using the same fetchQuote as existing swap
    const recommendations: SwapRecommendation[] = [];

    // Process quotes in parallel (same pattern as existing swap)
    const quotePromises = tokensToQuote.map(async (token) => {
        try {
            const quote = await fetchQuote({
                inputMint: tokenInMint,
                outputMint: token.mint,
                amount: amountInLamports,
                slippageBps: 50 // 0.5%
            });

            if (quote && quote.outAmount) {
                const outAmount = Number(quote.outAmount) / Math.pow(10, token.decimals);
                const priceImpact = parseFloat(quote.priceImpactPct || '0') * 100;

                // Risk level based on price impact
                let riskLevel: 'low' | 'medium' | 'high' = 'low';
                if (Math.abs(priceImpact) > 2) riskLevel = 'high';
                else if (Math.abs(priceImpact) > 0.5) riskLevel = 'medium';

                // Score
                const smartSwapScore = Math.round(100 - Math.abs(priceImpact) * 10);

                console.log(`[Smart Swap] ${token.symbol}: ${outAmount.toFixed(4)}, impact: ${priceImpact.toFixed(2)}%`);

                return {
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
                    riskScore: smartSwapScore,
                    smartSwapScore,
                    explanation: `~${outAmount.toLocaleString(undefined, { maximumFractionDigits: 4 })} ${token.symbol} • ${priceImpact.toFixed(2)}% impact • ${token.category}`,
                    priceImpact,
                } as SwapRecommendation;
            }
            return null;
        } catch (error) {
            console.log(`[Smart Swap] Quote failed for ${token.symbol}:`, error);
            return null;
        }
    });

    const results = await Promise.all(quotePromises);

    // Filter out nulls and add to recommendations
    for (const result of results) {
        if (result) {
            recommendations.push(result);
        }
    }

    // Sort by score (lowest price impact first)
    recommendations.sort((a, b) => b.smartSwapScore - a.smartSwapScore);

    console.log(`[Smart Swap] Returning ${recommendations.length} recommendations`);

    return {
        recommendations,
        timestamp: Date.now(),
        riskMode,
    };
}

// Re-export types
export * from './types';
