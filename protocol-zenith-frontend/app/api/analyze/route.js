// app/api/analyze/route.js - Unified token analysis endpoint

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextResponse } from 'next/server';
import { redisClient, logger } from '../../../lib/utils.js';
import { fetchTrendingTokens } from '../../../lib/api-clients.js';
import { scoreAndRankTokens } from '../../../lib/scoring.js';

const CACHE_KEY = 'zenith:analyzed_tokens';
const CACHE_TTL = 60; // 60 seconds cache

/**
 * GET /api/analyze
 * Fetches, analyzes, and ranks tokens
 */
export async function GET(request) {
    try {
        logger.info('analyze_start');

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

        // Fetch trending tokens
        const trendingTokens = await fetchTrendingTokens();

        if (trendingTokens.length === 0) {
            return NextResponse.json({
                success: false,
                error: 'No trending tokens found',
                tokens: [],
            }, { status: 404 });
        }

        // Score and rank tokens
        const rankedTokens = await scoreAndRankTokens(trendingTokens);

        // Cache results
        await redisClient.setex(CACHE_KEY, CACHE_TTL, JSON.stringify(rankedTokens));

        logger.info('analyze_complete', { count: rankedTokens.length });

        return NextResponse.json({
            success: true,
            tokens: rankedTokens,
            cached: false,
            timestamp: new Date().toISOString(),
        });

    } catch (error) {
        logger.error('analyze_error', { error: error.message });
        return NextResponse.json({
            success: false,
            error: error.message,
            tokens: [],
        }, { status: 500 });
    }
}
