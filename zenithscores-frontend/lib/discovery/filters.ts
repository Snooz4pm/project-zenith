import { GlobalToken } from './normalize';

/**
 * Liquidity Filters
 * 
 * Production rules for filtering discovered tokens
 */

const MIN_LIQUIDITY_USD = 1_000; // $1,000
const MAX_LIQUIDITY_USD = 1_000_000_000; // $1 billion

/**
 * Check if token passes liquidity filter
 */
export function passesLiquidityFilter(token: GlobalToken): boolean {
    // Must have liquidity data
    if (!token.liquidityUsd || token.liquidityUsd <= 0) {
        return false;
    }

    // Within acceptable range
    if (token.liquidityUsd < MIN_LIQUIDITY_USD) {
        return false;
    }

    if (token.liquidityUsd > MAX_LIQUIDITY_USD) {
        return false;
    }

    return true;
}

/**
 * Filter array of tokens
 */
export function filterTokens(tokens: GlobalToken[]): GlobalToken[] {
    return tokens.filter(passesLiquidityFilter);
}

/**
 * Quality score for ranking
 * Higher is better
 */
export function calculateQualityScore(token: GlobalToken): number {
    let score = 0;

    // Logo presence
    if (token.logo) score += 10;

    // Volume (normalized)
    if (token.volume24h > 100_000) score += 20;
    if (token.volume24h > 1_000_000) score += 30;

    // Liquidity (normalized)
    if (token.liquidityUsd > 50_000) score += 15;
    if (token.liquidityUsd > 500_000) score += 25;

    // Price change (positive momentum)
    if (token.priceChange24h > 0) score += 5;
    if (token.priceChange24h > 10) score += 10;

    return score;
}
