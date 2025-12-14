// src/api-clients.js (COMPLETE: SecurityClient & HistoricalClient)

import fetch from 'node-fetch';
import { env } from 'process';
import { logger } from './utils.js';
import { Redis } from '@upstash/redis'; // Required for the HistoricalClient to fetch OHLCV (for Sharpe Ratio)

// Base URLs
const GOPLUS_BASE_URL = 'https://api.gopluslabs.io/api/v1/token_security/';
const COINGECKO_BASE_URL = 'https://pro-api.coingecko.com/api/v3/';


// =========================================================================
// 1. Security Client (GoPlus)
// =========================================================================

/**
 * Executes a token security check using the GoPlus API.
 * @param {string} chain - The blockchain network (e.g., 'eth', 'bsc').
 * @param {string} address - The token contract address.
 * @returns {object | null} - The full security response object, or null on error/failure.
 */
async function getGoPlusSecurity(chain, address) {
    const url = `${GOPLUS_BASE_URL}${chain}?contract_addresses=${address}`;

    try {
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`GoPlus API HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        const securityData = data.result ? data.result[address.toLowerCase()] : null;

        if (!securityData) {
            logger.error('goplus_no_result', { chain, address });
            return null;
        }

        logger.info('goplus_fetch_success', { chain, address });
        return securityData;

    } catch (error) {
        logger.error('goplus_api_fail', { chain, address, error: error.message });
        return null;
    }
}

/**
 * Calculates a simple security score based on GoPlus data.
 * @param {object} securityData - The raw response from getGoPlusSecurity.
 * @returns {number} - A score from 0 (High Risk) to 10 (High Security).
 */
function calculateSecurityScore(securityData) {
    if (!securityData) {
        return 0; // Default to zero if no security data is available (Fail-Safe)
    }

    let score = 10;
    let riskFlags = [];

    // --- Critical Red Flags (Drops score to 0 or 1) ---
    if (securityData.is_honeypot === '1' || securityData.is_malicious === '1') {
        logger.warn('security_honeypot_flag', { address: securityData.contract_address });
        return 0;
    }

    // Buy/Sell Tax too high (e.g., > 10%)
    const buyTax = parseFloat(securityData.buy_tax);
    const sellTax = parseFloat(securityData.sell_tax);

    if (buyTax > 0.1 || sellTax > 0.1) {
        logger.warn('security_high_tax', { buyTax, sellTax });
        score = Math.min(score, 1);
        riskFlags.push(`High Tax (${(Math.max(buyTax, sellTax) * 100).toFixed(1)}%)`);
    }

    // --- Major Deductions ---
    // Modifiable Contract/Owner Privileges (Indicates rug potential)
    if (securityData.owner_change_txns === '1' || securityData.can_take_back_ownership === '1') {
        score -= 4;
        riskFlags.push('Owner/Privilege Risk');
    }

    // No Lock or Low Liquidity Lock (A primary rug vector)
    const liquidityLockStatus = securityData.liquidity_lock;
    if (liquidityLockStatus === '0' || (securityData.liquidity_locked_percentage && parseFloat(securityData.liquidity_locked_percentage) < 50)) {
        score -= 3;
        riskFlags.push('Low/No Liquidity Lock');
    }

    // --- Minor Deductions ---
    if (securityData.is_proxy === '1') {
        score -= 1;
        riskFlags.push('Proxy Contract');
    }

    score = Math.max(0, score);

    logger.info('security_score_calculated', {
        score: score.toFixed(1),
        address: securityData.contract_address,
        flags: riskFlags.join(', ') || 'None'
    });

    return score;
}

export const SecurityClient = {
    getGoPlusSecurity,
    calculateSecurityScore
};


// =========================================================================
// 2. Historical Data Client (CoinGecko)
// =========================================================================

/**
 * Fetches historical OHLCV data from CoinGecko Pro API.
 */
async function getHistoricalPrices(coinId, currency = 'usd', days = 30) {
    const url = `${COINGECKO_BASE_URL}coins/${coinId}/ohlc?vs_currency=${currency}&days=${days}`;

    try {
        const response = await fetch(url, {
            headers: {
                'x-cg-pro-api-key': env.COINGECKO_API_KEY,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            logger.warn('coingecko_api_error', {
                coinId,
                status: response.status,
                statusText: response.statusText
            });
            const errorBody = await response.text();
            logger.warn('coingecko_error_body', { body: errorBody });
            return null;
        }

        const data = await response.json();
        logger.info('coingecko_fetch_success', { coinId, count: data.length });
        return data;

    } catch (error) {
        logger.error('coingecko_fetch_fail', { coinId, error: error.message });
        return null;
    }
}

/**
 * Calculates the Sharpe Ratio for a token based on its historical returns.
 * The Sharpe Ratio is (Average Return - Risk-Free Rate) / Standard Deviation of Returns.
 */
function calculateSharpeRatio(closes) {
    if (closes.length < 5) {
        logger.warn('sharpe_insufficient_data', { count: closes.length });
        return 0;
    }

    const returns = [];
    for (let i = 1; i < closes.length; i++) {
        const dailyReturn = (closes[i] - closes[i - 1]) / closes[i - 1];
        returns.push(dailyReturn);
    }

    const averageReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - averageReturn, 2), 0) / returns.length;
    const standardDeviation = Math.sqrt(variance);

    if (standardDeviation === 0) {
        return 0;
    }

    const riskFreeRate = 0;
    const dailySharpe = (averageReturn - riskFreeRate) / standardDeviation;
    const annualSharpe = dailySharpe * Math.sqrt(365);

    logger.info('sharpe_ratio_calculated', { daily: dailySharpe.toFixed(4), annual: annualSharpe.toFixed(4) });

    return annualSharpe;
}


export const HistoricalClient = {
    getHistoricalPrices,
    calculateSharpeRatio
};


// =========================================================================
// 3. Real-Time Data Client (Dexscreener)
// =========================================================================

// Base URL for Dexscreener (Public API)
const DEXSCREENER_BASE_URL = 'https://api.dexscreener.com/latest/dex/';

const MIN_LIQUIDITY = parseFloat(env.MIN_LIQUIDITY) || 150000;
const MIN_VOLUME = parseFloat(env.MIN_VOLUME) || 250000;

/**
 * Fetches the top-performing or trending pairs across multiple chains.
 * This function serves as the dynamic source of token candidates.
 * @returns {Array<object>} - An array of simplified token candidate objects, or an empty array on error.
 */
async function getTrendingTokenCandidates() {
    // We target the 'pairs/trending' or a similar endpoint for dynamic discovery.
    // NOTE: The public API often just provides search/lookup. We will use a known 
    // endpoint that returns a list of top pairs on popular chains (e.g., Ethereum/Uniswap)

    // For simplicity and initial testing, we search for top ETH pairs on Uniswap V2
    // A more complex query would fetch the global trending list.
    const url = `${DEXSCREENER_BASE_URL}search?q=uniswap%20eth%20v2`;

    // We can also target the 'pairs/trending' endpoints if they exist and are suitable.
    // Example: const trendingUrl = 'https://api.dexscreener.com/latest/dex/pairs/trending';

    try {
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Dexscreener API HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();

        if (!data.pairs || data.pairs.length === 0) {
            logger.warn('dexscreener_no_pairs', { url });
            return [];
        }

        // --- Data Transformation ---
        // We must convert the Dexscreener data into the format needed by processToken: 
        // { address, chain, coingecko_id }
        const candidates = data.pairs
            .filter(pair =>
                // Basic filtering: ensure necessary data is present and min liquidity is met
                pair.baseToken &&
                pair.baseToken.address &&
                pair.liquidity && pair.liquidity.usd > MIN_LIQUIDITY &&
                pair.volume && pair.volume.h24 > MIN_VOLUME
            )
            .map(pair => ({
                // Map the Dexscreener data to our internal token structure
                address: pair.baseToken.address,
                chain: pair.chainId,
                coingecko_id: pair.baseToken.address, // For now, use address as CG ID (will need lookup later)
                // Also pass through key market data to the core function
                liquidity: pair.liquidity.usd,
                volume24h: pair.volume.h24
            }));

        logger.info('dexscreener_fetch_success', { count: candidates.length });
        return candidates;

    } catch (error) {
        logger.error('dexscreener_fetch_fail', { error: error.message });
        return [];
    }
}

// --- Export the Client Module (Add to existing exports) ---
export const RealTimeClient = {
    getTrendingTokenCandidates,
};


// =========================================================================
// 3B. Moralis Data Client (Token Liquidity & Pair Stats)
// =========================================================================

/**
 * Fetches token liquidity and pair statistics from Moralis API.
 * @param {string} tokenAddress - The token contract address.
 * @param {string} chain - The blockchain network (default: 'eth').
 * @returns {object | null} - { liquidity: number, activePairs: number } or null on error.
 */
async function fetchMoralisData(tokenAddress, chain = 'eth') {
    if (!env.MORALIS_API_KEY) {
        logger.warn('moralis_key_missing', { tokenAddress });
        return null;
    }

    const url = `https://deep-index.moralis.io/api/v2.2/erc20/${tokenAddress}/pairs/stats?chain=${chain}`;

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'X-API-Key': env.MORALIS_API_KEY,
            },
        });

        if (!response.ok) {
            logger.warn('moralis_api_error', {
                tokenAddress,
                status: response.status,
                statusText: response.statusText
            });
            return null;
        }

        const data = await response.json();

        // Extract required data for scoring
        const totalLiquidityUsd = data.total_liquidity_usd || 0;
        const totalActivePairs = data.total_active_pairs || 0;

        logger.info('moralis_fetch_success', {
            tokenAddress,
            liquidity: totalLiquidityUsd,
            pairs: totalActivePairs
        });

        return {
            liquidity: totalLiquidityUsd,
            activePairs: totalActivePairs
        };

    } catch (error) {
        logger.error('moralis_fetch_fail', { tokenAddress, error: error.message });
        return null;
    }
}

