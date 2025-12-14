// api/worker.js (Vercel Serverless Function Entry Point - FINAL VERSION)

import { env } from 'process';
import { verifySignature } from '@upstash/qstash/nextjs';
import { logger } from '../src/utils.js';
import { scoreAndRankTokens } from '../src/core.js';
import { RealTimeClient } from '../src/api-clients.js'; // Import the new RealTimeClient

// --- 1. Main Worker Handler ---
async function handler(req, res) {
    logger.info('worker_execution_start', { method: req.method });

    // Ensure it's a POST request (standard for worker/webhook communication)
    if (req.method !== 'POST') {
        res.status(405).send('Method Not Allowed');
        logger.warn('worker_fail_method', { method: req.method });
        return;
    }

    try {
        // --- 2. Fetch Real-World Token Candidates (Dexscreener) ---
        logger.info('fetching_candidates_start');
        const tokenCandidates = await RealTimeClient.getTrendingTokenCandidates();

        if (tokenCandidates.length === 0) {
            logger.warn('no_candidates_fetched', { message: "Dexscreener returned no valid token pairs." });
            res.status(200).json({ message: "Worker ran, but no candidates were found to score." });
            return;
        }

        logger.info('candidates_fetched_success', { count: tokenCandidates.length });

        // --- 3. Run the Core Scoring Logic ---
        const finalLeaderboard = await scoreAndRankTokens(tokenCandidates);

        logger.info('worker_execution_complete', { ranked: finalLeaderboard.length });

        // Return a successful response
        res.status(200).json({
            message: "Protocol Zenith worker completed successfully.",
            leaderboardSize: finalLeaderboard.length,
            topToken: finalLeaderboard[0] || null
        });

    } catch (error) {
        logger.error('worker_execution_failure', { error });
        res.status(500).json({ error: 'Internal Server Error during scoring pipeline.' });
    }
}

// --- 4. QStash Security Wrap ---
// This verifies the request signature using your QSTASH_SIGNING_KEYS.
export default verifySignature(handler);
