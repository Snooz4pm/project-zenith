// app/api/analyze/route.js - Enhanced market analysis endpoint

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextResponse } from 'next/server';
import { redisClient, logger } from '../../../lib/utils.js';
import { fetchMarketTokens } from '../../../lib/api-clients.js';
import { analyzeMarket } from '../../../lib/scoring.js';

const CACHE_KEY = 'zenith:market_analysis';
const CACHE_TTL = 300; // 5 minutes cache (longer due to comprehensive analysis)

/**
 * GET /api/analyze
 * Comprehensive market analysis with buy recommendations
 */
export async function GET(request) {
    try {
        logger.info('market_analysis_start');

        // Check cache first
        const cached = await redisClient.get(CACHE_KEY);
        if (cached) {
            logger.info('cache_hit');
            return NextResponse.json({
                success: true,
                tokens: cached,
                cached: true,
                timestamp: new Date().toISOString(),
            });
        }

        // Fetch 500+ tokens from multiple chains
        const marketTokens = await fetchMarketTokens(200); // 200 per chain = 600 total

        if (marketTokens.length === 0) {
            return NextResponse.json({
                success: false,
                error: 'No tokens found',
                tokens: [],
            }, { status: 404 });
        }

        // Analyze top 50 tokens (to avoid timeout)
        const topTokens = marketTokens
            .sort((a, b) => b.volume24h - a.volume24h)
            .slice(0, 50);

        const analyzed = await analyzeMarket(topTokens);

        // Cache results
        await redisClient.setex(CACHE_KEY, CACHE_TTL, JSON.stringify(analyzed));

        logger.info('market_analysis_complete', {
            scanned: marketTokens.length,
            analyzed: analyzed.length
        });

        return NextResponse.json({
            success: true,
            tokens: analyzed,
            cached: false,
            stats: {
                totalScanned: marketTokens.length,
                analyzed: analyzed.length,
                strongBuys: analyzed.filter(t => t.recommendation.recommendation === 'STRONG BUY').length,
                buys: analyzed.filter(t => t.recommendation.recommendation === 'BUY').length,
            },
            timestamp: new Date().toISOString(),
        });

    } catch (error) {
        logger.error('market_analysis_error', { error: error.message });
        return NextResponse.json({
            success: false,
            error: error.message,
            tokens: [],
        }, { status: 500 });
    }
}
