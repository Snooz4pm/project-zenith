/**
 * Real Market Data Fetcher
 *
 * Fetches 1000+ real token data from Jupiter Proxy
 * to build the trading universe for Brain V2 simulation
 */

import type { SearchableToken } from '@/types/LiquidityFilter';
import type { TokenPriceHistory } from '@/lib/physics-engine/types';

const JUPITER_PROXY_API = 'https://jupiter-proxy-production.up.railway.app';
const SOL_MINT = 'So11111111111111111111111111111111111111112';

interface JupiterProxyToken {
    address: string;
    symbol: string;
    name: string;
    decimals: number;
    logoURI?: string;
    tags?: string[];
    // Market data
    price?: number;
    volume24h?: number;
    volumeChange24h?: number;
    liquidity?: number;
    liquidityChange24h?: number;
    priceChange24h?: number;
    priceChange1h?: number;
    holders?: number;
    // Risk metrics
    rugPull?: boolean;
    freezable?: boolean;
    mintable?: boolean;
}

interface JupiterProxyResponse {
    tokens: JupiterProxyToken[];
    total: number;
    timestamp: number;
}

/**
 * Fetch all 1000 tokens from Jupiter Proxy
 */
export async function fetchJupiterProxyTokens(): Promise<JupiterProxyToken[]> {
    try {
        console.log('[DataFetcher] Fetching tokens from Jupiter Proxy...');

        const response = await fetch(`${JUPITER_PROXY_API}/tokens`, {
            headers: {
                'Accept': 'application/json',
            },
        });

        if (!response.ok) {
            console.error('[DataFetcher] Jupiter Proxy fetch failed:', response.status);
            return [];
        }

        const data = await response.json();

        // Handle different response formats
        let tokens: JupiterProxyToken[] = [];

        if (Array.isArray(data)) {
            tokens = data;
        } else if (data.tokens && Array.isArray(data.tokens)) {
            tokens = data.tokens;
        } else {
            console.error('[DataFetcher] Unexpected response format');
            return [];
        }

        console.log(`[DataFetcher] Fetched ${tokens.length} tokens from Jupiter Proxy`);
        return tokens;
    } catch (error) {
        console.error('[DataFetcher] Jupiter Proxy fetch error:', error);
        return [];
    }
}

/**
 * Calculate liquidity score (0-1)
 */
function calculateLiquidityScore(liquidity?: number): number {
    if (!liquidity) return 0.1;

    // Normalize liquidity to 0-1 scale
    // $1M+ = 1.0, $100k = 0.8, $10k = 0.5, $1k = 0.2
    if (liquidity >= 1_000_000) return 1.0;
    if (liquidity >= 500_000) return 0.9;
    if (liquidity >= 100_000) return 0.8;
    if (liquidity >= 50_000) return 0.6;
    if (liquidity >= 10_000) return 0.5;
    if (liquidity >= 5_000) return 0.3;
    if (liquidity >= 1_000) return 0.2;
    return 0.1;
}

/**
 * Calculate alpha score based on momentum and volume
 */
function calculateAlphaScore(token: JupiterProxyToken): number {
    const priceChange24h = token.priceChange24h || 0;
    const priceChange1h = token.priceChange1h || 0;
    const volumeChange = token.volumeChange24h || 0;
    const volume24h = token.volume24h || 0;

    let score = 0;

    // Price momentum (up to 0.4)
    const absChange24h = Math.abs(priceChange24h);
    if (absChange24h > 10) score += 0.4;
    else if (absChange24h > 5) score += 0.3;
    else if (absChange24h > 2) score += 0.2;
    else if (absChange24h > 1) score += 0.1;

    // Short-term momentum (up to 0.3)
    const absChange1h = Math.abs(priceChange1h);
    if (absChange1h > 5) score += 0.3;
    else if (absChange1h > 2) score += 0.2;
    else if (absChange1h > 1) score += 0.1;

    // Volume expansion (up to 0.3)
    if (volumeChange > 50) score += 0.3;
    else if (volumeChange > 20) score += 0.2;
    else if (volumeChange > 10) score += 0.1;

    // Volume threshold (absolute activity)
    if (volume24h > 100_000) score += 0.1;

    return Math.min(1.0, score);
}

