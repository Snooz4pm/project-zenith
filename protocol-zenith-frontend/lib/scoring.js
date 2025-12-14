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
    let confidence = 60; // Start higher for DeFi market
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

        confidence += (securityData.score - 4) * 4; // More lenient
        if (securityData.score >= 7) reasons.push('Good security score');
        if (securityData.score < 5) reasons.push('Security concerns');
    }

    // Trend impact - more weight
    if (trendData.score > 6) {
        confidence += 25;
        reasons.push('Strong bullish trend');
    } else if (trendData.score > 4.5) {
        confidence += 10;
        reasons.push('Positive trend');
    } else if (trendData.score < 3) {
        confidence -= 20;
        reasons.push('Weak trend');
    }

    // Volume impact - more generous
    if (token.volume24h > 500000) {
        confidence += 15;
        reasons.push('High trading volume');
    } else if (token.volume24h > 100000) {
        confidence += 5;
        reasons.push('Decent volume');
    }

    // Liquidity impact - adjusted
    if (token.liquidity > 300000) {
        confidence += 12;
        reasons.push('Good liquidity');
    } else if (token.liquidity < 75000) {
        confidence -= 15;
        reasons.push('Low liquidity risk');
    }

    // New launch bonus - opportunity focused
    if (token.isNewLaunch) {
        if (trendData.score > 5.5) {
            confidence += 20;
            reasons.push('🚀 Early entry opportunity');
        } else if (trendData.score > 4) {
            confidence += 5;
            reasons.push('New token with potential');
        } else {
            confidence -= 10;
            reasons.push('Unproven new token');
        }
    }

    // Price momentum - more weight
    if (token.priceChange24h > 15) {
        confidence += 15;
        reasons.push('Strong price momentum');
    } else if (token.priceChange24h > 5) {
        confidence += 5;
        reasons.push('Positive price action');
    } else if (token.priceChange24h < -15) {
        confidence -= 15;
        reasons.push('Negative price action');
    }

    // Bonus for strong fundamentals
    if (trendData.score > 6 && securityData?.score >= 7 && token.volume24h > 200000) {
        confidence += 10;
        reasons.push('💎 Strong fundamentals');
    }

    // Cap confidence at 0-100
    confidence = Math.max(0, Math.min(100, confidence));

    // Determine recommendation - lowered thresholds
    let recommendation;
    if (confidence >= 75) recommendation = 'STRONG BUY';
    else if (confidence >= 55) recommendation = 'BUY';
    else if (confidence >= 35) recommendation = 'HOLD';
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
