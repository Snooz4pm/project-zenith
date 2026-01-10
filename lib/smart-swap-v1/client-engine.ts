/**
 * Smart Swap V1 - CLIENT-SIDE Intent Matching
 *
 * Uses ZenithToken[] from /swap (no API needed)
 * Pure filtering + scoring + display
 */

import { ZenithToken } from '@/lib/zenith';
import {
    EnrichedToken,
    IntentInput,
    SmartMatchResult,
    findSmartMatches
} from './intent-engine';

/**
 * Convert ZenithToken to EnrichedToken
 * Adds synthetic data for missing fields (deterministic)
 */
function enrichZenithToken(token: ZenithToken): EnrichedToken {
    // Deterministic synthetic data from token address hash
    const hash = token.mint.split('').reduce((a, b) => a + b.charCodeAt(0), 0);

    // Price change 7d (amplified from 24h for consistency)
    const priceChange7d = token.priceChange24h * 2.5;

    // Age estimate (7-97 days)
    const ageInDays = (hash % 90) + 7;

    // Market cap estimate (based on liquidity)
    const marketCap = token.liquidityUsd > 0
        ? token.liquidityUsd * 20  // Assume 5% of MC is liquidity
        : token.priceUsd > 100 ? 10_000_000 : token.priceUsd > 1 ? 1_000_000 : 100_000;

    // Rug risk heuristic
    let rugRisk: 'low' | 'medium' | 'high' = 'low';
    if (token.liquidityUsd < 20_000 || ageInDays < 3) {
        rugRisk = 'high';
    } else if (token.liquidityUsd < 50_000 || ageInDays < 10) {
        rugRisk = 'medium';
    }

    return {
        address: token.mint,
        symbol: token.symbol,
        name: token.name,
        price: token.priceUsd,
        marketCap,
        liquidity: token.liquidityUsd,
        volume24h: token.volume24hUsd,
        priceChange24h: token.priceChange24h,
        priceChange7d,
        ageInDays,
        rugRisk,
        logoURI: token.logoURI,
    };
}

/**
 * CLIENT-SIDE: Find smart matches from Zenith tokens
 * No API call needed - pure function
 */
export function findSmartMatchesFromZenith(
    zenithTokens: ZenithToken[],
    intent: IntentInput
): SmartMatchResult[] {
    // Convert to EnrichedTokens
    const enrichedTokens = zenithTokens
        .filter(t => t.priceUsd > 0) // Must have price
        .map(enrichZenithToken);

    console.log(`[Smart Swap V1 Client] Analyzing ${enrichedTokens.length} tokens`);

    // Run intent matching
    const matches = findSmartMatches(enrichedTokens, intent);

    console.log(`[Smart Swap V1 Client] Found ${matches.length} matches`);

    return matches;
}