/**
 * Calculate volatility
 */
function calculateVolatility(token: JupiterProxyToken): number {
    // Use price changes as proxy for volatility
    const change24h = Math.abs(token.priceChange24h || 0);
    const change1h = Math.abs(token.priceChange1h || 0);

    // Average the changes and normalize
    const avgChange = (change24h + change1h * 6) / 7; // Weight 1h more heavily
    return Math.min(1.0, avgChange / 15); // Normalize to 0-1, 15% = max
}

/**
 * Estimate round-trip loss from liquidity and volume
 */
function estimateRTL(liquidity?: number, volume24h?: number): number {
    if (!liquidity) return 10.0; // High default for unknown liquidity

    // Base RTL varies by liquidity tier
    let baseRTL = 5.0;

    if (liquidity >= 1_000_000) baseRTL = 0.5;
    else if (liquidity >= 500_000) baseRTL = 1.0;
    else if (liquidity >= 100_000) baseRTL = 2.0;
    else if (liquidity >= 50_000) baseRTL = 3.0;
    else if (liquidity >= 10_000) baseRTL = 5.0;
    else if (liquidity >= 5_000) baseRTL = 7.0;

    // Adjust for volume (high volume = tighter spreads)
    if (volume24h && liquidity > 0) {
        const volumeRatio = volume24h / liquidity;
        if (volumeRatio > 5) baseRTL *= 0.8;
        else if (volumeRatio > 2) baseRTL *= 0.9;
        else if (volumeRatio < 0.5) baseRTL *= 1.2;
    }

    return Math.max(0.1, Math.min(15, baseRTL));
}

/**
 * Determine token tier based on metrics
 */
function determineTier(
    liquidity?: number,
    volume24h?: number,
    rugPull?: boolean,
    freezable?: boolean
): 'SAFE' | 'RANKABLE' | 'REJECTED' {
    // Immediate rejection criteria
    if (rugPull || freezable) return 'REJECTED';
    if (!liquidity || liquidity < 1_000) return 'REJECTED';

    // Tier classification
    // SAFE = high liquidity, high volume
    if (liquidity >= 500_000 && (volume24h || 0) >= 100_000) return 'SAFE';
    // RANKABLE = decent liquidity
    if (liquidity >= 10_000) return 'RANKABLE';

    return 'REJECTED';
}

/**
 * Build trading universe from Jupiter Proxy data
 *
 * CHAOS MODE: Excludes all stablecoins - only volatile/chaos tokens allowed
 */
