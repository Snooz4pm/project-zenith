'use server';

import { unstable_cache } from 'next/cache';

// ========================
// CRYPTO FINDS API ACTIONS
// ========================

const DEXSCREENER_API = 'https://api.dexscreener.com/latest/dex';

interface DexPair {
    chainId: string;
    dexId: string;
    url: string;
    pairAddress: string;
    baseToken: {
        address: string;
        name: string;
        symbol: string;
    };
    quoteToken: {
        address: string;
        name: string;
        symbol: string;
    };
    priceNative: string;
    priceUsd: string;
    txns: {
        m5: { buys: number; sells: number };
        h1: { buys: number; sells: number };
        h6: { buys: number; sells: number };
        h24: { buys: number; sells: number };
    };
    volume: {
        m5: number;
        h1: number;
        h6: number;
        h24: number;
    };
    priceChange: {
        m5: number;
        h1: number;
        h6: number;
        h24: number;
    };
    liquidity: {
        usd: number;
        base: number;
        quote: number;
    };
    fdv: number;
    pairCreatedAt: number;
}

interface CryptoFindsFilters {
    chains?: ('ethereum' | 'arbitrum' | 'base')[];
    minLiquidity?: number;
    minVolume24h?: number;
    minTxns24h?: number;
    limit?: number;
}

/**
 * Get curated crypto finds feed from Dexscreener.
 * Filters for quality pairs with real liquidity.
 */
export const getCryptoFindsFeed = unstable_cache(
    async (filters: CryptoFindsFilters = {}) => {
        const {
            chains = [...ALLOWED_CHAINS],
            minLiquidity = 10_000,
            minVolume24h = 5_000,
            minTxns24h = 10,
            limit = 50
        } = filters;

        try {
            // Fetch trending pairs from Dexscreener
            const response = await fetch(
                `${DEXSCREENER_API}/search?q=trending`,
                { next: { revalidate: 30 } }
            );

            if (!response.ok) throw new Error('Dexscreener API failed');

            const data = await response.json();
            const pairs: DexPair[] = data.pairs || [];

            // Filter and curate
            const curated = pairs
                .filter(p => {
                    if (chain && p.chainId !== chain) return false;
                    if (p.liquidity?.usd < minLiquidity) return false;
                    if (p.volume?.h24 < minVolume24h) return false;
                    return true;
                })
                .slice(0, limit)
                .map(p => ({
                    pairAddress: p.pairAddress,
                    chainId: p.chainId,
                    dexId: p.dexId,
                    baseSymbol: p.baseToken.symbol,
                    baseName: p.baseToken.name,
                    quoteSymbol: p.quoteToken.symbol,
                    priceUsd: parseFloat(p.priceUsd || '0'),
                    priceChange24h: p.priceChange?.h24 || 0,
                    priceChange1h: p.priceChange?.h1 || 0,
                    volume24h: p.volume?.h24 || 0,
                    volume1h: p.volume?.h1 || 0,
                    liquidity: p.liquidity?.usd || 0,
                    txns24h: (p.txns?.h24?.buys || 0) + (p.txns?.h24?.sells || 0),
                    buys24h: p.txns?.h24?.buys || 0,
                    sells24h: p.txns?.h24?.sells || 0,
                    fdv: p.fdv || 0,
                    pairCreatedAt: p.pairCreatedAt,
                    url: p.url
                }));

            return { success: true, pairs: curated };
        } catch (error) {
            console.error('getCryptoFindsFeed error:', error);
            return { success: false, pairs: [], error: 'Failed to fetch feed' };
        }
    },
    ['crypto-finds-feed'],
    { revalidate: 30 }
);

/**
 * Get detailed pair information.
 * Supports ETH/ARB/BASE - uses search API if chainId not provided.
 */
export async function getPairDetails(pairAddress: string, chainId?: string) {
    try {
        // Use direct chain endpoint if chainId known, otherwise search
        const searchUrl = chainId
            ? `${DEXSCREENER_API}/pairs/${chainId}/${pairAddress}`
            : `${DEXSCREENER_API}/search?q=${pairAddress}`;

        const response = await fetch(searchUrl, { next: { revalidate: 10 } });

        if (!response.ok) throw new Error('Pair not found');

        const data = await response.json();
        const pair = data.pairs?.[0] || data.pair;

        if (!pair) throw new Error('Pair not found');

        return {
            success: true,
            pair: {
                pairAddress: pair.pairAddress,
                chainId: pair.chainId,
                dexId: pair.dexId,
                baseToken: pair.baseToken,
                quoteToken: pair.quoteToken,
                priceUsd: parseFloat(pair.priceUsd || '0'),
                priceNative: parseFloat(pair.priceNative || '0'),
                priceChange: pair.priceChange,
                volume: pair.volume,
                txns: pair.txns,
                liquidity: pair.liquidity,
                fdv: pair.fdv,
                pairCreatedAt: pair.pairCreatedAt,
                url: pair.url
            }
        };
    } catch (error) {
        console.error('getPairDetails error:', error);
        return { success: false, pair: null, error: 'Failed to fetch pair' };
    }
}

