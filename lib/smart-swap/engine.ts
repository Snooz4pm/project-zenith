/**
 * Smart Swap Engine V4 - Enhanced with 1K Tokens + USD Values
 *
 * APPROACH:
 * 1. Fetch Jupiter token list (1K+ tokens)
 * 2. Batch fetch prices for estimation
 * 3. User filters by category, volume, etc.
 * 4. Quote only top matches via Railway proxy
 * 5. Show USD values
 */

import {
    RiskMode,
    SwapRecommendation,
    SmartSwapRequest,
    SmartSwapResponse,
} from './types';
import { fetchQuote } from '@/lib/swap/execution';

const JUPITER_TOKEN_API = 'https://token.jup.ag/strict';
const JUPITER_PRICE_API = 'https://price.jup.ag/v6/price';
const SOL_MINT = 'So11111111111111111111111111111111111111112';

// Cache for token list
let tokenListCache: TokenInfo[] = [];
let tokenListCacheTime = 0;
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

// ============================================================================
// TYPES
// ============================================================================

export interface TokenInfo {
    address: string;
    symbol: string;
    name: string;
    decimals: number;
    logoURI?: string;
    tags?: string[];
    price?: number;
}

export interface SmartSwapFilters {
    categories?: string[];  // 'stablecoin', 'lst', 'defi', 'meme', 'gaming', 'ai'
    minPrice?: number;
    maxPrice?: number;
    search?: string;
}

// Token categories based on tags/patterns
const TOKEN_CATEGORIES: Record<string, string[]> = {
    stablecoin: ['USDC', 'USDT', 'PYUSD', 'DAI', 'USDH', 'UXD'],
    lst: ['mSOL', 'JitoSOL', 'bSOL', 'stSOL', 'JSOL', 'LST'],
    defi: ['JUP', 'RAY', 'ORCA', 'MNGO', 'SRM', 'STEP'],
    meme: ['BONK', 'WIF', 'MEW', 'WEN', 'POPCAT', 'SLERF', 'BOME', 'MYRO'],
    gaming: ['ATLAS', 'POLIS', 'GST', 'GMT', 'DUST'],
    ai: ['RNDR', 'TAO', 'ALEPH'],
    utility: ['PYTH', 'HNT', 'MOBILE', 'IOT', 'HONEY'],
};

// ============================================================================
// PHASE 1: Fetch Token Universe
// ============================================================================

async function fetchTokenList(): Promise<TokenInfo[]> {
    const now = Date.now();

    // Use cache if fresh
    if (tokenListCache.length > 0 && now - tokenListCacheTime < CACHE_DURATION) {
        console.log(`[Smart Swap] Using cached token list (${tokenListCache.length} tokens)`);
        return tokenListCache;
    }

    try {
        console.log('[Smart Swap] Fetching Jupiter token list...');
        const response = await fetch(JUPITER_TOKEN_API);

        if (!response.ok) {
            console.error('[Smart Swap] Token list fetch failed:', response.status);
            return tokenListCache; // Return stale cache
        }

        const tokens = await response.json();

        // Filter and limit to tradeable tokens
        const filtered = tokens
            .filter((t: any) =>
                t.address &&
                t.symbol &&
                t.address !== SOL_MINT
            )
            .slice(0, 1000) // Limit to 1000 tokens
            .map((t: any) => ({
                address: t.address,
                symbol: t.symbol,
                name: t.name || t.symbol,
                decimals: t.decimals,
                logoURI: t.logoURI,
                tags: t.tags || [],
            }));

        tokenListCache = filtered;
        tokenListCacheTime = now;

        console.log(`[Smart Swap] Cached ${filtered.length} tokens`);
        return filtered;
    } catch (error) {
        console.error('[Smart Swap] Token list error:', error);
        return tokenListCache;
    }
}

// ============================================================================
// PHASE 2: Batch Fetch Prices
// ============================================================================

async function fetchTokenPrices(tokens: TokenInfo[]): Promise<Map<string, number>> {
    const prices = new Map<string, number>();

    // Batch in chunks of 100
    const chunks: TokenInfo[][] = [];
    for (let i = 0; i < tokens.length; i += 100) {
        chunks.push(tokens.slice(i, i + 100));
    }

    console.log(`[Smart Swap] Fetching prices for ${tokens.length} tokens in ${chunks.length} batches`);

    try {
        await Promise.all(chunks.map(async (chunk) => {
            const ids = chunk.map(t => t.address).join(',');
            const response = await fetch(`${JUPITER_PRICE_API}?ids=${ids}`);

            if (response.ok) {
                const data = await response.json();
                for (const [mint, info] of Object.entries(data.data || {})) {
                    const price = (info as any)?.price;
                    if (price && price > 0) {
                        prices.set(mint, price);
                    }
                }
            }
        }));
    } catch (error) {
        console.error('[Smart Swap] Price fetch error:', error);
    }

    console.log(`[Smart Swap] Got prices for ${prices.size} tokens`);
    return prices;
}

// ============================================================================
// PHASE 3: Filter Tokens
// ============================================================================

function categorizeToken(token: TokenInfo): string {
    for (const [category, symbols] of Object.entries(TOKEN_CATEGORIES)) {
        if (symbols.some(s => token.symbol.toUpperCase().includes(s.toUpperCase()))) {
            return category;
        }
    }

    // Check tags
    if (token.tags?.includes('stablecoin')) return 'stablecoin';
    if (token.tags?.includes('lp-token')) return 'lp';

    return 'other';
}