export async function buildTradingUniverse(
    minLiquidity: number = 10_000,
    maxTokens: number = 1000,
    allowStablecoins: boolean = false // DEFAULT: NO STABLECOINS
): Promise<SearchableToken[]> {
    console.log('[DataFetcher] Building trading universe...');
    console.log(`  Min liquidity: $${minLiquidity.toLocaleString()}`);
    console.log(`  Max tokens: ${maxTokens}`);
    console.log(`  🔥 CHAOS MODE: ${allowStablecoins ? 'OFF (stables allowed)' : 'ON (NO STABLES)'}`);

    const tokens = await fetchJupiterProxyTokens();

    if (tokens.length === 0) {
        console.error('[DataFetcher] No tokens fetched');
        return [];
    }

    const universe: SearchableToken[] = [];
    let stablecoinsBlocked = 0;

    // Filter and transform tokens
    for (const token of tokens) {
        // Skip if below minimum liquidity
        if ((token.liquidity || 0) < minLiquidity) continue;

        // Determine if stablecoin
        const isStable = ['USDC', 'USDT', 'DAI', 'BUSD', 'TUSD', 'FRAX', 'PYUSD', 'GUSD', 'USDP', 'USDD'].includes(token.symbol.toUpperCase());

        // 🔥 CHAOS MODE: Block all stablecoins
        if (!allowStablecoins && isStable) {
            stablecoinsBlocked++;
            continue;
        }

        const liquidityScore = calculateLiquidityScore(token.liquidity);
        const alphaScore = calculateAlphaScore(token);
        const volatility = calculateVolatility(token);
        const rtl = estimateRTL(token.liquidity, token.volume24h);
        const tier = determineTier(token.liquidity, token.volume24h, token.rugPull, token.freezable);

        // Skip rejected tokens
        if (tier === 'REJECTED') continue;

        const searchableToken: SearchableToken = {
            mint: token.address,
            symbol: token.symbol,
            valueInSOL: token.price || 0, // Price in SOL
            liquidityScore,
            roundTripLoss: rtl,
            hasRoute: true, // Assume true if from Jupiter proxy
            alphaScore,
            volatility,
            tier,
            isStable,
            isAlpha: alphaScore > 0.5,
            source: 'jupiter',
        };

        universe.push(searchableToken);
    }

    // Sort by liquidity and take top N
    universe.sort((a, b) => b.liquidityScore - a.liquidityScore);
    const finalUniverse = universe.slice(0, maxTokens);

    console.log(`[DataFetcher] Built universe with ${finalUniverse.length} tokens`);
    console.log(`  SAFE: ${finalUniverse.filter(t => t.tier === 'SAFE').length}`);
    console.log(`  RANKABLE: ${finalUniverse.filter(t => t.tier === 'RANKABLE').length}`);
    console.log(`  REJECTED: ${finalUniverse.filter(t => t.tier === 'REJECTED').length}`);
    console.log(`  Alpha tokens: ${finalUniverse.filter(t => t.isAlpha).length}`);
    if (!allowStablecoins) {
        console.log(`  🔥 Stablecoins blocked: ${stablecoinsBlocked}`);
    }

    return finalUniverse;
}

/**
 * Fetch price histories for learning validation
 */
export async function fetchPriceHistories(
    tokenAddresses: string[]
): Promise<TokenPriceHistory[]> {
    console.log(`[DataFetcher] Fetching price histories for ${tokenAddresses.length} tokens...`);

    // Fetch current data
    const tokens = await fetchJupiterProxyTokens();
    const tokenMap = new Map(tokens.map(t => [t.address, t]));

    const histories: TokenPriceHistory[] = [];

    for (const address of tokenAddresses) {
        const token = tokenMap.get(address);
        if (!token || !token.price) continue;

        // Build mock price history from available data points
        // In a real implementation, you'd fetch actual historical OHLCV data
        const now = Date.now();
        const currentPrice = token.price;
        const change24h = token.priceChange24h || 0;
        const change1h = token.priceChange1h || 0;

        const prices = [
            {
                timestamp: now - 24 * 60 * 60 * 1000,
                price: currentPrice / (1 + change24h / 100),
                volume: token.volume24h,
            },
            {
                timestamp: now - 1 * 60 * 60 * 1000,
                price: currentPrice / (1 + change1h / 100),
                volume: token.volume24h ? token.volume24h / 24 : undefined,
            },
            {
                timestamp: now,
                price: currentPrice,
                volume: token.volume24h ? token.volume24h / 24 : undefined,
            },
        ];

        histories.push({
            symbol: token.symbol,
            mint: address,
            prices,
        });
    }

    console.log(`[DataFetcher] Fetched ${histories.length} price histories`);
    return histories;
}

/**
 * Get top tokens by various criteria
 */
export async function getTopTokens(
    criteria: 'volume' | 'liquidity' | 'momentum' | 'alpha' = 'liquidity',
    limit: number = 50
): Promise<SearchableToken[]> {
    const universe = await buildTradingUniverse();

    let sorted: SearchableToken[];

    switch (criteria) {
        case 'volume':
            // Would need volume data - use liquidity as proxy
            sorted = universe.sort((a, b) => b.liquidityScore - a.liquidityScore);
            break;
        case 'liquidity':
            sorted = universe.sort((a, b) => b.liquidityScore - a.liquidityScore);
            break;
        case 'momentum':
            sorted = universe.sort((a, b) => (b.volatility || 0) - (a.volatility || 0));
            break;
        case 'alpha':
            sorted = universe.sort((a, b) => (b.alphaScore || 0) - (a.alphaScore || 0));
            break;
    }

    return sorted.slice(0, limit);
}
