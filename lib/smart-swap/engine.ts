/**
 * Smart Swap Engine - Simple & Working
 *
 * SMART FILTER APPROACH:
 * - Curated list of top tradeable tokens
 * - Instant price estimates
 * - Real quotes for what user selects
 * - No complex filtering that fails
 */

import {
    RiskMode,
    SwapRecommendation,
    SmartSwapRequest,
    SmartSwapResponse,
} from './types';

// Railway proxy for quotes
const JUPITER_PROXY_URL = process.env.NEXT_PUBLIC_JUPITER_PROXY_URL || 'https://quote-api.jup.ag/v6';
const JUPITER_PRICE_API = 'https://price.jup.ag/v6/price';
const SOL_MINT = 'So11111111111111111111111111111111111111112';

// ============================================================================
// CURATED TOKEN LIST - Always works, no API filtering needed
// ============================================================================

interface TokenData {
    mint: string;
    symbol: string;
    name: string;
    decimals: number;
    category: 'stablecoin' | 'liquid-staking' | 'defi' | 'memecoin' | 'utility';
}

const CURATED_TOKENS: TokenData[] = [
    // Stablecoins
    { mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', symbol: 'USDC', name: 'USD Coin', decimals: 6, category: 'stablecoin' },
    { mint: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', symbol: 'USDT', name: 'Tether USD', decimals: 6, category: 'stablecoin' },

    // Liquid Staking
    { mint: 'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So', symbol: 'mSOL', name: 'Marinade SOL', decimals: 9, category: 'liquid-staking' },
    { mint: 'J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn', symbol: 'JitoSOL', name: 'Jito SOL', decimals: 9, category: 'liquid-staking' },
    { mint: 'bSo13r4TkiE4KumL71LsHTPpL2euBYLFx6h9HP3piy1', symbol: 'bSOL', name: 'BlazeStake SOL', decimals: 9, category: 'liquid-staking' },

    // DeFi
    { mint: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN', symbol: 'JUP', name: 'Jupiter', decimals: 6, category: 'defi' },
    { mint: 'RasVKbLFpzNjcRCgMnpYXJC7mJrg4tGSSSwUjMZ3Wfu', symbol: 'RAY', name: 'Raydium', decimals: 6, category: 'defi' },
    { mint: 'orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE', symbol: 'ORCA', name: 'Orca', decimals: 6, category: 'defi' },

    // Memecoins
    { mint: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', symbol: 'BONK', name: 'Bonk', decimals: 5, category: 'memecoin' },
    { mint: '7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs', symbol: 'WIF', name: 'dogwifhat', decimals: 6, category: 'memecoin' },
    { mint: 'MEW1gQWJ3nEXg2qgERiKu7FAFj79PHvQVREQUzScPP5', symbol: 'MEW', name: 'cat in a dogs world', decimals: 5, category: 'memecoin' },
    { mint: 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm', symbol: 'WEN', name: 'WEN', decimals: 5, category: 'memecoin' },

    // Utility
    { mint: 'HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3', symbol: 'PYTH', name: 'Pyth Network', decimals: 6, category: 'utility' },
    { mint: 'rndrizKT3MK1iimdxRdWabcF7Zg7AR5T4nud4EkHBof', symbol: 'RNDR', name: 'Render', decimals: 8, category: 'utility' },
    { mint: 'hntyVP6YFm1Hg25TN9WGLqM12b8TQmcknKrdu1oxWux', symbol: 'HNT', name: 'Helium', decimals: 8, category: 'utility' },
];

// ============================================================================
// PRICE FETCHING
// ============================================================================

async function fetchPrices(mints: string[]): Promise<Map<string, number>> {
    const prices = new Map<string, number>();

    try {
        const ids = mints.join(',');
        const response = await fetch(`${JUPITER_PRICE_API}?ids=${ids}`, {
            headers: { 'Accept': 'application/json' },
        });

        if (response.ok) {
            const data = await response.json();
            for (const [mint, info] of Object.entries(data.data || {})) {
                const price = (info as any)?.price;
                if (price && price > 0) {
                    prices.set(mint, price);
                }
            }
        }
    } catch (error) {
        console.error('[Smart Swap] Price fetch error:', error);
    }

    return prices;
}

// ============================================================================
// MAIN: Generate Recommendations
// ============================================================================

export async function generateRecommendations(
    request: SmartSwapRequest
): Promise<SmartSwapResponse> {
    const { amountIn, riskMode } = request;

    console.log(`[Smart Swap] Generating for ${amountIn} SOL, mode: ${riskMode}`);

    // Get all prices at once (single API call)
    const allMints = [SOL_MINT, ...CURATED_TOKENS.map(t => t.mint)];
    const prices = await fetchPrices(allMints);

    const solPrice = prices.get(SOL_MINT) || 180; // Fallback
    const inputValueUsd = amountIn * solPrice;

    console.log(`[Smart Swap] SOL price: $${solPrice}, Input: $${inputValueUsd.toFixed(2)}`);
    console.log(`[Smart Swap] Got ${prices.size} prices`);

    // Filter tokens based on risk mode
    let tokensToShow: TokenData[];

    if (riskMode === 'safe') {
        // Safe: stablecoins + liquid staking + established DeFi
        tokensToShow = CURATED_TOKENS.filter(t =>
            t.category === 'stablecoin' ||
            t.category === 'liquid-staking' ||
            t.category === 'defi'
        );
    } else if (riskMode === 'degenerate') {
        // Degen: memecoins + utility
        tokensToShow = CURATED_TOKENS.filter(t =>
            t.category === 'memecoin' ||
            t.category === 'utility'
        );
    } else {
        // Balanced: all tokens
        tokensToShow = CURATED_TOKENS;
    }

    console.log(`[Smart Swap] ${tokensToShow.length} tokens for ${riskMode} mode`);

    // Build recommendations
    const recommendations: SwapRecommendation[] = [];

    for (const token of tokensToShow) {
        const tokenPrice = prices.get(token.mint);

        if (!tokenPrice || tokenPrice <= 0) {
            console.log(`[Smart Swap] No price for ${token.symbol}`);
            continue;
        }

        // Calculate estimated output
        const estimatedOut = inputValueUsd / tokenPrice;
        const outputValueUsd = estimatedOut * tokenPrice;

        // Risk level based on category
        let riskLevel: 'low' | 'medium' | 'high' = 'medium';
        if (token.category === 'stablecoin') riskLevel = 'low';
        else if (token.category === 'liquid-staking') riskLevel = 'low';
        else if (token.category === 'memecoin') riskLevel = 'high';

        // Score based on category
        let smartSwapScore = 75;
        if (token.category === 'stablecoin') smartSwapScore = 95;
        else if (token.category === 'liquid-staking') smartSwapScore = 90;
        else if (token.category === 'defi') smartSwapScore = 85;
        else if (token.category === 'memecoin') smartSwapScore = 70;

        recommendations.push({
            tokenOut: {
                mint: token.mint,
                symbol: token.symbol,
                name: token.name,
                decimals: token.decimals,
            },
            estimatedAmountOut: estimatedOut,
            estimatedSlippage: 0.1, // Estimate
            liquidityScore: smartSwapScore,
            riskLevel,
            riskScore: smartSwapScore,
            smartSwapScore,
            explanation: `~${estimatedOut.toLocaleString(undefined, { maximumFractionDigits: 4 })} ${token.symbol} ($${outputValueUsd.toFixed(2)}) • ${token.category}`,
            priceImpact: 0.1,
        });
    }

    // Sort by score
    recommendations.sort((a, b) => b.smartSwapScore - a.smartSwapScore);

    console.log(`[Smart Swap] Returning ${recommendations.length} recommendations`);

    return {
        recommendations,
        timestamp: Date.now(),
        riskMode,
    };
}

// Re-export types
export * from './types';
