// File: protocol-zenith-frontend/app/api/leaderboard/route.js

export const dynamic = 'force-dynamic'; // Force dynamic rendering, no caching

import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

const REDIS_KEY = 'zenith:leaderboard';

/**
 * GET /api/leaderboard
 * Fetches the ranked token list from Redis
 */
export async function GET() {
    try {
        // Check if Redis credentials are configured
        if (!process.env.REDIS_URL || !process.env.REDIS_TOKEN) {
            console.error('Redis credentials missing');
            return NextResponse.json({
                success: false,
                error: 'Redis credentials not configured',
                leaderboard: [],
                debug: {
                    hasUrl: !!process.env.REDIS_URL,
                    hasToken: !!process.env.REDIS_TOKEN
                }
            }, { status: 500 });
        }

        // Initialize Redis client
        const redis = new Redis({
            url: process.env.REDIS_URL,
            token: process.env.REDIS_TOKEN,
        });

        console.log('Attempting to fetch from Redis key:', REDIS_KEY);

        // Fetch top 50 tokens from Redis sorted set (highest scores first)
        const rawLeaderboard = await redis.zrange(REDIS_KEY, 0, 49, {
            withScores: true,
            rev: true
        });

        console.log('Raw Redis response:', rawLeaderboard);

        // Parse the results
        const leaderboard = [];
        for (let i = 0; i < rawLeaderboard.length; i += 2) {
            try {
                const tokenData = JSON.parse(rawLeaderboard[i]);
                const finalScore = rawLeaderboard[i + 1];

                leaderboard.push({
                    ...tokenData,
                    finalScore: parseFloat(finalScore),
                    rank: leaderboard.length + 1
                });
            } catch (parseError) {
                console.error('Error parsing token data:', parseError);
            }
        }

        console.log('Parsed leaderboard:', leaderboard);

        return NextResponse.json({
            success: true,
            leaderboard,
            count: leaderboard.length,
            debug: {
                rawCount: rawLeaderboard.length,
                redisKey: REDIS_KEY
            }
        });

    } catch (error) {
        console.error('Redis API Error:', error);
        return NextResponse.json(
            {
                success: false,
                error: error.message || 'Failed to fetch leaderboard from Redis.',
                leaderboard: [],
                debug: {
                    errorType: error.constructor.name,
                    errorMessage: error.message
                }
            },
            { status: 500 }
        );
    }
}
