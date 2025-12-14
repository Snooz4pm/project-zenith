// File: protocol-zenith-frontend/app/api/leaderboard/route.js

import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

// Initialize Redis client
const redis = new Redis({
    url: process.env.REDIS_URL,
    token: process.env.REDIS_TOKEN,
});

const REDIS_KEY = 'zenith:leaderboard';

/**
 * GET /api/leaderboard
 * Fetches the ranked token list from Redis
 */
export async function GET() {
    try {
        // Fetch top 50 tokens from Redis sorted set (highest scores first)
        const rawLeaderboard = await redis.zrange(REDIS_KEY, 0, 49, {
            withScores: true,
            rev: true
        });

        // Parse the results
        const leaderboard = [];
        for (let i = 0; i < rawLeaderboard.length; i += 2) {
            const tokenData = JSON.parse(rawLeaderboard[i]);
            const finalScore = rawLeaderboard[i + 1];

            leaderboard.push({
                ...tokenData,
                finalScore: parseFloat(finalScore),
                rank: leaderboard.length + 1
            });
        }

        return NextResponse.json({
            success: true,
            leaderboard,
            count: leaderboard.length
        });

    } catch (error) {
        console.error('Redis API Error:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to fetch leaderboard from Redis.',
                leaderboard: []
            },
            { status: 500 }
        );
    }
}