/**
 * Get chart URL for a pair.
 * Uses Dexscreener embed chart with correct chain.
 */
export async function getPairCandles(
    pairAddress: string,
    chainId: string = 'ethereum'
) {
    try {
        // Return Dexscreener chart embed URL with correct chain
        return {
            success: true,
            chartUrl: `https://dexscreener.com/${chainId}/${pairAddress}?embed=1&theme=dark&trades=0&info=0`,
            pairAddress,
            chainId
        };
    } catch (error) {
        console.error('getPairCandles error:', error);
        return { success: false, chartUrl: null, error: 'Failed to fetch candles' };
    }
}

/**
 * Get recent transactions for a pair.
 */
export async function getPairTransactions(pairAddress: string, limit: number = 20) {
    try {
        // Dexscreener provides transaction data in pair details
        const { pair } = await getPairDetails(pairAddress);

        if (!pair) throw new Error('Pair not found');

        // Return transaction summary (real-time trades would need WebSocket)
        return {
            success: true,
            summary: {
                m5: pair.txns?.m5 || { buys: 0, sells: 0 },
                h1: pair.txns?.h1 || { buys: 0, sells: 0 },
                h6: pair.txns?.h6 || { buys: 0, sells: 0 },
                h24: pair.txns?.h24 || { buys: 0, sells: 0 }
            },
            volume: pair.volume
        };
    } catch (error) {
        console.error('getPairTransactions error:', error);
        return { success: false, summary: null, error: 'Failed to fetch transactions' };
    }
}

/**
 * Generate market log entries based on pair analysis.
 * Deterministic, append-only style.
 */
export async function getMarketLog(pairAddress: string, chainId?: string) {
    try {
        const { pair } = await getPairDetails(pairAddress, chainId);

        if (!pair) return { success: false, logs: [] };

        const now = new Date();
        const logs: { time: string; type: string; message: string }[] = [];

        // Chain context - first entry
        const chainLabels: Record<string, string> = {
            ethereum: 'ETHEREUM',
            arbitrum: 'ARBITRUM',
            base: 'BASE'
        };
        const chainLabel = chainLabels[pair.chainId] || pair.chainId.toUpperCase();

        logs.push({
            time: formatLogTime(now, -10),
            type: 'CONTEXT',
            message: `Chain: ${chainLabel}`
        });

        // Analyze and generate log entries
        const priceChange1h = pair.priceChange?.h1 || 0;
        const priceChange24h = pair.priceChange?.h24 || 0;
        const volume1h = pair.volume?.h1 || 0;
        const volume24h = pair.volume?.h24 || 0;
        const liquidity = pair.liquidity?.usd || 0;
        const buySellRatio = pair.txns?.h1 ?
            pair.txns.h1.buys / Math.max(pair.txns.h1.sells, 1) : 1;

        // Volume spike detection
        if (volume1h > volume24h / 6) {
            logs.push({
                time: formatLogTime(now),
                type: 'VOLUME_SPIKE',
                message: `1H volume ${formatNumber(volume1h)} exceeds 4H average`
            });
        }

        // Price regime
        if (Math.abs(priceChange1h) < 1 && Math.abs(priceChange24h) < 3) {
            logs.push({
                time: formatLogTime(now, -2),
                type: 'REGIME_LOCK',
                message: 'Market in CONSOLIDATION — low volatility detected'
            });
        } else if (priceChange1h > 5) {
            logs.push({
                time: formatLogTime(now, -1),
                type: 'BREAK_ATTEMPT',
                message: `Upward momentum +${priceChange1h.toFixed(1)}% in 1H`
            });
        } else if (priceChange1h < -5) {
            logs.push({
                time: formatLogTime(now, -1),
                type: 'BREAK_ATTEMPT',
                message: `Downward pressure ${priceChange1h.toFixed(1)}% in 1H`
            });
        }

        // Buy pressure
        if (buySellRatio > 1.5) {
            logs.push({
                time: formatLogTime(now, -3),
                type: 'BUY_PRESSURE',
                message: `Buy/Sell ratio ${buySellRatio.toFixed(2)}x — accumulation signal`
            });
        } else if (buySellRatio < 0.67) {
            logs.push({
                time: formatLogTime(now, -3),
                type: 'SELL_PRESSURE',
                message: `Sell dominance — distribution detected`
            });
        }

        // Liquidity check
        if (liquidity < 50000) {
            logs.push({
                time: formatLogTime(now, -5),
                type: 'LOW_LIQUIDITY',
                message: `Liquidity $${formatNumber(liquidity)} — high slippage risk`
            });
        }

        // Sort by time descending
        logs.reverse();

        return { success: true, logs };
    } catch (error) {
        console.error('getMarketLog error:', error);
        return { success: false, logs: [] };
    }
}

// ========================
// HELPERS
// ========================

function formatLogTime(date: Date, offsetMinutes: number = 0): string {
    const d = new Date(date.getTime() + offsetMinutes * 60000);
    return d.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });
}

function formatNumber(n: number): string {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return n.toFixed(0);
}
