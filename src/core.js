// src/core.js (The Core Logic Module - Scoring and Ranking)

import { env } from 'process';
import { logger, redisClient } from './utils.js';
import { SecurityClient, HistoricalClient } from './api-clients.js';
import pLimit from 'p-limit'; // Used for rate-limiting external API calls

// --- Configuration Constants (Loaded from .env) ---
const MAX_TOKENS = parseInt(env.MAX_TOKENS, 10) || 30; // Max tokens to save to leaderboard
const MIN_LIQUIDITY = parseFloat(env.MIN_LIQUIDITY) || 150000; // Minimum required liquidity
const MIN_VOLUME = parseFloat(env.MIN_VOLUME) || 250000;     // Minimum 24h volume
const MIN_PRICE_CHANGE = parseFloat(env.MIN_PRICE_CHANGE) || 0.05; // Minimum 24h price change (5%)
const CONCURRENT_LIMIT = parseInt(env.CONCURRENT_LIMIT, 10) || 5; // Max concurrent API calls

// --- The Rate Limiter ---
// We use p-limit to prevent hitting API rate limits on CoinGecko and GoPlus.
const limit = pLimit(CONCURRENT_LIMIT);


/**
 * Runs the full scoring pipeline for a single token candidate.
 * @param {object} token - The raw token object (must have 'address', 'chain', and 'coingecko_id').
 * @returns {object | null} - The full scored token object, or null if it fails any filter.
 */
async function processToken(token) {
    const { address, chain, coingecko_id } = token;

    logger.info('processing_start', { address, chain });

    // -----------------------------------------------------------
    // 1. Core Security Filter (GoPlus)
    // -----------------------------------------------------------
    const securityData = await SecurityClient.getGoPlusSecurity(chain, address);

    if (!securityData) {
        logger.warn('filter_fail_security_data', { address });
        return null;
    }

    const securityScore = SecurityClient.calculateSecurityScore(securityData);

    // Disqualify if the security score is below a minimum threshold (e.g., 5/10)
    if (securityScore < 5) {
        logger.warn('filter_fail_low_security', { address, score: securityScore.toFixed(1) });
        return null;
    }

    // -----------------------------------------------------------
    // 2. Technical Analysis Filter (Sharpe Ratio)
    // -----------------------------------------------------------
    // Use the CoinGecko ID to fetch historical data
    const historicalData = await HistoricalClient.getHistoricalPrices(coingecko_id, 'usd', 30); // 30 days of data

    if (!historicalData || historicalData.length === 0) {
        logger.warn('filter_fail_historical_data', { address });
        return null;
    }

    // Extract closing prices for Sharpe Ratio calculation
    const closingPrices = historicalData.map(ohlcv => ohlcv[4]); // Index 4 is the closing price
    const sharpeRatio = HistoricalClient.calculateSharpeRatio(closingPrices);

    // Disqualify if the Sharpe Ratio is too low (i.e., poor risk-adjusted returns)
    if (sharpeRatio < 0.5) { // A common benchmark for acceptable Sharpe
        logger.warn('filter_fail_low_sharpe', { address, ratio: sharpeRatio.toFixed(2) });
        return null;
    }

    // -----------------------------------------------------------
    // 3. Final Score Calculation (The Zenith Formula)
    // -----------------------------------------------------------

    // The final score is a weighted average of:
    // A. Profitability/Risk (Sharpe Ratio): 60% weight
    // B. Security (GoPlus Score): 30% weight
    // C. Stability/Volume (Market Data): 10% weight (Using a placeholder for now)

    const baseScore = (sharpeRatio * 0.6) + (securityScore / 10 * 0.3); // Normalize security score to 0-1

    // Add a small bonus based on volume/liquidity (Placeholder values for now)
    // NOTE: This will be updated when we implement the Dexscreener Client.
    const liquidityFactor = Math.log10(MIN_LIQUIDITY) * 0.05; // Placeholder bonus

    const finalScore = baseScore + liquidityFactor;

    logger.info('processing_success', {
        address,
        sharpe: sharpeRatio.toFixed(2),
        security: securityScore.toFixed(1),
        finalScore: finalScore.toFixed(4)
    });

    return {
        address,
        chain,
        coingecko_id,
        sharpeRatio: parseFloat(sharpeRatio.toFixed(4)),
        securityScore: parseFloat(securityScore.toFixed(2)),
        finalScore: parseFloat(finalScore.toFixed(4)),
    };
}


/**
 * The main orchestration function for the worker.
 * @param {Array<object>} rawTokenCandidates - The initial list of tokens to check.
 */
async function scoreAndRankTokens(rawTokenCandidates) {
    logger.info('score_ranking_start', { candidates: rawTokenCandidates.length });

    // Map all token candidates to the rate-limited processToken function
    const scoringPromises = rawTokenCandidates.map(token =>
        limit(() => processToken(token))
    );

    // Run all checks concurrently, respecting the CONCURRENT_LIMIT
    const results = await Promise.all(scoringPromises);

    // Filter out all null results (failed tokens)
    const passedTokens = results.filter(token => token !== null);

    // Sort the tokens by finalScore in descending order
    const rankedTokens = passedTokens.sort((a, b) => b.finalScore - a.finalScore);

    // Apply the final MAX_TOKENS limit
    const finalLeaderboard = rankedTokens.slice(0, MAX_TOKENS);

    logger.metrics({
        metric: 'leaderboard_generation',
        totalCandidates: rawTokenCandidates.length,
        passedTokens: passedTokens.length,
        finalLeaderboardSize: finalLeaderboard.length,
    });

    // -----------------------------------------------------------
    // 4. Save to Redis Leaderboard (Sorted Set)
    // -----------------------------------------------------------
    const REDIS_KEY = 'zenith:leaderboard';

    // 1. Delete the old leaderboard
    await redisClient.del(REDIS_KEY);

    // 2. Add the new ranked tokens to the Sorted Set
    if (finalLeaderboard.length > 0) {
        // ZADD requires [score, member, score, member, ...] format
        const zaddArgs = finalLeaderboard.flatMap(token => [token.finalScore, JSON.stringify(token)]);

        // ZADD the full leaderboard. The `apply` is needed because zaddArgs is an array.
        const addResult = await redisClient.zadd(REDIS_KEY, ...zaddArgs);

        logger.info('redis_zadd_success', { key: REDIS_KEY, added: addResult });
    } else {
        logger.warn('redis_zadd_empty', { key: REDIS_KEY });
    }

    return finalLeaderboard;
}


export {
    scoreAndRankTokens
};
