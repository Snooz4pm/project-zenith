/**
 * Token Price Service
 * 
 * Fetches real-time token prices from Jupiter Price API
 * and normalizes all values to SOL for the Brain.
 * 
 * NO PREDICTIONS. Market data only.
 */

// In-memory price cache (15 second TTL)
interface PriceCacheEntry {
    priceInSOL: number;
    fetchedAt: number;
}

const priceCache = new Map<string, PriceCacheEntry>();
const CACHE_TTL_MS = 15_000; // 15 seconds

const SOL_MINT = 'So11111111111111111111111111111111111111112';
const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';

// Jupiter Price API v6 (public, no key needed for basic usage)
const JUPITER_PRICE_API = 'https://api.jup.ag/price/v2';

/**
 * Fetches token price in SOL from Jupiter Price API
 * Uses caching to avoid rate limits.
 */
export async function getTokenPriceInSOL(tokenMint: string): Promise<number | null> {
    // SOL is always 1 SOL
    if (tokenMint === SOL_MINT) return 1;

    // Check cache first
    const cached = priceCache.get(tokenMint);
    if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
        return cached.priceInSOL;
    }

    try {
        // Fetch price vs SOL directly
        const response = await fetch(
            `${JUPITER_PRICE_API}?ids=${tokenMint}&vsToken=${SOL_MINT}`,
            { headers: { 'Accept': 'application/json' } }
        );

        if (!response.ok) {
            console.error(`[PriceService] Jupiter API error: ${response.status}`);
            return null;
        }

        const data = await response.json();

        // Jupiter returns: { data: { [mint]: { price: number } } }
        const priceData = data?.data?.[tokenMint];
        if (!priceData || typeof priceData.price !== 'number') {
            console.warn(`[PriceService] No price found for ${tokenMint}`);
            return null;
        }

        const priceInSOL = priceData.price;

        // Cache the result
        priceCache.set(tokenMint, { priceInSOL, fetchedAt: Date.now() });

        return priceInSOL;
    } catch (error) {
        console.error(`[PriceService] Failed to fetch price for ${tokenMint}:`, error);
        return null;
    }
}

/**
 * Normalizes any token amount to its SOL equivalent value.
 * This is the CORE function the Brain should use.
 * 
 * @param tokenMint - The mint address of the input token
 * @param amount - The raw token amount (in token units)
 * @returns The equivalent value in SOL, or null if price unavailable
 */
export async function normalizeToSOL(tokenMint: string, amount: number): Promise<number | null> {
    const priceInSOL = await getTokenPriceInSOL(tokenMint);
    if (priceInSOL === null) return null;

    return amount * priceInSOL;
}

/**
 * Converts a fiat amount (USD) to SOL equivalent.
 * Uses USDC as the proxy for USD.
 */
export async function fiatToSOL(fiatAmount: number, currency: 'USD' = 'USD'): Promise<number | null> {
    // USD ≈ USDC (1:1)
    // USDC price in SOL tells us USD/SOL rate
    const usdcPriceInSOL = await getTokenPriceInSOL(USDC_MINT);
    if (usdcPriceInSOL === null) return null;

    return fiatAmount * usdcPriceInSOL;
}

/**
 * Batch price fetch for multiple tokens (more efficient)
 */
export async function getBatchPricesInSOL(tokenMints: string[]): Promise<Map<string, number>> {
    const results = new Map<string, number>();
    const uncached: string[] = [];

    // Check cache first
    for (const mint of tokenMints) {
        if (mint === SOL_MINT) {
            results.set(mint, 1);
            continue;
        }
        const cached = priceCache.get(mint);
        if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
            results.set(mint, cached.priceInSOL);
        } else {
            uncached.push(mint);
        }
    }

    if (uncached.length === 0) return results;

    try {
        // Batch fetch uncached
        const response = await fetch(
            `${JUPITER_PRICE_API}?ids=${uncached.join(',')}&vsToken=${SOL_MINT}`,
            { headers: { 'Accept': 'application/json' } }
        );

        if (!response.ok) {
            console.error(`[PriceService] Jupiter batch API error: ${response.status}`);
            return results;
        }

        const data = await response.json();
        const now = Date.now();

        for (const mint of uncached) {
            const priceData = data?.data?.[mint];
            if (priceData && typeof priceData.price === 'number') {
                results.set(mint, priceData.price);
                priceCache.set(mint, { priceInSOL: priceData.price, fetchedAt: now });
            }
        }
    } catch (error) {
        console.error(`[PriceService] Batch fetch failed:`, error);
    }

    return results;
}

/**
 * Clears the price cache (for testing or force refresh)
 */
export function clearPriceCache(): void {
    priceCache.clear();
}
