// lib/scoring.js - Token scoring logic (server-side only)

import { getSecurityScore } from './api-clients.js';
import { logger } from './utils.js';

/**
 * Calculate Zenith Score for a token
 * Formula: (Security * 0.4) + (Liquidity Factor * 0.3) + (Volume Factor * 0.3)
 */
export async function scoreToken(token) {
    try {
        // Get security score from GoPlus
        const securityScore = await getSecurityScore(token.chain, token.address);

        // Calculate liquidity factor (0-10 scale)
        const liquidityFactor = Math.min(10, (token.liquidity / 1000000) * 2);

        // Calculate volume factor (0-10 scale)
        const volumeFactor = Math.min(10, (token.volume24h / 500000) * 2);

        // Calculate final score
        const finalScore = (
            (securityScore * 0.4) +
            (liquidityFactor * 0.3) +
            (volumeFactor * 0.3)
        );

        return {
            ...token,
            securityScore: parseFloat(securityScore.toFixed(2)),
            liquidityFactor: parseFloat(liquidityFactor.toFixed(2)),
            volumeFactor: parseFloat(volumeFactor.toFixed(2)),
            finalScore: parseFloat(finalScore.toFixed(2)),
        };

    } catch (error) {
        logger.error('scoring_error', { token: token.address, error: error.message });
        return null;
    }
}

/**
 * Score and rank multiple tokens
 */
export async function scoreAndRankTokens(tokens) {
    logger.info('scoring_start', { count: tokens.length });

    // Score all tokens (with rate limiting)
    const scoredTokens = [];
    for (const token of tokens) {
        const scored = await scoreToken(token);
        if (scored) {
            scoredTokens.push(scored);
        }
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Sort by final score (descending)
    const ranked = scoredTokens.sort((a, b) => b.finalScore - a.finalScore);

    logger.info('scoring_complete', { ranked: ranked.length });
    return ranked;
}