export const MoralisClient = {
    fetchMoralisData
};


// =========================================================================
// 4. News Sentiment Client (Gemini with Google Search)
// =========================================================================

import { GoogleGenAI } from '@google/genai';

// Initialize the AI client using the Environment Variable
const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });

/**
 * Fetches and scores news sentiment for a token using Gemini with Google Search.
 * @param {string} tokenName - The name of the token to analyze.
 * @returns {object} - { newsScore: number, newsSummary: string }
 */
export async function fetchAndScoreNews(tokenName) {
    if (!env.GEMINI_API_KEY) {
        console.warn("GEMINI_API_KEY is missing. Skipping news analysis.");
        return { newsScore: 0, newsSummary: "News analysis disabled (API key missing)." };
    }

    // --- FINALIZED GEMINI PROMPT ---
    const prompt = `
        You are a financial sentiment analysis expert. 
        1. **Search:** Use Google Search to find all recent, reliable news, events, and community sentiment (last 48 hours) concerning the crypto token "${tokenName}".
        2. **Analyze:** Analyze all search results for overall positive or negative sentiment.
        3. **Score:** Provide a single, objective sentiment score from -10 (Extremely Negative) to +10 (Extremely Positive).
        4. **Summary:** Provide a concise, two-sentence summary of the key findings.
        
        The output MUST be only a single, valid JSON object following this schema:
        {
          "score": integer (-10 to 10),
          "summary": string (2 sentences maximum)
        }
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            config: {
                tools: [{ googleSearch: {} }],
                responseMimeType: "application/json",
                responseSchema: {
                    type: "object",
                    properties: {
                        score: { type: "integer", description: "Sentiment score from -10 to +10." },
                        summary: { type: "string", description: "A 2-sentence summary of the news." }
                    },
                    required: ["score", "summary"]
                }
            }
        });

        // Response should be clean JSON due to MimeType setting
        const parsedResult = JSON.parse(response.text.trim());

        logger.info('gemini_news_success', { tokenName, score: parsedResult.score });
        return { newsScore: parsedResult.score, newsSummary: parsedResult.summary };

    } catch (error) {
        logger.error('gemini_news_fail', { tokenName, error: error.message });
        return { newsScore: 0, newsSummary: "News analysis failed due to API error." };
    }
}

export const NewsClient = {
    fetchAndScoreNews
};
