import { MarketPrice, AssetType } from './types';
import { fetchPriceAV } from '@/lib/alpha-vantage';
import { fetchPriceFinnhub } from '@/lib/finnhub';
import { fetchPriceDex } from '@/lib/dexscreener';

const VERIFICATION_THRESHOLD_PERCENT = 0.5; // 0.5% discrepancy trigger

/**
 * Get Real-Time Price with Dual-Source Verification
 * 
 * Strategy:
 * 1. Crypto -> DexScreener (Verified Single Source for now)
 * 2. Stocks/Forex:
 *    - Fetch Alpha Vantage (Primary)
 *    - Fetch Finnhub (Secondary)
 *    - Compare:
 *      - If diff < 0.5% -> Return Primary with 'verified' status
 *      - If diff > 0.5% -> Return Primary with 'discrepancy' status (UI can warn)
 *      - If Primary fails -> Return Secondary with 'unverified' status
 */
export async function getRealTimePrice(
    symbol: string,
    assetType: AssetType = 'stock'
): Promise<MarketPrice | null> {

    // --- 1. CRYPTO ---
    if (assetType === 'crypto') {
        return await fetchPriceDex(symbol);
    }

    // --- 2. STOCKS & FOREX (Dual Source) ---

    // Parallel fetch for speed
    const [primary, secondary] = await Promise.all([
        fetchPriceAV(symbol, assetType),
        fetchPriceFinnhub(symbol)
    ]);

    // Case A: Primary works
    if (primary) {
        if (secondary) {
            // Verify
            const diff = Math.abs((primary.price - secondary.price) / primary.price) * 100;

            if (diff > VERIFICATION_THRESHOLD_PERCENT) {
                // DISCREPANCY DETECTED
                console.warn(`⚠️ Price Discrepancy for ${symbol}: AV=${primary.price}, FH=${secondary.price}, Diff=${diff.toFixed(2)}%`);
                return {
                    ...primary,
                    verificationStatus: 'discrepancy'
                };
            }

            // VERIFIED
            return {
                ...primary,
                verificationStatus: 'verified'
            };
        }

        // Secondary failed, return Primary Unverified
        return {
            ...primary,
            verificationStatus: 'unverified'
        };
    }

    // Case B: Primary failed, fallback to Secondary
    if (secondary) {
        return {
            ...secondary,
            source: 'finnhub', // Explicit source override
            verificationStatus: 'unverified'
        };
    }

    // Case C: Both failed
    return null;
}
