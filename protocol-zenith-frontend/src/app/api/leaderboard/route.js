// src/app/api/leaderboard/route.js (Frontend Data Fetcher)

import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

// Initialize the Redis client using the local environment variables
const redis = new Redis({
    url: process.env.REDIS_URL,
    token: process.env.REDIS_TOKEN,
});

const REDIS_KEY = 'zenith:leaderboard';

/**
 * Handles GET requests to /api/leaderboard
 * Fetches the ranked token list from Upstash Redis.
 */
export async function GET() {
    try {
        // ZRANGEBYSCORE Fetches the top 50 tokens, sorted by score (DESC)
        // withScores: true - We need the score (the ZADD score we used)
        // withScores: false - We only get the token string

        // We fetch the top 50 elements (0 to 49) and ask for the scores.
        const rawLeaderboard = await redis.zrange(REDIS_KEY, 0, 49, { withScores: true, rev: true });

        // The result is an array: [member1, score1, member2, score2, ...]
        const leaderboard = [];

        for (let i = 0; i < rawLeaderboard.length; i += 2) {
            const tokenData = JSON.parse(rawLeaderboard[i]);
            const finalScore = rawLeaderboard[i + 1];

            leaderboard.push({
                ...tokenData,
                finalScore: parseFloat(finalScore).toFixed(4),
                rank: leaderboard.length + 1
            });
        }

        return NextResponse.json({ success: true, leaderboard });

    } catch (error) {
        console.error('Redis API Error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch leaderboard from Redis.' },
            { status: 500 }
        );
    }
}
