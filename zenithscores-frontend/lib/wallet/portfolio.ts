/**
 * Portfolio Fetcher
 * 
 * Fetches wallet holdings with prices and calculates momentum projections.
 * Uses existing balance.ts for raw balances, adds Jupiter prices.
 */

import { Connection, PublicKey } from '@solana/web3.js';
import { fetchWalletBalances, enrichWalletBalances, WalletToken } from './balance';
import { buildZenithTokenList } from '@/lib/zenith';

const JUPITER_PRICE_API = 'https://api.jup.ag/price/v2';

export interface TokenHolding {
    mint: string;
    symbol: string;
    name: string;
    logoURI?: string;
    decimals: number;
    balance: number;           // Human-readable
    priceUsd: number;
    valueUsd: number;
    priceChange24h: number;    // Percentage
    projection7d: number;      // Projected value in 7 days
    projectionChange: number;  // Percentage change in projection
}

export interface PortfolioData {
    holdings: TokenHolding[];
    totalValueUsd: number;
    totalChange24h: number;     // Weighted portfolio change
    totalProjection7d: number;
    lastUpdated: number;
}

// Cache to prevent spam
let portfolioCache: PortfolioData | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 30000; // 30 seconds

/**
 * Calculate 7-day projection based on momentum
 * Formula: value × (1 + 24h_change × 0.7)
 * Uses 70% of momentum (conservative)
 */
function calculateProjection(valueUsd: number, priceChange24h: number): number {
    const momentumFactor = 0.7;
    const projectedChange = (priceChange24h / 100) * momentumFactor;
    return valueUsd * (1 + projectedChange);
}

/**
 * Fetch prices for multiple tokens from Jupiter
 */
async function fetchPrices(mints: string[]): Promise<Map<string, { price: number; change24h: number }>> {
    const priceMap = new Map<string, { price: number; change24h: number }>();

    if (mints.length === 0) return priceMap;

    try {
        // Jupiter Price API v2
        const ids = mints.join(',');
        const res = await fetch(`${JUPITER_PRICE_API}?ids=${ids}&showExtraInfo=true`);
        const data = await res.json();

        if (data.data) {
            for (const [mint, info] of Object.entries(data.data as Record<string, any>)) {
                priceMap.set(mint, {
                    price: Number(info.price) || 0,
                    change24h: Number(info.extraInfo?.lastSwappedPrice?.lastJupiterSellPrice) || 0
                });
            }
        }
    } catch (err) {
        console.error('[Portfolio] Price fetch error:', err);
    }

    return priceMap;
}

/**
 * Fetch complete portfolio data for a wallet
 */
export async function fetchPortfolio(
    connection: Connection,
    publicKey: PublicKey
): Promise<PortfolioData> {
    // Check cache
    if (portfolioCache && Date.now() - cacheTimestamp < CACHE_TTL) {
        return portfolioCache;
    }

    // 1. Get raw balances
    const rawBalances = await fetchWalletBalances(connection, publicKey);

    // 2. Get token metadata
    const tokenList = await buildZenithTokenList();
    const enrichedTokens = enrichWalletBalances(rawBalances, tokenList);

    // 3. Fetch prices
    const mints = enrichedTokens.map(t => t.address);
    const prices = await fetchPrices(mints);

    // 4. Build holdings with projections
    const holdings: TokenHolding[] = [];
    let totalValueUsd = 0;
    let weightedChange = 0;

    for (const token of enrichedTokens) {
        const priceInfo = prices.get(token.address);
        const priceUsd = priceInfo?.price || 0;
        const priceChange24h = priceInfo?.change24h || 0;
        const valueUsd = token.uiBalance * priceUsd;

        // Skip dust (<$0.01)
        if (valueUsd < 0.01 && token.symbol !== 'SOL') continue;

        const projection7d = calculateProjection(valueUsd, priceChange24h);
        const projectionChange = valueUsd > 0 ? ((projection7d - valueUsd) / valueUsd) * 100 : 0;

        holdings.push({
            mint: token.address,
            symbol: token.symbol,
            name: token.name || token.symbol,
            logoURI: token.logoURI,
            decimals: token.decimals,
            balance: token.uiBalance,
            priceUsd,
            valueUsd,
            priceChange24h,
            projection7d,
            projectionChange
        });

        totalValueUsd += valueUsd;
        weightedChange += priceChange24h * valueUsd;
    }

    // Sort by value (highest first)
    holdings.sort((a, b) => b.valueUsd - a.valueUsd);

    // Calculate portfolio-level metrics
    const totalChange24h = totalValueUsd > 0 ? weightedChange / totalValueUsd : 0;
    const totalProjection7d = holdings.reduce((sum, h) => sum + h.projection7d, 0);

    const portfolio: PortfolioData = {
        holdings,
        totalValueUsd,
        totalChange24h,
        totalProjection7d,
        lastUpdated: Date.now()
    };

    // Cache
    portfolioCache = portfolio;
    cacheTimestamp = Date.now();

    return portfolio;
}

/**
 * Clear portfolio cache (call on wallet change)
 */
export function clearPortfolioCache() {
    portfolioCache = null;
    cacheTimestamp = 0;
}

// ============================================
// TRANSACTION HISTORY
// ============================================

export interface WalletTransaction {
    signature: string;
    timestamp: number;
    type: 'send' | 'receive' | 'swap' | 'unknown';
    fee: number;
    status: 'success' | 'failed';
}

let txCache: WalletTransaction[] = [];
let txCacheTimestamp = 0;
const TX_CACHE_TTL = 60000; // 1 minute

/**
 * Fetch recent transactions for wallet
 */
export async function fetchTransactions(
    connection: Connection,
    publicKey: PublicKey,
    limit: number = 20
): Promise<WalletTransaction[]> {
    // Check cache
    if (txCache.length > 0 && Date.now() - txCacheTimestamp < TX_CACHE_TTL) {
        return txCache;
    }

    try {
        const signatures = await connection.getSignaturesForAddress(publicKey, { limit });

        const transactions: WalletTransaction[] = signatures.map(sig => ({
            signature: sig.signature,
            timestamp: (sig.blockTime || 0) * 1000,
            type: 'unknown' as const,
            fee: 0.000005,
            status: sig.err ? 'failed' as const : 'success' as const
        }));

        txCache = transactions;
        txCacheTimestamp = Date.now();

        return transactions;
    } catch (err) {
        console.error('[Portfolio] Transaction fetch error:', err);
        return txCache;
    }
}

/**
 * Format transaction for display
 */
export function formatTransaction(tx: WalletTransaction) {
    const seconds = Math.floor((Date.now() - tx.timestamp) / 1000);
    let timeAgo = `${seconds}s ago`;
    if (seconds >= 60) timeAgo = `${Math.floor(seconds / 60)}m ago`;
    if (seconds >= 3600) timeAgo = `${Math.floor(seconds / 3600)}h ago`;
    if (seconds >= 86400) timeAgo = `${Math.floor(seconds / 86400)}d ago`;

    return {
        ...tx,
        timeAgo,
        shortSig: `${tx.signature.slice(0, 8)}...${tx.signature.slice(-8)}`,
        solscanUrl: `https://solscan.io/tx/${tx.signature}`
    };
}
