// lib/scoring.js - Advanced scoring with trend detection and buy recommendations

import { getDetailedSecurity } from './api-clients.js';
import { logger } from './utils.js';

/**
 * Calculate trend score based on multiple factors
 */
export function calculateTrendScore(token) {
    // Price momentum (0-10)
    const priceMomentum = Math.min(10, Math.max(0, (token.priceChange24h / 20) + 5));

    // Volume growth (0-10)
    const volumeGrowth = token.volume7d > 0
        ? Math.min(10, (token.volume24h / (token.volume7d / 7)) * 2)
        : 5;

    // Liquidity factor (0-10)
    const liquidityFactor = Math.min(10, (token.liquidity / 500000) * 5);

    // Age bonus (newer = higher potential)
    const ageBonus = token.isNewLaunch ? 2 : 0;

    // Calculate weighted trend score
    const trendScore = (
        (priceMomentum * 0.3) +
        (volumeGrowth * 0.3) +
        (liquidityFactor * 0.2) +
        ageBonus
    );

    return {
        score: parseFloat(trendScore.toFixed(2)),
        priceMomentum: parseFloat(priceMomentum.toFixed(2)),
        volumeGrowth: parseFloat(volumeGrowth.toFixed(2)),
        liquidityFactor: parseFloat(liquidityFactor.toFixed(2)),
    };
}

/**
 * Generate buy recommendation with confidence score
 */
export function generateBuyRecommendation(token, securityData, trendData) {
    let confidence = 50; // Start at neutral
    const reasons = [];

    // Security impact
    if (securityData) {
        if (securityData.isHoneypot) {
            return {
                recommendation: 'AVOID',
                confidence: 0,
                reasons: ['HONEYPOT DETECTED - DO NOT BUY'],
            };
        }

        confidence += (securityData.score - 5) * 5; // -25 to +25
        if (securityData.score >= 8) reasons.push('High security score');
        if (securityData.score < 6) reasons.push('Security concerns');
    }

    // Trend impact
    if (trendData.score > 7.5) {
        confidence += 20;
        reasons.push('Strong bullish trend');
    } else if (trendData.score < 4) {
        confidence -= 20;
        reasons.push('Weak trend');
    }

    // Volume impact
    if (token.volume24h > 1000000) {
        confidence += 10;
        reasons.push('High trading volume');
    }

    // Liquidity impact
    if (token.liquidity > 500000) {
        confidence += 10;
        reasons.push('Good liquidity');
    } else if (token.liquidity < 100000) {
        confidence -= 15;
        reasons.push('Low liquidity risk');
    }

    // New launch bonus/risk
    if (token.isNewLaunch) {
        if (trendData.score > 7) {
            confidence += 15;
            reasons.push('Early entry opportunity');
        } else {
            confidence -= 10;
            reasons.push('Unproven new token');
        }
    }

    // Price momentum
    if (token.priceChange24h > 20) {
        confidence += 10;
        reasons.push('Strong price momentum');
    } else if (token.priceChange24h < -20) {
        confidence -= 15;
        reasons.push('Negative price action');
    }

    // Cap confidence at 0-100
    confidence = Math.max(0, Math.min(100, confidence));

    // Determine recommendation
    let recommendation;
    if (confidence >= 80) recommendation = 'STRONG BUY';
    else if (confidence >= 60) recommendation = 'BUY';
    else if (confidence >= 40) recommendation = 'HOLD';
    else recommendation = 'AVOID';

    return {
        recommendation,
        confidence: Math.round(confidence),
        reasons,
    };
}

/**
 * Comprehensive token analysis
 */
export async function analyzeToken(token) {
    try {
        // Get security data
        const securityData = await getDetailedSecurity(token.chain, token.address);

        // Calculate trend score
        const trendData = calculateTrendScore(token);

        // Generate buy recommendation
        const buyRec = generateBuyRecommendation(token, securityData, trendData);

        return {
            ...token,
            security: securityData,
            trend: trendData,
            recommendation: buyRec,
        };

    } catch (error) {
        logger.error('token_analysis_error', { token: token.address, error: error.message });
        return null;
    }
}

/**
 * Analyze and rank multiple tokens
 */
export async function analyzeMarket(tokens) {
    logger.info('market_analysis_start', { count: tokens.length });

    const analyzed = [];

    // Analyze tokens in batches to avoid rate limiting
    for (let i = 0; i < tokens.length; i += 10) {
        const batch = tokens.slice(i, i + 10);
        const results = await Promise.all(
            batch.map(token => analyzeToken(token))
        );

        analyzed.push(...results.filter(r => r !== null));

        // Delay between batches
        if (i + 10 < tokens.length) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }

    // Sort by recommendation confidence
    const ranked = analyzed.sort((a, b) =>
        b.recommendation.confidence - a.recommendation.confidence
    );

    logger.info('market_analysis_complete', { analyzed: ranked.length });
    return ranked;
}
