// api/populate-now.js - Manual trigger without auth (for testing only)

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

import { logger, redisClient } from '../src/utils.js';

// Simple test data
const mockTokenData = [
    {
        address: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
        chain: 'ethereum',
        coingecko_id: 'uniswap',
        sharpeRatio: 1.25,
        securityScore: 8.5,
        finalScore: 8.2
    },
    {
        address: '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9',
        chain: 'ethereum',
        coingecko_id: 'aave',
        sharpeRatio: 1.15,
        securityScore: 9.0,
        finalScore: 7.8
    },
    {
        address: '0x514910771af9ca656af840dff83e8264ecf986ca',
        chain: 'ethereum',
        coingecko_id: 'chainlink',
        sharpeRatio: 0.95,
        securityScore: 8.8,
        finalScore: 7.5
    }
];

export default async function handler(req, res) {
    logger.info('populate_now_start');

    try {
        const REDIS_KEY = 'zenith:leaderboard';

        // Delete old data
        await redisClient.del(REDIS_KEY);
        logger.info('redis_cleared');

        // Add test data to Redis
        const zaddArgs = mockTokenData.flatMap(token => [
            token.finalScore,
            JSON.stringify(token)
        ]);

        const result = await redisClient.zadd(REDIS_KEY, ...zaddArgs);

        logger.info('populate_now_success', { added: result });

        res.status(200).json({
            success: true,
            message: 'Test data added to Redis successfully!',
            tokensAdded: mockTokenData.length,
            redisKey: REDIS_KEY,
            tokens: mockTokenData.map(t => t.coingecko_id)
        });

    } catch (error) {
        logger.error('populate_now_error', { error: error.message });
        res.status(500).json({
            success: false,
            error: error.message,
            stack: error.stack
        });
    }
}