function filterTokens(
    tokens: TokenInfo[],
    riskMode: RiskMode,
    filters?: SmartSwapFilters
): TokenInfo[] {
    let filtered = [...tokens];

    // Risk mode filtering
    if (riskMode === 'safe') {
        // Only stablecoins, LST, and established DeFi
        filtered = filtered.filter(t => {
            const category = categorizeToken(t);
            return ['stablecoin', 'lst', 'defi'].includes(category);
        });
    } else if (riskMode === 'degenerate') {
        // Memes, gaming, AI, and unknown
        filtered = filtered.filter(t => {
            const category = categorizeToken(t);
            return ['meme', 'gaming', 'ai', 'utility', 'other'].includes(category);
        });
    }

    // Apply custom filters
    if (filters?.search) {
        const search = filters.search.toLowerCase();
        filtered = filtered.filter(t =>
            t.symbol.toLowerCase().includes(search) ||
            t.name.toLowerCase().includes(search)
        );
    }

    if (filters?.categories && filters.categories.length > 0) {
        filtered = filtered.filter(t => {
            const category = categorizeToken(t);
            return filters.categories!.includes(category);
        });
    }

    return filtered;
}

// ============================================================================
// MAIN: Generate Recommendations
// ============================================================================

export async function generateRecommendations(
    request: SmartSwapRequest & { filters?: SmartSwapFilters }
): Promise<SmartSwapResponse & { totalTokens: number }> {
    const { amountIn, tokenInMint, riskMode, filters } = request;
    const startTime = Date.now();

    console.log(`[Smart Swap] Starting for ${amountIn} SOL, mode: ${riskMode}`);

    // Convert to lamports
    const amountInLamports = Math.floor(amountIn * 1e9).toString();

    // PHASE 1: Get token list
    const allTokens = await fetchTokenList();

    // PHASE 2: Filter tokens
    const filteredTokens = filterTokens(allTokens, riskMode, filters);
    console.log(`[Smart Swap] Filtered to ${filteredTokens.length} tokens`);

    // PHASE 3: Get prices for filtered tokens
    const prices = await fetchTokenPrices(filteredTokens);

    // Get SOL price for USD calculations
    const solPrices = await fetchTokenPrices([{ address: SOL_MINT, symbol: 'SOL', name: 'Solana', decimals: 9 }]);
    const solPrice = solPrices.get(SOL_MINT) || 180;
    const inputValueUsd = amountIn * solPrice;

    console.log(`[Smart Swap] SOL: $${solPrice}, Input: $${inputValueUsd.toFixed(2)}`);

    // PHASE 4: Estimate returns and select top candidates
    const candidates = filteredTokens
        .filter(t => prices.has(t.address))
        .map(t => ({
            token: t,
            price: prices.get(t.address)!,
            estimatedOut: inputValueUsd / prices.get(t.address)!,
            estimatedUsd: inputValueUsd, // Same as input for estimation
            category: categorizeToken(t),
        }))
        .sort((a, b) => b.estimatedOut - a.estimatedOut)
        .slice(0, 20); // Top 20 for quoting

    console.log(`[Smart Swap] Quoting top ${candidates.length} candidates`);

    // PHASE 5: Get real quotes via Railway proxy
    const recommendations: SwapRecommendation[] = [];

    const quotePromises = candidates.map(async (candidate) => {
        try {
            const quote = await fetchQuote({
                inputMint: tokenInMint,
                outputMint: candidate.token.address,
                amount: amountInLamports,
                slippageBps: 50
            });

            if (quote && quote.outAmount) {
                const outAmount = Number(quote.outAmount) / Math.pow(10, candidate.token.decimals);
                const priceImpact = parseFloat(quote.priceImpactPct || '0') * 100;
                const outputValueUsd = outAmount * candidate.price;

                // Risk level
                let riskLevel: 'low' | 'medium' | 'high' = 'low';
                if (Math.abs(priceImpact) > 2) riskLevel = 'high';
                else if (Math.abs(priceImpact) > 0.5) riskLevel = 'medium';

                const smartSwapScore = Math.round(100 - Math.abs(priceImpact) * 10);

                return {
                    tokenOut: {
                        mint: candidate.token.address,
                        symbol: candidate.token.symbol,
                        name: candidate.token.name,
                        decimals: candidate.token.decimals,
                        logoURI: candidate.token.logoURI,
                    },
                    estimatedAmountOut: outAmount,
                    estimatedSlippage: Math.abs(priceImpact),
                    liquidityScore: smartSwapScore,
                    riskLevel,
                    riskScore: smartSwapScore,
                    smartSwapScore,
                    explanation: `~${outAmount.toLocaleString(undefined, { maximumFractionDigits: 4 })} ${candidate.token.symbol} • $${outputValueUsd.toFixed(2)} • ${priceImpact.toFixed(2)}% impact`,
                    priceImpact,
                    outputValueUsd, // NEW: Add USD value
                    category: candidate.category, // NEW: Add category
                } as SwapRecommendation & { outputValueUsd: number; category: string };
            }
            return null;
        } catch (error) {
            return null;
        }
    });

    const results = await Promise.all(quotePromises);

    for (const result of results) {
        if (result) {
            recommendations.push(result as any);
        }
    }

    // Sort by score
    recommendations.sort((a, b) => b.smartSwapScore - a.smartSwapScore);

    const elapsed = Date.now() - startTime;
    console.log(`[Smart Swap] Done: ${recommendations.length} recommendations in ${elapsed}ms`);

    return {
        recommendations,
        timestamp: Date.now(),
        riskMode,
        totalTokens: allTokens.length, // NEW: Tell UI how many tokens available
    };
}

// Export for UI
export { TOKEN_CATEGORIES, categorizeToken, fetchTokenList };
export * from './types';
